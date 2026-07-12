import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import styles from './AiChatWidget.module.css';
import { sendChatMessage } from '../services/aiService';

const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your Subscription AI Assistant. Ask me anything about your spending or subscriptions.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: 'user' }]);
    setLoading(true);

    try {
      const res = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, { id: Date.now(), text: res.response, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Sorry, I couldn't process your request right now. Check your AI provider configuration.", sender: 'bot', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.widgetContainer}>
      {!isOpen && (
        <button className={styles.toggleBtn} onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Bot size={20} />
              <span>AI Assistant</span>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className={styles.messagesList}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.userWrapper : styles.botWrapper}`}>
                {msg.sender === 'bot' && <div className={styles.avatar}><Bot size={14} /></div>}
                <div className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userBubble : styles.botBubble} ${msg.error ? styles.errorBubble : ''}`}>
                  {msg.text}
                </div>
                {msg.sender === 'user' && <div className={styles.avatar}><User size={14} /></div>}
              </div>
            ))}
            {loading && (
              <div className={`${styles.messageWrapper} ${styles.botWrapper}`}>
                <div className={styles.avatar}><Bot size={14} /></div>
                <div className={`${styles.messageBubble} ${styles.botBubble}`}>
                  <Loader2 size={16} className={styles.spinner} /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className={styles.inputArea}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className={styles.input}
              disabled={loading}
            />
            <button type="submit" className={styles.sendBtn} disabled={!input.trim() || loading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiChatWidget;
