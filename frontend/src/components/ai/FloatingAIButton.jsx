import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAI } from '../../hooks/useAI';

const FloatingAIButton = () => {
  const { enabled, assistantOpen, toggleAssistant } = useAI();

  if (!enabled || assistantOpen) return null;

  return (
    <div className="ai-fabWrap" aria-hidden="false">
      <span className="ai-fabTooltip">TrackMySubs AI</span>
      <motion.button
        type="button"
        className={`ai-fab ${assistantOpen ? 'is-open' : ''}`}
        onClick={toggleAssistant}
        aria-label={assistantOpen ? 'Close TrackMySubs AI' : 'Open TrackMySubs AI'}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="ai-fabPulse" />
        <Bot size={27} strokeWidth={2.2} />
      </motion.button>
    </div>
  );
};

export default FloatingAIButton;
