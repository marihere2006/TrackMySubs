const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isCurrentMonthStart = (startDate, referenceDate = new Date()) => {
  const start = toDate(startDate);
  const reference = toDate(referenceDate);
  if (!start || !reference) return false;
  return start.getFullYear() === reference.getFullYear()
    && start.getMonth() === reference.getMonth();
};

export const getCurrentMonthContribution = (subscription = {}, referenceDate = new Date()) => {
  if (!isCurrentMonthStart(subscription.startDate, referenceDate)) {
    return 0;
  }

  const cost = Number(subscription.cost || 0);
  return Number.isFinite(cost) ? cost : 0;
};

export const getCurrentMonthSubscriptions = (subscriptions = [], referenceDate = new Date()) =>
  subscriptions.filter((subscription) => getCurrentMonthContribution(subscription, referenceDate) > 0);

export const getCurrentMonthSpend = (subscriptions = [], referenceDate = new Date()) =>
  getCurrentMonthSubscriptions(subscriptions, referenceDate)
    .reduce((sum, subscription) => sum + Number(subscription.cost || 0), 0);
