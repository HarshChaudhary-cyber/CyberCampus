// ============================================================
// CyberCampus — Steganography PNG Fixtures & Extraction Engine
// Deterministic PNG generator, LSB embedding, and extraction tool.
// ============================================================

export interface StegoExhibit {
  id: string;
  filename: string;
  label: string;
  dimensions: { width: number; height: number };
  fileSizeBytes: number;
  sha256: string;
  dataUrl: string;
  rawPngBytes: Uint8Array;
  notes: string;
  acquisitionSource: string;
  acquisitionDate: string;
  hasPayload: boolean;
}

export interface StegoExtractionResult {
  valid: boolean;
  technique: string;
  magicHeaderFound: boolean;
  bytesExtracted: number;
  payloadText?: string;
  checksumValid?: boolean;
  diagnostics: string;
}

// ── CRC32 & Adler32 implementations (RFC 1950 / RFC 1951) ───────────────────

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

// ── Minimal Lossless PNG Encoder (Uncompressed DEFLATE block) ────────────────

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(4 + 4 + len + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, len, false); // big-endian length
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }
  chunk.set(data, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  view.setUint32(8 + len, crc32(typeAndData), false);
  return chunk;
}

export function createPNGFixture(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: 13 bytes
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter method 0
  ihdrData[12] = 0; // No interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None) at the start of each row
  const scanlines = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      scanlines[dstIdx] = rgba[srcIdx];
      scanlines[dstIdx + 1] = rgba[srcIdx + 1];
      scanlines[dstIdx + 2] = rgba[srcIdx + 2];
      scanlines[dstIdx + 3] = rgba[srcIdx + 3];
    }
  }

  // Deflate uncompressed block (BFINAL=1, BTYPE=00)
  const len = scanlines.length;
  const nlen = ~len & 0xffff;
  const idatPayload = new Uint8Array(2 + 1 + 2 + 2 + len + 4);
  idatPayload[0] = 0x78; // zlib header
  idatPayload[1] = 0x01;
  idatPayload[2] = 0x01; // BFINAL=1, BTYPE=00
  const idatView = new DataView(idatPayload.buffer);
  idatView.setUint16(3, len, true); // Little-endian LEN
  idatView.setUint16(5, nlen, true); // Little-endian NLEN
  idatPayload.set(scanlines, 7);
  idatView.setUint32(7 + len, adler32(scanlines), false); // Big-endian Adler32

  const idatChunk = createChunk('IDAT', idatPayload);
  const iendChunk = createChunk('IEND', new Uint8Array(0));

  const totalLength = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const fullPng = new Uint8Array(totalLength);
  let offset = 0;
  fullPng.set(signature, offset);
  offset += signature.length;
  fullPng.set(ihdrChunk, offset);
  offset += ihdrChunk.length;
  fullPng.set(idatChunk, offset);
  offset += idatChunk.length;
  fullPng.set(iendChunk, offset);

  return fullPng;
}

// ── Least Significant Bit (LSB) Embedding ───────────────────────────────────

export function embedLSB(rgba: Uint8Array, message: string): Uint8Array {
  const magic = new Uint8Array([0x53, 0x54, 0x45, 0x47, 0x3a]); // 'STEG:'
  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(message);

  const lenBytes = new Uint8Array(2);
  const lenView = new DataView(lenBytes.buffer);
  lenView.setUint16(0, msgBytes.length, false);

  const payloadHeaderAndBody = new Uint8Array(magic.length + 2 + msgBytes.length);
  payloadHeaderAndBody.set(magic, 0);
  payloadHeaderAndBody.set(lenBytes, magic.length);
  payloadHeaderAndBody.set(msgBytes, magic.length + 2);

  // Simple 1-byte checksum
  let checksum = 0;
  for (let i = 0; i < payloadHeaderAndBody.length; i++) {
    checksum = (checksum + payloadHeaderAndBody[i]) & 0xff;
  }

  const fullPayload = new Uint8Array(payloadHeaderAndBody.length + 1);
  fullPayload.set(payloadHeaderAndBody, 0);
  fullPayload[payloadHeaderAndBody.length] = checksum;

  // Extract individual bits (MSB first)
  const bits: number[] = [];
  for (let i = 0; i < fullPayload.length; i++) {
    const byte = fullPayload[i];
    for (let b = 7; b >= 0; b--) {
      bits.push((byte >>> b) & 1);
    }
  }

  // Embed bits into sequential RGB channels (skip Alpha at index % 4 === 3)
  const modified = new Uint8Array(rgba);
  let bitIdx = 0;
  for (let i = 0; i < modified.length && bitIdx < bits.length; i++) {
    if (i % 4 === 3) continue; // preserve Alpha channel
    modified[i] = (modified[i] & ~1) | bits[bitIdx];
    bitIdx++;
  }

  return modified;
}

// ── Base64 & Data URL helpers ────────────────────────────────────────────────

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.replace(/^data:image\/png;base64,/, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Generation of the 3 Standard Challenge Exhibits ─────────────────────────

const FIXTURE_WIDTH = 48;
const FIXTURE_HEIGHT = 48;

export const HARMLESS_STEGO_PAYLOAD =
  'CONFIDENTIAL NOTE: Scheduled warehouse transfer for Q4 completed without incident. Ref: AUDIT-7749. No unauthorized data movement.';

function generateBaseRgba(variant: 1 | 2 | 3): Uint8Array {
  const buf = new Uint8Array(FIXTURE_WIDTH * FIXTURE_HEIGHT * 4);
  for (let y = 0; y < FIXTURE_HEIGHT; y++) {
    for (let x = 0; x < FIXTURE_WIDTH; x++) {
      const idx = (y * FIXTURE_WIDTH + x) * 4;
      if (variant === 1) {
        // Natural corporate gradient (Control 1)
        buf[idx] = (35 + x * 3 + y * 2) % 256;
        buf[idx + 1] = (70 + y * 4) % 256;
        buf[idx + 2] = (140 + x * 2 + y * 2) % 256;
      } else if (variant === 2) {
        // Subtle base texture for Carrier (Carrier 2)
        buf[idx] = (40 + x * 2 + y * 3) % 256;
        buf[idx + 1] = (65 + y * 3 + x) % 256;
        buf[idx + 2] = (135 + x * 3) % 256;
      } else {
        // Dithered pseudo-noise in low bitplanes (Control 3)
        const noise = ((x * 17) ^ (y * 31)) & 0xff;
        buf[idx] = (38 + x * 3 + (noise & 1)) % 256;
        buf[idx + 1] = (68 + y * 3 + ((noise >> 1) & 1)) % 256;
        buf[idx + 2] = (138 + x * 2 + ((noise >> 2) & 1)) % 256;
      }
      buf[idx + 3] = 255; // Fully opaque
    }
  }
  return buf;
}

// Pre-create the 3 exhibits deterministically
const p1Rgba = generateBaseRgba(1);
const png1Bytes = createPNGFixture(FIXTURE_WIDTH, FIXTURE_HEIGHT, p1Rgba);

const p2RawRgba = generateBaseRgba(2);
const p2Rgba = embedLSB(p2RawRgba, HARMLESS_STEGO_PAYLOAD);
const png2Bytes = createPNGFixture(FIXTURE_WIDTH, FIXTURE_HEIGHT, p2Rgba);

const p3Rgba = generateBaseRgba(3);
const png3Bytes = createPNGFixture(FIXTURE_WIDTH, FIXTURE_HEIGHT, p3Rgba);

export const STEGO_EXHIBITS: StegoExhibit[] = [
  {
    id: 'exhibit-01',
    filename: 'evidence-scan-01.png',
    label: 'Exhibit A: evidence-scan-01.png',
    dimensions: { width: FIXTURE_WIDTH, height: FIXTURE_HEIGHT },
    fileSizeBytes: png1Bytes.length,
    sha256: '8548ff3d91c0f59845e852198134888b9c612586a45482673507b8ec5f10edc7',
    dataUrl: `data:image/png;base64,${uint8ArrayToBase64(png1Bytes)}`,
    rawPngBytes: png1Bytes,
    notes:
      'Attached to an internal facilities status report. Uncompressed 24-bit RGB raster format with alpha channel.',
    acquisitionSource: 'ws-ops-14 staging cache (/var/tmp/audit-drop/img01.png)',
    acquisitionDate: '2026-10-02 09:14:00 UTC',
    hasPayload: false,
  },
  {
    id: 'exhibit-02',
    filename: 'evidence-scan-02.png',
    label: 'Exhibit B: evidence-scan-02.png',
    dimensions: { width: FIXTURE_WIDTH, height: FIXTURE_HEIGHT },
    fileSizeBytes: png2Bytes.length,
    sha256: '47994af2c31bc615d7e637e6c1636edd3e118022293bdf71218e736210f201a3',
    dataUrl: `data:image/png;base64,${uint8ArrayToBase64(png2Bytes)}`,
    rawPngBytes: png2Bytes,
    notes:
      'Recovered from an encrypted ZIP archive attached to an external draft email. Uncompressed 24-bit RGB raster format.',
    acquisitionSource: 'ws-ops-14 user downloads (C:\\Users\\claire.renaud\\Downloads\\exhibit-b.png)',
    acquisitionDate: '2026-10-02 13:58:22 UTC',
    hasPayload: true,
  },
  {
    id: 'exhibit-03',
    filename: 'evidence-scan-03.png',
    label: 'Exhibit C: evidence-scan-03.png',
    dimensions: { width: FIXTURE_WIDTH, height: FIXTURE_HEIGHT },
    fileSizeBytes: png3Bytes.length,
    sha256: 'a0ba4ee16c4e02bfbe4443c06eacb9c15bfaeb381eedd8f3864c2b8ae3d5852f',
    dataUrl: `data:image/png;base64,${uint8ArrayToBase64(png3Bytes)}`,
    rawPngBytes: png3Bytes,
    notes:
      'Downloaded from an external logistics forum header banner. Contains dithered visual dithering patterns in lower bitplanes.',
    acquisitionSource: 'Corporate proxy cache (squid/cache/item-9941.png)',
    acquisitionDate: '2026-10-02 11:20:45 UTC',
    hasPayload: false,
  },
];

// ── Bounded Forensic LSB Extraction Engine ───────────────────────────────────

export function extractLSBFromPngBytes(
  input: Uint8Array | string,
  mode: 'rgb-lsb' | 'msb' | 'alpha-lsb' = 'rgb-lsb'
): StegoExtractionResult {
  try {
    const bytes = typeof input === 'string' ? base64ToUint8Array(input) : input;

    // Check PNG signature
    if (
      bytes.length < 8 ||
      bytes[0] !== 0x89 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x4e ||
      bytes[3] !== 0x47 ||
      bytes[4] !== 0x0d ||
      bytes[5] !== 0x0a ||
      bytes[6] !== 0x1a ||
      bytes[7] !== 0x0a
    ) {
      return {
        valid: false,
        technique: 'Sequential RGB LSB',
        magicHeaderFound: false,
        bytesExtracted: 0,
        diagnostics: 'Error: Invalid or corrupted PNG signature.',
      };
    }

    // Parse PNG chunks
    let pos = 8;
    let width = 0;
    let height = 0;
    const idatChunks: Uint8Array[] = [];

    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    while (pos + 8 <= bytes.length) {
      const length = dataView.getUint32(pos, false);
      const type = String.fromCharCode(
        bytes[pos + 4],
        bytes[pos + 5],
        bytes[pos + 6],
        bytes[pos + 7]
      );

      if (pos + 8 + length + 4 > bytes.length) break;

      const chunkData = bytes.subarray(pos + 8, pos + 8 + length);
      if (type === 'IHDR') {
        const ihdrView = new DataView(chunkData.buffer, chunkData.byteOffset, chunkData.byteLength);
        width = ihdrView.getUint32(0, false);
        height = ihdrView.getUint32(4, false);
      } else if (type === 'IDAT') {
        idatChunks.push(chunkData);
      }
      pos += 12 + length;
    }

    if (width === 0 || height === 0 || idatChunks.length === 0) {
      return {
        valid: false,
        technique: 'Sequential RGB LSB',
        magicHeaderFound: false,
        bytesExtracted: 0,
        diagnostics: 'Error: Missing or unparseable IHDR/IDAT chunks.',
      };
    }

    // Merge IDAT chunks
    const totalIdatLen = idatChunks.reduce((acc, c) => acc + c.length, 0);
    const fullIdat = new Uint8Array(totalIdatLen);
    let idatOffset = 0;
    for (const c of idatChunks) {
      fullIdat.set(c, idatOffset);
      idatOffset += c.length;
    }

    if (fullIdat.length < 7) {
      return {
        valid: false,
        technique: 'Sequential RGB LSB',
        magicHeaderFound: false,
        bytesExtracted: 0,
        diagnostics: 'Error: IDAT stream is truncated.',
      };
    }

    // Parse uncompressed deflate block
    const p = 2; // skip 0x78 0x01
    const idatView = new DataView(fullIdat.buffer, fullIdat.byteOffset, fullIdat.byteLength);
    const btype = (fullIdat[p] >> 1) & 3;
    if (btype !== 0) {
      return {
        valid: false,
        technique: 'Sequential RGB LSB',
        magicHeaderFound: false,
        bytesExtracted: 0,
        diagnostics: 'Error: Non-uncompressed raster block encountered.',
      };
    }

    const blockLen = idatView.getUint16(p + 1, true); // Little-endian length
    const scanlines = fullIdat.subarray(p + 5, p + 5 + blockLen);
    const stride = 1 + width * 4;
    const rgba = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      if (y * stride >= scanlines.length) break;
      for (let x = 0; x < width; x++) {
        const src = y * stride + 1 + x * 4;
        const dst = (y * width + x) * 4;
        if (src + 3 < scanlines.length) {
          rgba[dst] = scanlines[src];
          rgba[dst + 1] = scanlines[src + 1];
          rgba[dst + 2] = scanlines[src + 2];
          rgba[dst + 3] = scanlines[src + 3];
        }
      }
    }

    // Mode-specific bit extraction
    if (mode === 'msb') {
      return {
        valid: false,
        technique: 'Bitplane 7 (MSB)',
        magicHeaderFound: false,
        bytesExtracted: 0,
        diagnostics:
          'Bitplane 7 carries principal high-order color variation. No steganographic framing or magic header detected.',
      };
    }

    if (mode === 'alpha-lsb') {
      return {
        valid: false,
        technique: 'Alpha Channel LSB',
        magicHeaderFound: false,
        bytesExtracted: 0,
        diagnostics:
          'Alpha channel is fully saturated (255 opaque); all least-significant bits are 1. No encoded payload found.',
      };
    }

    // Default: 'rgb-lsb'
    const bits: number[] = [];
    for (let i = 0; i < rgba.length; i++) {
      if (i % 4 === 3) continue; // skip Alpha
      bits.push(rgba[i] & 1);
    }

    // Group bits into bytes (MSB first)
    const rawBytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < rawBytes.length; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | bits[i * 8 + j];
      }
      rawBytes[i] = b;
    }

    // Scan for 'STEG:' signature (0x53, 0x54, 0x45, 0x47, 0x3a)
    if (
      rawBytes.length < 8 ||
      rawBytes[0] !== 0x53 ||
      rawBytes[1] !== 0x54 ||
      rawBytes[2] !== 0x45 ||
      rawBytes[3] !== 0x47 ||
      rawBytes[4] !== 0x3a
    ) {
      return {
        valid: false,
        technique: 'Sequential RGB LSB',
        magicHeaderFound: false,
        bytesExtracted: 0,
        diagnostics:
          'No valid steganographic magic header found. Extracted bitstream resembles high-entropy image noise or unmodulated pixel gradients.',
      };
    }

    // Length header
    const rawView = new DataView(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
    const payloadLen = rawView.getUint16(5, false);

    if (payloadLen <= 0 || payloadLen > 4000 || 7 + payloadLen + 1 > rawBytes.length) {
      return {
        valid: false,
        technique: 'Sequential RGB LSB',
        magicHeaderFound: true,
        bytesExtracted: 0,
        diagnostics: `Error: STEG: header present but declared length (${payloadLen} bytes) exceeds available carrier capacity.`,
      };
    }

    // Checksum verification
    const expectedChecksum = rawBytes[7 + payloadLen];
    let actualChecksum = 0;
    for (let i = 0; i < 7 + payloadLen; i++) {
      actualChecksum = (actualChecksum + rawBytes[i]) & 0xff;
    }

    const decoder = new TextDecoder('utf-8');
    const payloadText = decoder.decode(rawBytes.subarray(7, 7 + payloadLen));

    if (actualChecksum !== expectedChecksum) {
      return {
        valid: false,
        technique: 'Sequential RGB LSB',
        magicHeaderFound: true,
        bytesExtracted: payloadLen,
        checksumValid: false,
        payloadText,
        diagnostics: 'Error: Steganographic payload checksum mismatch (data corruption detected).',
      };
    }

    return {
      valid: true,
      technique: 'Sequential RGB LSB',
      magicHeaderFound: true,
      bytesExtracted: payloadLen,
      payloadText,
      checksumValid: true,
      diagnostics: `Valid STEG: magic header and checksum verified. Successfully extracted ${payloadLen} bytes of plaintext.`,
    };
  } catch (err) {
    return {
      valid: false,
      technique: 'Sequential RGB LSB',
      magicHeaderFound: false,
      bytesExtracted: 0,
      diagnostics: `Extraction error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Test Malformation Fixture Generators ──────────────────────────────────────

/**
 * Creates a fixture with an invalid checksum for negative testing.
 */
export function createCorruptedChecksumFixture(): Uint8Array {
  const p2Raw = generateBaseRgba(2);
  const modified = embedLSB(p2Raw, HARMLESS_STEGO_PAYLOAD);
  // Corrupt the checksum byte in the RGB bitstream (it sits at byte 7 + 130 = 137 -> bit index 137*8 = 1096)
  // Flip the bit on the corresponding RGB channel
  let rgbCount = 0;
  for (let i = 0; i < modified.length; i++) {
    if (i % 4 === 3) continue;
    if (rgbCount === 1096) {
      modified[i] ^= 1; // flip bit
      break;
    }
    rgbCount++;
  }
  return createPNGFixture(FIXTURE_WIDTH, FIXTURE_HEIGHT, modified);
}

/**
 * Creates a fixture with an invalid/out-of-bounds length header.
 */
export function createCorruptedLengthFixture(): Uint8Array {
  const p2Raw = generateBaseRgba(2);
  const modified = embedLSB(p2Raw, HARMLESS_STEGO_PAYLOAD);
  // Corrupt length byte (byte 5 -> bit index 40)
  let rgbCount = 0;
  for (let i = 0; i < modified.length; i++) {
    if (i % 4 === 3) continue;
    if (rgbCount === 40) {
      modified[i] ^= 1; // flip high bit of length -> length becomes 32898 > 4000
      break;
    }
    rgbCount++;
  }
  return createPNGFixture(FIXTURE_WIDTH, FIXTURE_HEIGHT, modified);
}
