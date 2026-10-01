// ============================================================
// CyberCampus — Reproducible Performance Measurement Suite (Task 9B)
// Measures cold direct loads, SPA navigation, and dist chunk sizes.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ChromeBrowser } from './cdp_browser.mjs';

const PREVIEW_URL = process.env.CYBERCAMPUS_URL || 'http://localhost:4173';
const VIEWPORT = { width: 1280, height: 800, isMobile: false };

/**
 * Identify JavaScript resources using resource type, MIME type, and parsed URL pathname.
 * Handles query strings properly via URL.pathname.
 */
export function isJavaScriptResource(url, resourceType, mimeType) {
  if (resourceType === 'Script') return true;
  if (
    mimeType &&
    (mimeType.includes('javascript') ||
      mimeType.includes('ecmascript') ||
      mimeType.includes('application/x-javascript') ||
      mimeType.includes('text/javascript'))
  ) {
    return true;
  }
  try {
    const parsed = new URL(url);
    const cleanPath = parsed.pathname;
    if (cleanPath.endsWith('.js') || cleanPath.endsWith('.mjs')) return true;
  } catch {}
  return false;
}

/**
 * Creates an active request tracker using CDP Network domain events.
 */
export function createNetworkTracker(browser) {
  const requests = new Map(); // requestId -> reqData
  const activeRequestIds = new Set();
  const completedRecords = [];

  const onRequestWillBeSent = (params) => {
    const { requestId, request, type } = params;
    requests.set(requestId, {
      requestId,
      url: request.url,
      method: request.method,
      resourceType: type,
      status: null,
      mimeType: null,
      fromDiskCache: false,
      fromMemoryCache: false,
      fromServiceWorker: false,
      contentEncoding: null,
      encodedDataLength: 0,
      failed: false,
      errorText: null,
      incomplete: false,
    });
    activeRequestIds.add(requestId);
  };

  const onResponseReceived = (params) => {
    const { requestId, response, type } = params;
    const req = requests.get(requestId);
    if (req) {
      req.status = response.status;
      req.mimeType = response.mimeType;
      req.resourceType = type || req.resourceType;
      req.fromDiskCache = !!response.fromDiskCache;
      req.fromMemoryCache =
        !!response.fromPrefetchCache ||
        (response.status === 200 && response.encodedDataLength === 0 && !response.fromDiskCache);
      req.fromServiceWorker = !!response.fromServiceWorker;
      req.contentEncoding = response.headers?.['content-encoding'] || response.headers?.['Content-Encoding'] || null;
      if (typeof response.encodedDataLength === 'number') {
        req.encodedDataLength = response.encodedDataLength;
      }
    }
  };

  const onLoadingFinished = (params) => {
    const { requestId, encodedDataLength } = params;
    const req = requests.get(requestId);
    if (req) {
      req.encodedDataLength = encodedDataLength;
      completedRecords.push(req);
    }
    activeRequestIds.delete(requestId);
  };

  const onLoadingFailed = (params) => {
    const { requestId, errorText } = params;
    const req = requests.get(requestId);
    if (req) {
      req.failed = true;
      req.errorText = errorText;
      completedRecords.push(req);
    }
    activeRequestIds.delete(requestId);
  };

  browser.addEventListener('Network.requestWillBeSent', onRequestWillBeSent);
  browser.addEventListener('Network.responseReceived', onResponseReceived);
  browser.addEventListener('Network.loadingFinished', onLoadingFinished);
  browser.addEventListener('Network.loadingFailed', onLoadingFailed);

  const cleanup = () => {
    browser.removeEventListener('Network.requestWillBeSent', onRequestWillBeSent);
    browser.removeEventListener('Network.responseReceived', onResponseReceived);
    browser.removeEventListener('Network.loadingFinished', onLoadingFinished);
    browser.removeEventListener('Network.loadingFailed', onLoadingFailed);
  };

  const waitForNetworkIdle = async (idleTimeMs = 600, maxWaitMs = 10000) => {
    const start = Date.now();
    let idleStart = activeRequestIds.size === 0 ? Date.now() : null;

    while (Date.now() - start < maxWaitMs) {
      if (activeRequestIds.size === 0) {
        if (!idleStart) idleStart = Date.now();
        if (Date.now() - idleStart >= idleTimeMs) {
          return;
        }
      } else {
        idleStart = null;
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    // Mark any unfinished requests as incomplete
    for (const pendingId of activeRequestIds) {
      const pendingReq = requests.get(pendingId);
      if (pendingReq) {
        pendingReq.incomplete = true;
        completedRecords.push(pendingReq);
      }
    }

    throw new Error(
      `Timeout waiting for network idle after ${maxWaitMs}ms (${activeRequestIds.size} pending requests)`
    );
  };

  const getIncompleteOrFailedRequests = () => {
    const issues = [];
    for (const req of requests.values()) {
      if (req.failed || req.incomplete) {
        issues.push(req);
      }
    }
    return issues;
  };

  return {
    requests,
    activeRequestIds,
    completedRecords,
    cleanup,
    waitForNetworkIdle,
    getIncompleteOrFailedRequests,
    getJavaScriptRequests: () =>
      completedRecords.filter((r) => isJavaScriptResource(r.url, r.resourceType, r.mimeType)),
  };
}

/**
 * Measure a single cold load on a specific route with clean profile & cache disabled.
 */
async function measureColdRoute({ route, initScript, readinessSelectors }) {
  console.log(`\n--- Measuring Cold Direct Load: ${route} ---`);
  const browser = new ChromeBrowser();
  await browser.launch();

  try {
    await browser.setViewport(VIEWPORT);

    // Explicitly enable CDP Network tracking before navigation
    await browser.sendToSession('Network.enable');
    await browser.setCacheDisabled(true);
    await browser.setBypassServiceWorker(true);

    if (initScript) {
      await browser.addInitScript(initScript);
    }

    const tracker = createNetworkTracker(browser);

    await browser.navigate(`${PREVIEW_URL}${route}`);

    // Wait for route-specific readiness conditions
    for (const selector of readinessSelectors) {
      await browser.waitForSelector(selector, 10000);
    }

    // Bounded network-idle wait
    await tracker.waitForNetworkIdle(600, 10000);

    const jsRequests = tracker.getJavaScriptRequests();
    let totalTransfer = 0;

    const formattedRequests = jsRequests.map((r) => {
      totalTransfer += r.encodedDataLength;
      const parsedUrl = new URL(r.url);
      const filename = path.basename(parsedUrl.pathname);
      return {
        url: r.url,
        pathname: parsedUrl.pathname,
        filename,
        status: r.status,
        resourceType: r.resourceType,
        mimeType: r.mimeType,
        contentEncoding: r.contentEncoding,
        fromDiskCache: r.fromDiskCache,
        fromMemoryCache: r.fromMemoryCache,
        fromServiceWorker: r.fromServiceWorker,
        encodedDataLength: r.encodedDataLength,
        failed: r.failed,
        errorText: r.errorText,
        incomplete: r.incomplete,
      };
    });

    const failedOrIncomplete = tracker.getIncompleteOrFailedRequests();
    tracker.cleanup();

    console.log(
      `  Route ${route}: ${formattedRequests.length} JS chunk(s), ${totalTransfer} network transfer bytes.`
    );
    for (const req of formattedRequests) {
      console.log(
        `    - ${req.filename} (${req.encodedDataLength} transfer bytes, status: ${req.status}, encoding: ${
          req.contentEncoding || 'none'
        })`
      );
    }

    if (failedOrIncomplete.length > 0) {
      console.warn(`  Warning: ${failedOrIncomplete.length} request(s) failed or incomplete:`);
      for (const iss of failedOrIncomplete) {
        console.warn(`    - ${iss.url} (failed=${iss.failed}, incomplete=${iss.incomplete}, error=${iss.errorText})`);
      }
    }

    return {
      route,
      jsCount: formattedRequests.length,
      totalTransferBytes: totalTransfer,
      requests: formattedRequests,
      failedOrIncompleteCount: failedOrIncomplete.length,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Measure SPA in-session navigation with caching enabled.
 */
async function measureSpaNavigation() {
  console.log('\n--- Measuring SPA Navigation Flow ---');
  const browser = new ChromeBrowser();
  await browser.launch();

  const results = [];
  const seenChunkFilenames = new Set();

  try {
    await browser.setViewport(VIEWPORT);

    // Explicitly enable CDP Network tracking
    await browser.sendToSession('Network.enable');
    await browser.setCacheDisabled(false); // Caching enabled for realistic SPA navigation
    await browser.setBypassServiceWorker(false);

    const tracker = createNetworkTracker(browser);

    // 1. Initial Landing Page load
    console.log('SPA Step 1: Loading Landing Page (/)');
    const mark1 = tracker.completedRecords.length;
    await browser.navigate(`${PREVIEW_URL}/`);
    await browser.waitForSelector('h1', 10000);
    await browser.waitForSelector('a[href="/campus"]', 10000);
    await tracker.waitForNetworkIdle(600, 10000);

    const step1Js = tracker.completedRecords
      .slice(mark1)
      .filter((r) => isJavaScriptResource(r.url, r.resourceType, r.mimeType));
    const step1Transfer = step1Js.reduce((acc, r) => acc + r.encodedDataLength, 0);

    const step1NewChunks = [];
    for (const r of step1Js) {
      const fn = path.basename(new URL(r.url).pathname);
      if (!seenChunkFilenames.has(fn)) {
        seenChunkFilenames.add(fn);
        step1NewChunks.push(fn);
      }
    }

    results.push({
      step: 'Landing Page Load',
      route: '/',
      totalChunksInStep: step1Js.length,
      newChunks: step1NewChunks,
      transferBytes: step1Transfer,
      requests: step1Js.map((r) => ({
        filename: path.basename(new URL(r.url).pathname),
        encodedDataLength: r.encodedDataLength,
        fromDiskCache: r.fromDiskCache,
        fromMemoryCache: r.fromMemoryCache,
      })),
    });
    console.log(`  Landing: ${step1NewChunks.length} new chunks, ${step1Transfer} transfer bytes`);

    // 2. Click "Enter Campus"
    console.log('SPA Step 2: Navigating to /campus via link click');
    const mark2 = tracker.completedRecords.length;
    await browser.evaluate(() => {
      const link = document.querySelector('a[href="/campus"]');
      if (!link) throw new Error('Enter Campus link not found');
      link.click();
    });
    await browser.waitForSelector('h1', 10000);
    await browser.waitForSelector('a[href="/room/phishing"]', 10000);
    await tracker.waitForNetworkIdle(600, 10000);

    const step2Js = tracker.completedRecords
      .slice(mark2)
      .filter((r) => isJavaScriptResource(r.url, r.resourceType, r.mimeType));
    const step2Transfer = step2Js.reduce((acc, r) => acc + r.encodedDataLength, 0);

    const step2NewChunks = [];
    for (const r of step2Js) {
      const fn = path.basename(new URL(r.url).pathname);
      if (!seenChunkFilenames.has(fn)) {
        seenChunkFilenames.add(fn);
        step2NewChunks.push(fn);
      }
    }

    results.push({
      step: 'Navigate Landing -> Campus',
      route: '/campus',
      totalChunksInStep: step2Js.length,
      newChunks: step2NewChunks,
      transferBytes: step2Transfer,
      requests: step2Js.map((r) => ({
        filename: path.basename(new URL(r.url).pathname),
        encodedDataLength: r.encodedDataLength,
        fromDiskCache: r.fromDiskCache,
        fromMemoryCache: r.fromMemoryCache,
      })),
    });
    console.log(`  To Campus: ${step2NewChunks.length} new chunks, ${step2Transfer} transfer bytes`);

    // 3. Click Room link (Phishing Defense)
    console.log('SPA Step 3: Navigating to /room/phishing via link click');
    const mark3 = tracker.completedRecords.length;
    await browser.evaluate(() => {
      const link = document.querySelector('a[href="/room/phishing"]');
      if (!link) throw new Error('Room link not found');
      link.click();
    });
    await browser.waitForSelector('h1', 10000);
    await browser.waitForSelector('a[href^="/challenge/"]', 10000);
    await tracker.waitForNetworkIdle(600, 10000);

    const step3Js = tracker.completedRecords
      .slice(mark3)
      .filter((r) => isJavaScriptResource(r.url, r.resourceType, r.mimeType));
    const step3Transfer = step3Js.reduce((acc, r) => acc + r.encodedDataLength, 0);

    const step3NewChunks = [];
    for (const r of step3Js) {
      const fn = path.basename(new URL(r.url).pathname);
      if (!seenChunkFilenames.has(fn)) {
        seenChunkFilenames.add(fn);
        step3NewChunks.push(fn);
      }
    }

    results.push({
      step: 'Navigate Campus -> Room',
      route: '/room/phishing',
      totalChunksInStep: step3Js.length,
      newChunks: step3NewChunks,
      transferBytes: step3Transfer,
      requests: step3Js.map((r) => ({
        filename: path.basename(new URL(r.url).pathname),
        encodedDataLength: r.encodedDataLength,
        fromDiskCache: r.fromDiskCache,
        fromMemoryCache: r.fromMemoryCache,
      })),
    });
    console.log(`  To Room: ${step3NewChunks.length} new chunks, ${step3Transfer} transfer bytes`);

    // 4. Click Challenge link (cc-ph-01)
    console.log('SPA Step 4: Navigating to /challenge/cc-ph-01 via link click');
    const mark4 = tracker.completedRecords.length;
    await browser.evaluate(() => {
      const link = document.querySelector('a[href="/challenge/cc-ph-01"]');
      if (!link) throw new Error('Challenge link not found');
      link.click();
    });
    await browser.waitForSelector('#submit-challenge', 10000);
    await browser.waitForSelector('[role="tablist"][aria-label="Evidence tabs"]', 10000);
    await tracker.waitForNetworkIdle(600, 10000);

    const step4Js = tracker.completedRecords
      .slice(mark4)
      .filter((r) => isJavaScriptResource(r.url, r.resourceType, r.mimeType));
    const step4Transfer = step4Js.reduce((acc, r) => acc + r.encodedDataLength, 0);

    const step4NewChunks = [];
    for (const r of step4Js) {
      const fn = path.basename(new URL(r.url).pathname);
      if (!seenChunkFilenames.has(fn)) {
        seenChunkFilenames.add(fn);
        step4NewChunks.push(fn);
      }
    }

    results.push({
      step: 'Navigate Room -> Challenge',
      route: '/challenge/cc-ph-01',
      totalChunksInStep: step4Js.length,
      newChunks: step4NewChunks,
      transferBytes: step4Transfer,
      requests: step4Js.map((r) => ({
        filename: path.basename(new URL(r.url).pathname),
        encodedDataLength: r.encodedDataLength,
        fromDiskCache: r.fromDiskCache,
        fromMemoryCache: r.fromMemoryCache,
      })),
    });
    console.log(`  To Challenge: ${step4NewChunks.length} new chunks, ${step4Transfer} transfer bytes`);

    tracker.cleanup();
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Measure dist artifact sizes (raw and gzip).
 * Calculated separately from dist files, distinct from network transfers.
 */
export function measureDistArtifacts() {
  console.log('\n--- Measuring dist/ Build Artifacts ---');
  const distDir = path.resolve('dist', 'assets');
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory does not exist: ${distDir}. Run npm run build first.`);
  }

  const files = fs.readdirSync(distDir);
  const jsFiles = files.filter((f) => f.endsWith('.js') || f.endsWith('.mjs'));

  let totalRaw = 0;
  let totalGzip = 0;

  const artifacts = jsFiles.map((filename) => {
    const fullPath = path.join(distDir, filename);
    const content = fs.readFileSync(fullPath);
    const rawBytes = content.length;
    const gzipBytes = zlib.gzipSync(content).length;

    totalRaw += rawBytes;
    totalGzip += gzipBytes;

    return {
      filename,
      rawBytes,
      gzipBytes,
    };
  });

  console.log(`Found ${artifacts.length} JS artifact(s):`);
  for (const art of artifacts) {
    console.log(
      `  - ${art.filename}: ${art.rawBytes.toLocaleString()} bytes raw | ${art.gzipBytes.toLocaleString()} bytes gzip`
    );
  }
  console.log(
    `Total JS Dist Artifacts: ${totalRaw.toLocaleString()} bytes raw | ${totalGzip.toLocaleString()} bytes gzip`
  );

  return {
    totalRawBytes: totalRaw,
    totalGzipBytes: totalGzip,
    artifacts,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

  console.log('=== CyberCampus Performance Measurement Suite ===');
  console.log(`Browser: Google Chrome (Headless)`);
  console.log(`Target URL: ${PREVIEW_URL}`);
  console.log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);

  const distStats = measureDistArtifacts();

  // 1. Cold Direct Loads
  const coldLanding = await measureColdRoute({
    route: '/',
    initScript: null,
    readinessSelectors: ['h1', 'a[href="/campus"]'],
  });

  // Verify: Landing loads must NEVER request full challenge evidence or challenge pages
  const landingEvidenceRequests = coldLanding.requests.filter(
    (r) =>
      r.filename.toLowerCase().includes('challenge') ||
      r.filename.toLowerCase().includes('evidence') ||
      r.filename.toLowerCase().includes('stego') ||
      r.filename.toLowerCase().includes('packet')
  );
  if (landingEvidenceRequests.length > 0) {
    console.error(
      'REGRESSION: Cold landing page requested challenge evidence chunk(s):',
      landingEvidenceRequests.map((r) => r.filename)
    );
    process.exit(1);
  } else {
    console.log('Verified: Cold landing load never requested challenge evidence chunks.');
  }

  const lowPerfInitScript = `
    try {
      const state = {
        state: {
          profile: {
            id: 'test-user',
            displayName: 'CyberCadet',
            createdAt: new Date().toISOString(),
            settings: { reducedMotion: false, lowPerformanceMode: true, soundEnabled: true },
          },
          progress: { userId: 'test-user', attempts: [], portfolio: [], skillTags: {} },
        },
        version: 0,
      };
      localStorage.setItem('cybercampus_v1', JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  `;

  const coldCampus2D = await measureColdRoute({
    route: '/campus',
    initScript: lowPerfInitScript,
    readinessSelectors: ['h1', 'nav[aria-label="Campus rooms"]'],
  });

  // Verify: Cold 2D low-performance campus loads must NEVER request the 3D scene chunk
  const requested3DIn2D = coldCampus2D.requests.some((r) =>
    r.filename.toLowerCase().includes('campuscene') || r.filename.toLowerCase().includes('campusscene')
  );
  if (requested3DIn2D) {
    console.error('REGRESSION: Cold 2D low-performance campus requested 3D scene chunk!');
    process.exit(1);
  } else {
    console.log('Verified: Cold low-performance 2D campus load never requested 3D scene chunk.');
  }

  const coldChallenge = await measureColdRoute({
    route: '/challenge/cc-ph-01',
    initScript: null,
    readinessSelectors: ['#submit-challenge', '[role="tablist"][aria-label="Evidence tabs"]'],
  });

  const highPerfInitScript = `
    try {
      const state = {
        state: {
          profile: {
            id: 'test-user',
            displayName: 'CyberCadet',
            createdAt: new Date().toISOString(),
            settings: { reducedMotion: false, lowPerformanceMode: false, soundEnabled: true },
          },
          progress: { userId: 'test-user', attempts: [], portfolio: [], skillTags: {} },
        },
        version: 0,
      };
      localStorage.setItem('cybercampus_v1', JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  `;

  const coldCampus3D = await measureColdRoute({
    route: '/campus',
    initScript: highPerfInitScript,
    readinessSelectors: ['h1', 'div[aria-label="Interactive 3D campus view"] canvas'],
  });

  // 2. SPA Navigation
  const spaResults = await measureSpaNavigation();

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      browser: 'Google Chrome (Headless)',
      previewUrl: PREVIEW_URL,
      viewport: VIEWPORT,
      cachePolicy: {
        coldLoads: 'setCacheDisabled=true, setBypassServiceWorker=true',
        spaNavigation: 'setCacheDisabled=false, setBypassServiceWorker=false',
      },
      notes:
        'Dist artifact sizes (raw and gzip) are computed directly from dist/ files via zlib.gzipSync. Network transfer bytes represent actual wire bytes transferred (encodedDataLength from CDP Network.loadingFinished).',
    },
    distStats,
    coldLoads: {
      landing: coldLanding,
      campus2D: coldCampus2D,
      challenge: coldChallenge,
      campus3D: coldCampus3D,
    },
    spaNavigation: spaResults,
  };

  if (outputFile) {
    const fullOutputPath = path.resolve(outputFile);
    fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
    fs.writeFileSync(fullOutputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nMachine-readable report successfully saved to ${fullOutputPath}`);
  }

  console.log('\n=== Measurement Suite Finished Successfully ===');
}

main().catch((err) => {
  console.error('\nMeasurement failed with error:', err);
  process.exit(1);
});
