import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  /** Renders as an anchor tag */
  as?: 'button';
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
