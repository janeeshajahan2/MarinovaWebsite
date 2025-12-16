
const USAGE_KEY = 'marinova_usage_count';
const SUBSCRIBED_KEY = 'marinova_is_subscribed';
const MAX_USAGE = 5;

export const getUsage = (): number => {
  return parseInt(localStorage.getItem(USAGE_KEY) || '0', 10);
};

export const isSubscribed = (): boolean => {
  return localStorage.getItem(SUBSCRIBED_KEY) === 'true';
};

export const isLimitReached = (): boolean => {
  if (isSubscribed()) return false;
  return getUsage() >= MAX_USAGE;
};

export const checkAndIncrementUsage = (): boolean => {
  if (isSubscribed()) return true;
  
  const current = getUsage();
  if (current >= MAX_USAGE) {
    window.dispatchEvent(new Event('marinovaLimitReached'));
    return false;
  }
  
  localStorage.setItem(USAGE_KEY, (current + 1).toString());
  return true;
};

export const subscribeUser = (): void => {
  localStorage.setItem(SUBSCRIBED_KEY, 'true');
};

export const resetUsageForTesting = (): void => {
    localStorage.removeItem(USAGE_KEY);
    localStorage.removeItem(SUBSCRIBED_KEY);
}
