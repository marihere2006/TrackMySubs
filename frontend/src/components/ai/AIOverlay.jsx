import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import ChatWindow from './ChatWindow';

const AIOverlay = () => {
  const { enabled, assistantOpen, closeAssistant, assistantFullscreen } = useAI();

  useEffect(() => {
    if (!assistantOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAssistant();
      }
    };

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    window.addEventListener('keydown', onKeyDown);
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [assistantOpen, closeAssistant]);

  if (!enabled || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {assistantOpen && (
        <div className="ai-overlay" role="presentation">
          <motion.button
            type="button"
            className="ai-overlayBackdrop"
            aria-label="Close assistant"
            onClick={closeAssistant}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className={`ai-panel ${assistantFullscreen ? 'ai-panelFullscreen' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="TrackMySubs AI"
            initial={{ opacity: 0, x: 44, scale: assistantFullscreen ? 0.98 : 0.99 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 36, scale: assistantFullscreen ? 0.98 : 0.99 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <ChatWindow onClose={closeAssistant} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default AIOverlay;
