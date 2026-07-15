export const AI_SUGGESTED_PROMPTS = [
  'Which subscription costs the most?',
  'How can I save money?',
  'Show upcoming renewals.',
  'Suggest subscriptions to cancel.',
  'Optimize my monthly spending.',
  'Which subscriptions are rarely renewed?',
  'Find duplicate services.',
  'Show yearly spending.',
  'Plan my monthly budget.',
];

export const AI_QUICK_ACTIONS = [
  {
    id: 'optimize-spend',
    label: 'Optimize Spending',
    prompt: 'Help me optimize my monthly spending.',
    intent: 'optimizer',
    tone: 'primary',
  },
  {
    id: 'budget-planner',
    label: 'Budget Planner',
    prompt: 'I only want to spend \u20B9 2500 per month. Help me build a budget plan.',
    intent: 'budget_planner',
    tone: 'violet',
  },
  {
    id: 'upcoming-renewals',
    label: 'Upcoming Renewals',
    prompt: 'Show upcoming renewals and tell me what I should do.',
    intent: 'renewal_advisor',
    tone: 'warning',
  },
  {
    id: 'monthly-review',
    label: 'Monthly Review',
    prompt: 'Create a monthly AI review of my subscriptions.',
    intent: 'monthly_review',
    tone: 'teal',
  },
  {
    id: 'health-score',
    label: 'Health Score',
    prompt: 'What is my subscription health score and how do I improve it?',
    intent: 'health_score',
    tone: 'success',
  },
  {
    id: 'forecast',
    label: 'Forecast',
    prompt: 'Predict my subscription spending for next month, next quarter, and next year.',
    intent: 'forecast',
    tone: 'sky',
  },
  {
    id: 'duplicate-detect',
    label: 'Duplicate Detection',
    prompt: 'Find duplicate or overlapping subscription services.',
    intent: 'duplicate_detector',
    tone: 'danger',
  },
];

export const AI_FEATURES = [
  {
    id: 'budget-planner',
    title: 'Budget Planner',
    description: 'Set a monthly cap and get a concrete removal plan.',
    prompt: 'I only want to spend \u20B9 2500 per month. Help me build a budget plan.',
    intent: 'budget_planner',
    tone: 'violet',
  },
  {
    id: 'cost-optimizer',
    title: 'Cost Optimizer',
    description: 'Suggest downgrades, annual plans, and cheaper alternatives.',
    prompt: 'Optimize my subscriptions and suggest downgrades, annual plans, duplicates, unused plans, and cheaper alternatives.',
    intent: 'optimizer',
    tone: 'primary',
  },
  {
    id: 'what-if',
    title: 'What-if Simulator',
    description: 'See the savings and impact of cancelling a service.',
    prompt: 'What if I cancel Netflix?',
    intent: 'what_if',
    tone: 'sky',
  },
  {
    id: 'renewal-advisor',
    title: 'Renewal Advisor',
    description: 'Review upcoming renewals and decide what to do.',
    prompt: 'Show upcoming renewals and tell me what I should do.',
    intent: 'renewal_advisor',
    tone: 'warning',
  },
  {
    id: 'health-score',
    title: 'Health Score',
    description: 'Get a subscription health score and improvement plan.',
    prompt: 'What is my subscription health score and how do I improve it?',
    intent: 'health_score',
    tone: 'success',
  },
  {
    id: 'monthly-review',
    title: 'Monthly Review',
    description: 'Generate a compact monthly AI review report.',
    prompt: 'Create a monthly AI review of my subscriptions.',
    intent: 'monthly_review',
    tone: 'teal',
  },
  {
    id: 'forecast',
    title: 'Spending Forecast',
    description: 'Predict next month, next quarter, and next year.',
    prompt: 'Predict my subscription spending for next month, next quarter, and next year.',
    intent: 'forecast',
    tone: 'sky',
  },
  {
    id: 'duplicates',
    title: 'Duplicate Detector',
    description: 'Find overlapping subscriptions and possible redundancy.',
    prompt: 'Find duplicate or overlapping subscription services.',
    intent: 'duplicate_detector',
    tone: 'danger',
  },
  {
    id: 'coach',
    title: 'Financial Coach',
    description: 'Get proactive advice based on your current spend.',
    prompt: 'Give me proactive advice to reduce my subscription spending.',
    intent: 'assistant_query',
    tone: 'amber',
  },
];

export const AI_EMPTY_PROMPTS = [
  'What should I cancel to save money?',
  'How much do I spend every month?',
  'What renews next week?',
  'Can I reduce spending below \u20B9 2000?',
];

export const AI_TOOL_GROUPS = [
  {
    title: 'Decision Tools',
    description: 'Launch the main AI actions directly.',
    featureIds: ['budget-planner', 'cost-optimizer', 'what-if', 'renewal-advisor', 'health-score', 'monthly-review', 'forecast', 'duplicates', 'coach'],
  },
];

export const AI_ADVISOR_LIBRARY = {
  'ui design': {
    label: 'UI Design',
    services: [
      { name: 'Figma', note: 'Core design tool' },
      { name: 'Coursera', note: 'Structured learning' },
      { name: 'Frontend Masters', note: 'Advanced practice' },
      { name: 'Udemy', note: 'Budget-friendly courses' },
    ],
  },
  frontend: {
    label: 'Frontend Development',
    services: [
      { name: 'Frontend Masters', note: 'Deep technical courses' },
      { name: 'Coursera', note: 'Learning paths' },
      { name: 'Udemy', note: 'On-demand classes' },
      { name: 'Figma', note: 'Design handoff and prototyping' },
    ],
  },
  'video editing': {
    label: 'Video Editing',
    services: [
      { name: 'Adobe Creative Cloud', note: 'Pro editing suite' },
      { name: 'Canva', note: 'Simple social content' },
      { name: 'CapCut', note: 'Lightweight creator tool' },
      { name: 'DaVinci Resolve', note: 'Professional editing' },
    ],
  },
  productivity: {
    label: 'Productivity',
    services: [
      { name: 'Notion', note: 'Workspace and docs' },
      { name: 'Google One', note: 'Storage and sharing' },
      { name: 'Microsoft 365', note: 'Office suite' },
      { name: 'Todoist', note: 'Task management' },
    ],
  },
};

export const GOAL_TEMPLATES = [
  'Spend below \u20B9 3000/month',
  'Reduce streaming costs',
  'Keep only yearly subscriptions',
  'Save \u20B9 500 every month',
];
