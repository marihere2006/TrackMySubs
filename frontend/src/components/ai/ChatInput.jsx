import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Paperclip, Send, CircleStop } from 'lucide-react';
import Button from '../ui/Button';
import { normalizeAssistantText } from '../../utils/aiAssistantUtils';

const ChatInput = ({ onSend, onCancel, sending, placeholder = 'Ask anything about your subscriptions...', resetKey = 0 }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setValue('');
    inputRef.current?.focus();
  }, [resetKey]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleSend = async () => {
    const text = value.trim();
    if (!text || sending) return;
    setValue('');
    await onSend(text);
  };

  return (
    <div className="ai-inputDock">
      <div className="ai-inputRow">
        <button
          type="button"
          className="ai-iconButton"
          aria-label="Attach file"
          title="Attach files coming soon"
          disabled
        >
          <Paperclip size={16} />
        </button>

        <textarea
          ref={inputRef}
          className="ai-input"
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel?.();
            }
          }}
          placeholder={normalizeAssistantText(placeholder)}
          aria-label="Ask TrackMySubs AI"
        />

        {sending ? (
          <Button
            size="sm"
            variant="ghost"
            icon={CircleStop}
            onClick={onCancel}
          >
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            variant="gradient"
            icon={Send}
            onClick={handleSend}
            disabled={!value.trim()}
          >
            Send
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
