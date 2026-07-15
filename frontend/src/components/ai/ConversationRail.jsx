import { useMemo, useState } from 'react';
import { Download, Edit3, Pin, PinOff, Plus, Search, Trash2, X, MessageSquareText } from 'lucide-react';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useAI } from '../../hooks/useAI';
import { normalizeAssistantText } from '../../utils/aiAssistantUtils';

const ConversationRail = ({ onOpenChat }) => {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    newConversation,
    renameConversation,
    toggleConversationPin,
    conversationSearch,
    setConversationSearch,
    clearConversation,
    clearAllConversations,
    exportConversation,
  } = useAI();

  const [editingId, setEditingId] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [clearId, setClearId] = useState('');
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const visibleConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    return [...conversations]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      })
      .filter((conversation) => {
        if (!query) return true;
        const content = `${conversation.title || ''} ${conversation.promptSeed || ''} ${(conversation.messages || []).slice(-1)[0]?.content || ''}`.toLowerCase();
        return content.includes(query);
      });
  }, [conversationSearch, conversations]);

  const startRename = (conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title || 'New chat');
  };

  const saveRename = (conversationId) => {
    renameConversation(conversationId, editingTitle);
    setEditingId('');
    setEditingTitle('');
  };

  const clearCurrent = () => {
    if (!clearId) return;
    clearConversation(clearId);
    setClearId('');
  };

  return (
    <aside className="ai-rail">
      <div className="ai-railTop">
        <div>
          <div className="ai-railKicker">Conversations</div>
          <div className="ai-railTitle">History and control</div>
        </div>
        <Button size="sm" variant="gradient" icon={Plus} onClick={() => {
          newConversation('');
          onOpenChat?.();
        }}>
          New chat
        </Button>
      </div>

      <label className="ai-railSearch" aria-label="Search conversations">
        <Search size={15} />
        <input
          type="search"
          value={conversationSearch}
          onChange={(event) => setConversationSearch(event.target.value)}
          placeholder="Search chats"
        />
      </label>

      <div className="ai-railActions">
        <Button
          size="sm"
          variant="ghost"
          icon={MessageSquareText}
          onClick={() => clearConversation(activeConversationId)}
          disabled={!activeConversationId}
        >
          Clear chat
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={Download}
          onClick={() => exportConversation(activeConversationId)}
          disabled={!activeConversationId}
        >
          Export
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={Trash2}
          onClick={() => setClearAllOpen(true)}
          disabled={!conversations.length}
        >
          Clear all
        </Button>
      </div>

      <div className="ai-railList">
        {visibleConversations.length ? visibleConversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const isEditing = conversation.id === editingId;
          const latestMessage = conversation.messages?.slice(-1)[0];

          return (
            <div
              key={conversation.id}
              className={`ai-railItem ${isActive ? 'is-active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (isEditing) return;
                selectConversation(conversation.id);
                onOpenChat?.();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  selectConversation(conversation.id);
                  onOpenChat?.();
                }
              }}
            >
              <div className="ai-railItemMain">
                <div className="ai-railItemTitleRow">
                  {isEditing ? (
                    <input
                      className="ai-railEdit"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          event.stopPropagation();
                          saveRename(conversation.id);
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          event.stopPropagation();
                          setEditingId('');
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <strong className="ai-railItemTitle">{normalizeAssistantText(conversation.title || 'New chat')}</strong>
                  )}
                  {conversation.pinned && <Pin size={12} />}
                </div>
                <p className="ai-railItemSnippet">
                  {normalizeAssistantText(latestMessage?.content || 'No messages yet.')}
                </p>
              </div>

              <div className="ai-railItemMeta">
                <span>{(conversation.messages || []).length} msg</span>
                <div className="ai-railItemButtons">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); saveRename(conversation.id); }}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setEditingId(''); }}>
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); startRename(conversation); }} icon={Edit3} />
                      <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); toggleConversationPin(conversation.id); }} icon={conversation.pinned ? PinOff : Pin} />
                      <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setClearId(conversation.id); }} icon={Trash2} />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="ai-railEmpty">No conversations match your search.</div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(clearId)}
        onClose={() => setClearId('')}
        onConfirm={clearCurrent}
        title="Clear this conversation?"
        message="This will remove the messages from the selected chat and start it fresh, but keep the conversation in your history."
        confirmLabel="Clear chat"
        cancelLabel="Cancel"
        isDestructive
      />

      <ConfirmDialog
        isOpen={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={() => {
          clearAllConversations();
          setClearAllOpen(false);
        }}
        title="Clear all conversations?"
        message="This will remove every saved assistant conversation from this device."
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        isDestructive
      />
    </aside>
  );
};

export default ConversationRail;
