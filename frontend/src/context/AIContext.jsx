/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSubscriptions } from './SubscriptionContext';
import { getAiDashboard, getTimeline, sendChatMessage } from '../services/aiService';
import {
  buildConversationSeed,
  buildBudgetPlannerV2,
  buildCoachCardV2,
  buildCostOptimizerCardV2,
  buildDynamicSuggestedPrompts,
  buildDuplicateDetectorV2,
  buildForecastCardV2,
  buildGoalPlannerCardV2,
  buildHealthScoreCardV2,
  buildMonthlyReviewCardV2,
  buildRenewalAdvisorV2,
  detectIntent,
  deriveConversationTitle,
  extractTargetAmount,
  parseAssistantNarrative,
  buildWhatIfSimulatorV2,
  findSubscriptionByPrompt,
  normalizeAssistantText,
  extractTargetAmountSafe,
} from '../utils/aiAssistantUtils';
import { formatCurrency } from '../utils/formatUtils';

export const AIContext = createContext(null);

const STORAGE_KEY = 'sms_ai_conversations_v4';
const ACTIVE_KEY = 'sms_ai_active_conversation_v4';
const PINNED_KEY = 'sms_ai_pinned_conversations_v4';
const FULLSCREEN_KEY = 'sms_ai_fullscreen_v4';
const SEARCH_KEY = 'sms_ai_conversation_search_v4';
const WINDOW_STEP = 24;

const PAGE_LABELS = {
  '/dashboard': 'Dashboard',
  '/subscriptions': 'Subscriptions',
  '/add-subscription': 'Add Subscription',
  '/expired': 'Expired Plans',
  '/history': 'History',
  '/analytics': 'Analytics',
  '/profile': 'Profile',
  '/review-subscriptions': 'Review Subscriptions',
  '/edit-subscription': 'Edit Subscription',
};

const nowIso = () => new Date().toISOString();
const makeId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const normalizeConversation = (conversation = {}) => ({
  id: conversation.id || makeId(),
  title: normalizeAssistantText(conversation.title || 'New chat'),
  createdAt: conversation.createdAt || nowIso(),
  updatedAt: conversation.updatedAt || nowIso(),
  promptSeed: normalizeAssistantText(conversation.promptSeed || ''),
  messages: Array.isArray(conversation.messages)
    ? conversation.messages.map((message) => ({
        ...(message || {}),
        content: normalizeAssistantText(message?.content || ''),
        response: normalizeAssistantText(message?.response || ''),
      }))
    : [],
  pinned: Boolean(conversation.pinned),
  workflow: conversation.workflow || null,
});

const loadJson = (keys, fallback) => {
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed !== null && parsed !== undefined) return parsed;
    } catch {
      // Try the next key.
    }
  }
  return fallback;
};

const persistJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

const buildConversation = (title = 'New chat', prompt = '') => ({
  id: makeId(),
  title,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  promptSeed: prompt ? buildConversationSeed(prompt) : '',
  messages: [],
  pinned: false,
  workflow: null,
});

const buildUserMessage = (content) => ({
  id: makeId(),
  role: 'user',
  content: normalizeAssistantText(content),
  createdAt: nowIso(),
});

const buildAssistantMessage = ({ content, response, action, cards, prompt }) => ({
  id: makeId(),
  role: 'assistant',
  content: normalizeAssistantText(content),
  response: normalizeAssistantText(response),
  action: action || 'NONE',
  cards: cards || [],
  prompt: normalizeAssistantText(prompt),
  createdAt: nowIso(),
  narrative: parseAssistantNarrative(normalizeAssistantText(content)),
});

const getPageLabel = (pathname = '') => {
  if (pathname.startsWith('/edit-subscription/')) return PAGE_LABELS['/edit-subscription'];
  return PAGE_LABELS[pathname] || 'TrackMySubs';
};

const toFilterSummary = (search = '') => {
  const params = new URLSearchParams(search);
  const parts = [];
  params.forEach((value, key) => {
    if (parts.length < 4) {
      parts.push(`${key}=${value}`);
    }
  });
  return parts.length ? parts.join(', ') : 'None';
};

export const AIProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { subscriptions, activeSubscriptions, expiringSoon, history, monthlyTotal, reload } = useSubscriptions();
  const location = useLocation();
  const navigate = useNavigate();
  const abortRef = useRef(null);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantFullscreen, setAssistantFullscreen] = useState(() => loadJson([FULLSCREEN_KEY, 'sms_ai_fullscreen'], false));
  const [conversations, setConversations] = useState(() => loadJson([STORAGE_KEY, 'sms_ai_conversations_v3', 'sms_ai_conversations'], []).map(normalizeConversation));
  const [activeConversationId, setActiveConversationId] = useState(() => loadJson([ACTIVE_KEY, 'sms_ai_active_conversation_v3', 'sms_ai_active_conversation'], ''));
  const [pinnedConversationIds, setPinnedConversationIds] = useState(() => loadJson([PINNED_KEY, 'sms_ai_pinned_conversations'], []));
  const [conversationSearch, setConversationSearch] = useState(() => loadJson([SEARCH_KEY, 'sms_ai_conversation_search'], ''));
  const [visibleCount, setVisibleCount] = useState(WINDOW_STEP);
  const [dashboard, setDashboard] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const openAssistant = useCallback(() => setAssistantOpen(true), []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);
  const toggleAssistant = useCallback(() => setAssistantOpen((open) => !open), []);

  useEffect(() => {
    persistJson(STORAGE_KEY, conversations);
  }, [conversations]);

  useEffect(() => {
    persistJson(ACTIVE_KEY, activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    persistJson(PINNED_KEY, pinnedConversationIds);
  }, [pinnedConversationIds]);

  useEffect(() => {
    persistJson(FULLSCREEN_KEY, assistantFullscreen);
  }, [assistantFullscreen]);

  useEffect(() => {
    persistJson(SEARCH_KEY, conversationSearch);
  }, [conversationSearch]);

  useEffect(() => {
    if (!isAuthenticated) {
      Promise.resolve().then(() => {
        setAssistantOpen(false);
        setAssistantFullscreen(false);
        setDashboard(null);
        setTimeline([]);
        setLoadingSnapshot(false);
        setConversations([]);
        setActiveConversationId('');
        setPinnedConversationIds([]);
        setConversationSearch('');
      });
      return;
    }

    let mounted = true;
    (async () => {
      setLoadingSnapshot(true);
      try {
        const [dashboardData, timelineData] = await Promise.all([
          getAiDashboard().catch(() => null),
          getTimeline().catch(() => []),
        ]);
        if (!mounted) return;
        setDashboard(dashboardData);
        setTimeline(timelineData || []);
      } finally {
        if (mounted) setLoadingSnapshot(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const activeConversation = useMemo(() => {
    if (!conversations.length) return null;
    return conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0];
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!conversations.length) return;
    if (!activeConversationId || !conversations.some((conversation) => conversation.id === activeConversationId)) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  const pageContext = useMemo(() => {
    const selectedSubscriptionId =
      location.pathname.match(/^\/edit-subscription\/([^/]+)/)?.[1] ||
      new URLSearchParams(location.search).get('subscriptionId') ||
      new URLSearchParams(location.search).get('id') ||
      '';
    const topExpense = [...activeSubscriptions].sort((a, b) => Number(b.cost || 0) - Number(a.cost || 0))[0] || null;
    const recentActions = timeline.slice(-3).map((item) => item.message || item.title || item.action).filter(Boolean).join(' | ') || 'None';

    return {
      pageLabel: getPageLabel(location.pathname),
      pathname: location.pathname,
      search: location.search,
      selectedSubscriptionId,
      filterSummary: toFilterSummary(location.search),
      monthlyTotal,
      activeCount: activeSubscriptions.length,
      expiringSoonCount: expiringSoon.length,
      historyCount: history.length,
      topExpense,
      recentActions,
      healthScore: dashboard?.healthScore?.healthScore ?? null,
      forecast: dashboard?.forecast || null,
      topRecommendation: dashboard?.recommendations?.[0] || null,
      copilotSummary: dashboard?.copilotSummary || null,
      insightSummary: dashboard?.insights || null,
    };
  }, [
    activeSubscriptions,
    dashboard,
    expiringSoon.length,
    history.length,
    location.pathname,
    location.search,
    monthlyTotal,
    timeline,
  ]);

  const refreshSnapshot = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingSnapshot(true);
    try {
      const [dashboardData, timelineData] = await Promise.all([
        getAiDashboard().catch(() => null),
        getTimeline().catch(() => []),
      ]);
      setDashboard(dashboardData);
      setTimeline(timelineData || []);
    } finally {
      setLoadingSnapshot(false);
    }
  }, [isAuthenticated]);

  const newConversation = useCallback((prompt = '') => {
    const convo = buildConversation(buildConversationSeed(prompt), prompt);
    setConversations((prev) => [convo, ...prev]);
    setActiveConversationId(convo.id);
    setVisibleCount(WINDOW_STEP);
    return convo.id;
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveConversationId(id);
    setVisibleCount(WINDOW_STEP);
  }, []);

  const clearConversation = useCallback((id) => {
    setConversations((prev) => prev.map((conversation) => (
      conversation.id === id
        ? {
            ...conversation,
            title: 'New chat',
            promptSeed: '',
            messages: [],
            workflow: null,
            updatedAt: nowIso(),
          }
        : conversation
    )));
    setVisibleCount(WINDOW_STEP);
  }, []);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveConversationId('');
    setVisibleCount(WINDOW_STEP);
  }, []);

  const toggleConversationPin = useCallback((id) => {
    setConversations((prev) => prev.map((conversation) => {
      if (conversation.id !== id) return conversation;
      const pinned = !conversation.pinned;
      return { ...conversation, pinned, updatedAt: nowIso() };
    }));
    setPinnedConversationIds((current) => {
      const pinned = current.includes(id);
      if (pinned) return current.filter((item) => item !== id);
      return [id, ...current];
    });
  }, []);

  const exportConversation = useCallback((id = activeConversationId) => {
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation || typeof document === 'undefined') return null;
    const payload = JSON.stringify(conversation, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(conversation.title || 'trackmysubs-ai').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return conversation;
  }, [activeConversationId, conversations]);

  const toggleFullscreen = useCallback(() => {
    setAssistantFullscreen((value) => !value);
  }, []);

  const renameConversation = useCallback((id, title) => {
    const nextTitle = title.trim() || 'New chat';
    setConversations((prev) => prev.map((conversation) => (
      conversation.id === id
        ? { ...conversation, title: nextTitle, updatedAt: nowIso() }
        : conversation
    )));
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations((prev) => {
      const next = prev.filter((conversation) => conversation.id !== id);
      setActiveConversationId((current) => (current === id ? (next[0]?.id || '') : current));
      return next;
    });
  }, []);


  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort?.();
    setSending(false);
    setError('');
    abortRef.current = null;
  }, []);

  const updateConversation = useCallback((id, updater) => {
    setConversations((prev) => prev.map((conversation) => {
      if (conversation.id !== id) return conversation;
      const next = typeof updater === 'function' ? updater(conversation) : { ...conversation, ...updater };
      return { ...next, updatedAt: nowIso() };
    }));
  }, []);

  const getWorkflowStarterCard = useCallback((type) => {
    switch (type) {
      case 'budget_planner':
        return buildBudgetPlannerV2({ subscriptions: activeSubscriptions, targetAmount: 0 });
      case 'cost_optimizer':
        return buildCostOptimizerCardV2({ subscriptions: activeSubscriptions, goal: '' });
      case 'renewal_advisor':
        return buildRenewalAdvisorV2({ subscriptions: activeSubscriptions, mode: '' });
      case 'what_if':
        return buildWhatIfSimulatorV2({ subscriptions: activeSubscriptions, prompt: '' });
      case 'monthly_review':
        return buildMonthlyReviewCardV2({ subscriptions: activeSubscriptions, history });
      case 'health_score':
        return buildHealthScoreCardV2({ subscriptions: activeSubscriptions });
      case 'forecast':
        return buildForecastCardV2({ subscriptions: activeSubscriptions, history });
      case 'duplicate_detector':
        return buildDuplicateDetectorV2({ subscriptions });
      default:
        return buildCoachCardV2({ subscriptions: activeSubscriptions, prompt: '' });
    }
  }, [activeSubscriptions, history, subscriptions]);

  const startWorkflow = useCallback((type) => {
    const workflowType = type || 'assistant_query';
    let conversationId = activeConversation?.id;
    if (!conversationId) {
      conversationId = newConversation('');
    }

    const starterCard = getWorkflowStarterCard(workflowType);
    const assistantMessage = buildAssistantMessage({
      content: starterCard.summary || "Let's continue.",
      response: starterCard.summary || "Let's continue.",
      action: 'NONE',
      cards: [starterCard],
      prompt: workflowType,
    });

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      workflow: { type: workflowType },
      messages: [...conversation.messages, assistantMessage],
    }));

    setActiveConversationId(conversationId);
    setAssistantOpen(true);
    setVisibleCount((count) => Math.max(count, WINDOW_STEP));
    return assistantMessage;
  }, [activeConversation?.id, getWorkflowStarterCard, newConversation, updateConversation]);

  const sendPrompt = useCallback(async (prompt) => {
    const text = normalizeAssistantText(String(prompt || '')).trim();
    if (!text || sending) return null;

    setAssistantOpen(true);
    setSending(true);
    setError('');
    setVisibleCount((count) => Math.max(count, WINDOW_STEP));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let conversationId = activeConversation?.id;
      const isNewConversation = !conversationId;
      if (!conversationId) {
        conversationId = newConversation(text);
      }

      const snapshot = conversations.find((conversation) => conversation.id === conversationId) || activeConversation || null;
      const workflow = snapshot?.workflow || null;
      const currentMessages = snapshot?.messages || [];
      const userMessage = buildUserMessage(text);

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        title: currentMessages.length === 0 ? buildConversationSeed(text) : conversation.title,
        promptSeed: conversation.promptSeed || buildConversationSeed(text),
        messages: [...conversation.messages, userMessage],
      }));

      const normalized = detectIntent(text);
      let assistantCard;
      let nextWorkflow = workflow;

      if (workflow?.type === 'budget_planner' || normalized === 'budget_planner') {
        const amount = extractTargetAmountSafe(text);
        assistantCard = buildBudgetPlannerV2({ subscriptions: activeSubscriptions, targetAmount: amount || 0 });
        nextWorkflow = amount ? null : { type: 'budget_planner' };
      } else if (workflow?.type === 'cost_optimizer' || normalized === 'cost_optimizer' || normalized === 'optimizer') {
        const goalText = text;
        const goalIsSpecific = /reduce spending|annual plans|student discounts|remove unused subscriptions|optimize everything/i.test(goalText);
        assistantCard = buildCostOptimizerCardV2({
          subscriptions: activeSubscriptions,
          goal: goalIsSpecific ? goalText : '',
        });
        nextWorkflow = goalIsSpecific ? null : { type: 'cost_optimizer' };
      } else if (workflow?.type === 'renewal_advisor' || normalized === 'renewal_advisor') {
        const lower = text.toLowerCase();
        const mode = /expensive/.test(lower) ? 'expensive' : /all/.test(lower) ? 'all' : '';
        assistantCard = buildRenewalAdvisorV2({
          subscriptions: activeSubscriptions,
          mode,
        });
        nextWorkflow = mode ? null : { type: 'renewal_advisor' };
      } else if (workflow?.type === 'what_if' || normalized === 'what_if') {
        assistantCard = buildWhatIfSimulatorV2({ subscriptions: activeSubscriptions, prompt: text });
        nextWorkflow = findSubscriptionByPrompt(activeSubscriptions, text) ? null : { type: 'what_if' };
      } else if (normalized === 'health_score') {
        assistantCard = buildHealthScoreCardV2({ subscriptions: activeSubscriptions });
        nextWorkflow = null;
      } else if (normalized === 'monthly_review') {
        assistantCard = buildMonthlyReviewCardV2({ subscriptions: activeSubscriptions, history });
        nextWorkflow = null;
      } else if (normalized === 'forecast') {
        assistantCard = buildForecastCardV2({ subscriptions: activeSubscriptions, history });
        nextWorkflow = null;
      } else if (normalized === 'duplicate_detector') {
        assistantCard = buildDuplicateDetectorV2({ subscriptions });
        nextWorkflow = null;
      } else if (normalized === 'assistant_query' || /how much|what is my|most expensive|yearly|save money|spend|renewal|waste/.test(text.toLowerCase())) {
        assistantCard = buildCoachCardV2({ subscriptions: activeSubscriptions, prompt: text });
        nextWorkflow = null;
      } else {
        assistantCard = buildCoachCardV2({ subscriptions: activeSubscriptions, prompt: text });
        nextWorkflow = null;
      }

      let backendReply = null;
      try {
        backendReply = await sendChatMessage(
          {
            message: text,
            workflowType: workflow?.type || '',
          },
          { signal: controller.signal },
        );
      } catch (backendError) {
        if (backendError?.name !== 'AbortError') {
          console.warn('AI chat fallback:', backendError);
        }
      }

      const responseText = normalizeAssistantText(backendReply?.response) || assistantCard?.summary || assistantCard?.note || 'Here is what I found from your subscriptions.';
      const assistantMessage = buildAssistantMessage({
        content: responseText,
        response: responseText,
        action: backendReply?.action || 'NONE',
        cards: assistantCard ? [assistantCard] : [],
        prompt: text,
      });

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        title: currentMessages.length <= 1 && !isNewConversation ? deriveConversationTitle(text) : conversation.title,
        workflow: nextWorkflow,
        messages: [...conversation.messages, assistantMessage],
      }));

      if (backendReply?.action === 'RELOAD') {
        await reload();
        await refreshSnapshot();
      }

      return assistantMessage;
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  }, [
    activeConversation?.id,
    activeConversation?.messages,
    activeConversation?.workflow,
    activeSubscriptions,
    conversations,
    history,
    newConversation,
    refreshSnapshot,
    reload,
    subscriptions,
    sending,
    updateConversation,
  ]);

  const runAction = useCallback((action) => {
    if (!action) return;
    if (action.kind === 'navigate') {
      navigate(action.value);
      return;
    }
    if (action.kind === 'prompt') {
      sendPrompt(action.value);
    }
  }, [navigate, sendPrompt]);

  const loadMoreMessages = useCallback(() => {
    setVisibleCount((count) => count + WINDOW_STEP);
  }, []);

  const visibleMessages = useMemo(() => {
    const messages = activeConversation?.messages || [];
    if (messages.length <= visibleCount) return messages;
    return messages.slice(messages.length - visibleCount);
  }, [activeConversation, visibleCount]);

  const hasMoreMessages = (activeConversation?.messages?.length || 0) > visibleMessages.length;
  const assistantStatus = loadingSnapshot ? 'Syncing' : 'Connected';
  const assistantTone = loadingSnapshot ? 'warning' : 'success';

  const contextSummary = useMemo(() => [
    `Page: ${pageContext.pageLabel}`,
    `Filters: ${pageContext.filterSummary}`,
    `Selected subscription: ${pageContext.selectedSubscriptionId || 'None'}`,
    `Current month spend: ${formatCurrency(pageContext.monthlyTotal)}`,
    `Active subscriptions: ${pageContext.activeCount}`,
    `Expiring soon: ${pageContext.expiringSoonCount}`,
    `Recent history: ${pageContext.recentActions}`,
  ].join(' | '), [pageContext]);

  const suggestedPrompts = useMemo(() => (
    buildDynamicSuggestedPrompts({
      subscriptions: activeSubscriptions,
      history,
    })
  ), [activeSubscriptions, history]);

  const value = useMemo(() => ({
    enabled: isAuthenticated,
    assistantOpen,
    assistantFullscreen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    toggleFullscreen,
    conversations,
    activeConversation,
    activeConversationId,
    subscriptions,
    activeSubscriptions,
    expiringSoon,
    history,
    conversationSearch,
    setConversationSearch,
    pinnedConversationIds,
    toggleConversationPin,
    visibleMessages,
    hasMoreMessages,
    newConversation,
    clearConversation,
    clearAllConversations,
    selectConversation,
    renameConversation,
    deleteConversation,
    exportConversation,
    startWorkflow,
    sendPrompt,
    cancelGeneration,
    loadMoreMessages,
    refreshSnapshot,
    dashboard,
    timeline,
    loadingSnapshot,
    sending,
    error,
    runAction,
    pageContext,
    assistantStatus,
    assistantTone,
    monthlyTotal,
    contextSummary,
    suggestedPrompts,
  }), [
    activeConversation,
    activeConversationId,
    assistantOpen,
    assistantFullscreen,
    assistantStatus,
    assistantTone,
    cancelGeneration,
    closeAssistant,
    contextSummary,
    conversations,
    clearAllConversations,
    clearConversation,
    dashboard,
    deleteConversation,
    error,
    hasMoreMessages,
    isAuthenticated,
    loadMoreMessages,
    loadingSnapshot,
    monthlyTotal,
    conversationSearch,
    exportConversation,
    newConversation,
    openAssistant,
    pageContext,
    pinnedConversationIds,
    refreshSnapshot,
    renameConversation,
    setConversationSearch,
    startWorkflow,
    runAction,
    selectConversation,
    sendPrompt,
    sending,
    subscriptions,
    activeSubscriptions,
    expiringSoon,
    history,
    timeline,
    toggleAssistant,
    toggleConversationPin,
    toggleFullscreen,
    visibleMessages,
    suggestedPrompts,
  ]);

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};
