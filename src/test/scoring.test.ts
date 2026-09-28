import { describe, it, expect } from 'vitest';
import { computeScore } from '../store';
import type { StepResponse } from '../types';

// Helper to build a StepResponse
const resp = (stepId: string, pointsEarned: number): StepResponse => ({
  stepId,
  submitted: 'value',
  pointsEarned,
});

describe('computeScore — scoring formula', () => {
  const PASS = 70;

  it('perfect attempt, no hints: earnedScore=100, finalScore=100, passed', () => {
    const result = computeScore([resp('s1', 60), resp('s2', 40)], 0, PASS);
    expect(result.earnedScore).toBe(100);
    expect(result.finalScore).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('one hint deducts 10 pts', () => {
    const result = computeScore([resp('s1', 100)], 1, PASS);
    expect(result.finalScore).toBe(90);
    expect(result.passed).toBe(true);
  });

  it('hints cannot push finalScore below 0', () => {
    const result = computeScore([resp('s1', 20)], 5, PASS);
    // earnedScore=20, deduction=50, result would be -30 → clamped to 0
    expect(result.earnedScore).toBe(20);
    expect(result.finalScore).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('score exactly at passThreshold passes', () => {
    const result = computeScore([resp('s1', 70)], 0, 70);
    expect(result.passed).toBe(true);
  });

  it('score one below passThreshold fails', () => {
    const result = computeScore([resp('s1', 69)], 0, 70);
    expect(result.passed).toBe(false);
  });

  it('7 hints on 100 earned score → finalScore 30 (not 0, not clamped here)', () => {
    const result = computeScore([resp('s1', 100)], 7, PASS);
    expect(result.finalScore).toBe(30);
    expect(result.passed).toBe(false);
  });

  it('partial credit across multiple steps', () => {
    // Step 1 contributes 30/60, step 2 contributes 40/40
    const result = computeScore([resp('s1', 30), resp('s2', 40)], 0, PASS);
    expect(result.earnedScore).toBe(70);
    expect(result.finalScore).toBe(70);
    expect(result.passed).toBe(true);
  });

  it('all wrong, no hints: finalScore 0, not passed', () => {
    const result = computeScore([resp('s1', 0), resp('s2', 0)], 0, PASS);
    expect(result.earnedScore).toBe(0);
    expect(result.finalScore).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('all wrong + hints still floors at 0', () => {
    const result = computeScore([resp('s1', 0)], 10, PASS);
    expect(result.finalScore).toBe(0);
  });

  it('custom passThreshold of 50', () => {
    const result = computeScore([resp('s1', 50)], 0, 50);
    expect(result.passed).toBe(true);
  });
});
