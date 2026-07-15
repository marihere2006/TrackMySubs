import { useEffect, useRef } from 'react';
import { ChevronUp, Bot, User } from 'lucide-react';
import Button from '../ui/Button';
import MarkdownRenderer from './MarkdownRenderer';
import AIResponseCards from './AIResponseCards';
import TypingIndicator from './TypingIndicator';
import { normalizeAssistantText } from '../../utils/aiAssistantUtils';

const MessageBubble = ({ message, onAction }) => {
  const isUser = message.role === 'user';
  const content = normalizeAssistantText(message.content);

  return (
    <div className={`ai-message ai-message-${isUser ? 'user' : 'assistant'}`}>
      <div className="ai-messageAvatar">
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className={`ai-messageBubble ai-messageBubble-${isUser ? 'user' : 'assistant'}`}>
        {isUser ? (
          <div className="ai-messageText">{content}</div>
        ) : (
          <>
            <MarkdownRenderer content={content} />
            {Array.isArray(message.cards) && message.cards.length > 0 && (
              <AIResponseCards cards={message.cards} onAction={onAction} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ChatMessages = ({ messages = [], loading = false, hasMore = false, onLoadMore, onAction }) => {
  const feedRef = useRef(null);
  const endRef = useRef(null);
  const previousRef = useRef({ lastMessageId: '', loading: false });
  const lastMessageId = messages[messages.length - 1]?.id || '';

  useEffect(() => {
    const previous = previousRef.current;
    const shouldStick = Boolean(lastMessageId && lastMessageId !== previous.lastMessageId) || (loading && !previous.loading);
    previousRef.current = { lastMessageId, loading };

    if (shouldStick) {
      requestAnimationFrame(() => {
        feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [lastMessageId, loading]);

  return (
    <div className="ai-messageFeed" ref={feedRef} role="log" aria-live="polite" aria-relevant="additions text">
      {hasMore && (
        <div className="ai-loadMoreRow">
          <Button size="sm" variant="ghost" icon={ChevronUp} onClick={onLoadMore}>
            Load older messages
          </Button>
        </div>
      )}

      <div className="ai-messageList">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onAction={onAction} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
