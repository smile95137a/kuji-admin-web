export const loadSession = <T>(key: string): T | undefined => {
  try {
    const serializedState = sessionStorage.getItem(key);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState) as T;
  } catch (err) {
    console.error(`Error loading session state from key "${key}":`, err);
    return undefined;
  }
};

export const saveSession = (key: string, value: unknown): void => {
  try {
    const serializedState = JSON.stringify(value);
    sessionStorage.setItem(key, serializedState);
  } catch (err) {
    console.error(`Error saving session state to key "${key}":`, err);
  }
};

export const removeSession = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing session state from key "${key}":`, err);
  }
};

export const removeAllSession = (): void => {
  try {
    sessionStorage.clear();
  } catch (err) {
    console.error('Error clearing sessionStorage:', err);
  }
};
