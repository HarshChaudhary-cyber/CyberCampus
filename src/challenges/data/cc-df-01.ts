// ============================================================
// Challenge: cc-df-01 "Deleted File Recovery"
// Room: Digital Forensics | Difficulty: Beginner
// ============================================================

import type { Challenge } from '../../types';

export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  directory: string;
  status: 'active' | 'deleted';
  allocated: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  createdTime: string;
  modifiedTime: string;
  deletionTime: string;
  fileType: string;
  signatureMagic: string;
  sha256: string;
  preview: string;
  notes?: string;
}

export interface FileSystemContent {
  isFileSystem: boolean;
  targetDevice: string;
  imageFileName: string;
  filesystemType: string;
  totalRecordsScanned: number;
  caseReference: string;
  guidanceNote?: {
    title: string;
    rules: string[];
  };
  files: FileSystemItem[];
}

export const challengeCC_DF_01: Challenge = {
  id: 'cc-df-01',
  roomId: 'forensics',
  difficulty: 'beginner',
  title: 'Deleted File Recovery',
  briefing:
    'Security Operations received notification of a sensitive customer database leak on an external paste site. Forensic investigators acquired a bit-stream physical image (E01) of a departed financial analyst’s laptop (ws-fin-09). Inspect the recovered file tree, analyze metadata, timestamps, and recovered file content previews to identify the exfiltrated dataset, determine the forensic evidence confirming the leak, and select the correct evidence-preservation protocol.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-filesystem',
      type: 'file',
      label: 'Workstation Filesystem Triage (ws-fin-09_nvme0n1p2.E01)',
      content: {
        isFileSystem: true,
        targetDevice: 'ws-fin-09.veridian-logistics.example (Dell Latitude 5520, Serial: VL-NB-4910)',
        imageFileName: 'ws-fin-09_nvme0n1p2.E01 (Read-Only Expert Witness Bitstream)',
        filesystemType: 'NTFS v3.1 (Triage Inode & Unallocated Space Parsing)',
        totalRecordsScanned: 142890,
        caseReference: 'IR-2026-0924-LEAK',
        guidanceNote: {
          title: 'Forensic Filesystem Triage & Recovery Guidance',
          rules: [
            '1. File Allocation Status: Deleted status indicates that MFT record flags mark clusters as unallocated. Operating systems and software update routines frequently create and delete temporary files during normal operation.',
            '2. Contextual Validation: A file is not malicious or relevant simply because it was deleted. Investigators must inspect canonical paths, MACB timestamps, and recovered content previews to establish direct correlation with the reported incident.',
            '3. Anti-Forensics Distractor Awareness: Scripts and utilities named "cleanup" or "maintenance" must be verified against digital signatures and change tickets before assuming malicious intent.',
          ],
        },
        files: [
          // 1. The Genuine Leak Target (Staged in %TEMP%, deleted, content matches leak)
          {
            id: 'file-client-tax',
            name: 'client_tax_records_2026.csv',
            path: 'C:\\Users\\jordan.bell\\AppData\\Local\\Temp\\client_tax_records_2026.csv',
            directory: 'C:\\Users\\jordan.bell\\AppData\\Local\\Temp',
            status: 'deleted',
            allocated: false,
            sizeBytes: 1452800,
            sizeFormatted: '1.4 MB',
            createdTime: '2026-09-24 14:15:00 UTC',
            modifiedTime: '2026-09-24 16:22:10 UTC',
            deletionTime: '2026-09-24 16:45:00 UTC',
            fileType: 'CSV Document (ASCII Text)',
            signatureMagic: '43 75 73 74 ("Cust") - ASCII Text Header',
            sha256: '8a4f91c7b12e039485d261e8c07153a9f24e75618290372bcde92138a0f44192',
            preview: [
              'account_id,client_name,routing_transit,tax_id,balance_usd',
              'VL-90214,Apex Horizon LLC,021000021,XX-XXX4192,482150.00',
              'VL-90215,Beacon Global Freight,071000288,XX-XXX8813,124900.00',
              'VL-90216,Cascade Maritime Ltd,122000496,XX-XXX3041,894300.00',
              'VL-90217,Delta Point Logistics,031000053,XX-XXX7209,315200.00',
              '[... 1,420 sensitive client records with unmasked banking identifiers recovered from unallocated clusters ...]',
            ].join('\n'),
            notes: 'Exact content match for leaked paste site data; created and deleted during final working hours.',
          },

          // 2. Suspicious-Looking File Name, but Innocent Context (Empty HR template)
          {
            id: 'file-confidential-salary',
            name: 'confidential_salary_review.xlsx',
            path: 'C:\\Users\\jordan.bell\\Documents\\HR_Review\\confidential_salary_review.xlsx',
            directory: 'C:\\Users\\jordan.bell\\Documents\\HR_Review',
            status: 'deleted',
            allocated: false,
            sizeBytes: 18432,
            sizeFormatted: '18 KB',
            createdTime: '2026-07-10 09:12:00 UTC',
            modifiedTime: '2026-07-10 09:12:00 UTC',
            deletionTime: '2026-08-01 11:30:00 UTC',
            fileType: 'Microsoft Excel OpenXML Spreadsheet',
            signatureMagic: '50 4B 03 04 ("PK..") - OpenXML Zip Container',
            sha256: '3b9d12a87401c4e95103a8f237190e241088bc1956102fae83719401bfd9012a',
            preview: [
              '[Workbook Metadata: Veridian Human Resources Standard Forms]',
              'Title: Corporate Employee Self-Assessment & Annual Review Template v4.2',
              'Author: hr-operations@veridian-logistics.example',
              'Status: Blank Template (All employee and compensation fields unpopulated)',
              '[Notice: Downloaded standard HR template unedited; deleted weeks ago during folder reorganization]',
            ].join('\n'),
            notes: 'Suspicious name, but preview confirms empty template discarded months prior.',
          },

          // 3. Suspicious-Looking Script Name, but Innocent Context (Code-signed IT maintenance script)
          {
            id: 'file-cleanup-script',
            name: 'cleanup_temp_files.ps1',
            path: 'C:\\Users\\jordan.bell\\Downloads\\cleanup_temp_files.ps1',
            directory: 'C:\\Users\\jordan.bell\\Downloads',
            status: 'active',
            allocated: true,
            sizeBytes: 2140,
            sizeFormatted: '2.1 KB',
            createdTime: '2026-09-18 10:05:00 UTC',
            modifiedTime: '2026-09-18 10:05:00 UTC',
            deletionTime: 'N/A - Active file',
            fileType: 'PowerShell Script (UTF-8)',
            signatureMagic: '23 20 56 65 ("# Ve") - UTF-8 Script Text',
            sha256: '9c2a71bf384102917e8105ab204918e745610293817451029384719028374102',
            preview: [
              '# =========================================================================',
              '# Veridian Logistics — IT Desktop Support Scheduled Maintenance Script',
              '# Package: VL-IT-CleanHost-v2.4 | Approved Change Ticket: CHG-8109',
              '# Purpose: Purge local application crash dumps and browser temp caches',
              '# Author: desktop-support@veridian-logistics.example (Code-Signed by VL-CA)',
              '# =========================================================================',
              'Write-Output "Executing standard desktop temporary file cleanup routine..."',
              'Remove-Item -Path "$env:LOCALAPPDATA\\CrashDumps\\*" -Recurse -Force -ErrorAction SilentlyContinue',
            ].join('\n'),
            notes: 'Active script; header and signature prove legitimate company-wide IT utility.',
          },

          // 4. Innocent Active File (Quarterly public financial presentation)
          {
            id: 'file-q3-summary',
            name: 'Q3_Financial_Summary.pdf',
            path: 'C:\\Users\\jordan.bell\\Documents\\Q3_Financial_Summary.pdf',
            directory: 'C:\\Users\\jordan.bell\\Documents',
            status: 'active',
            allocated: true,
            sizeBytes: 4210000,
            sizeFormatted: '4.2 MB',
            createdTime: '2026-09-22 13:40:00 UTC',
            modifiedTime: '2026-09-22 13:40:00 UTC',
            deletionTime: 'N/A - Active file',
            fileType: 'Adobe Portable Document Format (PDF)',
            signatureMagic: '25 50 44 46 ("%PDF") - Adobe PDF Specification 1.7',
            sha256: '4f71a09e18237401928471029384710293847102938471029384710293847102',
            preview: [
              '[PDF Document: Veridian Logistics Public Financial Highlights]',
              'Quarter: Q3 2026 Investor & Partner Presentation',
              'Author: investor-relations@veridian-logistics.example',
              'Abstract: High-level quarterly gross revenue summaries, fleet expansion milestones,',
              'and regional distribution route performance. (Contains zero customer PII or banking data).',
            ].join('\n'),
            notes: 'Active presentation file containing only public marketing summaries.',
          },

          // 5. Innocent Deleted Draft (Meeting notes in Recycle Bin)
          {
            id: 'file-meeting-notes',
            name: 'meeting_notes_september.docx',
            path: 'C:\\Users\\jordan.bell\\Desktop\\meeting_notes_september.docx',
            directory: 'C:\\Users\\jordan.bell\\Desktop',
            status: 'deleted',
            allocated: false,
            sizeBytes: 24576,
            sizeFormatted: '24 KB',
            createdTime: '2026-09-15 11:00:00 UTC',
            modifiedTime: '2026-09-15 11:45:00 UTC',
            deletionTime: '2026-09-20 09:10:00 UTC',
            fileType: 'Microsoft Word OpenXML Document',
            signatureMagic: '50 4B 03 04 ("PK..") - OpenXML Zip Container',
            sha256: '7d189c4201948571029384710293847102938471029384710293847102938471',
            preview: [
              'Weekly Logistics Operations Sync — 15 Sept 2026',
              'Attendees: Jordan Bell, Marcus Vance, Elena Rostova',
              'Agenda Items:',
              '1. Review warehouse forklift battery maintenance schedule',
              '2. Update route optimization shift rotations',
              '3. Reminder: submit quarterly expense reimbursements by Friday',
            ].join('\n'),
            notes: 'Routine internal operational meeting draft deleted to Recycle Bin.',
          },

          // 6. Innocent Deleted Software Installer
          {
            id: 'file-slack-installer',
            name: 'slack_setup_x64.exe',
            path: 'C:\\Users\\jordan.bell\\Downloads\\slack_setup_x64.exe',
            directory: 'C:\\Users\\jordan.bell\\Downloads',
            status: 'deleted',
            allocated: false,
            sizeBytes: 82410240,
            sizeFormatted: '82.4 MB',
            createdTime: '2026-09-02 08:30:00 UTC',
            modifiedTime: '2026-09-02 08:30:00 UTC',
            deletionTime: '2026-09-02 08:35:00 UTC',
            fileType: 'Portable Executable (PE32+ x86-64 Binary)',
            signatureMagic: '4D 5A 90 00 ("MZ..") - DOS/PE Header',
            sha256: '1e90ac4710293847102938471029384710293847102938471029384710293847',
            preview: [
              '[PE32+ Executable Binary: Vendor Application Installer]',
              'Product: Slack Workplace Communication Client x64',
              'Publisher: Slack Technologies LLC (Verified Digital Signature)',
              'File Version: 4.38.125',
              '[Notice: Binary installer removed immediately following successful application setup]',
            ].join('\n'),
            notes: 'Normal application setup file removed after completion.',
          },

          // 7. Innocent Active Log
          {
            id: 'file-chrome-log',
            name: 'chrome_installer_log.txt',
            path: 'C:\\Users\\jordan.bell\\AppData\\Local\\Temp\\chrome_installer_log.txt',
            directory: 'C:\\Users\\jordan.bell\\AppData\\Local\\Temp',
            status: 'active',
            allocated: true,
            sizeBytes: 45120,
            sizeFormatted: '45 KB',
            createdTime: '2026-09-12 04:00:00 UTC',
            modifiedTime: '2026-09-12 04:02:15 UTC',
            deletionTime: 'N/A - Active file',
            fileType: 'Plain Text Log',
            signatureMagic: '5B 30 39 31 ("<091") - ASCII Text Log',
            sha256: 'a832ef1019283740192837401928374019283740192837401928374019283740',
            preview: [
              '[0912/040012.890:INFO:setup_main.cc(2210)] Chrome build 128.0.6613.138',
              '[0912/040013.104:INFO:install_worker.cc(340)] Component updater registration successful.',
              '[0912/040015.421:INFO:setup_main.cc(2350)] Installation update verified without errors.',
            ].join('\n'),
            notes: 'Standard background web browser update log.',
          },

          // 8. Innocent Deleted Browser Cache Asset
          {
            id: 'file-browser-cache',
            name: 'f_0001a4',
            path: 'C:\\Users\\jordan.bell\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache\\f_0001a4',
            directory: 'C:\\Users\\jordan.bell\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache',
            status: 'deleted',
            allocated: false,
            sizeBytes: 12288,
            sizeFormatted: '12 KB',
            createdTime: '2026-09-23 16:10:00 UTC',
            modifiedTime: '2026-09-23 16:10:00 UTC',
            deletionTime: '2026-09-24 08:00:00 UTC',
            fileType: 'Portable Network Graphics (PNG)',
            signatureMagic: '89 50 4E 47 (".PNG") - PNG Image Specification',
            sha256: '6e2980fa19283740192837401928374019283740192837401928374019283740',
            preview: [
              '[Binary Image Asset: Cached Web Graphic]',
              'Dimensions: 128x128 pixels (PNG image data)',
              'Origin URL: https://portal.veridian-logistics.example/assets/nav-logo.png',
              '[Notice: Ephemeral browser cache resource discarded during automated tab cleanup]',
            ].join('\n'),
            notes: 'Routine browser cache file deleted automatically.',
          },
        ],
      },
    },
    {
      id: 'ev-forensic-sop',
      type: 'policy',
      label: 'Forensic Evidence Preservation Guidelines (SOP FOR-101)',
      content: {
        title: 'SOP FOR-101: Digital Forensics Evidence Handling & Preservation Standards',
        documentId: 'SOP-FOR-101-REV3',
        effectiveDate: '2026-01-15',
        classification: 'INTERNAL FORENSIC STANDARD',
        rules: [
          'Rule 1 (Order of Volatility & Acquisition): First responders must acquire digital evidence in order of volatility (RFC 3227). When handling fixed storage media, investigators must create a bit-stream physical duplicate (e.g. Expert Witness Format .E01 or raw .DD) utilizing hardware write-blocking to prevent accidental write operations.',
          'Rule 2 (Cryptographic Integrity Verification): All acquired forensic disk images and recovered evidence items must be hashed immediately using SHA-256 upon acquisition and re-verified before and after analysis. Hashes must match exactly to prove the evidence was not altered.',
          'Rule 3 (Chain of Custody Documentation): A continuous chain-of-custody form must record the date, time, acquiring investigator, storage location, and hash verification logs for every physical device and forensic image container.',
          'Rule 4 (Prohibition of Live Media Tampering): Analysts must NEVER inspect suspect storage media by mounting it read-write, booting the host workstation (even into Safe Mode), opening files directly in productivity software (e.g. Microsoft Excel), or copying files via Windows Explorer. Such actions overwrite NTFS access timestamps ($STANDARD_INFORMATION), modify swap/pagefile contents, and destroy slack space.',
          'Rule 5 (Interpretation of Deleted Files): Modern operating systems and applications continuously create, modify, and delete files (such as browser cache, application installers, and temporary workspace drafts). A file marked "deleted" is NOT inherently malicious. Investigators must establish relevance through content inspection, timestamp correlation, and unusual directory placement (e.g. staging in %TEMP%).',
        ],
      },
    },
  ],

  // ── Steps ──────────────────────────────────────────────────────────────────
  steps: [
    // Step 1: Target File Identification (30 pts, single-choice)
    {
      id: 'step-target-file',
      prompt:
        'Based on your inspection of the file tree, file statuses, and recovered content previews, which file is most directly relevant to the reported customer data leak?',
      interaction: 'single-choice',
      items: [
        {
          id: 'file-client-tax',
          label:
            'C:\\Users\\jordan.bell\\AppData\\Local\\Temp\\client_tax_records_2026.csv (Deleted / Recovered from Unallocated Clusters)',
        },
        {
          id: 'file-confidential-salary',
          label:
            'C:\\Users\\jordan.bell\\Documents\\HR_Review\\confidential_salary_review.xlsx (Deleted)',
        },
        {
          id: 'file-cleanup-script',
          label:
            'C:\\Users\\jordan.bell\\Downloads\\cleanup_temp_files.ps1 (Active / Allocated)',
        },
        {
          id: 'file-q3-summary',
          label:
            'C:\\Users\\jordan.bell\\Documents\\Q3_Financial_Summary.pdf (Active / Allocated)',
        },
      ],
      answerKey: { chosen: 'file-client-tax' },
      pointValue: 30,
      partialCreditAllowed: false,
    },

    // Step 2: Corroborating Forensic Evidence (35 pts, multi-choice, partial credit)
    {
      id: 'step-forensic-evidence',
      prompt:
        'Which specific forensic facts from your inspection confirm that client_tax_records_2026.csv is the primary source of the data leak and evidence of compromise? Select the 3 valid forensic indicators.',
      interaction: 'multi-choice',
      items: [
        {
          id: 'ev-content-match',
          label:
            'Recovered file content contains unmasked client banking identifiers, routing transit numbers, and account balances matching the leaked dataset.',
        },
        {
          id: 'ev-timestamp-timing',
          label:
            'File creation (14:15 UTC) and deletion (16:45 UTC) on 2026-09-24 correlate with the timeline immediately preceding the data leak disclosure.',
        },
        {
          id: 'ev-staging-anomaly',
          label:
            'The file was staged in an ephemeral temporary folder (AppData\\Local\\Temp) and deleted rather than saved in standard document shares.',
        },
        {
          id: 'ev-deleted-implies-malware',
          label:
            'The deleted allocation status by itself proves the workstation was infected with an automated rootkit.',
        },
        {
          id: 'ev-executable-magic',
          label:
            'The file signature magic bytes confirm the file is an executable binary masquerading as a spreadsheet.',
        },
        {
          id: 'ev-zero-hash',
          label:
            'The SHA-256 cryptographic checksum consists of all zeroes, proving the file was wiped by an anti-forensics tool.',
        },
      ],
      answerKey: {
        chosen: ['ev-content-match', 'ev-timestamp-timing', 'ev-staging-anomaly'],
      },
      pointValue: 35,
      partialCreditAllowed: true,
    },

    // Step 3: Evidence Preservation Action (35 pts, single-choice)
    {
      id: 'step-preservation-action',
      prompt:
        'Following the identification of the exfiltrated file and recovery of residual clusters, what is the forensically sound procedure for securing and preserving the evidence under SOP FOR-101?',
      interaction: 'single-choice',
      items: [
        {
          id: 'action-bitstream-image',
          label:
            'Acquire a verified bit-stream physical image (e.g. E01 / raw DD) using a hardware write-blocker, generate SHA-256 hashes for integrity verification, and maintain a chain-of-custody log before starting deep analysis.',
        },
        {
          id: 'action-copy-usb',
          label:
            'Copy the recovered CSV file onto an administrative USB flash drive using Windows File Explorer to quickly email it to the legal department.',
        },
        {
          id: 'action-excel-safe-mode',
          label:
            'Boot the workstation into Safe Mode and open the CSV in Microsoft Excel to inspect all client rows directly on the drive.',
        },
        {
          id: 'action-run-wiper',
          label:
            'Run a secure disk wiper on the %TEMP% directory to eliminate residual customer records from the employee machine.',
        },
      ],
      answerKey: { chosen: 'action-bitstream-image' },
      pointValue: 35,
      partialCreditAllowed: false,
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Do not assume that every deleted file is malicious. Normal operating system tasks and users routinely delete installers, cache files, and templates. Look closely at file paths, creation and deletion timestamps, and recovered content previews.',
    'Examine client_tax_records_2026.csv located in AppData\\Local\\Temp. Check its creation (14:15 UTC) and deletion (16:45 UTC) timestamps on the day of the leak, and read its recovered content preview.',
    'Standard forensic guidelines (SOP FOR-101) require investigators to work exclusively from verified bit-stream physical images (E01/DD) acquired with write-blocking and cryptographic hash verification to preserve evidence integrity and maintain chain of custody.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'filesystem-forensics',
    'deleted-file-recovery',
    'metadata-timestamp-analysis',
    'evidence-preservation',
    'chain-of-custody',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding forensic investigation! You properly navigated the triage image, distinguished innocent routine file deletions from genuine incident artifacts, identified the exfiltrated customer database, and selected the correct evidence preservation protocol.\n\nInvestigation Findings Breakdown:\n1. Target File Identification:\n- `client_tax_records_2026.csv` in `AppData\\Local\\Temp` was the primary exfiltrated file.\n- The recovered content preview contains 1,420 unmasked customer records, routing numbers, and account balances matching the public paste site dump.\n- The file was created at 14:15 UTC, modified at 16:22 UTC, and deleted at 16:45 UTC on 2026-09-24, shortly before the analyst vacated the facility.\n\n2. Avoiding the "Deleted = Malicious" Fallacy:\n- Files like `slack_setup_x64.exe` (installer), `f_0001a4` (browser cache), and `meeting_notes_september.docx` (meeting draft) were deleted as part of routine system hygiene.\n- `confidential_salary_review.xlsx` looked suspicious by name, but content inspection confirmed it was an empty corporate review template discarded months prior.\n- `cleanup_temp_files.ps1` looked like an anti-forensics wiper, but its digital signature and comments proved it was an official Veridian IT maintenance script (CHG-8109).\n\n3. Evidence Preservation Standards:\n- Copying files with Windows File Explorer or opening them in Excel alters filesystem access timestamps ($STANDARD_INFORMATION) and pagefile data.\n- Admissible forensics requires bit-stream physical imaging (E01/DD) with hardware write-blocking, cryptographic hashing (SHA-256), and meticulous chain-of-custody records.',

  failureExplanation:
    'Successful digital forensics requires correlating file metadata, timestamps, and recovered content rather than jumping to conclusions based on file names or deleted status alone.\n\nKey Forensic Lessons:\n- Normal vs Malicious Deletion: Operating systems constantly delete temporary files, installers, and caches. Deletion by itself is never proof of compromise.\n- Evidence Correlation: The file `client_tax_records_2026.csv` was proven guilty because its content matched the leaked paste, its staging in %TEMP% was anomalous, and its creation/deletion timestamps closely matched the exfiltration window.\n- Don\'t Fall for Name Distractors: An empty template named "confidential salary" or a legitimate IT script named "cleanup" can easily distract an analyst who does not inspect the recovered file content.\n- Preservation Rules: Always acquire a bit-stream physical image (E01/DD) using write-blocking and verify SHA-256 hashes. Never open suspect evidence on live machines.',

  shuffleItems: false,
};
