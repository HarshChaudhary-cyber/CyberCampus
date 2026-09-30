// ============================================================
// CyberCampus — Challenge cc-pr-03: "Data Minimisation Audit"
// Room: Privacy & Account Security | Difficulty: Advanced
// ============================================================

import type { Challenge } from '../../types';

export interface DataInventoryEntry {
  id: string;
  name: string;
  category: string;
  dataType: string;
  collectionScope: string;
  declaredAppPurpose: string;
  technicalContext: string;
  currentRetention: string;
  accessControl: string;
}

export interface DataInventoryContent {
  isDataInventory: boolean;
  appName: string;
  appVersion: string;
  reviewStage: string;
  documentedPurposes: string[];
  entries: DataInventoryEntry[];
}export interface RetentionConfigRow {
  moduleName: string;
  permissionOrSource: string;
  storageTarget: string;
  configuredRetention: string;
  thirdPartySharing: string;
  operationalHandling: string;
}

export interface RetentionConfigContent {
  isRetentionConfig: boolean;
  systemName: string;
  configVersion: string;
  status: string;
  rows: RetentionConfigRow[];
}

export const challengeCC_PR_03: Challenge = {
  id: 'cc-pr-03',
  roomId: 'privacy',
  difficulty: 'advanced',
  title: 'Data Minimisation Audit',
  briefing:
    'StudyTrack, an independent study-planning utility, is undergoing a comprehensive privacy and data protection architecture audit prior to its production release. The application’s documented purposes are scheduling self-directed study sessions, optional reminder notifications for upcoming study blocks, and optional calendar integration to sync scheduled sessions to a user-chosen calendar. Learners must review the declared functional requirements, inspect an 8-item data collection inventory and draft retention configuration, apply privacy-by-design principles (necessity, proportionality, purpose limitation, least privilege, and storage limitation), classify each inventory entry, construct a compliant configuration, and formulate an actionable minimisation remediation plan without making country-specific legal determinations.',

  // ── Evidence Items ────────────────────────────────────────────────────────
  evidence: [
    // 1. Product Requirements & Declared Functional Scope (Policy Document)
    {
      id: 'ev-studyapp-requirements',
      type: 'policy',
      label: 'Product Requirements & Declared Functional Scope (StudyTrack PRD v1.2)',
      content: {
        title: 'Product Requirements & Functional Scope: StudyTrack v1.2',
        code: 'PRD-ST-2026-V1',
        category: 'APPLICATION FUNCTIONAL SPECIFICATION & SCOPE DOCUMENT',
        effectiveDate: '2026-11-01',
        classification: 'INTERNAL PRODUCT ARCHITECTURE SPECIFICATION',
        rules: [
          'Requirement 1 (Primary Functional Scope — Study Scheduling): StudyTrack is designed strictly as a focused personal productivity utility for creating, organizing, and tracking self-directed study sessions, subject tags, and elapsed study durations.',
          'Requirement 2 (Optional Feature A — Upcoming Session Reminders): Users may optionally enable local or push notifications to receive alert banners 10 to 15 minutes before a scheduled study session begins. This reminder capability must function without accessing device address books, reading external accounts, or tracking device location.',
          'Requirement 3 (Optional Feature B — Calendar Synchronization): Users may optionally connect an external calendar account to synchronize scheduled study blocks. When enabled, permissions must be scoped strictly to a single user-selected calendar, with zero read or write access to unselected personal, medical, family, or employment calendars.',
          'Requirement 4 (Explicitly Excluded Scopes): The application does NOT provide social networking, peer messaging, public profile directories, targeted advertising, behavioral monetization, or background physical location tracking.',
          'Requirement 5 (Data Protection Architecture Mandate): Engineering teams are required to apply data minimisation (collecting only data strictly required for declared purposes), purpose limitation (using data solely for declared study-planning functions), proportionality, least privilege in permissions, and storage limitation (prompt deletion of discarded or deleted user records).',
        ],
      } as unknown as Record<string, unknown>,
    },

    // 2. Data Collection & Permission Inventory (8 Entries)
    {
      id: 'ev-data-inventory',
      type: 'file',
      label: 'Data Collection & Permission Inventory (8 Candidate Entries)',
      content: {
        isDataInventory: true,
        appName: 'StudyTrack',
        appVersion: 'v1.2.0-rc3',
        reviewStage: 'Pre-Release Privacy Architecture Audit',
        documentedPurposes: [
          'Purpose 1: Core personal study session scheduling and elapsed time tracking',
          'Purpose 2: Optional upcoming session reminder notifications',
          'Purpose 3: Optional synchronization of scheduled study blocks with a user-selected external calendar',
        ],
        entries: [
          {
            id: 'inv-session-details',
            name: 'Study Session Titles & Subject Topics',
            category: 'Core Application Data',
            dataType: 'Text strings, planned duration (minutes), subject tags',
            collectionScope:
              'Recorded upon user entry (e.g. "Linear Algebra — Problem Set 3", 90 minutes). Synced to the user’s encrypted cloud account profile.',
            declaredAppPurpose:
              'Scheduling, organizing, and tracking personal study blocks (Documented Purpose 1).',
            technicalContext:
              'Core data structure used for rendering study timetable blocks, calculating cumulative study hours, and maintaining the user study log in the active account.',
            currentRetention:
              'Retained in active database while user account remains open; erased upon account closure.',
            accessControl:
              'First-party application service only; encrypted in transit via TLS 1.3 and at rest via AES-256.',
          },
          {
            id: 'inv-timezone-offset',
            name: 'Device Timezone Identifier & UTC Offset',
            category: 'System Configuration',
            dataType: 'IANA Timezone String (e.g. "America/Los_Angeles", UTC-8)',
            collectionScope:
              'Queried from device operating system locale settings upon application launch or system timezone change.',
            declaredAppPurpose:
              'Accurate temporal scheduling of study blocks and alarm triggers across local day boundaries (Documented Purposes 1 & 2).',
            technicalContext:
              'Queried from device locale to calculate local start and end times for scheduled study sessions and alert triggers across timezone changes.',
            currentRetention:
              'Cached in local client configuration; latest active timezone stored in account profile.',
            accessControl:
              'First-party scheduling engine only; no external disclosure.',
          },
          {
            id: 'inv-notification-permission',
            name: 'System Notification Permission (Push & Local)',
            category: 'Device OS Permission',
            dataType: 'OS Notification Channel Grant & Device Push Token',
            collectionScope:
              'Standard OS permission prompt triggered only when user toggles "Enable Upcoming Session Reminders" in application preferences.',
            declaredAppPurpose:
              'Optional upcoming session reminders (Documented Purpose 2).',
            technicalContext:
              'Requested only after an affirmative user toggle in preferences. Declining this permission leaves core session scheduling unaffected. Reminders trigger locally without accessing contacts, location, or network identifiers.',
            currentRetention:
              'Maintained while reminder toggle remains enabled in user settings.',
            accessControl:
              'Device notification daemon and secure first-party push dispatch service.',
          },
          {
            id: 'inv-selected-calendar',
            name: 'Selected External Calendar Read/Write Access',
            category: 'Account Integration Permission',
            dataType: 'Calendar event title, start time, end time (scoped to single calendar)',
            collectionScope:
              'OAuth grant requested only after user explicitly activates "Sync with External Calendar" and selects a designated destination calendar.',
            declaredAppPurpose:
              'Optional calendar synchronization for scheduled study blocks (Documented Purpose 3).',
            technicalContext:
              'Requested only after an affirmative user toggle to sync with a chosen external calendar. Scoped to create, update, and remove events on that designated calendar. Does not read or access unselected personal or work calendars.',
            currentRetention:
              'OAuth refresh token valid until user disconnects calendar integration or revokes authorization in account settings.',
            accessControl:
              'Direct authenticated API connection between client device and selected calendar service.',
          },
          {
            id: 'inv-address-book-contacts',
            name: 'Full Address Book & Contacts Upload',
            category: 'Device Permission & Cloud Upload',
            dataType: 'Complete contact cards (names, mobile phone numbers, personal email addresses, postal addresses)',
            collectionScope:
              'System dialog requesting READ_CONTACTS upon initial installation; transmits entire local phone address book to remote backend servers.',
            declaredAppPurpose:
              'PRD draft notation: "Facilitate finding potential study partners who might also use the application."',
            technicalContext:
              'Application specification contains no messaging, social feed, or peer study rooms. Requests READ_CONTACTS globally and uploads all stored contact cards to backend tables without a user-directed recipient selection interface.',
            currentRetention:
              'Stored indefinitely on backend marketing and user-graph database tables.',
            accessControl:
              'Internal analytics cluster and developer test environments.',
          },
          {
            id: 'inv-precise-location',
            name: 'Continuous Precise GPS Background Location',
            category: 'Hardware Sensor Telemetry',
            dataType: 'High-precision latitude, longitude, altitude, speed (within 5-meter accuracy)',
            collectionScope:
              'Continuous 24/7 background polling via ACCESS_FINE_LOCATION and ACCESS_BACKGROUND_LOCATION APIs.',
            declaredAppPurpose:
              'PRD draft notation: "Automatically detect if user is studying at a library, cafe, or at home."',
            technicalContext:
              'Study sessions and alert triggers execute based on clock time and user-entered schedules. Requests background GPS location continuously every 60 seconds regardless of whether a study session is active, and streams coordinates to an external telemetry provider.',
            currentRetention:
              'Retained in raw location trail database for 180 days.',
            accessControl:
              'Shared with analytics telemetry and third-party location-based performance SDK.',
          },
          {
            id: 'inv-advertising-identifiers',
            name: 'Advertising Identifiers & Cross-App Behavioral Tracking',
            category: 'Commercial Ad Telemetry',
            dataType: 'IDFA (Apple), GAID (Google), device hardware fingerprints, cross-app install signals',
            collectionScope:
              'Embedded third-party monetization SDK initializes at launch and broadcasts persistent identifiers across commercial ad exchanges.',
            declaredAppPurpose:
              'PRD draft notation: "Monetization attribution and commercial market analytics."',
            technicalContext:
              'StudyTrack functional specification describes an ad-free utility with no in-app advertising slots. Embedded third-party SDK accesses hardware identifiers and IDFA/GAID tokens upon launch and transmits install signals across 3 commercial ad networks.',
            currentRetention:
              'Retained by third-party ad networks according to their independent commercial schedules.',
            accessControl:
              'Transmitted to 3 external commercial advertising broker endpoints.',
          },
          {
            id: 'inv-indefinite-deleted-retention',
            name: 'Indefinite Storage of Deleted Sessions and User Data',
            category: 'Data Storage & Lifecycle Policy',
            dataType: 'Deleted session titles, personal notes, study timestamps, past accounts',
            collectionScope:
              'When a user deletes a study block or requests account closure, records are marked with a soft-delete flag (is_deleted=true) in production databases.',
            declaredAppPurpose:
              'Backend architecture draft note: "Preserve historical telemetry for potential re-engagement."',
            technicalContext:
              'User deletions and account closure requests mark rows with an is_deleted=true flag in the active database. No automated hard-deletion routine, purge pipeline, or retention expiration schedule is configured, leaving discarded records in storage indefinitely.',
            currentRetention:
              'Permanent / Indefinite active database residency.',
            accessControl:
              'Standard production engineering read access.',
          },
        ],
      } as unknown as Record<string, unknown>,
    },

    // 3. Draft Retention & Access Control Configuration Matrix (File)
    {
      id: 'ev-retention-access-config',
      type: 'file',
      label: 'Draft System Retention & Access Control Configuration Matrix',
      content: {
        isRetentionConfig: true,
        systemName: 'StudyTrack Production Platform',
        configVersion: 'CFG-PROD-DRAFT-2026.10',
        status: 'DRAFT CONFIGURATION (PENDING PRIVACY AUDIT REMEDIATION)',
        rows: [
          {
            moduleName: 'Core Study Scheduler',
            permissionOrSource: 'Local Storage / Sync API',
            storageTarget: 'Encrypted User Database (PostgreSQL / AES-256)',
            configuredRetention: 'Active Account Lifetime (Hard-purge upon account closure)',
            thirdPartySharing: 'None (First-party strictly isolated)',
            operationalHandling:
              'Synchronized to encrypted user account database; hard-deleted upon user account closure.',
          },
          {
            moduleName: 'Locale Synchronizer',
            permissionOrSource: 'System Timezone Query',
            storageTarget: 'Local Client State & Account Profile',
            configuredRetention: 'Active Account Lifetime',
            thirdPartySharing: 'None (First-party strictly isolated)',
            operationalHandling:
              'Queried locally on application launch and system timezone changes; updated in place; erased upon account closure.',
          },
          {
            moduleName: 'Upcoming Session Alerts',
            permissionOrSource: 'POST_NOTIFICATIONS (OS Permission)',
            storageTarget: 'Local Device Notification Daemon',
            configuredRetention: 'Active while user notification toggle is ON',
            thirdPartySharing: 'None (First-party push dispatch only)',
            operationalHandling:
              'Requires affirmative user toggle in preferences; can be disabled at any time; clears local notification schedule.',
          },
          {
            moduleName: 'External Calendar Sync',
            permissionOrSource: 'CALENDAR_SELECTED_ONLY (OAuth Scoped)',
            storageTarget: 'User-Selected Calendar Only',
            configuredRetention: 'Active while integration is connected',
            thirdPartySharing: 'Direct sync with user-selected calendar service',
            operationalHandling:
              'Requires affirmative user OAuth connection; revocable in settings; restricted to write events to the single selected calendar.',
          },
          {
            moduleName: 'Social Discovery (Draft)',
            permissionOrSource: 'READ_CONTACTS (Full Address Book)',
            storageTarget: 'Cloud User Graph Database',
            configuredRetention: 'Indefinite',
            thirdPartySharing: 'Internal Analytics Cluster',
            operationalHandling:
              'Full address book uploaded to backend upon app install; no recipient selection UI; no automated deletion routine.',
          },
          {
            moduleName: 'Context Sensor (Draft)',
            permissionOrSource: 'ACCESS_FINE_LOCATION & BACKGROUND_LOCATION',
            storageTarget: 'Location Telemetry Cluster',
            configuredRetention: '180 Days in raw log trails',
            thirdPartySharing: 'Location Telemetry SDK',
            operationalHandling:
              'Continuous background GPS polling every 60 seconds; raw coordinates transmitted to external telemetry service.',
          },
          {
            moduleName: 'Ad Mediation SDK',
            permissionOrSource: 'IDFA / GAID / Cross-App Tracking',
            storageTarget: 'Commercial Ad Network Infrastructure',
            configuredRetention: 'Determined by external ad brokers',
            thirdPartySharing: '3 External Ad Networks',
            operationalHandling:
              'Embedded monetization SDK initializes at launch; broadcasts persistent device identifiers across 3 ad networks.',
          },
          {
            moduleName: 'Purge & Erasure Pipeline',
            permissionOrSource: 'Soft-Delete Database Flag (is_deleted=true)',
            storageTarget: 'Primary Production DB',
            configuredRetention: 'Indefinite (No purge mechanism)',
            thirdPartySharing: 'Production Engineering',
            operationalHandling:
              'Applies soft-delete flag (is_deleted=true) in database; no automated purging routine; records remain in storage indefinitely.',
          },
        ],
      } as unknown as Record<string, unknown>,
    },

    // 4. Privacy-by-Design & Data Governance Standards (Policy Document)
    {
      id: 'ev-privacy-principles',
      type: 'policy',
      label: 'Privacy-by-Design & Data Governance Standard (POL-PRIV-01)',
      content: {
        title: 'Privacy-by-Design & Data Governance Standard',
        code: 'POL-PRIV-01-REV3',
        category: 'ENGINEERING DATA PROTECTION STANDARD',
        effectiveDate: '2026-06-01',
        classification: 'ORGANIZATIONAL GOVERNANCE SPECIFICATION',
        rules: [
          'Principle 1 (Data Minimisation & Necessity): Systems must process only the personal data strictly required to achieve documented functional purposes. Data collection cannot be justified merely because it might prove convenient or interesting for hypothetical future features.',
          'Principle 2 (Proportionality & Purpose Limitation): Data collected for a specific declared purpose (e.g. study scheduling) must not be repurposed for unrelated activities such as commercial advertising, unrequested social networking, or indiscriminate location tracking.',
          'Principle 3 (Affirmative User Control & Granular Consent): Optional secondary features (such as notifications or calendar synchronization) must require explicit, unbundled user opt-in. A user’s decision to decline an optional feature must never degrade or disable core application functionality.',
          'Principle 4 (Least Privilege in Permissions): Operating system permissions must be scoped to the minimum necessary surface. For example, calendar integrations must be restricted exclusively to user-selected target calendars rather than granting blanket access to all device calendar accounts.',
          'Principle 5 (Storage Limitation & Verifiable Deletion): Personal data must be retained only for as long as necessary to fulfill its legitimate operational purpose. When records are marked for deletion by a user, or when an account is closed, automated pipelines must permanently hard-delete all associated primary records, backups, and analytical replicas within defined timeframes (standard target: within 30 days).',
        ],
      } as unknown as Record<string, unknown>,
    },
  ],

  // ── Steps ──────────────────────────────────────────────────────────────────
  steps: [
    // Step 1: Classify Inventory Entries (40 pts, classification, partial credit allowed)
    {
      id: 'step-classify-inventory',
      prompt:
        "Based on StudyTrack's documented functional purposes and privacy-by-design principles, classify each of the 8 items in the Data & Permission Inventory as 'Necessary and appropriately scoped', 'Optional with user control', or 'Excessive or unjustified'.",
      interaction: 'classification',
      items: [
        {
          id: 'inv-session-details',
          label: 'Study Session Titles & Subject Topics',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
        {
          id: 'inv-timezone-offset',
          label: 'Device Timezone Identifier & UTC Offset',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
        {
          id: 'inv-notification-permission',
          label: 'System Notification Permission (Push & Local)',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
        {
          id: 'inv-selected-calendar',
          label: 'Selected External Calendar Read/Write Access',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
        {
          id: 'inv-address-book-contacts',
          label: 'Full Address Book & Contacts Upload',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
        {
          id: 'inv-precise-location',
          label: 'Continuous Precise GPS Background Location',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
        {
          id: 'inv-advertising-identifiers',
          label: 'Advertising Identifiers & Cross-App Behavioral Tracking',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
        {
          id: 'inv-indefinite-deleted-retention',
          label: 'Indefinite Storage of Deleted Sessions and User Data',
          options: [
            'Necessary and appropriately scoped',
            'Optional with user control',
            'Excessive or unjustified',
          ],
        },
      ],
      answerKey: {
        'inv-session-details': 'Necessary and appropriately scoped',
        'inv-timezone-offset': 'Necessary and appropriately scoped',
        'inv-notification-permission': 'Optional with user control',
        'inv-selected-calendar': 'Optional with user control',
        'inv-address-book-contacts': 'Excessive or unjustified',
        'inv-precise-location': 'Excessive or unjustified',
        'inv-advertising-identifiers': 'Excessive or unjustified',
        'inv-indefinite-deleted-retention': 'Excessive or unjustified',
      },
      pointValue: 40,
      partialCreditAllowed: true,
    },

    // Step 2: Construct Proportionate Configuration (30 pts, guided-form, partial credit allowed)
    {
      id: 'step-configure-proportions',
      prompt:
        'Construct a proportionate configuration for StudyTrack by selecting the compliant specification for calendar integration permission scope, data retention lifecycle, and third-party access control under POL-PRIV-01.',
      interaction: 'guided-form',
      items: [
        {
          id: 'cfg-calendar-scope',
          label: 'Calendar Integration Permission Scope',
          options: [
            'Permanently disable all calendar functionality and forbid any calendar interaction',
            'Granular user-selected calendar read/write access only (isolated from personal calendars)',
            'Full device calendar access granted across all personal, medical, and work accounts',
            'Background system-wide calendar harvesting and indexing without user calendar selection',
          ],
        },
        {
          id: 'cfg-retention-schedule',
          label: 'Study Session & User Record Retention Lifecycle',
          options: [
            'Retain active sessions during account lifetime; automated hard-delete of deleted items within 30 days and upon account closure',
            'Indefinite cloud retention for all historical sessions to support potential future marketing re-engagement',
            'Immediate destructive erasure of all study sessions within 60 seconds of session completion',
            'Store all created study sessions indefinitely on unencrypted public analytics buckets',
          ],
        },
        {
          id: 'cfg-access-telemetry',
          label: 'Access Control, Third-Party Sharing & Telemetry',
          options: [
            'Distribute advertising identifiers and location telemetry to commercial ad brokers for monetized analytics',
            'First-party strictly isolated access; zero third-party ad tracking; encrypted at rest and in transit',
            'Expose all user study schedules through an unauthenticated public API for social networking',
            'Allow any locally installed third-party app to read user study logs through an exported content provider',
          ],
        },
      ],
      answerKey: {
        'cfg-calendar-scope':
          'Granular user-selected calendar read/write access only (isolated from personal calendars)',
        'cfg-retention-schedule':
          'Retain active sessions during account lifetime; automated hard-delete of deleted items within 30 days and upon account closure',
        'cfg-access-telemetry':
          'First-party strictly isolated access; zero third-party ad tracking; encrypted at rest and in transit',
      },
      pointValue: 30,
      partialCreditAllowed: true,
    },

    // Step 3: Actionable Remediation & Reporting Plan (30 pts, single-choice)
    {
      id: 'step-remediation-plan',
      prompt:
        'As the lead privacy auditor, which comprehensive remediation and reporting plan should you submit to the engineering steering committee before the application is approved for release?',
      interaction: 'single-choice',
      items: [
        {
          id: 'plan-remediate-minimize-audit',
          label:
            'Remediate and Enforce Minimisation: Remove contacts upload, precise GPS tracking, and ad tracking SDKs from the application code; scope calendar integration strictly to user-selected calendars with explicit opt-in; implement automated 30-day purge for deleted records with complete account erasure; and issue an audit report documenting purpose limitation and verified data minimisation.',
        },
        {
          id: 'plan-notice-only-keep-all',
          label:
            'Notice-Only Approach: Retain all current data collection including address book harvesting and continuous GPS tracking, but add a lengthy disclosure in the Terms of Service claiming broad implied consent upon app installation.',
        },
        {
          id: 'plan-disable-all-features',
          label:
            'Total Feature Shutdown: Delete all study planning functionality and disable optional reminders completely, requiring users to manually keep paper notes to avoid any digital processing.',
        },
        {
          id: 'plan-anonymize-gps-ad-networks',
          label:
            'Partial Anonymization: Continue collecting background GPS and uploading phone address books, but hash phone numbers with SHA-256 while continuing to distribute advertising identifiers to third-party ad networks.',
        },
      ],
      answerKey: { chosen: 'plan-remediate-minimize-audit' },
      pointValue: 30,
      partialCreditAllowed: false,
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Compare each inventory item directly against StudyTrack’s three documented functional purposes: core study session scheduling, optional reminders, and optional calendar sync. Ask whether the application can fulfill its declared utility without collecting that data item.',
    'Distinguish between core requirements, genuine user choices, and excessive harvesting. Essential operational attributes like timezone and session titles are necessary; features like reminders and calendar sync require voluntary user control; but full contacts, continuous GPS, and ad tracking have no functional connection to a study planner.',
    'For retention and remediation, privacy-by-design requires automated disposal lifecycles rather than permanent storage. A compliant audit plan does not merely add legalistic disclaimer text; it removes unjustified sensors and SDKs, isolates optional features, and enforces verifiable hard deletion.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'data-minimisation',
    'purpose-limitation',
    'privacy-by-design',
    'least-privilege',
    'retention-management',
  ],

  // ── Feedback Explanations ──────────────────────────────────────────────────
  passThreshold: 70,
  successExplanation:
    'Superb privacy engineering! You rigorously applied data minimisation, purpose limitation, and storage limitation. By distinguishing necessary operational data from optional user-controlled features and identifying excessive collection (contacts harvesting, continuous GPS tracking, advertising trackers, and indefinite retention), you protected user privacy. Your remediation plan removes unjustified collection, enforces granular least-privilege scoping for calendar integration, and institutes an automated 30-day purge and account erasure lifecycle.',
  failureExplanation:
    'Review the product specification and privacy-by-design principles. Data minimisation requires collecting only what is strictly necessary for declared application functions. Study planning requires session details and timezone; reminders and calendar sync must be optional and narrowly scoped; while contacts uploading, background GPS tracking, ad identifiers, and indefinite retention are unjustified. A compliant audit plan removes excessive collection and enforces verifiable deletion lifecycles.',
};
