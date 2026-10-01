import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  children: React.ReactNode;
}

/**
 * CyberCampus base Button component.
 * Supports primary / secondary / ghost / danger variants and sm / md / lg sizes.
 * Always meets the 44×44 px minimum touch target.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      iconOnly = false,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const cls = [
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      fullWidth ? styles['button--full'] : '',
      iconOnly ? styles['button--icon'] : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={cls} {...rest}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export interface LinkButtonProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Single semantic interactive link styled consistently with Button.
 * Replaces invalid nested <Link><Button> combinations with an accessible, keyboard-focusable anchor.
 */
export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      iconOnly = false,
      className = '',
      children,
      to,
      ...rest
    },
    ref
  ) => {
    const cls = [
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      fullWidth ? styles['button--full'] : '',
      iconOnly ? styles['button--icon'] : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
);

LinkButton.displayName = 'LinkButton';
