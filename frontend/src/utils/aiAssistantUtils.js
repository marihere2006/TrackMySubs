import { formatCurrency } from './formatUtils';
import { AI_ADVISOR_LIBRARY, GOAL_TEMPLATES } from '../data/aiAssistantData';

const MONEY_REGEX = /(?:rs\.?\s*|inr\s*|\$\s*|â‚¹\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)/i;

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const compact = (value = '') => normalize(value).replace(/\s+/g, '');

const nowIso = () => new Date().toISOString();

export const extractTargetAmount = (prompt = '') => {
  const match = prompt.match(MONEY_REGEX);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : null;
};

export const extractServiceQuery = (prompt = '') => {
  const normalized = normalize(prompt);
  const keywords = ['cancel', 'what if', 'open', 'renew', 'compare', 'about', 'on'];
  let candidate = normalized;
  keywords.forEach((word) => {
    candidate = candidate.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
  });
  return candidate.replace(/\b(my|the|a|an|this|that|if|i|should|can|could|would|what|happen|happens|to|from|for|of|on|in|next|month|year|week|and|or|please|help|me|with|spend|budget|save|money|show|find|which|subscription|subscriptions|service|services|cost|costs|remove|cancel|reduce|optimize|plan|goal)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const detectIntent = (prompt = '') => {
  const text = normalize(prompt);
  if (!text) return 'generic_chat';

  if (/(budget|spend below|spend under|only want to spend|monthly budget|limit of|cap of)/.test(text)) return 'budget_planner';
  if (/what if .*cancel|if i cancel|cancel [a-z0-9]|remove [a-z0-9]/.test(text)) return 'what_if';
  if (/(renewal|renews next|what renews|upcoming renewals|renew now|pause|delay|cancel next)/.test(text)) return 'renewal_advisor';
  if (/(health score|subscription health|how healthy|improve it)/.test(text)) return 'health_score';
  if (/(monthly review|this month|monthly summary|report this month|review my subscriptions)/.test(text)) return 'monthly_review';
  if (/(forecast|predict|next month|next quarter|next year|spending forecast)/.test(text)) return 'forecast';
  if (/(duplicate|overlap|redundant|duplicate services|find duplicate)/.test(text)) return 'duplicate_detector';
  if (/(plan my|recommend .*subscriptions|suggest subscriptions|learn|study|design|productivity|budget planner)/.test(text)) return 'assistant_query';
  if (/(cost optimizer|optimize subscriptions|optimize my subscriptions|downgrade|cheaper alternative|annual plan|annual plans|unused plan|unused plans)/.test(text)) return 'cost_optimizer';
  if (/(optimize|save money|reduce spending|cut costs)/.test(text)) return 'optimizer';
  if (/(how much|what is my|show all|which category|most expensive|renews next week)/.test(text)) return 'assistant_query';
  return 'generic_chat';
};

const sumCost = (subscriptions = []) =>
  subscriptions.reduce((sum, sub) => sum + Number(sub.cost || 0), 0);

const sortByExpiryAsc = (subscriptions = []) =>
  [...subscriptions].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

const keyMatches = (subscription, text) => {
  const source = normalize(`${subscription.serviceName || ''} ${subscription.planName || ''} ${subscription.category || ''}`);
  return text.split(' ').filter(Boolean).every((term) => source.includes(term));
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'your', 'this', 'that', 'what', 'which', 'where', 'when', 'how', 'why',
  'my', 'me', 'i', 'to', 'of', 'a', 'an', 'on', 'in', 'at', 'by', 'it', 'be', 'is', 'are', 'or', 'as', 'about',
  'show', 'find', 'compare', 'review', 'check', 'help', 'please', 'can', 'could', 'would', 'should', 'tell', 'me',
]);

const FAMILY_RULES = [
  { family: 'streaming', label: 'Streaming', keywords: [/netflix|prime video|prime|hotstar|disney|hulu|stream|video/], category: /entertain|video|stream/ },
  { family: 'music', label: 'Music', keywords: [/spotify|apple music|youtube music|music/], category: /music|audio/ },
  { family: 'cloud', label: 'Cloud Storage', keywords: [/dropbox|google drive|google one|icloud|drive|storage|one drive|onedrive|mega/], category: /cloud|storage|backup/ },
  { family: 'ai', label: 'AI', keywords: [/chatgpt|claude|gemini|copilot|perplexity|cursor|openai|anthropic|mistral/], category: /ai|assistant|model/ },
  { family: 'gaming', label: 'Gaming', keywords: [/steam|xbox|playstation|nintendo|game pass|gaming/], category: /game|gaming/ },
  { family: 'education', label: 'Education', keywords: [/coursera|udemy|skillshare|udacity|masterclass|linkedin learning|learning/], category: /education|course|learning/ },
  { family: 'productivity', label: 'Productivity', keywords: [/notion|todoist|slack|microsoft 365|office|workspace|asana|trello|clickup/], category: /productivity|work|office|collaboration/ },
  { family: 'design', label: 'Design', keywords: [/figma|canva|adobe|sketch|framer|illustrator|photoshop/], category: /design|creative|graphics/ },
  { family: 'finance', label: 'Finance', keywords: [/yNAB|monarch|copilot money|rocket money|finance|budget/], category: /finance|money|budget/ },
  { family: 'security', label: 'Security', keywords: [/1password|dashlane|lastpass|bitwarden|security|vpn/], category: /security|vpn|password/ },
];

const extractTokens = (value = '') =>
  normalize(value)
    .split(' ')
    .filter((token) => token && !STOP_WORDS.has(token) && token.length > 1);

const getBillingFactor = (billingCycle = '') => {
  const text = normalize(billingCycle);
  if (/annual|year/.test(text)) return 1 / 12;
  if (/quarter/.test(text)) return 1 / 3;
  if (/week/.test(text)) return 52 / 12;
  if (/day/.test(text)) return 365 / 12;
  return 1;
};

export const getMonthlyEquivalentCost = (subscription = {}) => {
  const raw = Number(subscription.cost || 0);
  const factor = getBillingFactor(subscription.billingCycle);
  return Number.isFinite(raw) ? raw * factor : 0;
};

export const getAnnualEquivalentCost = (subscription = {}) => getMonthlyEquivalentCost(subscription) * 12;

export const getNormalizedMonthlyTotal = (subscriptions = []) =>
  subscriptions.reduce((sum, sub) => sum + getMonthlyEquivalentCost(sub), 0);

export const getTopExpense = (subscriptions = []) =>
  [...subscriptions]
    .map((subscription) => ({ ...subscription, monthlyEquivalentCost: getMonthlyEquivalentCost(subscription) }))
    .sort((a, b) => b.monthlyEquivalentCost - a.monthlyEquivalentCost)[0] || null;

export const getUpcomingRenewals = (subscriptions = [], daysWindow = 30) => {
  const limit = Number(daysWindow || 30);
  return [...subscriptions]
    .map((subscription) => {
      const expiry = new Date(subscription.expiryDate);
      return {
        ...subscription,
        monthlyEquivalentCost: getMonthlyEquivalentCost(subscription),
        daysUntilExpiry: Math.round((expiry.getTime() - Date.now()) / 86400000),
      };
    })
    .filter((subscription) => Number.isFinite(subscription.daysUntilExpiry) && subscription.daysUntilExpiry <= limit)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry || b.monthlyEquivalentCost - a.monthlyEquivalentCost);
};

export const classifySubscriptionFamily = (subscription = {}) => {
  const text = normalize(`${subscription.serviceName || ''} ${subscription.planName || ''} ${subscription.category || ''}`);
  const match = FAMILY_RULES.find((rule) => rule.keywords.some((keyword) => keyword.test(text)) || (rule.category && rule.category.test(text)));
  return match || { family: 'other', label: 'Other' };
};

export const getSubscriptionOverlapScore = (a = {}, b = {}) => {
  const familyA = classifySubscriptionFamily(a);
  const familyB = classifySubscriptionFamily(b);
  const tokensA = extractTokens(`${a.serviceName || ''} ${a.planName || ''} ${a.category || ''}`);
  const tokensB = extractTokens(`${b.serviceName || ''} ${b.planName || ''} ${b.category || ''}`);
  const sharedTokens = tokensA.filter((token) => tokensB.includes(token));
  const union = new Set([...tokensA, ...tokensB]).size || 1;
  const tokenOverlap = (sharedTokens.length / union) * 100;
  const sameFamily = familyA.family !== 'other' && familyA.family === familyB.family;
  const sameCategory = normalize(a.category) && normalize(a.category) === normalize(b.category);
  const serviceNameA = compact(a.serviceName);
  const serviceNameB = compact(b.serviceName);
  const serviceNameMatch = Boolean(serviceNameA && serviceNameB && serviceNameA === serviceNameB);
  const compactContainsMatch = Boolean(serviceNameA && serviceNameB && (serviceNameA.includes(serviceNameB) || serviceNameB.includes(serviceNameA)));
  const brandA = tokensA[0] || normalize(a.serviceName).split(' ')[0] || '';
  const brandB = tokensB[0] || normalize(b.serviceName).split(' ')[0] || '';
  const brandMatch = Boolean(brandA && brandB && brandA === brandB);
  const containsMatch = Boolean(normalize(a.serviceName) && normalize(b.serviceName) && (
    normalize(a.serviceName).includes(normalize(b.serviceName)) ||
    normalize(b.serviceName).includes(normalize(a.serviceName))
  ));

  let similarity = tokenOverlap * 0.35;
  if (compactContainsMatch) similarity += 28;
  if (sameFamily) similarity += sharedTokens.length >= 1 ? 24 : 12;
  if (sameCategory) similarity += 10;
  if (brandMatch) similarity += 8;
  if (sharedTokens.length >= 2) similarity += 18;
  else if (sharedTokens.length === 1) similarity += 6;
  if (containsMatch) similarity += 10;
  if (serviceNameMatch) similarity += 20;
  similarity = Math.min(100, Math.round(similarity));

  return {
    similarity,
    sameFamily,
    sameCategory,
    familyLabel: sameFamily ? familyA.label : 'Other',
    sharedTokens,
    brandMatch,
    containsMatch,
    compactContainsMatch,
    serviceNameMatch,
  };
};

export const findDuplicatePairs = (subscriptions = []) => {
  const pairs = [];
  for (let i = 0; i < subscriptions.length; i += 1) {
    for (let j = i + 1; j < subscriptions.length; j += 1) {
      const a = subscriptions[i];
      const b = subscriptions[j];
      const score = getSubscriptionOverlapScore(a, b);
      const exactMatch = compact(a.serviceName) === compact(b.serviceName);
      const strongNameMatch = score.compactContainsMatch || score.serviceNameMatch || score.containsMatch;
      const strongTokenMatch = score.sharedTokens.length >= 2 && score.sameFamily;
      const isStrongOverlap = exactMatch || strongNameMatch || strongTokenMatch || score.similarity >= 72;
      if (!isStrongOverlap) continue;
      const lowerCost = Math.min(getMonthlyEquivalentCost(a), getMonthlyEquivalentCost(b));
      const estimatedWaste = score.similarity >= 90
        ? lowerCost
        : score.similarity >= 80
          ? lowerCost * 0.75
          : lowerCost * 0.5;
      pairs.push({
        items: [a, b],
        similarity: score.similarity,
        familyLabel: score.familyLabel,
        estimatedWaste,
        confidence: score.similarity >= 90 ? 'High' : score.similarity >= 80 ? 'Medium' : 'Review',
        exactMatch,
      });
    }
  }

  return pairs.sort((a, b) => b.similarity - a.similarity).slice(0, 6);
};

export const buildDynamicSuggestedPrompts = ({ subscriptions = [], goals = [], history = [] } = {}) => {
  const prompts = [];
  const topExpense = getTopExpense(subscriptions);
  const renewals = getUpcomingRenewals(subscriptions, 14);
  const duplicates = findDuplicatePairs(subscriptions);
  const recentHistory = history[0]?.serviceName || '';

  if (topExpense) {
    prompts.push(`Your ${topExpense.serviceName} subscription costs the most. Review it.`);
  }
  if (renewals[0]) {
    prompts.push(`${renewals[0].serviceName} renews in ${Math.max(renewals[0].daysUntilExpiry, 0)} days. What should I do?`);
  }
  if (duplicates[0]) {
    prompts.push(`You have ${duplicates.length} possible overlaps. Check them.`);
  }
  if (recentHistory) {
    prompts.push(`Show spending impact for ${recentHistory}.`);
  }
  const monthlyTotal = getNormalizedMonthlyTotal(subscriptions);
  if (monthlyTotal > 0) {
    prompts.push('How much do I spend yearly?');
  }
  if (!prompts.length) {
    prompts.push('What should I do with my subscriptions?');
  }

  return [...new Set(prompts)].slice(0, 6);
};

export const buildGoalTemplates = ({ subscriptions = [] } = {}) => {
  const topExpense = getTopExpense(subscriptions);
  const renewals = getUpcomingRenewals(subscriptions, 7);
  const duplicates = findDuplicatePairs(subscriptions);
  const current = getNormalizedMonthlyTotal(subscriptions);
  const templates = [];

  if (current > 0) {
    templates.push(`Keep spending below ${formatCurrency(Math.round(current * 0.9))}/month`);
    templates.push(`Save ${formatCurrency(Math.round(current * 0.15))} every month`);
  }
  if (topExpense) {
    templates.push(`Review ${topExpense.serviceName} spending`);
  }
  if (renewals[0]) {
    templates.push(`Decide on ${renewals[0].serviceName} before it renews`);
  }
  if (duplicates[0]) {
    templates.push(`Remove overlapping subscriptions`);
  }
  if (!templates.length) {
    templates.push('Track subscriptions more closely');
  }

  return [...new Set(templates)].slice(0, 5);
};

export const calculateHealthScore = ({ subscriptions = [] } = {}) => {
  const monthlyTotal = getNormalizedMonthlyTotal(subscriptions);
  const upcomingRenewals = getUpcomingRenewals(subscriptions, 30);
  const urgentRenewals = upcomingRenewals.filter((sub) => sub.daysUntilExpiry <= 7);
  const duplicatePairs = findDuplicatePairs(subscriptions);
  const duplicateWaste = duplicatePairs.reduce((sum, pair) => sum + pair.estimatedWaste, 0);
  const lowUsageExpensive = subscriptions.filter((sub) => {
    const monthlyCost = getMonthlyEquivalentCost(sub);
    const usage = normalize(sub.usageFrequency);
    return monthlyCost >= (monthlyTotal / Math.max(subscriptions.length || 1, 1)) && /rare|never|low/.test(usage);
  });
  const expensiveAutoRenew = subscriptions.filter((sub) => getMonthlyEquivalentCost(sub) >= (monthlyTotal / Math.max(subscriptions.length || 1, 1)) && sub.autoRenewal);

  const renewalManagement = Math.max(0, 100 - (urgentRenewals.length * 14) - (upcomingRenewals.filter((sub) => !sub.autoRenewal).length * 6));
  const unusedExpensive = Math.max(0, 100 - (lowUsageExpensive.length * 20));
  const duplicateServices = monthlyTotal > 0 ? Math.max(0, 100 - Math.round((duplicateWaste / monthlyTotal) * 120)) : 100;
  const autoRenewOptimization = Math.max(0, 100 - (expensiveAutoRenew.length * 12) + (subscriptions.filter((sub) => sub.autoRenewal).length * 2));

  const components = {
    renewalManagement: Math.min(100, renewalManagement),
    unusedExpensive: Math.min(100, unusedExpensive),
    duplicateServices: Math.min(100, duplicateServices),
    autoRenewOptimization: Math.min(100, autoRenewOptimization),
  };

  const weightedEntries = [
    { key: 'renewalManagement', weight: 40, value: components.renewalManagement },
    { key: 'unusedExpensive', weight: 20, value: components.unusedExpensive },
    { key: 'duplicateServices', weight: 20, value: components.duplicateServices },
    { key: 'autoRenewOptimization', weight: 10, value: components.autoRenewOptimization },
  ].filter(Boolean);

  const totalWeight = weightedEntries.reduce((sum, entry) => sum + entry.weight, 0) || 1;
  const score = Math.round(weightedEntries.reduce((sum, entry) => sum + (entry.value * entry.weight), 0) / totalWeight);

  const breakdown = [
    {
      key: 'renewalManagement',
      label: 'Renewal management',
      value: components.renewalManagement,
      reason: urgentRenewals.length
        ? `${urgentRenewals.length} renewal${urgentRenewals.length === 1 ? '' : 's'} need attention within 7 days.`
        : 'Renewals are under control.',
    },
    {
      key: 'unusedExpensive',
      label: 'Unused expensive subscriptions',
      value: components.unusedExpensive,
      reason: lowUsageExpensive.length
        ? `${lowUsageExpensive.length} high-cost subscription${lowUsageExpensive.length === 1 ? '' : 's'} appear underused.`
        : 'No obvious expensive unused plans were found.',
    },
    {
      key: 'duplicateServices',
      label: 'Duplicate services',
      value: components.duplicateServices,
      reason: duplicatePairs.length
        ? `${duplicatePairs.length} possible overlap${duplicatePairs.length === 1 ? '' : 's'} were detected.`
        : 'No clear duplicate services were detected.',
    },
    {
      key: 'autoRenewOptimization',
      label: 'Auto-renew optimization',
      value: components.autoRenewOptimization,
      reason: expensiveAutoRenew.length
        ? `${expensiveAutoRenew.length} expensive plan${expensiveAutoRenew.length === 1 ? '' : 's'} auto-renew automatically.`
        : 'Auto-renew settings look balanced.',
    },
  ];

  const weakAreas = [...breakdown]
    .filter((item) => item.value < 75)
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  const recommendations = [];
  if (urgentRenewals.length) {
    recommendations.push(`Review ${urgentRenewals[0].serviceName} before it renews in ${Math.max(urgentRenewals[0].daysUntilExpiry, 0)} days.`);
  }
  if (lowUsageExpensive[0]) {
    recommendations.push(`Check whether ${lowUsageExpensive[0].serviceName} still needs to stay active.`);
  }
  if (duplicatePairs[0]) {
    const [a, b] = duplicatePairs[0].items;
    recommendations.push(`Compare ${a.serviceName} and ${b.serviceName} because they overlap.`);
  }
  if (!recommendations.length) {
    recommendations.push('Your subscription setup looks balanced. Keep reviewing renewals and usage.');
  }

  return {
    score,
    components,
    breakdown,
    weakAreas,
    recommendations,
    duplicatePairs,
    upcomingRenewals,
    monthlyTotal,
  };
};

export const findSubscriptionByPrompt = (subscriptions = [], prompt = '') => {
  const query = extractServiceQuery(prompt);
  if (!query) return null;

  const exact = subscriptions.find((sub) => normalize(sub.serviceName) === query);
  if (exact) return exact;

  const contains = subscriptions.find((sub) => normalize(sub.serviceName).includes(query) || query.includes(normalize(sub.serviceName)));
  if (contains) return contains;

  const keywordMatch = subscriptions.find((sub) => keyMatches(sub, query));
  return keywordMatch || null;
};

export const findDuplicateGroups = (subscriptions = []) => {
  const pairs = findDuplicatePairs(subscriptions);
  if (!pairs.length) return [];

  const indexBySubscription = new Map(subscriptions.map((subscription, index) => [subscription, index]));
  const parent = subscriptions.map((_, index) => index);

  const find = (index) => {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  };

  const union = (left, right) => {
    const rootLeft = find(left);
    const rootRight = find(right);
    if (rootLeft !== rootRight) {
      parent[rootRight] = rootLeft;
    }
  };

  pairs.forEach((pair) => {
    const [first, second] = pair.items;
    const firstIndex = indexBySubscription.get(first);
    const secondIndex = indexBySubscription.get(second);
    if (firstIndex != null && secondIndex != null) {
      union(firstIndex, secondIndex);
    }
  });

  const grouped = new Map();
  subscriptions.forEach((subscription, index) => {
    const root = find(index);
    if (!grouped.has(root)) grouped.set(root, []);
    grouped.get(root).push(subscription);
  });

  return [...grouped.values()]
    .filter((items) => items.length > 1)
    .map((items) => ({
      label: items.map((item) => item.serviceName).join(' + '),
      items,
    }))
    .slice(0, 5);
};

const topRemovalsForTarget = (subscriptions, targetAmount) => {
  const sorted = [...subscriptions]
    .map((sub) => ({ ...sub, monthlyEquivalentCost: getMonthlyEquivalentCost(sub) }))
    .sort((a, b) => b.monthlyEquivalentCost - a.monthlyEquivalentCost);
  const chosen = [];
  let current = getNormalizedMonthlyTotal(sorted);

  for (const sub of sorted) {
    if (current <= targetAmount) break;
    chosen.push(sub);
    current -= Number(sub.monthlyEquivalentCost || 0);
  }

  return { chosen, newTotal: current };
};

export const buildBudgetPlanner = ({ subscriptions = [], targetAmount }) => {
  const current = sumCost(subscriptions);
  const target = Number(targetAmount || 0);
  const { chosen, newTotal } = topRemovalsForTarget(subscriptions, target);
  const savings = Math.max(current - newTotal, 0);

  return {
    type: 'budget',
    title: 'Budget Planner',
    badge: 'Budget',
    summary: target
      ? `Your current spend is ${formatCurrency(current)} per month. To stay under ${formatCurrency(target)}, you need to free up ${formatCurrency(savings)}.`
      : `Your current spend is ${formatCurrency(current)} per month. Set a target budget and I will calculate the savings plan.`,
    metrics: [
      { label: 'Current Cost', value: formatCurrency(current), tone: 'neutral' },
      { label: 'Target Cost', value: formatCurrency(target), tone: 'accent' },
      { label: 'Potential Savings', value: formatCurrency(savings), tone: 'success' },
      { label: 'Estimated New Total', value: formatCurrency(newTotal), tone: 'info' },
    ],
    listTitle: 'Subscriptions to remove',
    items: chosen.map((sub) => ({
      title: sub.serviceName,
      subtitle: `${sub.category || 'Other'} Â· ${formatCurrency(sub.cost)}`,
    })),
    note: chosen.length
      ? 'These are the fastest cuts to reach your budget target.'
      : 'You are already within the budget target.',
    actions: [
      { label: 'Open Subscriptions', kind: 'navigate', value: '/subscriptions' },
      { label: 'Compare Plans', kind: 'prompt', value: 'Compare cheaper plan options for my highest-cost subscriptions.' },
    ],
  };
};

export const buildWhatIfSimulator = ({ subscriptions = [], prompt = '' }) => {
  const target = findSubscriptionByPrompt(subscriptions, prompt);
  const current = sumCost(subscriptions);
  if (!target) {
    return {
      type: 'what_if',
      title: 'What-if Simulator',
      badge: 'Scenario',
      summary: 'I could not identify the subscription you want to cancel. Try using the exact service name.',
      metrics: [],
      items: [],
      note: 'Example: What if I cancel Netflix?',
      actions: [
        { label: 'Show subscriptions', kind: 'navigate', value: '/subscriptions' },
        { label: 'Find duplicates', kind: 'prompt', value: 'Find duplicate services in my subscriptions.' },
      ],
    };
  }

  const monthlySavings = Number(target.cost || 0);
  const yearlySavings = monthlySavings * 12;
  const remaining = Math.max(current - monthlySavings, 0);

  return {
    type: 'what_if',
    title: `What if I cancel ${target.serviceName}?`,
    badge: 'Scenario',
    summary: `Cancelling ${target.serviceName} would reduce your monthly spend to ${formatCurrency(remaining)}.`,
    metrics: [
      { label: 'Monthly Savings', value: formatCurrency(monthlySavings), tone: 'success' },
      { label: 'Yearly Savings', value: formatCurrency(yearlySavings), tone: 'success' },
      { label: 'Budget Impact', value: `${Math.round((monthlySavings / Math.max(current, 1)) * 100)}%`, tone: 'warning' },
      { label: 'Subscriptions Remaining', value: String(Math.max(subscriptions.length - 1, 0)), tone: 'neutral' },
    ],
    items: [
      { title: 'Remaining spend', subtitle: formatCurrency(remaining) },
      { title: 'Category', subtitle: target.category || 'Other' },
    ],
    note: 'You can also compare alternative plans before you cancel.',
    actions: [
      { label: 'Open Subscription', kind: 'navigate', value: '/subscriptions' },
      { label: 'Compare Plans', kind: 'prompt', value: `Compare cheaper plans for ${target.serviceName}.` },
      { label: 'Set Reminder', kind: 'prompt', value: `Set a renewal reminder for ${target.serviceName}.` },
    ],
  };
};

export const buildRenewalAdvisor = ({ subscriptions = [] }) => {
  const upcoming = sortByExpiryAsc(subscriptions).slice(0, 6);
  const rows = upcoming.map((sub) => {
    const days = Math.round((new Date(sub.expiryDate).getTime() - Date.now()) / 86400000);
    const action = sub.autoRenewal ? 'Renew' : days <= 7 ? 'Cancel' : 'Delay';
    const reason = sub.autoRenewal
      ? 'Auto-renewal is on, so this will continue unless you intervene.'
      : days <= 7
        ? 'This is close to expiry and auto-renewal is off.'
        : 'You have enough time to review the plan before renewal.';
    return {
      title: sub.serviceName,
      subtitle: `${days <= 0 ? 'Expires now' : `${days} day${days === 1 ? '' : 's'} left`} Â· ${formatCurrency(sub.cost)}`,
      action,
      reason,
      target: sub.serviceName,
    };
  });

  return {
    type: 'renewal',
    title: 'Renewal Advisor',
    badge: 'Renewals',
    summary: upcoming.length
      ? `I found ${upcoming.length} upcoming renewals that deserve attention.`
      : 'No upcoming renewals require immediate attention.',
    metrics: [
      { label: 'Upcoming', value: String(upcoming.length), tone: 'neutral' },
      { label: 'Auto-renew on', value: String(subscriptions.filter((sub) => sub.autoRenewal).length), tone: 'success' },
      { label: 'Manual renewals', value: String(subscriptions.filter((sub) => !sub.autoRenewal).length), tone: 'warning' },
      { label: 'Alerts', value: String(upcoming.filter((sub) => !sub.autoRenewal).length), tone: 'danger' },
    ],
    listTitle: 'Renewal actions',
    items: rows,
    note: 'Focus first on high-cost services with auto-renewal disabled.',
    actions: [
      { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
      { label: 'Show expiring plans', kind: 'prompt', value: 'Show me what renews next week.' },
    ],
  };
};

export const buildDuplicateDetector = ({ subscriptions = [] }) => {
  const groups = findDuplicateGroups(subscriptions);
  const duplicateCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  return {
    type: 'duplicate',
    title: 'Duplicate Service Detector',
    badge: 'Duplicates',
    summary: duplicateCount
      ? `I found ${groups.length} possible overlap group${groups.length === 1 ? '' : 's'} that may be wasting money.`
      : 'No obvious duplicate services were detected.',
    metrics: [
      { label: 'Overlap groups', value: String(groups.length), tone: 'warning' },
      { label: 'Potential duplicates', value: String(duplicateCount), tone: 'danger' },
      { label: 'Likely savings', value: groups.length ? 'Review needed' : 'None detected', tone: 'success' },
      { label: 'Risk level', value: groups.length ? 'Medium' : 'Low', tone: 'neutral' },
    ],
    items: groups.map((group) => ({
      title: group.label,
      subtitle: group.items.map((item) => item.serviceName).join(' + '),
      reason: 'These subscriptions look functionally similar and should be reviewed together.',
    })),
    note: 'Overlap does not always mean waste, but it often reveals consolidation opportunities.',
    actions: [
      { label: 'Review subscriptions', kind: 'navigate', value: '/subscriptions' },
      { label: 'Ask for savings plan', kind: 'prompt', value: 'How can I save money by removing duplicates?' },
    ],
  };
};

export const buildCostOptimizerCard = ({ subscriptions = [] }) => {
  const duplicates = findDuplicateGroups(subscriptions);
  const premiumCandidates = subscriptions.filter((sub) => /premium|pro|plus|ultimate|max|elite/i.test(`${sub.planName || ''} ${sub.serviceName || ''}`));
  const monthlyPlans = subscriptions.filter((sub) => /month/i.test(`${sub.billingCycle || ''}`) || !sub.billingCycle);
  const topExpense = getTopExpense(subscriptions);

  const items = [];
  if (topExpense) {
    items.push({
      title: topExpense.serviceName,
      subtitle: `${topExpense.category || 'Other'} · ${formatCurrency(topExpense.monthlyEquivalentCost)}`,
      reason: 'This is the most expensive recurring service in your current data.',
    });
  }

  if (premiumCandidates[0]) {
    const current = premiumCandidates[0];
    items.push({
      title: `${current.serviceName} Premium`,
      subtitle: 'Try Standard or Basic · Save about Rs 150/month',
      reason: 'High-tier plan detected. Check whether the lower tier covers your actual usage.',
    });
  }

  if (duplicates[0]) {
    items.push({
      title: duplicates[0].label,
      subtitle: duplicates[0].items.map((item) => item.serviceName).join(' + '),
      reason: 'These services appear overlapping. Consolidating can lower your monthly spend.',
    });
  }

  const underused = monthlyPlans.filter((sub) => !sub.autoRenewal).slice(0, 2);
  underused.forEach((sub) => {
    items.push({
      title: sub.serviceName,
      subtitle: 'Review usage and pause if this is not needed',
      reason: 'Manual renewals are often the easiest place to remove waste.',
    });
  });

  return {
    type: 'optimizer',
    title: 'Cost Optimizer',
    badge: 'Optimizer',
    summary: 'I reviewed your current subscriptions for downgrade, consolidation, and annual-plan opportunities.',
    metrics: [
      { label: 'Active subs', value: String(subscriptions.length), tone: 'info' },
      { label: 'Premium plans', value: String(premiumCandidates.length), tone: 'warning' },
      { label: 'Overlap groups', value: String(duplicates.length), tone: 'danger' },
      { label: 'Monthly plans', value: String(monthlyPlans.length), tone: 'neutral' },
    ],
    items: items.slice(0, 5),
    note: 'These are high-confidence savings ideas. I can refine them once you ask about a specific service.',
    actions: [
      { label: 'Compare plans', kind: 'prompt', value: 'Compare cheaper plans for my most expensive subscriptions.' },
      { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
      { label: 'Create savings goal', kind: 'prompt', value: 'Save Rs 500 every month' },
    ],
  };
};
export const buildGoalPlannerCard = ({ goals = [], subscriptions = [] }) => {
  const activeCount = subscriptions.length;

  return {
    type: 'goals',
    title: 'Budget Planning',
    badge: 'Budget',
    summary: goals.length
      ? `You already have ${goals.length} goal${goals.length === 1 ? '' : 's'} being tracked. Add another or refine one of these templates.`
      : 'Create a goal and I will help you stay on track.',
    metrics: [
      { label: 'Tracked goals', value: String(goals.length), tone: 'success' },
      { label: 'Active subs', value: String(activeCount), tone: 'info' },
      { label: 'Templates', value: String(GOAL_TEMPLATES.length), tone: 'neutral' },
      { label: 'Focus', value: 'Budget control', tone: 'warning' },
    ],
    items: GOAL_TEMPLATES.map((goal) => ({
      title: goal,
      subtitle: 'Tap to create this goal',
    })),
    note: 'Smart goals keep the assistant proactive instead of reactive.',
    actions: [
      { label: 'Create goal', kind: 'prompt', value: 'Spend below Rs 3000/month' },
      { label: 'Optimize spending', kind: 'prompt', value: 'Help me optimize my monthly spending.' },
    ],
  };
};

export const buildSubscriptionAdvisor = ({ subscriptions = [], prompt = '' }) => {
  const text = normalize(prompt);
  let topic = Object.keys(AI_ADVISOR_LIBRARY).find((key) => text.includes(key));

  if (!topic) {
    if (/(learn|study|design|ui|frontend)/.test(text)) topic = 'ui design';
    else if (/(productivity|work|organize)/.test(text)) topic = 'productivity';
    else if (/(editing|video|creator)/.test(text)) topic = 'video editing';
  }

  const library = AI_ADVISOR_LIBRARY[topic || 'productivity'];
  const services = library?.services || [];
  const estimatedMonthly = services.length ? 0 : 0;

  return {
    type: 'advisor',
    title: `${library.label} Subscription Guide`,
    badge: 'Guide',
    summary: `Based on your goal, these services give you a focused stack for ${library.label.toLowerCase()}.`,
    metrics: [
      { label: 'Suggested services', value: String(services.length), tone: 'neutral' },
      { label: 'Estimated monthly cost', value: estimatedMonthly ? formatCurrency(estimatedMonthly) : 'Varies', tone: 'info' },
      { label: 'Focus', value: library.label, tone: 'success' },
      { label: 'Current match', value: subscriptions.length ? 'Personalized' : 'Curated', tone: 'warning' },
    ],
    items: services.map((service) => ({
      title: service.name,
      subtitle: service.note,
    })),
    note: 'I will tailor the recommendation further when you mention a specific goal or budget.',
    actions: [
      { label: 'Create learning goal', kind: 'prompt', value: `Learn ${library.label}` },
      { label: 'Refine recommendation', kind: 'prompt', value: `Refine this subscription stack for ${library.label}.` },
    ],
  };
};

export const buildHealthScoreCard = ({ dashboard, subscriptions = [] }) => {
  const score = dashboard?.healthScore?.healthScore;
  const reason = dashboard?.healthScore?.reason;
  const fallbackScore = Math.max(45, 100 - subscriptions.filter((sub) => !sub.autoRenewal).length * 2);
  const currentScore = Number.isFinite(score) ? score : fallbackScore;
  const duplicates = findDuplicateGroups(subscriptions);

  return {
    type: 'health',
    title: 'Subscription Health Score',
    badge: 'Health',
    summary: reason || 'Your subscription portfolio looks manageable.',
    metrics: [
      { label: 'Overall Score', value: `${currentScore} / 100`, tone: currentScore >= 80 ? 'success' : currentScore >= 60 ? 'warning' : 'danger' },
      { label: 'Duplicate risk', value: String(duplicates.length), tone: duplicates.length ? 'warning' : 'success' },
      { label: 'Auto-renew off', value: String(subscriptions.filter((sub) => !sub.autoRenewal).length), tone: 'neutral' },
      { label: 'Active subs', value: String(subscriptions.length), tone: 'info' },
    ],
    items: (dashboard?.healthScore?.breakdown || []).map((item) => ({
      title: item.description,
      subtitle: item.points,
    })),
    note: currentScore >= 80
      ? 'You are in good shape. Keep reviewing renewals to maintain momentum.'
      : 'A few targeted cuts can improve your score quickly.',
    actions: [
      { label: 'Improve score', kind: 'prompt', value: 'How can I improve my subscription health score?' },
      { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
    ],
  };
};

export const buildForecastCard = ({ dashboard, subscriptions = [] }) => {
  const forecast = dashboard?.forecast;
  const monthly = sumCost(subscriptions);
  const nextMonth = Number(forecast?.nextMonth ?? monthly);
  const next3Months = Number(forecast?.next3Months ?? monthly * 3);
  const nextYear = Number(forecast?.nextYear ?? monthly * 12);
  const confidence = Number(forecast?.confidence ?? 72);

  return {
    type: 'forecast',
    title: 'Spending Forecast',
    badge: 'Forecast',
    summary: `Projected spend is ${formatCurrency(nextMonth)} next month and ${formatCurrency(nextYear)} over the next year.`,
    metrics: [
      { label: 'Next Month', value: formatCurrency(nextMonth), tone: 'accent' },
      { label: 'Next Quarter', value: formatCurrency(next3Months), tone: 'info' },
      { label: 'Next Year', value: formatCurrency(nextYear), tone: 'warning' },
      { label: 'Confidence', value: `${confidence}%`, tone: confidence >= 80 ? 'success' : 'warning' },
    ],
    items: (forecast?.reasons || []).map((reason) => ({
      title: reason,
      subtitle: 'Forecast driver',
    })),
    note: 'Forecasts are based on your current subscriptions and renewal patterns.',
    actions: [
      { label: 'Ask for budget plan', kind: 'prompt', value: 'Plan my monthly budget.' },
      { label: 'See renewals', kind: 'prompt', value: 'Show upcoming renewals.' },
    ],
  };
};

export const buildMonthlyReviewCard = ({ subscriptions = [], history = [], dashboard }) => {
  const added = subscriptions.filter((sub) => {
    const started = new Date(sub.startDate);
    const limit = new Date();
    limit.setDate(limit.getDate() - 30);
    return started >= limit;
  });

  const renewed = history.filter((item) => {
    const renewedOn = new Date(item.renewedOn || item.startDate);
    const limit = new Date();
    limit.setDate(limit.getDate() - 30);
    return renewedOn >= limit;
  });

  const monthlySpend = dashboard?.insights?.totalMonthlySpending || subscriptions.reduce((sum, sub) => sum + Number(sub.cost || 0), 0);
  const largestExpense = subscriptions.slice().sort((a, b) => Number(b.cost || 0) - Number(a.cost || 0))[0];
  const biggestIncrease = dashboard?.insights?.highestExpense || largestExpense?.serviceName || 'N/A';

  return {
    type: 'review',
    title: 'Monthly AI Review',
    badge: 'Review',
    summary: 'Here is a compact monthly review of your subscription activity.',
    metrics: [
      { label: 'Added', value: String(added.length), tone: 'success' },
      { label: 'Renewed', value: String(renewed.length), tone: 'info' },
      { label: 'Money spent', value: formatCurrency(monthlySpend), tone: 'warning' },
      { label: 'Largest expense', value: largestExpense?.serviceName || 'N/A', tone: 'neutral' },
    ],
    items: [
      { title: 'Biggest increase', subtitle: biggestIncrease },
      { title: 'Recent additions', subtitle: added.length ? added.map((item) => item.serviceName).join(', ') : 'None in the last 30 days' },
      { title: 'Renewal count', subtitle: String(renewed.length) },
    ],
    note: 'I am tracking new subscriptions and renewals, while spend trends stay in the analytics area.',
    actions: [
      { label: 'Plan next month', kind: 'prompt', value: 'Help me plan next month\'s spending.' },
      { label: 'Open dashboard', kind: 'navigate', value: '/dashboard' },
    ],
  };
};

export const buildCoachCard = ({ dashboard, subscriptions = [] }) => {
  const recommendations = dashboard?.recommendations || [];
  const first = recommendations[0];
  const activeCount = subscriptions.length;
  const streamingCount = subscriptions.filter((sub) => /stream|video|music|netflix|spotify|prime|hotstar|youtube/.test(normalize(sub.serviceName))).length;

  return {
    type: 'coach',
    title: 'AI Financial Coach',
    badge: 'Coach',
    summary: activeCount
      ? `You have ${activeCount} active subscription${activeCount === 1 ? '' : 's'}. The quickest wins usually come from duplicate services and high-cost streaming plans.`
      : 'Add subscriptions and I will start coaching you on spending decisions.',
    metrics: [
      { label: 'Streaming count', value: String(streamingCount), tone: 'warning' },
      { label: 'Active subs', value: String(activeCount), tone: 'info' },
      { label: 'Next best move', value: first?.action || 'Review plans', tone: 'success' },
      { label: 'Confidence', value: `${Number(first?.confidence ?? 0)}%`, tone: 'neutral' },
    ],
    items: recommendations.slice(0, 3).map((rec) => ({
      title: rec.action,
      subtitle: `${rec.targetSubscription} Â· ${rec.estimatedSavings || 'Savings varies'}`,
      reason: rec.reason || rec.description,
    })),
    note: streamingCount >= 5
      ? 'You have a lot of entertainment overlap. Cancelling one plan could create immediate savings.'
      : 'Small recurring cuts add up quickly when you review them monthly.',
    actions: [
      { label: 'Suggest cuts', kind: 'prompt', value: 'Which subscriptions should I cancel?' },
      { label: 'Create goal', kind: 'prompt', value: 'Save Rs 500 every month' },
    ],
  };
};

const HEALTH_SNAPSHOT_KEY = 'sms_ai_health_snapshot_v1';
const REVIEW_SNAPSHOT_KEY = 'sms_ai_review_snapshot_v1';

const readSnapshot = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSnapshot = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

export const buildBudgetPlannerV2 = ({ subscriptions = [], targetAmount }) => {
  const current = getNormalizedMonthlyTotal(subscriptions);
  const target = Number(targetAmount || 0);

  if (!Number.isFinite(target) || target <= 0) {
    const options = current > 0
      ? [Math.round(current), Math.round(current * 0.9), Math.round(current * 0.75)]
      : [];

    return {
      type: 'budget',
      title: 'Budget Planner',
      badge: 'Budget',
      summary: 'What is your monthly subscription budget? I will compare it against your real subscription spend.',
      metrics: [
        { label: 'Current monthly spend', value: formatCurrency(current), tone: 'neutral' },
        { label: 'Budget target', value: 'Needed', tone: 'accent' },
        { label: 'Savings needed', value: 'Pending', tone: 'warning' },
        { label: 'Active subscriptions', value: String(subscriptions.length), tone: 'info' },
      ],
      items: options.map((amount) => ({
        title: formatCurrency(amount),
        subtitle: 'Suggested starting point',
      })),
      note: 'I will only calculate cuts after you share a budget target.',
      actions: [
        { label: 'Use current spend', kind: 'prompt', value: `Set my budget to ${formatCurrency(Math.round(current))}/month.` },
        { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
      ],
    };
  }

  const { chosen, newTotal } = topRemovalsForTarget(subscriptions, target);
  const savingsNeeded = Math.max(current - target, 0);
  const potentialSavings = Math.max(current - newTotal, 0);
  const downgradeCandidates = subscriptions
    .map((sub) => ({
      ...sub,
      monthlyEquivalentCost: getMonthlyEquivalentCost(sub),
      family: classifySubscriptionFamily(sub),
    }))
    .filter((sub) => sub.monthlyEquivalentCost > 0)
    .sort((a, b) => b.monthlyEquivalentCost - a.monthlyEquivalentCost);

  const plannedDowngrades = downgradeCandidates
    .filter((sub) => {
      const peers = downgradeCandidates.filter((item) => item.family.family === sub.family.family);
      if (peers.length < 2) return false;
      const costs = peers.map((item) => item.monthlyEquivalentCost).sort((a, b) => a - b);
      const median = costs[Math.floor(costs.length / 2)] || sub.monthlyEquivalentCost;
      return sub.monthlyEquivalentCost > median;
    })
    .slice(0, 3)
    .map((sub) => {
      const peers = downgradeCandidates.filter((item) => item.family.family === sub.family.family);
      const costs = peers.map((item) => item.monthlyEquivalentCost).sort((a, b) => a - b);
      const median = costs[Math.floor(costs.length / 2)] || sub.monthlyEquivalentCost;
      const estimatedSavings = Math.max(sub.monthlyEquivalentCost - median, 0);
      return {
        title: sub.serviceName,
        subtitle: `${sub.family.label} Â· ${formatCurrency(sub.monthlyEquivalentCost)}`,
        reason: estimatedSavings > 0
          ? `A lower tier in this category may save about ${formatCurrency(Math.round(estimatedSavings))} each month.`
          : 'This is a plausible downgrade review, but exact savings are not visible from the current data.',
      };
    });

  return {
    type: 'budget',
    title: 'Budget Planner',
    badge: 'Budget',
    summary: `Your current normalized monthly spend is ${formatCurrency(current)}. To stay under ${formatCurrency(target)}, you need to free up ${formatCurrency(savingsNeeded)}.`,
    metrics: [
      { label: 'Current Cost', value: formatCurrency(current), tone: 'neutral' },
      { label: 'Target Cost', value: formatCurrency(target), tone: 'accent' },
      { label: 'Savings Needed', value: formatCurrency(savingsNeeded), tone: 'success' },
      { label: 'Estimated New Total', value: formatCurrency(newTotal), tone: 'info' },
    ],
    items: chosen.map((sub) => ({
      title: sub.serviceName,
      subtitle: `${sub.category || 'Other'} Â· ${formatCurrency(sub.monthlyEquivalentCost || 0)}`,
      reason: 'This removal gets you to budget faster than smaller cuts.',
    })),
    note: plannedDowngrades.length
      ? `I also found ${plannedDowngrades.length} possible downgrade review${plannedDowngrades.length === 1 ? '' : 's'} based on real category comparisons.`
      : 'I did not find enough data to recommend a safe downgrade without guessing.',
    actions: [
      { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
      { label: 'Compare plans', kind: 'prompt', value: 'Compare cheaper plan options for my highest-cost subscriptions.' },
    ],
    details: plannedDowngrades.length ? [
      {
        title: 'Possible downgrade reviews',
        content: plannedDowngrades.map((item) => `${item.title}: ${item.reason}`).join('\n'),
      },
    ] : [],
    progress: {
      label: 'Budget progress',
      value: current > 0 ? Math.max(0, Math.min(100, Math.round((1 - (savingsNeeded / Math.max(current, 1))) * 100))) : 0,
      description: `Potential savings: ${formatCurrency(potentialSavings)}.`,
    },
  };
};

export const buildWhatIfSimulatorV2 = ({ subscriptions = [], prompt = '' }) => {
  const target = findSubscriptionByPrompt(subscriptions, prompt);
  const current = getNormalizedMonthlyTotal(subscriptions);

  if (!target) {
    return {
      type: 'what_if',
      title: 'What-if Simulator',
      badge: 'Scenario',
      summary: 'Which subscription are you considering cancelling?',
      metrics: [
        { label: 'Active subscriptions', value: String(subscriptions.length), tone: 'neutral' },
        { label: 'Current monthly spend', value: formatCurrency(current), tone: 'accent' },
      ],
      items: subscriptions
        .slice()
        .sort((a, b) => getMonthlyEquivalentCost(b) - getMonthlyEquivalentCost(a))
        .slice(0, 4)
        .map((sub) => ({
          title: sub.serviceName,
          subtitle: `${sub.category || 'Other'} Â· ${formatCurrency(getMonthlyEquivalentCost(sub))}`,
        })),
      note: 'Pick one service and I will simulate the savings and trade-offs.',
      actions: [
        { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
        { label: 'Find duplicates', kind: 'prompt', value: 'Find duplicate services in my subscriptions.' },
      ],
    };
  }

  const monthlySavings = getMonthlyEquivalentCost(target);
  const yearlySavings = monthlySavings * 12;
  const remaining = Math.max(current - monthlySavings, 0);
  const replacementSuggestions = subscriptions
    .filter((sub) => sub.id !== target.id && classifySubscriptionFamily(sub).family === classifySubscriptionFamily(target).family)
    .slice(0, 3)
    .map((sub) => sub.serviceName);

  return {
    type: 'what_if',
    title: `What if I cancel ${target.serviceName}?`,
    badge: 'Scenario',
    summary: `Cancelling ${target.serviceName} would reduce your monthly spend to ${formatCurrency(remaining)}.`,
    metrics: [
      { label: 'Monthly Savings', value: formatCurrency(monthlySavings), tone: 'success' },
      { label: 'Yearly Savings', value: formatCurrency(yearlySavings), tone: 'success' },
      { label: 'Budget Impact', value: `${Math.max(0, Math.min(100, Math.round((monthlySavings / Math.max(current, 1)) * 100)))}%`, tone: 'warning' },
      { label: 'Subscriptions Remaining', value: String(Math.max(subscriptions.length - 1, 0)), tone: 'neutral' },
    ],
    items: [
      { title: 'Feature loss', subtitle: target.category || 'Other' },
      { title: 'Replacement suggestions', subtitle: replacementSuggestions.length ? replacementSuggestions.join(', ') : 'No close replacement in your current data' },
    ],
    note: 'I based this on the actual subscription cost and category data you already have.',
    actions: [
      { label: 'Open subscription', kind: 'navigate', value: '/subscriptions' },
      { label: 'Compare plans', kind: 'prompt', value: `Compare cheaper plans for ${target.serviceName}.` },
    ],
  };
};

export const buildRenewalAdvisorV2 = ({ subscriptions = [], mode = '' }) => {
  const upcoming = getUpcomingRenewals(subscriptions, 30);
  const expensiveRenewals = upcoming.filter((sub, index) => {
    const costs = upcoming.map((item) => item.monthlyEquivalentCost).sort((a, b) => a - b);
    const median = costs[Math.floor(costs.length / 2)] || 0;
    return sub.monthlyEquivalentCost >= median || index < 3;
  });
  const selected = mode === 'expensive' ? expensiveRenewals : upcoming;

  return {
    type: 'renewal',
    title: 'Renewal Advisor',
    badge: 'Renewals',
    summary: mode
      ? `I found ${selected.length} renewal${selected.length === 1 ? '' : 's'} to review.`
      : 'Would you like me to remind you only about expensive renewals or all renewals?',
    metrics: [
      { label: 'Upcoming', value: String(upcoming.length), tone: 'neutral' },
      { label: 'Expensive review set', value: String(expensiveRenewals.length), tone: 'warning' },
      { label: 'Auto-renew on', value: String(subscriptions.filter((sub) => sub.autoRenewal).length), tone: 'success' },
      { label: 'Manual renewals', value: String(subscriptions.filter((sub) => !sub.autoRenewal).length), tone: 'info' },
    ],
    items: selected.slice(0, 6).map((sub) => ({
      title: sub.serviceName,
      subtitle: `${sub.daysUntilExpiry <= 0 ? 'Expires now' : `${sub.daysUntilExpiry} day${sub.daysUntilExpiry === 1 ? '' : 's'} left`} Â· ${formatCurrency(sub.monthlyEquivalentCost)}`,
      reason: sub.autoRenewal
        ? 'Auto-renewal is enabled.'
        : 'Auto-renewal is off, so you can choose to pause or cancel.',
    })),
    note: mode
      ? 'I ranked renewals by urgency and monthly cost using your actual subscriptions.'
      : 'Choose whether you want expensive renewals or all renewals and I will narrow the list.',
    actions: mode
      ? [
        { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
        { label: 'Review upcoming renewals', kind: 'prompt', value: 'Show me what renews next week.' },
      ]
      : [
        { label: 'Expensive renewals', kind: 'prompt', value: 'Show only expensive renewals.' },
        { label: 'All renewals', kind: 'prompt', value: 'Show all upcoming renewals.' },
      ],
  };
};

export const buildDuplicateDetectorV2 = ({ subscriptions = [] }) => {
  const pairs = findDuplicatePairs(subscriptions);

  if (!pairs.length) {
    return {
      type: 'duplicate',
      title: 'Duplicate Service Detector',
      badge: 'Duplicates',
      summary: 'I could not find clear duplicate or overlapping subscriptions in your current data.',
      metrics: [
        { label: 'Possible overlaps', value: '0', tone: 'success' },
        { label: 'Estimated waste', value: 'None detected', tone: 'neutral' },
        { label: 'Confidence', value: 'High', tone: 'success' },
        { label: 'Review status', value: 'Clear', tone: 'neutral' },
      ],
      items: [],
      note: 'I only surface duplicates when the data shows a meaningful overlap signal.',
      actions: [
        { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
        { label: 'Try what-if', kind: 'prompt', value: 'What if I cancel my most expensive subscription?' },
      ],
    };
  }

  return {
    type: 'duplicate',
    title: 'Duplicate Service Detector',
    badge: 'Duplicates',
    summary: `I found ${pairs.length} possible overlap${pairs.length === 1 ? '' : 's'} that may be wasting money.`,
    metrics: [
      { label: 'Possible overlaps', value: String(pairs.length), tone: 'warning' },
      { label: 'Estimated waste', value: formatCurrency(pairs.reduce((sum, pair) => sum + pair.estimatedWaste, 0)), tone: 'danger' },
      { label: 'Confidence', value: pairs[0]?.confidence || 'Review', tone: 'info' },
      { label: 'Highest similarity', value: `${pairs[0]?.similarity || 0}%`, tone: 'accent' },
    ],
    items: pairs.map((pair) => ({
      title: `${pair.items[0].serviceName} + ${pair.items[1].serviceName}`,
      subtitle: `${pair.familyLabel} Â· ${pair.similarity}% match`,
      reason: `Estimated waste: ${formatCurrency(pair.estimatedWaste)} per month.`,
    })),
    note: 'I only show overlaps when the category and service patterns support the match.',
    actions: [
      { label: 'Review subscriptions', kind: 'navigate', value: '/subscriptions' },
      { label: 'Optimize spending', kind: 'prompt', value: 'Help me optimize my monthly spending.' },
    ],
  };
};

export const buildHealthScoreCardV2 = ({ subscriptions = [] }) => {
  const health = calculateHealthScore({ subscriptions });
  const previous = readSnapshot(HEALTH_SNAPSHOT_KEY);
  writeSnapshot(HEALTH_SNAPSHOT_KEY, {
    score: health.score,
    components: health.components,
    updatedAt: nowIso(),
  });

  const changes = previous
    ? Object.entries(health.components)
      .map(([key, value]) => {
        const prevValue = previous.components?.[key];
        if (prevValue == null || prevValue === value) return null;
        const label = {
          renewalManagement: 'renewal management',
          unusedExpensive: 'unused expensive plans',
          duplicateServices: 'duplicate services',
          autoRenewOptimization: 'auto-renew settings',
          budgetAdherence: 'budget adherence',
        }[key] || key;
        return `${label} changed by ${value - prevValue >= 0 ? '+' : ''}${value - prevValue} points.`;
      })
      .filter(Boolean)
    : ['This is the first calculated health score in this session.'];

  return {
    type: 'health',
    title: 'Subscription Health Score',
    badge: 'Health',
    summary: `Your subscription health score is ${health.score}/100.`,
    metrics: [
      { label: 'Overall Score', value: `${health.score} / 100`, tone: health.score >= 80 ? 'success' : health.score >= 60 ? 'warning' : 'danger' },
      { label: 'Renewal management', value: `${health.components.renewalManagement}/100`, tone: 'info' },
      { label: 'Unused expensive', value: `${health.components.unusedExpensive}/100`, tone: 'warning' },
      { label: 'Duplicates', value: `${health.components.duplicateServices}/100`, tone: 'accent' },
    ],
    items: [
      ...health.weakAreas.map((item) => ({
        title: item.label,
        subtitle: item.reason,
      })),
      ...health.recommendations.slice(0, 2).map((rec) => ({
        title: 'Recommendation',
        subtitle: rec,
      })),
    ],
    note: changes.join(' '),
    actions: [
      { label: 'Improve score', kind: 'prompt', value: 'How can I improve my subscription health score?' },
      { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
    ],
    progress: {
      label: 'Health score',
      value: health.score,
      description: health.recommendations[0] || 'Keep reviewing renewals and duplicates.',
    },
  };
};

export const buildForecastCardV2 = ({ subscriptions = [], history = [] }) => {
  const monthlyTotal = getNormalizedMonthlyTotal(subscriptions);
  const upcoming = getUpcomingRenewals(subscriptions, 90);
  const nextMonth = Math.round(monthlyTotal + upcoming.filter((sub) => sub.daysUntilExpiry <= 30).reduce((sum, sub) => sum + sub.monthlyEquivalentCost, 0));
  const nextQuarter = Math.round(monthlyTotal * 3 + upcoming.filter((sub) => sub.daysUntilExpiry <= 90).reduce((sum, sub) => sum + sub.monthlyEquivalentCost, 0));
  const nextYear = Math.round(monthlyTotal * 12);
  const confidence = Math.min(95, 55 + (upcoming.length * 5) + (history.length > 0 ? 10 : 0));

  return {
    type: 'forecast',
    title: 'Spending Forecast',
    badge: 'Forecast',
    summary: `Based on your current subscriptions, I estimate ${formatCurrency(nextMonth)} next month and ${formatCurrency(nextYear)} over the next year.`,
    metrics: [
      { label: 'Next Month', value: formatCurrency(nextMonth), tone: 'accent' },
      { label: 'Next Quarter', value: formatCurrency(nextQuarter), tone: 'info' },
      { label: 'Next Year', value: formatCurrency(nextYear), tone: 'warning' },
      { label: 'Confidence', value: `${confidence}%`, tone: confidence >= 80 ? 'success' : 'warning' },
    ],
    items: upcoming.slice(0, 4).map((sub) => ({
      title: sub.serviceName,
      subtitle: `${sub.daysUntilExpiry} day${sub.daysUntilExpiry === 1 ? '' : 's'} left Â· ${formatCurrency(sub.monthlyEquivalentCost)}`,
    })),
    note: 'The forecast uses current subscription costs and renewal timing from your data.',
    actions: [
      { label: 'Plan my budget', kind: 'prompt', value: 'Help me build a subscription budget.' },
      { label: 'Show renewals', kind: 'prompt', value: 'Show upcoming renewals.' },
    ],
  };
};

export const buildMonthlyReviewCardV2 = ({ subscriptions = [], history = [] }) => {
  const monthlyTotal = getNormalizedMonthlyTotal(subscriptions);
  const topExpense = getTopExpense(subscriptions);
  const upcoming = getUpcomingRenewals(subscriptions, 30);
  const duplicates = findDuplicatePairs(subscriptions);
  const health = calculateHealthScore({ subscriptions });
  const added = subscriptions.filter((sub) => {
    const started = new Date(sub.startDate);
    const limit = new Date();
    limit.setDate(limit.getDate() - 30);
    return started >= limit;
  });
  const renewed = history.filter((item) => {
    const renewedOn = new Date(item.renewedOn || item.startDate);
    const limit = new Date();
    limit.setDate(limit.getDate() - 30);
    return renewedOn >= limit;
  });

  const previous = readSnapshot(REVIEW_SNAPSHOT_KEY);
  writeSnapshot(REVIEW_SNAPSHOT_KEY, {
    monthlyTotal,
    activeCount: subscriptions.length,
    updatedAt: nowIso(),
  });
  const trend = previous
    ? monthlyTotal > previous.monthlyTotal
      ? `Up ${formatCurrency(Math.round(monthlyTotal - previous.monthlyTotal))} from your last review.`
      : monthlyTotal < previous.monthlyTotal
        ? `Down ${formatCurrency(Math.round(previous.monthlyTotal - monthlyTotal))} from your last review.`
        : 'Flat compared with your last review.'
    : 'This is your first saved monthly review.';

  return {
    type: 'review',
    title: 'Monthly AI Review',
    badge: 'Review',
    summary: 'Here is a compact monthly review generated from your actual subscription data.',
    metrics: [
      { label: 'Total spent', value: formatCurrency(monthlyTotal), tone: 'warning' },
      { label: 'Highest subscription', value: topExpense?.serviceName || 'N/A', tone: 'neutral' },
      { label: 'Upcoming renewals', value: String(upcoming.length), tone: 'info' },
      { label: 'Health score', value: `${health.score}/100`, tone: health.score >= 80 ? 'success' : 'warning' },
    ],
    items: [
      { title: 'Least used', subtitle: subscriptions.filter((sub) => /rare|never|low/.test(normalize(sub.usageFrequency || ''))).map((sub) => sub.serviceName).join(', ') || 'No usage data marked as rare or never' },
      { title: 'Savings opportunities', subtitle: duplicates.length ? `${duplicates.length} overlap${duplicates.length === 1 ? '' : 's'} detected` : 'No clear duplicate savings found' },
      { title: 'Trend', subtitle: trend },
      { title: 'Renewed this month', subtitle: renewed.length ? renewed.map((item) => item.serviceName).join(', ') : 'None' },
    ],
    note: health.recommendations[0] || 'Keep reviewing renewals and duplicate services.',
    actions: [
      { label: 'Open dashboard', kind: 'navigate', value: '/dashboard' },
      { label: 'Optimize spending', kind: 'prompt', value: 'Help me optimize my monthly spending.' },
    ],
    details: [
      {
        title: 'Review notes',
        content: `Added this month: ${added.length}\nRenewed this month: ${renewed.length}\nUpcoming renewals: ${upcoming.map((item) => item.serviceName).join(', ') || 'None'}`,
      },
    ],
  };
};

export const buildGoalPlannerCardV2 = ({ subscriptions = [], goals = [] }) => {
  const templates = buildGoalTemplates({ subscriptions, goals });
  return {
    type: 'goals',
    title: 'Budget Planning',
    badge: 'Budget',
    summary: goals.length
      ? `You currently have ${goals.length} goal${goals.length === 1 ? '' : 's'}.`
      : 'Create a goal and I will help track progress from your subscription data.',
    metrics: [
      { label: 'Tracked goals', value: String(goals.length), tone: 'success' },
      { label: 'Active subscriptions', value: String(subscriptions.length), tone: 'info' },
      { label: 'Templates', value: String(templates.length), tone: 'neutral' },
      { label: 'Focus', value: 'Budget control', tone: 'warning' },
    ],
    items: templates.map((goal) => ({
      title: goal,
      subtitle: 'Tap to create this goal',
    })),
    note: 'Goals keep the assistant proactive instead of reactive.',
    actions: [
      { label: 'Create goal', kind: 'prompt', value: templates[0] || 'Track subscriptions more closely' },
      { label: 'Optimize spending', kind: 'prompt', value: 'How can I save money?' },
    ],
  };
};

export const buildCostOptimizerCardV2 = ({ subscriptions = [], goal = '' }) => {
  const current = getNormalizedMonthlyTotal(subscriptions);
  const topExpense = getTopExpense(subscriptions);
  const duplicates = findDuplicatePairs(subscriptions);
  const lowUsage = subscriptions.filter((sub) => /rare|never|low/.test(normalize(sub.usageFrequency || '')));
  const familyMap = subscriptions.map((sub) => ({ ...sub, family: classifySubscriptionFamily(sub), monthlyEquivalentCost: getMonthlyEquivalentCost(sub) }));

  if (!goal) {
    return {
      type: 'optimizer',
      title: 'Cost Optimizer',
      badge: 'Optimizer',
      summary: 'What is your primary goal?',
      metrics: [
        { label: 'Current monthly spend', value: formatCurrency(current), tone: 'neutral' },
        { label: 'Duplicate groups', value: String(duplicates.length), tone: 'warning' },
        { label: 'Low usage plans', value: String(lowUsage.length), tone: 'info' },
        { label: 'Highest expense', value: topExpense?.serviceName || 'N/A', tone: 'accent' },
      ],
      items: [
        { title: 'Reduce spending', subtitle: 'Focus on cuts and downgrades' },
        { title: 'Annual plans', subtitle: 'Review long-term billing opportunities' },
        { title: 'Student discounts', subtitle: 'Check whether eligible vendors support a student rate' },
        { title: 'Remove unused subscriptions', subtitle: 'Target low-usage services' },
        { title: 'Optimize everything', subtitle: 'Combine all savings paths' },
      ],
      note: 'Choose one goal and I will narrow the recommendations using your actual subscriptions.',
      actions: [
        { label: 'Reduce spending', kind: 'prompt', value: 'Reduce spending' },
        { label: 'Optimize everything', kind: 'prompt', value: 'Optimize everything' },
      ],
    };
  }

  const normalizedGoal = normalize(goal);
  const recommendations = [];

  if (/reduce spending|optimize everything/.test(normalizedGoal)) {
    recommendations.push(...familyMap
      .slice()
      .sort((a, b) => b.monthlyEquivalentCost - a.monthlyEquivalentCost)
      .slice(0, 4)
      .map((sub) => ({
        title: sub.serviceName,
        subtitle: `${sub.family.label} Â· ${formatCurrency(sub.monthlyEquivalentCost)}`,
        reason: sub.autoRenewal
          ? 'Large recurring cost and auto-renewal is on.'
          : 'High recurring cost and auto-renewal is off.',
      })));
  }

  if (/annual plans|optimize everything/.test(normalizedGoal)) {
    recommendations.push(...subscriptions
      .filter((sub) => /monthly|month/i.test(sub.billingCycle || ''))
      .slice(0, 3)
      .map((sub) => ({
        title: sub.serviceName,
        subtitle: `${sub.category || 'Other'} Â· monthly billing`,
        reason: 'If you plan to keep this service for a year, compare the annual price before the next renewal.',
      })));
  }

  if (/student discounts/.test(normalizedGoal)) {
    recommendations.push(...subscriptions
      .filter((sub) => /education|design|productivity|creative|software/i.test(normalize(`${sub.category || ''} ${sub.serviceName || ''}`)))
      .slice(0, 3)
      .map((sub) => ({
        title: sub.serviceName,
        subtitle: `${sub.category || 'Other'} Â· ${formatCurrency(sub.monthlyEquivalentCost)}`,
        reason: 'This subscription is worth checking for education or student pricing directly with the vendor.',
      })));
  }

  if (/remove unused subscriptions/.test(normalizedGoal)) {
    recommendations.push(...lowUsage.slice(0, 4).map((sub) => ({
      title: sub.serviceName,
      subtitle: `${sub.usageFrequency || 'Usage not marked'} Â· ${formatCurrency(getMonthlyEquivalentCost(sub))}`,
      reason: 'Low usage is a strong signal that this plan should be reviewed or cancelled.',
    })));
  }

  if (/optimize everything/.test(normalizedGoal) && duplicates.length) {
    recommendations.push(...duplicates.slice(0, 2).map((pair) => ({
      title: `${pair.items[0].serviceName} + ${pair.items[1].serviceName}`,
      subtitle: `${pair.familyLabel} overlap`,
      reason: `Estimated waste: ${formatCurrency(pair.estimatedWaste)} per month.`,
    })));
  }

  return {
    type: 'optimizer',
    title: 'Cost Optimizer',
    badge: 'Optimizer',
    summary: `I found ${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'} for your goal: ${goal}.`,
    metrics: [
      { label: 'Current monthly spend', value: formatCurrency(current), tone: 'neutral' },
      { label: 'Goal', value: goal, tone: 'accent' },
      { label: 'Recommendations', value: String(recommendations.length), tone: 'success' },
      { label: 'Duplicates', value: String(duplicates.length), tone: 'warning' },
    ],
    items: recommendations.slice(0, 5),
    note: 'Every recommendation is grounded in your current subscriptions.',
    actions: [
      { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
      { label: 'Build budget plan', kind: 'prompt', value: 'Help me build a subscription budget.' },
    ],
  };
};

export const buildCoachCardV2 = ({ subscriptions = [], prompt = '' }) => {
  const text = normalize(prompt);
  const current = getNormalizedMonthlyTotal(subscriptions);
  const topExpense = getTopExpense(subscriptions);
  const yearlySpend = current * 12;
  const upcoming = getUpcomingRenewals(subscriptions, 30);
  const duplicates = findDuplicatePairs(subscriptions);

  if (/(most expensive|costs the most|highest subscription)/.test(text) && topExpense) {
    return {
      type: 'coach',
      title: 'AI Financial Coach',
      badge: 'Coach',
      summary: `Your most expensive subscription is ${topExpense.serviceName}.`,
      metrics: [
        { label: 'Monthly cost', value: formatCurrency(topExpense.monthlyEquivalentCost), tone: 'warning' },
        { label: 'Yearly cost', value: formatCurrency(Math.round(topExpense.monthlyEquivalentCost * 12)), tone: 'accent' },
        { label: 'Category', value: topExpense.category || 'Other', tone: 'neutral' },
        { label: 'Auto-renewal', value: topExpense.autoRenewal ? 'On' : 'Off', tone: topExpense.autoRenewal ? 'success' : 'warning' },
      ],
      items: [
        { title: 'Why it matters', subtitle: topExpense.autoRenewal ? 'This will keep recurring until you act.' : 'This is easier to stop because auto-renewal is off.' },
      ],
      note: 'This answer uses your actual subscription data.',
      actions: [
        { label: 'What if I cancel it?', kind: 'prompt', value: `What if I cancel ${topExpense.serviceName}?` },
        { label: 'Open subscriptions', kind: 'navigate', value: '/subscriptions' },
      ],
    };
  }

  if (/(yearly|per year|annually)/.test(text)) {
    return {
      type: 'coach',
      title: 'AI Financial Coach',
      badge: 'Coach',
      summary: `Your estimated yearly subscription spend is ${formatCurrency(Math.round(yearlySpend))}.`,
      metrics: [
        { label: 'Monthly total', value: formatCurrency(current), tone: 'neutral' },
        { label: 'Yearly total', value: formatCurrency(Math.round(yearlySpend)), tone: 'accent' },
        { label: 'Upcoming renewals', value: String(upcoming.length), tone: 'info' },
        { label: 'Duplicates', value: String(duplicates.length), tone: 'warning' },
      ],
      items: upcoming.slice(0, 3).map((sub) => ({
        title: sub.serviceName,
        subtitle: `${sub.daysUntilExpiry} day${sub.daysUntilExpiry === 1 ? '' : 's'} left Â· ${formatCurrency(sub.monthlyEquivalentCost)}`,
      })),
      note: 'Review upcoming renewals before they auto-renew.',
      actions: [
        { label: 'Show renewals', kind: 'prompt', value: 'Show upcoming renewals.' },
      ],
    };
  }

  if (/(save money|can i save|where am i wasting money|optimize|reduce spending)/.test(text)) {
    const duplicateWaste = duplicates.reduce((sum, pair) => sum + pair.estimatedWaste, 0);
    const lowUsage = subscriptions.filter((sub) => /rare|never|low/.test(normalize(sub.usageFrequency || '')));
    return {
      type: 'coach',
      title: 'AI Financial Coach',
      badge: 'Coach',
      summary: 'Here are the quickest data-backed ways to save money from your current subscriptions.',
      metrics: [
        { label: 'Duplicate waste', value: formatCurrency(Math.round(duplicateWaste)), tone: 'danger' },
        { label: 'Low-usage plans', value: String(lowUsage.length), tone: 'warning' },
        { label: 'Upcoming renewals', value: String(upcoming.length), tone: 'info' },
        { label: 'Current monthly spend', value: formatCurrency(current), tone: 'neutral' },
      ],
      items: [
        ...duplicates.slice(0, 2).map((pair) => ({
          title: `${pair.items[0].serviceName} + ${pair.items[1].serviceName}`,
          subtitle: `Estimated waste ${formatCurrency(pair.estimatedWaste)} per month`,
        })),
        ...lowUsage.slice(0, 2).map((sub) => ({
          title: sub.serviceName,
          subtitle: `Low usage Â· ${formatCurrency(getMonthlyEquivalentCost(sub))}`,
        })),
      ],
      note: 'These recommendations are generated from your actual subscription data and usage flags.',
      actions: [
        { label: 'Duplicate detector', kind: 'prompt', value: 'Find duplicate services.' },
      ],
    };
  }

  if (/(renewal|renews next|what renews|upcoming renewals)/.test(text)) {
    return buildRenewalAdvisorV2({ subscriptions, mode: /expensive/.test(text) ? 'expensive' : '' });
  }

  return {
    type: 'coach',
    title: 'AI Financial Coach',
    badge: 'Coach',
    summary: current
      ? `You currently spend ${formatCurrency(current)} per month across ${subscriptions.length} active subscription${subscriptions.length === 1 ? '' : 's'}.`
      : 'Add subscriptions and I will start coaching you on spending decisions.',
    metrics: [
      { label: 'Monthly spend', value: formatCurrency(current), tone: 'neutral' },
      { label: 'Yearly spend', value: formatCurrency(Math.round(yearlySpend)), tone: 'accent' },
      { label: 'Renewals', value: String(upcoming.length), tone: 'info' },
      { label: 'Duplicates', value: String(duplicates.length), tone: 'warning' },
    ],
    items: [
      { title: topExpense?.serviceName || 'No top expense yet', subtitle: topExpense ? `${topExpense.category || 'Other'} Â· ${formatCurrency(topExpense.monthlyEquivalentCost)}` : 'Add subscriptions to see your largest cost.' },
      { title: 'Next renewal', subtitle: upcoming[0] ? `${upcoming[0].serviceName} Â· ${upcoming[0].daysUntilExpiry} days left` : 'No upcoming renewals found in the next 30 days.' },
    ],
    note: 'Ask me about a service, yearly spend, renewals, or cost savings.',
    actions: [
      { label: 'Show budget plan', kind: 'prompt', value: 'Help me build a subscription budget.' },
      { label: 'Find duplicates', kind: 'prompt', value: 'Find duplicate services.' },
    ],
  };
};

export const buildPromptCard = ({ prompt = '', subscriptions = [], history = [] }) => {
  const intent = detectIntent(prompt);
  switch (intent) {
    case 'budget_planner':
      return buildBudgetPlannerV2({ subscriptions, targetAmount: extractTargetAmount(prompt) });
    case 'what_if':
      return buildWhatIfSimulatorV2({ subscriptions, prompt });
    case 'renewal_advisor':
      return buildRenewalAdvisorV2({ subscriptions, mode: /expensive/.test(normalize(prompt)) ? 'expensive' : '' });
    case 'health_score':
      return buildHealthScoreCardV2({ subscriptions });
    case 'monthly_review':
      return buildMonthlyReviewCardV2({ subscriptions, history });
    case 'forecast':
      return buildForecastCardV2({ subscriptions, history });
    case 'duplicate_detector':
      return buildDuplicateDetectorV2({ subscriptions });
    case 'cost_optimizer':
      return buildCostOptimizerCardV2({ subscriptions, goal: prompt });
    case 'optimizer':
      return buildCostOptimizerCardV2({ subscriptions, goal: prompt });
    case 'assistant_query':
      return buildCoachCardV2({ subscriptions, prompt });
    default:
      return null;
  }
};

export const parseAssistantNarrative = (content = '') => {
  const text = String(content || '').trim();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const bullets = [];
  const paragraphs = [];
  lines.forEach((line) => {
    if (/^[-*â€¢]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*â€¢]\s+/, ''));
    } else if (/^\d+\.\s+/.test(line)) {
      bullets.push(line.replace(/^\d+\.\s+/, ''));
    } else {
      paragraphs.push(line);
    }
  });

  const summary = paragraphs[0] || text;
  return {
    summary,
    bullets,
    paragraphs,
    raw: text,
  };
};

export const deriveConversationTitle = (prompt = '') => {
  const text = normalize(prompt);
  if (!text) return 'New chat';
  if (text.length <= 36) return prompt.trim();
  return `${prompt.trim().slice(0, 33).trim()}...`;
};

export const buildConversationSeed = (prompt = '') => {
  const intent = detectIntent(prompt);
  const lower = normalize(prompt);

  if (intent === 'budget_planner') return 'Budget planning';
  if (intent === 'what_if') return 'What-if scenario';
  if (intent === 'renewal_advisor') return 'Renewal advisor';
  if (intent === 'health_score') return 'Health score review';
  if (intent === 'monthly_review') return 'Monthly review';
  if (intent === 'forecast') return 'Spending forecast';
  if (intent === 'duplicate_detector') return 'Duplicate detector';
  if (lower.includes('cancel')) return 'Cancellation review';
  return deriveConversationTitle(prompt);
};

export const normalizeAssistantText = (value = '') => String(value)
  .replace(/\$(?=\d)/g, '₹')
  .replace(/Â₹|â‚¹/g, '₹')
  .replace(/Â·/g, '·')
  .replace(/â€¢/g, '•')
  .replace(/â€”/g, '—')
  .replace(/â€“/g, '–')
  .replace(/â€¦/g, '…')
  .replace(/ï»¿/g, '')
  .replace(/ðŸ”´/g, '🔴')
  .replace(/ðŸŸ /g, '🟠')
  .replace(/ðŸŸ¢/g, '🟢')
  .replace(/ðŸ”µ/g, '🔵')
  .replace(/ðŸ’´/g, '🟣');

export const extractTargetAmountSafe = (prompt = '') => {
  const normalized = normalizeAssistantText(prompt);
  const match = normalized.match(/(?:rs\.?\s*|inr\s*|₹\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)/i);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : null;
};



