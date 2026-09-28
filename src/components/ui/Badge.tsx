import React from 'react';
import styles from './Badge.module.css';
import type { Difficulty } from '../../types';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | Difficulty;

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const cls = [styles.badge, styles[`badge--${variant}`], className]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{children}</span>;
};

/** Convenience: render a Difficulty badge with the correct label */
export const DifficultyBadge: React.FC<{ difficulty: Difficulty }> = ({
  difficulty,
}) => (
  <Badge variant={difficulty}>{DIFFICULTY_LABEL[difficulty]}</Badge>
);
