import { Bot, Maximize2, Minimize2, Plus, Sparkles, X } from 'lucide-react';
import { useAI } from '../../hooks/useAI';

const ChatHeader = ({ onClose }) => {
  const { assistantFullscreen, toggleFullscreen, newConversation } = useAI();

  return (
    <div className="ai-header">
      <div className="ai-headerTop">
        <div className="ai-headerBrand">
          <div className="ai-headerIcon">
            <Sparkles size={15} />
          </div>
          <div className="ai-headerText">
            <div className="ai-headerTitle">
              <Bot size={14} />
              <span>TrackMySubs AI</span>
            </div>
            <div className="ai-headerSubtitle">Ask anything about your subscriptions.</div>
          </div>
        </div>

        <div className="ai-headerActions">
          <button type="button" className="ai-headerAction" onClick={() => newConversation('')} aria-label="New chat">
            <Plus size={16} />
          </button>
          <button type="button" className="ai-headerAction" onClick={toggleFullscreen} aria-label={assistantFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {assistantFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button type="button" className="ai-headerClose" onClick={onClose} aria-label="Close assistant">
            <X size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
