// ============================================================
// CyberCampus — Challenge Data: cc-df-03 "Steganography Detection"
// Room: Digital Forensics | Difficulty: Advanced
// ============================================================

import type { Challenge } from '../../types';
import { STEGO_EXHIBITS, type StegoExhibit } from './stego-fixtures';

export interface StegoEvidenceContent {
  [key: string]: unknown;
  isStegoEvidence: boolean;
  caseReference: string;
  exhibits: StegoExhibit[];
  guidanceNote: {
    title: string;
    rules: string[];
  };
}

export const challengeCC_DF_03: Challenge = {
  id: 'cc-df-03',
  roomId: 'forensics',
  difficulty: 'advanced',
  title: 'Steganography Detection',
  briefing:
    'During an internal communications audit, security operations recovered three lossless PNG image files from a workstation suspected of being used for unauthorized data movement. An anonymous tip alleged that confidential warehouse transit schedules were being concealed inside innocent-looking images. Investigators must analyze the three PNG exhibits, recognize that file sizes, standard metadata, and visual appearances alone do not prove or disprove steganography, execute spatial-domain least-significant-bit (LSB) extraction on the actual raster data, evaluate whether any recovered bitstream contains valid framing and integrity checksums, and formulate a defensible forensic reporting and preservation action.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-stego-workbench',
      type: 'image',
      label: 'Image Evidence & Extraction Workbench (3 exhibits)',
      content: {
        isStegoEvidence: true,
        caseReference: 'IR-2026-1044-STEGO',
        exhibits: STEGO_EXHIBITS,
        guidanceNote: {
          title: 'Image Steganalysis & Least-Significant-Bit Principles',
          rules: [
            '1. Limitations of Visual & File Size Inspection: Spatial-domain least-significant-bit (LSB) steganography modifies only the least significant bit of raw pixel color bytes. Because the total number of pixels and the image dimensions remain unchanged, LSB embedding does not alter raster file sizes or produce human-discernible color changes. Appearance and file size alone never prove steganography.',
            '2. Structured Framing vs. Random Noise: In modern steganalysis, lower bitplanes frequently exhibit high visual entropy or dithered noise from gradients and compression. A valid steganographic payload requires structured framing: recognized magic headers, explicit length boundaries, and cryptographic or algebraic integrity checksums.',
            '3. Evidentiary Distinction & Attribution Boundaries: Recovering an embedded payload establishes that data was steganographically concealed in the container. However, payload discovery alone does not prove malicious intent or identify an offender without corroborating payload content and contextual telemetry.',
          ],
        },
      } as StegoEvidenceContent,
    },
    {
      id: 'ev-stego-sop',
      type: 'policy',
      label: 'Forensic Steganography Examination SOP (SOP FOR-204)',
      content: {
        title: 'SOP FOR-204: Forensic Image Steganography Examination & Reporting Standards',
        code: 'SOP-FOR-204-REV1',
        category: 'DIGITAL FORENSICS STANDARD OPERATING PROCEDURE',
        effectiveDate: '2026-03-15',
        classification: 'INTERNAL FORENSIC STANDARD',
        rules: [
          'Rule 1 (Spatial Domain Extraction Methodology): When evaluating lossless 24-bit and 32-bit raster formats (PNG, BMP), examiners must parse uncompressed scanlines and extract least-significant bits across sequential color channels (RGB in raster scanline order). The alpha transparency channel must be excluded from payload decoding unless custom 4-channel encoding is explicitly documented.',
          'Rule 2 (Payload Validation & Elimination of False Positives): Extracted bitstreams must be screened for verified protocol framing, including magic identifiers, declared payload byte lengths, and parity/checksum validation. Random bit sequences or corrupt headers must be classified as image entropy noise rather than positive payload recoveries.',
          'Rule 3 (Objective Reporting & Attribution Restrictions): Successful payload extraction must be reported strictly as an objective technical finding. The forensic report must describe the recovered text verbatim, record verification hashes, and explicitly avoid concluding criminal intent or attributing authorship unless independent host or network telemetry corroborates the action.',
          'Rule 4 (Evidence Preservation & Working Copies): All examinations must be executed on verified working copies. Original SHA-256 hashes must be verified before and after extraction, and all raw bitstreams, extraction parameters, and recovered artifacts must be documented in the master evidence ledger.',
        ],
      },
    },
  ],

  // ── Steps ──────────────────────────────────────────────────────────────────
  steps: [
    // Step 1: Extraction Methodology (30 pts, single-choice)
    {
      id: 'step-extraction-method',
      prompt:
        'Based on SOP FOR-204 and the lossless PNG evidence files, which forensic analysis method should be used to test for hidden data embedded in the spatial image domain?',
      interaction: 'single-choice',
      items: [
        {
          id: 'meth-lsb',
          label:
            'Extract the least significant bits (LSB) across sequential RGB color channels and inspect the resulting bitstream for structured payload headers and checksum verification.',
        },
        {
          id: 'meth-filesize',
          label:
            'Compare file sizes in the file manager, because any image carrying steganographic text must be at least twice as large as the original.',
        },
        {
          id: 'meth-visual',
          label:
            'Perform visual inspection of the image thumbnails, because 1-bit color modifications always produce visible discolored pixel blocks to the naked eye.',
        },
        {
          id: 'meth-exif-only',
          label:
            'Inspect standard EXIF and IPTC metadata headers, because spatial-domain steganography tools always store their text in the Camera Model field.',
        },
      ],
      answerKey: { chosen: 'meth-lsb' },
      pointValue: 30,
      partialCreditAllowed: false,
    },

    // Step 2: Identify Carrier & Extract Payload (40 pts, single-choice)
    {
      id: 'step-identify-carrier',
      prompt:
        'Execute the forensic extraction tool across the three evidence exhibits. Which image file contains a verified, intact steganographic payload?',
      interaction: 'single-choice',
      items: [
        {
          id: 'carrier-ev01',
          label:
            'evidence-scan-01.png — No valid payload (bitstream contains only natural gradient noise)',
        },
        {
          id: 'carrier-ev02',
          label:
            'evidence-scan-02.png — Verified payload recovered ("CONFIDENTIAL NOTE: Scheduled warehouse transfer for Q4 completed without incident...")',
        },
        {
          id: 'carrier-ev03',
          label:
            'evidence-scan-03.png — No valid payload (dithered entropy without a recognized steganographic header)',
        },
      ],
      answerKey: { chosen: 'carrier-ev02' },
      pointValue: 40,
      partialCreditAllowed: false,
    },

    // Step 3: Defensible Reporting & Preservation (30 pts, single-choice)
    {
      id: 'step-reporting-action',
      prompt:
        'How must the forensic investigator interpret the recovered payload and document the findings under SOP FOR-204?',
      interaction: 'single-choice',
      items: [
        {
          id: 'report-defensible',
          label:
            'Document the successful recovery of the harmless warehouse transfer note from evidence-scan-02.png, log the verified SHA-256 hashes and extraction parameters, and state that payload recovery confirms data embedding but does not prove malicious intent without independent corroborating evidence.',
        },
        {
          id: 'report-espionage',
          label:
            'Formally recommend immediate criminal prosecution for industrial espionage against the user who downloaded evidence-scan-02.png, since using steganography is absolute legal proof of criminal intent.',
        },
        {
          id: 'report-delete-controls',
          label:
            'Delete evidence-scan-01.png and evidence-scan-03.png from the evidence locker and forensic log to save disk space, since neither yielded an embedded payload.',
        },
        {
          id: 'report-modify-header',
          label:
            'Hex-edit the original evidence-scan-02.png file to overwrite the hidden bits with zeros so that corporate executives cannot accidentally view the message.',
        },
      ],
      answerKey: { chosen: 'report-defensible' },
      pointValue: 30,
      partialCreditAllowed: false,
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Remember the fundamental rule of spatial-domain steganography: LSB replacement changes only the lowest bit of color values without adding new bytes or pixels. File sizes (all 9,332 bytes) and dimensions (48×48) are identical across exhibits.',
    'Use the Forensic Extraction Tool on each exhibit to test for sequential RGB LSB encoding. Look for which file validates the "STEG:" magic header and passes checksum verification.',
    'Carefully inspect the plaintext recovered from the carrier: it is a routine, harmless note regarding scheduled warehouse operations. Defensible forensic reporting presents the technical recovery objectively without assuming criminal intent without independent corroboration.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'steganography-detection',
    'lsb-extraction',
    'bitplane-analysis',
    'evidence-preservation',
    'forensic-reporting',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding steganalysis investigation! You successfully applied spatial-domain least-significant-bit extraction across the evidence exhibits, identified the authentic carrier while filtering out control noise, verified the payload integrity, and formulated an objective, forensically defensible conclusion.\n\nInvestigation Breakdown:\n1. Methodology Selection:\n- Lossless 24-bit/32-bit raster formats like PNG do not change file size or image dimensions when LSB steganography is applied. Visual inspection is ineffective because 1-bit color shifts (e.g. RGB value 140 vs 141) are imperceptible to human vision.\n- Sequential RGB LSB extraction directly samples the least significant bit of each color byte in raster order, parsing the resulting bitstream for structured protocol framing.\n\n2. Carrier Identification & Payload Recovery:\n- Testing `evidence-scan-01.png` yielded no valid header; its low-order bits represent natural continuous gradients.\n- Testing `evidence-scan-03.png` revealed high bitplane entropy and dithering patterns, but no valid framing or checksum.\n- Testing `evidence-scan-02.png` successfully recovered the 130-byte ASCII payload: "CONFIDENTIAL NOTE: Scheduled warehouse transfer for Q4 completed without incident. Ref: AUDIT-7749. No unauthorized data movement." along with a verified checksum.\n\n3. Defensible Forensic Reporting:\n- Recovering an embedded payload proves that steganographic embedding occurred. However, forensic integrity requires evaluating the recovered content: the message describes a routine, harmless operational transfer rather than sensitive intellectual property exfiltration.\n- Under SOP FOR-204, investigators must never infer criminal malice or accuse individuals based solely on the technical presence of steganography without independent corroborating evidence.',

  failureExplanation:
    'In digital forensics and steganalysis, appearance and file size alone never prove or disprove hidden data.\n\nKey Principles to Remember:\n- Spatial LSB Invariance: LSB steganography substitutes existing low-order bits without changing pixel dimensions or uncompressed file size. All three exhibits have identical dimensions (48×48) and byte sizes (9,332 bytes).\n- Structured Framing: Genuine steganographic systems use framing (magic signatures, lengths, and checksums) to reliably delineate payloads from high-entropy image noise.\n- Objective Evidentiary Scoping: Finding a hidden payload confirms steganographic concealment, but does not prove malice. Examiners must evaluate the actual message content and avoid unfounded accusations of espionage.',

  shuffleItems: false,
};
