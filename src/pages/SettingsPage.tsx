import React, { useState } from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import { useCyberStore } from '../store';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import styles from './pages.module.css';

export const SettingsPage: React.FC = () => {
  const { profile, updateSettings, setDisplayName, resetAllProgress } = useCyberStore();
  const { settings, displayName } = profile;
  const [nameInput, setNameInput] = useState(displayName);
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <div className={styles.page}>
      <span className={styles.tag}>Settings</span>
      <Settings size={48} className={styles.icon} aria-hidden="true" />
      <h1 className={styles.heading}>Settings</h1>
      <p className={styles.sub}>Personalise your CyberCampus experience.</p>

      <div style={{
        width: '100%',
        maxWidth: '480px',
        marginTop: 'var(--space-8)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
      }}>

        {/* Display name */}
        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>Display Name</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              id="settings-display-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Optional — shown on your dashboard"
              maxLength={40}
              style={{
                flex: 1,
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                padding: 'var(--space-2) var(--space-3)',
                outline: 'none',
                minHeight: '44px',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDisplayName(nameInput.trim())}
              aria-label="Save display name"
            >
              Save
            </Button>
          </div>
        </section>

        {/* Toggles */}
        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>Accessibility & Performance</h2>
          {(
            [
              { key: 'reducedMotion',     label: 'Reduced motion',      desc: 'Disables animations and camera fly-ins.' },
              { key: 'lowPerformanceMode',label: 'Low performance mode', desc: 'Replaces 3D campus with a 2D map.' },
              { key: 'soundEnabled',      label: 'Sound effects',        desc: 'Enable ambient and interaction sounds.' },
            ] as const
          ).map(({ key, label, desc }) => (
            <label
              key={key}
              htmlFor={`settings-${key}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) 0',
                borderBottom: '1px solid var(--color-border-subtle)',
                cursor: 'pointer',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{desc}</div>
              </div>
              <input
                id={`settings-${key}`}
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => updateSettings({ [key]: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                aria-label={label}
              />
            </label>
          ))}
        </section>

        {/* Danger zone */}
        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)', color: 'var(--color-danger)' }}>
            Danger Zone
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
            This permanently deletes all attempts, portfolio entries, and skill tags from this device.
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

      {/* Reset confirmation modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset All Progress?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetAllProgress();
                setShowResetModal(false);
              }}
              aria-label="Confirm reset"
            >
              Yes, Reset Everything
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)' }}>
          All attempts, portfolio entries, and skill tags stored on this device
          will be permanently deleted. This cannot be undone.
        </p>
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Your display name and settings will be kept.
        </p>
      </Modal>
    </div>
  );
};
