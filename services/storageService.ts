import { AppState } from '../types';

const STORAGE_KEY = 'finai_dashboard_data_v2';
const ONBOARDING_KEY = 'gestorama_onboarding_completed';


export const loadState = (): Partial<AppState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (typeof data.isDarkMode === 'boolean') {
        data.themePreference = data.isDarkMode ? 'dark' : 'light';
        delete data.isDarkMode;
      }
      return data;
    }
  } catch (e) {
    console.error("Failed to load state from localStorage", e);
  }
  return {};
};

export const saveState = (state: Partial<AppState>) => {
  try {
    // FIX: Explicitly list all keys to be saved from AppState.
    const stateToSave: Partial<AppState> = {
      accounts: state.accounts,
      cards: state.cards,
      transactions: state.transactions,
      transfers: state.transfers,
      recurring: state.recurring,
      categories: state.categories,
      budgets: state.budgets,
      goals: state.goals,
      reminders: state.reminders,
      themePreference: state.themePreference,
      users: state.users,
      subscription: state.subscription,
      notifiedGoalIds: state.notifiedGoalIds,
      notifiedBudgetKeys: state.notifiedBudgetKeys,
      notifiedInvoiceKeys: state.notifiedInvoiceKeys,
      notifiedReminderIds: state.notifiedReminderIds,
      gamification: state.gamification,
      notifiedTxReminderKeys: state.notifiedTxReminderKeys,
      notifiedAnomalyKeys: state.notifiedAnomalyKeys,
      yaraUsage: state.yaraUsage,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error("Failed to save state to localStorage", e);
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear state from localStorage", e);
  }
};


export const getOnboardingStatus = (): boolean => {
  try {
    const status = localStorage.getItem(ONBOARDING_KEY);
    return status === 'true';
  } catch (e) {
    console.error("Failed to get onboarding status", e);
    // Fail safe to not show the tour again if storage is inaccessible
    return true; 
  }
};

export const setOnboardingCompleted = () => {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) {
    console.error("Failed to set onboarding status", e);
  }
};

export const resetOnboardingStatus = () => {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (e) {
    console.error("Failed to reset onboarding status", e);
  }
};