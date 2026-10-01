// ============================================================
// CyberCampus — Native CDP Automation Client for Google Chrome
// Used for reproducible performance measurement and browser testing.
// ============================================================

import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export class ChromeBrowser {
  constructor(options = {}) {
    this.chromePath =
      options.chromePath ||
      process.env.CHROME_BIN ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    this.tempProfile = path.join(
      os.tmpdir(),
      `cybercampus_test_profile_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    this.chromeProcess = null;
    this.ws = null;
    this.messageId = 1;
    this.pendingCallbacks = new Map();
    this.eventListeners = new Map();
    this.consoleLogs = [];
    this.networkErrors = [];
    this.targetId = null;
    this.sessionId = null;
  }

  async launch() {
    fs.mkdirSync(this.tempProfile, { recursive: true });

    return new Promise((resolve, reject) => {
      this.chromeProcess = spawn(
        this.chromePath,
        [
          '--headless=new',
          '--remote-debugging-port=0',
          `--user-data-dir=${this.tempProfile}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-networking',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-gpu-shader-disk-cache',
          'about:blank',
        ],
        { stdio: ['ignore', 'pipe', 'pipe'] }
      );

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          reject(new Error('Chrome launch timed out waiting for DevTools URL'));
        }
      }, 10000);

      this.chromeProcess.stderr.on('data', async (chunk) => {
        const text = chunk.toString();
        const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          const browserWsUrl = match[1];
          try {
            await this._initWebSocket(browserWsUrl);
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });

      this.chromeProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async _initWebSocket(browserWsUrl) {
    const ws = new WebSocket(browserWsUrl);
    this.ws = ws;

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pendingCallbacks.has(msg.id)) {
        const { resolve, reject } = this.pendingCallbacks.get(msg.id);
        this.pendingCallbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
        return;
      }

      // Handle session events
      if (msg.sessionId === this.sessionId && msg.method) {
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
          this.consoleLogs.push({ type: msg.params.type, text });
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const text =
            msg.params.exceptionDetails?.exception?.description ||
            msg.params.exceptionDetails?.text ||
            'Uncaught error';
          this.consoleLogs.push({ type: 'error', text });
        } else if (msg.method === 'Log.entryAdded') {
          this.consoleLogs.push({ type: msg.params.entry.level, text: msg.params.entry.text });
        } else if (msg.method === 'Network.loadingFailed') {
          this.networkErrors.push(msg.params);
        }

        const listeners = this.eventListeners.get(msg.method);
        if (listeners) {
          for (const cb of listeners) {
            try {
              cb(msg.params);
            } catch (err) {
              console.error(`Error in CDP event listener for ${msg.method}:`, err);
            }
          }
        }
      }
    };

    // Create a new target / page
    const target = await this.send('Target.createTarget', { url: 'about:blank' });
    this.targetId = target.targetId;

    // Attach to page target
    const attached = await this.send('Target.attachToTarget', {
      targetId: this.targetId,
      flatten: true,
    });
    this.sessionId = attached.sessionId;

    // Enable core domains for the page session
    await this.sendToSession('Page.enable');
    await this.sendToSession('Runtime.enable');
    await this.sendToSession('Log.enable');
    await this.sendToSession('Network.enable');
  }

  addEventListener(method, callback) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, new Set());
    }
    this.eventListeners.get(method).add(callback);
  }

  removeEventListener(method, callback) {
    const set = this.eventListeners.get(method);
    if (set) {
      set.delete(callback);
    }
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.pendingCallbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  sendToSession(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.pendingCallbacks.set(id, { resolve, reject });
      this.ws.send(
        JSON.stringify({ id, sessionId: this.sessionId, method, params })
      );
    });
  }

  async setViewport({ width = 1280, height = 800, isMobile = false }) {
    await this.sendToSession('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
  }

  async setCacheDisabled(disabled) {
    await this.sendToSession('Network.setCacheDisabled', { cacheDisabled: disabled });
  }

  async setBypassServiceWorker(bypass) {
    await this.sendToSession('Network.setBypassServiceWorker', { bypass });
  }

  async addInitScript(source) {
    return await this.sendToSession('Page.addScriptToEvaluateOnNewDocument', { source });
  }

  async navigate(url) {
    this.consoleLogs = [];
    this.networkErrors = [];
    return await this.sendToSession('Page.navigate', { url });
  }

  async evaluate(expression, ...args) {
    const expr =
      typeof expression === 'function'
        ? `(${expression.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`
        : expression;
    const res = await this.sendToSession('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.exception?.description ||
          JSON.stringify(res.exceptionDetails)
      );
    }
    return res.result?.value;
  }

  async waitForSelector(selector, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const found = await this.evaluate(
        `!!document.querySelector(${JSON.stringify(selector)})`
      ).catch(() => false);
      if (found) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for selector "${selector}" after ${timeoutMs}ms`);
  }

  async waitForFunction(fn, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await this.evaluate(fn).catch(() => false);
      if (result) return result;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for custom function after ${timeoutMs}ms`);
  }

  async screenshot(filePath) {
    const res = await this.sendToSession('Page.captureScreenshot', {
      format: 'png',
    });
    const buffer = Buffer.from(res.data, 'base64');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  async close() {
    this.eventListeners.clear();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }
    if (this.chromeProcess && this.chromeProcess.pid) {
      try {
        this.chromeProcess.kill('SIGKILL');
      } catch {}
    }
    try {
      fs.rmSync(this.tempProfile, { recursive: true, force: true });
    } catch {}
  }
}
