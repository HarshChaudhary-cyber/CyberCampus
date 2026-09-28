import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Target,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from './pages.module.css';

const FEATURES = [
  {
    icon: Target,
    title: '15 Hands-On Challenges',
    desc: 'Investigate real-world scenarios across 5 security domains — from phishing defence to digital forensics.',
  },
  {
    icon: BookOpen,
    title: 'Learn by Doing',
    desc: 'Examine evidence, make decisions, and receive clear explanations. Retry as many times as you need.',
  },
  {
    icon: Shield,
    title: 'Safe Simulation',
    desc: 'Every scenario uses entirely fictional data in a contained environment. No real systems involved.',
  },
  {
    icon: Award,
    title: 'Build Your Portfolio',
    desc: 'Track skill badges and completed challenges in your personal portfolio — stored locally on your device.',
  },
];

export const LandingPage: React.FC = () => (
  <div className="page">
    {/* ── Hero ── */}
    <section className={styles.hero} aria-label="Hero section">
      <div className={styles.heroBg} aria-hidden="true" />
      <div className={styles.heroContent}>
        <span className={styles.heroPill}>
          <span className={styles.heroPulse} aria-hidden="true" />
          Cybersecurity Learning Platform
        </span>

        <h1 className={styles.heroTitle}>
          Master Cyber&shy;security Through&nbsp;Investigation
        </h1>

        <p className={styles.heroDesc}>
          Enter a 3D virtual campus. Choose a room. Investigate simulated
          security incidents, make decisions, and learn from every outcome.
          No experience needed.
        </p>

        <div className={styles.actions}>
          <Button as="button" size="lg" variant="primary">
            <Link to="/campus" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} aria-hidden="true" />
              Enter Campus
            </Link>
          </Button>
          <Button as="button" size="lg" variant="secondary">
            <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
              View Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </section>

    {/* ── Feature grid ── */}
    <section aria-label="Features" className={styles.featureGrid}>
      {FEATURES.map(({ icon: Icon, title, desc }) => (
        <article key={title} className={styles.featureCard}>
          <div className={styles.featureIcon} aria-hidden="true">
            <Icon size={28} />
          </div>
          <h2 className={styles.featureTitle}>{title}</h2>
          <p className={styles.featureDesc}>{desc}</p>
        </article>
      ))}
    </section>
  </div>
);
