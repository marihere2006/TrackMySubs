// ============================================================
// HeroHeader — Unified SaaS Header with top-right AI Popup
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, X, Bot, Sparkles, MessageSquare, Send, Loader2, User, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useLayout } from '../../context/LayoutContext';
import { expiryLabel, daysUntilExpiry } from '../../utils/dateUtils';
import { sendChatMessage } from '../../services/aiService';
import styles from './HeroHeader.module.css';

const HeroHeader = ({ title, subtitle, action, breadcrumb }) => {
  const { toggleTheme, isDark } = useTheme();
  const { notifications, notificationsDismissed, dismissNotifications } = useSubscriptions();
  const { toggleMobileMenu } = useLayout();
  const navigate = useNavigate();
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // AI Popup state
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [aiTab, setAiTab] = useState('chat');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your AI Assistant. Ask me anything about your subscriptions or spending.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const aiPopupRef = useRef(null);

  const hasNotifs = !notificationsDismissed && notifications.length > 0;
  const expiringSoon = notifications.filter((s) => daysUntilExpiry(s.expiryDate) >= 0);
  const recentlyExpired = notifications.filter((s) => daysUntilExpiry(s.expiryDate) < 0);

  const handleNotifClick = () => {
    setShowNotifPanel((v) => !v);
    setShowAiPopup(false);
    if (!showNotifPanel) dismissNotifications();
  };

  const handleAiClick = () => {
    setShowAiPopup((v) => !v);
    setShowNotifPanel(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (aiPopupRef.current && !aiPopupRef.current.contains(e.target)) {
        setShowAiPopup(false);
      }
    };
    if (showAiPopup) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAiPopup]);

  useEffect(() => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: 'user' }]);
    setChatLoading(true);
    try {
      const res = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, { id: Date.now(), text: res.response, sender: 'bot' }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), text: "Couldn't reach the AI right now. Try again shortly.", sender: 'bot', error: true }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <header className={styles.heroHeader}>
      <div className={styles.bgOverlay} />
      
      <div className={styles.container}>
        {/* Left Side */}
        <div className={styles.leftSide}>
          <div className={styles.topLine}>
            <button className={styles.menuBtn} onClick={toggleMobileMenu} aria-label="Toggle menu">
              <Menu size={20} />
            </button>
            {breadcrumb && (
              <div className={styles.breadcrumbWrapper}>
                <span className={styles.brand}>TrackMySubs</span>
                <span className={styles.separator}>/</span>
                <span className={styles.breadcrumb}>{breadcrumb}</span>
              </div>
            )}
          </div>
          <div className={styles.heroText}>
            {title && <h1 className={styles.title}>{title}</h1>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        {/* Right Side */}
        <div className={styles.rightSide}>
          <div className={styles.globalActions}>

            {/* ── AI Popup Button ── */}
            <div className={styles.aiPopupWrapper} ref={aiPopupRef}>
              <button
                className={`${styles.aiBtn} ${showAiPopup ? styles.aiBtnActive : ''}`}
                onClick={handleAiClick}
                aria-label="AI Assistant"
                title="AI Features"
              >
                <Bot size={17} />
                <span className={styles.aiBtnLabel}>AI</span>
              </button>

              {showAiPopup && (
                <div className={styles.aiPopup}>
                  {/* Popup Header with Tabs */}
                  <div className={styles.aiPopupHeader}>
                    <div className={styles.aiPopupTabs}>
                      <button
                        className={`${styles.aiTab} ${aiTab === 'chat' ? styles.aiTabActive : ''}`}
                        onClick={() => setAiTab('chat')}
                      >
                        <MessageSquare size={13} /> Chat
                      </button>
                      <button
                        className={`${styles.aiTab} ${aiTab === 'engine' ? styles.aiTabActive : ''}`}
                        onClick={() => setAiTab('engine')}
                      >
                        <Sparkles size={13} /> AI Engine
                      </button>
                    </div>
                    <button className={styles.aiPopupClose} onClick={() => setShowAiPopup(false)}>
                      <X size={15} />
                    </button>
                  </div>

                  {/* Chat Tab */}
                  {aiTab === 'chat' && (
                    <div className={styles.chatContainer}>
                      <div className={styles.messagesList} ref={messagesListRef}>
                        {messages.map(msg => (
                          <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.userWrapper : styles.botWrapper}`}>
                            {msg.sender === 'bot' && <div className={styles.msgAvatar}><Bot size={11} /></div>}
                            <div className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userBubble : styles.botBubble} ${msg.error ? styles.errorBubble : ''}`}>
                              {msg.text}
                            </div>
                            {msg.sender === 'user' && <div className={`${styles.msgAvatar} ${styles.userAvatar}`}><User size={11} /></div>}
                          </div>
                        ))}
                        {chatLoading && (
                          <div className={`${styles.messageWrapper} ${styles.botWrapper}`}>
                            <div className={styles.msgAvatar}><Bot size={11} /></div>
                            <div className={`${styles.messageBubble} ${styles.botBubble}`}>
                              <Loader2 size={13} className={styles.spinner} /> Thinking...
                            </div>
                          </div>
                        )}
                      </div>
                      <form onSubmit={handleSend} className={styles.chatInputRow}>
                        <input
                          type="text"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          placeholder="Ask about your subscriptions…"
                          className={styles.chatInput}
                          disabled={chatLoading}
                        />
                        <button type="submit" className={styles.chatSendBtn} disabled={!input.trim() || chatLoading}>
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* AI Engine Tab */}
                  {aiTab === 'engine' && (
                    <div className={styles.engineMenu}>
                      <p className={styles.engineDesc}>Full AI analytics with health scores, forecasts, smart alerts and recommendations.</p>
                      <button
                        className={styles.engineOpenBtn}
                        onClick={() => { navigate('/ai-engine'); setShowAiPopup(false); }}
                      >
                        <Sparkles size={15} />
                        Open AI Engine
                        <ExternalLink size={13} />
                      </button>
                      <div className={styles.engineFeatures}>
                        <div className={styles.engineFeature}><span>🎯</span> Health Score</div>
                        <div className={styles.engineFeature}><span>📊</span> Spending Forecast</div>
                        <div className={styles.engineFeature}><span>🤖</span> AI Recommendations</div>
                        <div className={styles.engineFeature}><span>🔔</span> Smart Alerts</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              className={styles.iconBtn}
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className={styles.notifWrapper}>
              <button
                className={`${styles.iconBtn} ${hasNotifs ? styles.hasNotif : ''}`}
                onClick={handleNotifClick}
                aria-label="Notifications"
                aria-expanded={showNotifPanel}
              >
                <Bell size={18} />
                {hasNotifs && <span className={styles.notifCount}>{notifications.length}</span>}
              </button>

              {showNotifPanel && (
                <div className={styles.notifPanel}>
                  <div className={styles.notifHeader}>
                    <span>Notifications</span>
                    <button className={styles.closeNotif} onClick={() => setShowNotifPanel(false)} aria-label="Close">
                      <X size={14} />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className={styles.noNotif}>All subscriptions are up to date ✓</p>
                  ) : (
                    <ul className={styles.notifList}>
                      {expiringSoon.length > 0 && <li className={styles.notifSection}>EXPIRING SOON</li>}
                      {expiringSoon.map((sub) => (
                        <li key={sub.id} className={styles.notifItem}>
                          <div className={styles.notifContent}>
                            <p className={styles.notifTitle}>{sub.serviceName}</p>
                            <p className={styles.notifSub} style={{ color: 'var(--warning-600)' }}>{expiryLabel(sub.expiryDate)}</p>
                          </div>
                        </li>
                      ))}
                      {recentlyExpired.length > 0 && <li className={styles.notifSection}>RECENTLY EXPIRED</li>}
                      {recentlyExpired.map((sub) => (
                        <li key={sub.id} className={styles.notifItem}>
                          <div className={styles.notifContent}>
                            <p className={styles.notifTitle}>{sub.serviceName}</p>
                            <p className={styles.notifSub} style={{ color: 'var(--danger-600)' }}>{expiryLabel(sub.expiryDate)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className={styles.notifFooter}>
                    <Link to="/dashboard" onClick={() => setShowNotifPanel(false)} className={styles.viewAll}>
                      View all on Dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {action && <div className={styles.pageAction}>{action}</div>}
        </div>
      </div>
    </header>
  );
};

export default HeroHeader;
