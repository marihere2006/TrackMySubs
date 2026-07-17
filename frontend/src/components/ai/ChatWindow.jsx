import { useMemo, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import EmptyConversation from './EmptyConversation';
import AIFeatureDeck from './AIFeatureDeck';
import ConversationRail from './ConversationRail';
import { formatCurrency } from '../../utils/formatUtils';

const ChatWindow = ({ onClose }) => {
  const [view, setView] = useState('chat');
  const {
    assistantFullscreen,
    activeConversation,
    activeConversationId,
    visibleMessages,
    hasMoreMessages,
    loadMoreMessages,
    sending,
    error,
    pageContext,
    dashboard,
    monthlyTotal,
    suggestedPrompts,
    sendPrompt,
    cancelGeneration,
    runAction,
  } = useAI();

  const emptyInsights = useMemo(() => ([
    { label: 'Current page', value: pageContext.pageLabel },
    { label: 'Current month spend', value: formatCurrency(monthlyTotal) },
    { label: 'Health score', value: dashboard?.healthScore?.healthScore != null ? `${dashboard.healthScore.healthScore}/100` : '-' },
  ]), [dashboard?.healthScore?.healthScore, monthlyTotal, pageContext.pageLabel]);

  const emptyPrompts = suggestedPrompts.slice(0, 5);
  const showFooterSuggestions = visibleMessages.length > 0;
  const workflowPlaceholder = {
    budget_planner: 'Enter your monthly budget...',
    cost_optimizer: 'Pick a focus like Reduce spending or Annual plans...',
    renewal_advisor: 'Choose expensive renewals or all renewals...',
    what_if: 'Which subscription are you considering cancelling?',
  }[activeConversation?.workflow?.type] || 'Ask anything about your subscriptions...';

  const openChatView = () => setView('chat');

  const handleAction = (action) => {
    if (!action) return;
    if (action.kind === 'prompt') {
      setView('chat');
    }
    runAction(action);
  };

  const chatContent = (
    <>
      <div className="ai-windowBody">
        {error && <div className="ai-errorBanner">{error}</div>}

        <div className="ai-viewTabs" role="tablist" aria-label="AI assistant views">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'chat'}
            className={`ai-viewTab ${view === 'chat' ? 'ai-viewTabActive' : ''}`}
            onClick={() => setView('chat')}
          >
            Chat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'tools'}
            className={`ai-viewTab ${view === 'tools' ? 'ai-viewTabActive' : ''}`}
            onClick={() => setView('tools')}
          >
            Tools
          </button>
        </div>

        <div className="ai-messagesShell">
          {view === 'tools' ? (
            <AIFeatureDeck onLaunch={openChatView} />
          ) : (!activeConversation || visibleMessages.length === 0) ? (
            <EmptyConversation
              icon={MessageSquareText}
              title="Ask TrackMySubs AI anything."
              description="Get help deciding what to cancel, what to renew, and how to keep your recurring spend under control."
              prompts={emptyPrompts}
              insights={emptyInsights}
              onPrompt={sendPrompt}
            />
          ) : (
            <ChatMessages
              key={activeConversationId || 'empty'}
              messages={visibleMessages}
              loading={sending}
              hasMore={hasMoreMessages}
              onLoadMore={loadMoreMessages}
              onAction={handleAction}
            />
          )}
        </div>
      </div>

      <div className="ai-windowFooter">
        {showFooterSuggestions && (
          <SuggestionChips prompts={suggestedPrompts} onPrompt={sendPrompt} />
        )}
        <ChatInput
          onSend={sendPrompt}
          onCancel={cancelGeneration}
          sending={sending}
          placeholder={workflowPlaceholder}
          resetKey={`${activeConversationId || 'new'}-${activeConversation?.updatedAt || '0'}`}
        />
      </div>
    </>
  );

  return (
    <div className={`ai-window ${assistantFullscreen ? 'ai-windowFullscreen' : ''}`}>
      <ChatHeader onClose={onClose} />
      {assistantFullscreen ? (
        <div className="ai-workspace">
          <ConversationRail onOpenChat={openChatView} />
          <div className="ai-workspaceMain">
            {chatContent}
          </div>
        </div>
      ) : (
        chatContent
      )}
    </div>
  );
};

export default ChatWindow;
