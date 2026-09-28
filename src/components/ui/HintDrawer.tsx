import React, { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HintDrawer.module.css';

interface HintDrawerProps {
  hints: string[];
  /** Number of hints already revealed in this attempt */
  revealedCount: number;
  onRevealHint: () => void;
  /** If true, all hints shown (post-submission review mode) */
  reviewMode?: boolean;
}

/**
 * HintDrawer — collapsible panel for revealing ordered hints.
 *
 * Scoring rule (displayed to user):
 *   Each revealed hint costs −10 pts from your earned score.
 *   Minimum final score is 0.
 */
export const HintDrawer: React.FC<HintDrawerProps> = ({
  hints,
  revealedCount,
  onRevealHint,
  reviewMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const visibleHints = reviewMode ? hints : hints.slice(0, revealedCount);
  const hasMore = !reviewMode && revealedCount < hints.length;
  const allUsed = !reviewMode && revealedCount === hints.length;

  return (
    <div className={styles.drawer}>
      {/* Trigger */}
      <button
        className={styles.trigger}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-controls="hint-drawer-body"
        id="hint-drawer-trigger"
      >
        <span className={styles.triggerLeft}>
          <Lightbulb size={16} aria-hidden="true" />
          {reviewMode
            ? `All hints (${hints.length})`
            : revealedCount === 0
              ? 'Need a hint?'
              : `Hints used: ${revealedCount} of ${hints.length}`}
        </span>
        {!reviewMode && hasMore && (
          <span className={styles.costTag} aria-label="Each hint costs 10 points">
            −10 pts each
          </span>
        )}
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles['chevron--open'] : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="hint-drawer-body"
            role="region"
            aria-labelledby="hint-drawer-trigger"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.hintList}>
              {/* Already revealed hints */}
              {visibleHints.map((hint, i) => (
                <div key={i} className={styles.hintItem}>
                  <span className={styles.hintNumber} aria-hidden="true">
                    {i + 1}
                  </span>
                  <p className={styles.hintText}>{hint}</p>
                </div>
              ))}

              {/* Reveal next button */}
              {hasMore && (
                <button
                  className={styles.revealBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRevealHint();
                  }}
                  aria-label={`Reveal hint ${revealedCount + 1} of ${hints.length} (costs 10 points)`}
                >
                  Reveal hint {revealedCount + 1} of {hints.length} (−10 pts)
                </button>
              )}

              {allUsed && (
                <p className={styles.allUsed}>All hints have been revealed.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
