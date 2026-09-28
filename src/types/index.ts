// ============================================================
// CyberCampus — Shared TypeScript Types
// Source of truth for data model (matches the project plan).
// ============================================================

// ── Room ─────────────────────────────────────────────────────────────────────

export type RoomId =
  | 'phishing'
  | 'secops'
  | 'network'
  | 'forensics'
  | 'privacy';

export interface Room {
  id: RoomId;
  title: string;
  description: string;
  icon: string;          // Lucide icon component name
  accentClass: string;   // CSS class applied to room wrapper, e.g. 'room-phishing'
  challengeIds: [string, string, string];
}

// ── Challenge & Evidence ──────────────────────────────────────────────────────

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type EvidenceType =
  | 'email'
  | 'log'
  | 'file'
  | 'network-packet'
  | 'image'
  | 'chat'
  | 'policy';

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  label: string;
  /** Rendered by the type-specific EvidenceViewer component */
  content: string | Record<string, unknown>;
}

// ── Interaction System ────────────────────────────────────────────────────────
// All interactions are evaluated deterministically — no AI grading.

export type InteractionType =
  | 'flag-selection'   // checkbox — tick suspicious items
  | 'single-choice'    // radio — pick one option
  | 'multi-choice'     // checkbox — pick N of M (order irrelevant)
  | 'classification'   // assign each item a label from a fixed set
  | 'ordering'         // drag items into the correct sequence
  | 'ranking'          // order items by a named criterion
  | 'guided-form';     // dropdown / checkbox structured form (no free text)

/**
 * AnswerKey — maps item IDs to their expected values.
 *
 * Concrete shapes per interaction type:
 *   flag-selection : Record<itemId, boolean>
 *   single-choice  : { chosen: string }
 *   multi-choice   : { chosen: string[] }
 *   classification : Record<itemId, string>
 *   ordering       : { order: string[] }
 *   ranking        : { order: string[] }
 *   guided-form    : Record<fieldId, string | string[]>
 */
export type AnswerKey = Record<string, boolean | string | string[]>;

export interface StepItem {
  id: string;
  label: string;
  /** For classification / guided-form: the list of labels the user can assign */
  options?: string[];
}

export interface Step {
  id: string;
  /** Instruction text shown above the interaction widget */
  prompt: string;
  interaction: InteractionType;
  items: StepItem[];
  answerKey: AnswerKey;
  /** Max points this step contributes. All steps in a challenge sum to 100. */
  pointValue: number;
  /**
   * true  → each correct item earns pointValue / items.length
   * false → full pointValue only if ALL items are correct, else 0
   */
  partialCreditAllowed: boolean;
}

export interface Challenge {
  id: string;
  roomId: RoomId;
  difficulty: Difficulty;
  title: string;
  /** 2–3 sentence scenario introduction */
  briefing: string;
  evidence: EvidenceItem[];
  /** 1–3 sequential steps; total pointValue across all steps = 100 */
  steps: Step[];
  /**
   * Ordered hints. Each one revealed costs 10 points from earnedScore.
   * Rule: finalScore = max(0, earnedScore − hintsUsed × 10)
   */
  hints: string[];
  skills: string[];
  /** Minimum finalScore to be considered "Passed". Default: 70. */
  passThreshold: number;
  successExplanation: string;
  failureExplanation: string;
  /** If true, StepItem order is randomised on each retry */
  shuffleItems?: boolean;
}

// ── User & Progress ───────────────────────────────────────────────────────────

export interface UserSettings {
  reducedMotion: boolean;
  lowPerformanceMode: boolean;
  soundEnabled: boolean;
}

export interface UserProfile {
  id: string;          // UUID, generated on first visit
  displayName: string; // optional, cosmetic
  createdAt: string;   // ISO date
  settings: UserSettings;
}

export type StepSubmissionValue =
  | boolean
  | string
  | string[]
  | Record<string, boolean>
  | Record<string, string>
  | Record<string, string[]>
  | Record<string, boolean | string | string[]>
  | Record<string, unknown>;

export interface StepResponse {
  stepId: string;
  /** Value matches the shape expected by the step's AnswerKey */
  submitted: StepSubmissionValue;
  pointsEarned: number; // 0 to step.pointValue
}

export interface Attempt {
  id: string;
  challengeId: string;
  startedAt: string;
  completedAt: string | null;
  hintsUsed: number;
  stepResponses: StepResponse[];
  /** Raw score before hint penalty (0–100) */
  earnedScore: number;
  /** max(0, earnedScore − hintsUsed × 10) */
  finalScore: number;
  /** finalScore >= challenge.passThreshold */
  passed: boolean;
  /** 0 = first attempt, 1 = first retry, etc. */
  retryNumber: number;
}

export interface PortfolioEntry {
  challengeId: string;
  /** Highest finalScore across all attempts */
  bestFinalScore: number;
  /** ISO date of first passing attempt, or null if never passed */
  passedAt: string | null;
  /** From challenge.skills, awarded on first passing attempt */
  skillsEarned: string[];
  totalAttempts: number;
}

export interface UserProgress {
  userId: string;
  /** All historical attempts, newest last */
  attempts: Attempt[];
  /** One entry per challenge ever attempted */
  portfolio: PortfolioEntry[];
  /** skill → cumulative times practised */
  skillTags: Record<string, number>;
}
