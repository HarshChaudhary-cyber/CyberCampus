import React, { useState } from 'react';
import { Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCyberStore } from '../store';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import styles from './SettingsPage.module.css';

export const SettingsPage: React.FC = () => {
  const { profile, updateSettings, setDisplayName, resetAllProgress } = useCyberStore();
  const { settings, displayName } = profile;
  const [nameInput, setNameInput] = useState(displayName);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    setDisplayName(trimmed);
    setNameInput(trimmed);
    setSaveFeedback('Display name saved');
    setTimeout(() => {
      setSaveFeedback(null);
    }, 3000);
  };

  return (
    <div className={styles.settingsPage}>
      {/* ── Page Header ── */}
      <header className={styles.header}>
        <div className={styles.pill}>
          <Settings size={13} aria-hidden="true" />
          <span>Preferences & Data</span>
        </div>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Personalise your CyberCampus experience and manage locally stored progress.
        </p>
      </header>

      <div className={styles.sectionsContainer}>
        {/* ── Display Name Card ── */}
        <section className={styles.card} aria-labelledby="settings-profile-heading">
          <h2 id="settings-profile-heading" className={styles.cardTitle}>
            Profile
          </h2>
          <p className={styles.cardDesc}>
            Customise how your name appears on your dashboard greeting.
          </p>

          <form onSubmit={handleSaveDisplayName}>
            <label htmlFor="settings-display-name" className={styles.label}>
              Display Name
            </label>
            <p className={styles.helpText}>
              Optional nickname stored locally on this device (maximum 40 characters).
            </p>
            <div className={styles.inputRow}>
              <input
                id="settings-display-name"
                className={styles.textInput}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="CyberCadet"
                maxLength={40}
                aria-describedby={saveFeedback ? 'settings-name-feedback' : undefined}
              />
              <Button
                variant="secondary"
                size="sm"
                type="submit"
                aria-label="Save display name"
              >
                Save
              </Button>
            </div>
            {saveFeedback && (
              <div
                id="settings-name-feedback"
                role="status"
                aria-live="polite"
                className={styles.saveFeedback}
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>{saveFeedback}</span>
              </div>
            )}
          </form>
        </section>

        {/* ── Accessibility & Performance Card ── */}
        <section className={styles.card} aria-labelledby="settings-a11y-heading">
          <h2 id="settings-a11y-heading" className={styles.cardTitle}>
            Accessibility & Performance
          </h2>
          <p className={styles.cardDesc}>
            Adjust campus graphics and motion to suit your device and comfort preferences.
          </p>

          <div className={styles.toggleList}>
            <label htmlFor="settings-reducedMotion" className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <span className={styles.toggleLabel}>Reduced Motion</span>
                <span className={styles.toggleDesc}>
                  Disables smooth camera transitions and UI motion animations.
                </span>
              </div>
              <input
                id="settings-reducedMotion"
                type="checkbox"
                className={styles.checkbox}
                checked={settings.reducedMotion}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
              />
            </label>

            <label htmlFor="settings-lowPerformanceMode" className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <span className={styles.toggleLabel}>Low Performance Mode</span>
                <span className={styles.toggleDesc}>
                  Switches the campus view to an accessible 2D map instead of 3D WebGL rendering.
                </span>
              </div>
              <input
                id="settings-lowPerformanceMode"
                type="checkbox"
                className={styles.checkbox}
                checked={settings.lowPerformanceMode}
                onChange={(e) => updateSettings({ lowPerformanceMode: e.target.checked })}
              />
            </label>
          </div>
        </section>

        {/* ── Danger Zone Card ── */}
        <section
          className={`${styles.card} ${styles.dangerCard}`}
          aria-labelledby="settings-danger-heading"
        >
          <h2
            id="settings-danger-heading"
            className={`${styles.cardTitle} ${styles.cardTitleDanger}`}
          >
            Danger Zone
          </h2>
          <p className={styles.cardDesc}>
            Permanently delete all attempts, scores, and skills from this browser. This cannot be undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowResetModal(true)}
            aria-label="Reset all progress"
          >
            <AlertTriangle size={14} aria-hidden="true" />
            Reset All Progress
          </Button>
        </section>
      </div>

      {/* ── Reset Confirmation Modal ── */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset All Progress?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetAllProgress();
                setShowResetModal(false);
              }}
            >
              Yes, Reset Everything
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3)' }}>
          All challenge attempts, portfolio entries, and skill tags stored on this device
          will be permanently deleted. This action cannot be reversed.
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Your display name and accessibility settings will be kept.
        </p>
      </Modal>
    </div>
  );
};
