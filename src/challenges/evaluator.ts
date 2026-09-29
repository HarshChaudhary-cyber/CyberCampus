// ============================================================
// CyberCampus — Challenge Evaluator
// Deterministic scoring for all interaction types.
// No AI or free-text grading.
// ============================================================

import type { Step, StepResponse, AnswerKey } from '../types';

/**
 * Evaluate a single step given the user's submitted answer.
 * Returns the points earned (0 to step.pointValue).
 */
export function evaluateStep(
  step: Step,
  submitted: StepResponse['submitted']
): number {
  switch (step.interaction) {
    case 'flag-selection':
      return evalFlagSelection(step, submitted);
    case 'single-choice':
      return evalSingleChoice(step, submitted);
    case 'multi-choice':
      return evalMultiChoice(step, submitted);
    case 'classification':
      return evalClassification(step, submitted);
    case 'ordering':
    case 'ranking':
      return evalOrdering(step, submitted);
    case 'guided-form':
      return evalGuidedForm(step, submitted);
    default:
      return 0;
  }
}

// ── Flag Selection ────────────────────────────────────────────────────────────
// answerKey: Record<itemId, boolean>  (true = should be flagged)
// submitted: Record<itemId, boolean>  (serialised as JSON string or object)
function evalFlagSelection(step: Step, submitted: StepResponse['submitted']): number {
  const key = step.answerKey as Record<string, boolean>;
  const userAnswers = parseSubmitted<Record<string, boolean>>(submitted);

  const itemCount = step.items.length;
  if (itemCount === 0) return 0;

  if (!step.partialCreditAllowed) {
    // All items must match
    const allCorrect = step.items.every(
      (item) => Boolean(userAnswers[item.id]) === Boolean(key[item.id])
    );
    return allCorrect ? step.pointValue : 0;
  }

  // Partial credit: each item worth pointValue / itemCount
  const pointsPerItem = step.pointValue / itemCount;
  let earned = 0;
  for (const item of step.items) {
    if (Boolean(userAnswers[item.id]) === Boolean(key[item.id])) {
      earned += pointsPerItem;
    }
  }
  return Math.round(earned * 10) / 10; // round to 1dp
}

// ── Single Choice ─────────────────────────────────────────────────────────────
// answerKey: { chosen: string }
// submitted: string (the chosen item id)
function evalSingleChoice(step: Step, submitted: StepResponse['submitted']): number {
  const key = step.answerKey as { chosen: string };
  const chosen = typeof submitted === 'string' ? submitted : '';
  return chosen === key.chosen ? step.pointValue : 0;
}

// ── Multi Choice ──────────────────────────────────────────────────────────────
// answerKey: { chosen: string[] }
// submitted: string[]
function evalMultiChoice(step: Step, submitted: StepResponse['submitted']): number {
  const key = step.answerKey as { chosen: string[] };
  const chosen: string[] = Array.isArray(submitted) ? submitted : [];
  const correct = new Set(key.chosen);
  const userSet = new Set(chosen);

  if (!step.partialCreditAllowed) {
    // Exact match (same members, order irrelevant)
    if (correct.size !== userSet.size) return 0;
    for (const id of correct) if (!userSet.has(id)) return 0;
    return step.pointValue;
  }

  // Partial: award per correct pick, penalise per wrong pick (floor 0)
  const allIds = step.items.map((i) => i.id);
  const pointsPerItem = step.pointValue / Math.max(correct.size, 1);
  let earned = 0;
  for (const id of allIds) {
    const shouldBeChosen = correct.has(id);
    const wasChosen = userSet.has(id);
    if (shouldBeChosen === wasChosen) earned += pointsPerItem / allIds.length * correct.size;
  }
  // Simpler: credit per correctly included item, zero for incorrect picks
  earned = 0;
  for (const id of userSet) {
    if (correct.has(id)) earned += pointsPerItem;
    // wrong picks don't add but also don't subtract (handled by not adding)
  }
  // Penalise wrong picks: each wrong pick cancels one correct pick
  let wrongPicks = 0;
  for (const id of userSet) { if (!correct.has(id)) wrongPicks++; }
  earned = Math.max(0, earned - wrongPicks * pointsPerItem);
  return Math.round(earned * 10) / 10;
}

// ── Classification ────────────────────────────────────────────────────────────
// answerKey: Record<itemId, string>
// submitted: Record<itemId, string>  (JSON string or object)
function evalClassification(step: Step, submitted: StepResponse['submitted']): number {
  const key = step.answerKey as Record<string, string>;
  const userAnswers = parseSubmitted<Record<string, string>>(submitted);
  const itemCount = step.items.length;
  if (itemCount === 0) return 0;

  if (!step.partialCreditAllowed) {
    const allCorrect = step.items.every(
      (item) => userAnswers[item.id] === key[item.id]
    );
    return allCorrect ? step.pointValue : 0;
  }

  const pointsPerItem = step.pointValue / itemCount;
  let earned = 0;
  for (const item of step.items) {
    if (userAnswers[item.id] === key[item.id]) earned += pointsPerItem;
  }
  return Math.round(earned * 10) / 10;
}

// ── Ordering / Ranking ────────────────────────────────────────────────────────
// answerKey: { order: string[] }
// submitted: string[]
function evalOrdering(step: Step, submitted: StepResponse['submitted']): number {
  const key = step.answerKey as { order: string[] };
  let userOrder: string[] = [];
  if (Array.isArray(submitted)) {
    userOrder = submitted;
  } else if (typeof submitted === 'string') {
    try {
      const parsed = JSON.parse(submitted);
      if (Array.isArray(parsed)) userOrder = parsed;
    } catch {
      userOrder = [];
    }
  }

  if (!step.partialCreditAllowed) {
    if (userOrder.length !== key.order.length) return 0;
    const correct = userOrder.every((id, i) => id === key.order[i]);
    return correct ? step.pointValue : 0;
  }

  // Partial: one point per item in correct position
  const total = key.order.length;
  if (total === 0) return 0;
  let correctPositions = 0;
  for (let i = 0; i < total; i++) {
    if (userOrder[i] === key.order[i]) correctPositions++;
  }
  return Math.round((correctPositions / total) * step.pointValue * 10) / 10;
}

// ── Guided Form ───────────────────────────────────────────────────────────────
// answerKey: Record<fieldId, string | string[]>
// submitted: Record<fieldId, string | string[]>
function evalGuidedForm(step: Step, submitted: StepResponse['submitted']): number {
  const key = step.answerKey as Record<string, string | string[]>;
  const userAnswers = parseSubmitted<Record<string, string | string[]>>(submitted);
  const fields = Object.keys(key);
  if (fields.length === 0) return 0;

  if (!step.partialCreditAllowed) {
    const allCorrect = fields.every((fieldId) => {
      const expected = key[fieldId];
      const actual = userAnswers[fieldId];
      return answersMatch(expected, actual);
    });
    return allCorrect ? step.pointValue : 0;
  }

  const pointsPerField = step.pointValue / fields.length;
  let earned = 0;
  for (const fieldId of fields) {
    if (answersMatch(key[fieldId], userAnswers[fieldId])) earned += pointsPerField;
  }
  return Math.round(earned * 10) / 10;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSubmitted<T>(submitted: StepResponse['submitted']): T {
  if (typeof submitted === 'string') {
    try { return JSON.parse(submitted) as T; } catch { return {} as T; }
  }
  return (submitted ?? {}) as unknown as T;
}

function answersMatch(
  expected: string | string[] | boolean,
  actual: string | string[] | boolean | undefined
): boolean {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    const e = new Set(expected);
    return actual.every((v) => e.has(v));
  }
  return expected === actual;
}

/**
 * Build all StepResponses for a challenge given a map of step → submitted value.
 * This is the single function ChallengePage calls on submit.
 */
export function buildStepResponses(
  steps: Step[],
  submissions: Record<string, StepResponse['submitted']>
): StepResponse[] {
  return steps.map((step) => {
    const submitted = submissions[step.id] ?? '';
    const pointsEarned = evaluateStep(step, submitted);
    return { stepId: step.id, submitted, pointsEarned };
  });
}

/**
 * Get the AnswerKey for a step in a user-displayable format
 * (used on the results explanation screen).
 */
export function getCorrectAnswerDisplay(step: Step): string {
  const key: AnswerKey = step.answerKey;
  if (step.interaction === 'flag-selection') {
    const flagged = step.items
      .filter((item) => (key as Record<string, boolean>)[item.id])
      .map((item) => item.label);
    return flagged.length ? `Flag: ${flagged.join(', ')}` : 'None should be flagged';
  }
  if (step.interaction === 'single-choice') {
    const chosen = (key as { chosen: string }).chosen;
    const item = step.items.find((i) => i.id === chosen);
    return item?.label ?? chosen;
  }
  if (step.interaction === 'multi-choice') {
    const chosen = (key as { chosen: string[] }).chosen;
    return step.items
      .filter((i) => chosen.includes(i.id))
      .map((i) => i.label)
      .join(', ');
  }
  if (step.interaction === 'classification') {
    return step.items
      .map((i) => `${i.label} → ${(key as Record<string, string>)[i.id]}`)
      .join('\n');
  }
  if (step.interaction === 'ordering' || step.interaction === 'ranking') {
    const order = (key as { order: string[] }).order;
    return order
      .map((id, i) => {
        const item = step.items.find((it) => it.id === id);
        return `${i + 1}. ${item?.label ?? id}`;
      })
      .join('\n');
  }
  if (step.interaction === 'guided-form') {
    return step.items
      .map((i) => `${i.label}: ${(key as Record<string, string>)[i.id] ?? ''}`)
      .join('\n');
  }
  return JSON.stringify(key);
}
