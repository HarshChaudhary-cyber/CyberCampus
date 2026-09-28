import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  interactive?: boolean;
  glow?: boolean;
  flat?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  tabIndex?: number;
  role?: string;
  'aria-label'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  glow = false,
  flat = false,
  size = 'md',
  className = '',
  onClick,
  ...rest
}) => {
  const cls = [
    styles.card,
    interactive ? styles['card--interactive'] : '',
    glow ? styles['card--glow'] : '',
    flat ? styles['card--flat'] : '',
    size !== 'md' ? styles[`card--${size}`] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      onClick={onClick}
      tabIndex={interactive ? (rest.tabIndex ?? 0) : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }
          : undefined
      }
      {...rest}
    >
      {children}
    </div>
  );
};
