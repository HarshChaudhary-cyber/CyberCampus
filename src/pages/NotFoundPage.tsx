import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from './pages.module.css';

export const NotFoundPage: React.FC = () => (
  <div className={styles.page}>
    <AlertCircle size={48} className={styles.icon} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
    <span className={styles.tag}>404</span>
    <h1 className={styles.heading}>Page Not Found</h1>
    <p className={styles.sub}>
      The page you&apos;re looking for doesn&apos;t exist or has moved.
    </p>
    <div className={styles.actions}>
      <Link to="/">
        <Button variant="primary">← Back to Home</Button>
      </Link>
    </div>
  </div>
);
