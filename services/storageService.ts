/**
 * Storage Service - UI Preferences Only
 * 
 * IMPORTANT: This service is now only used for storing UI preferences (theme, onboarding status).
 * All application data (transactions, accounts, etc.) is now stored in Supabase backend.
 * 
 * Migration completed: Data moved from localStorage to Supabase with realtime sync.
 */

import { AppState } from '../types';

const STORAGE_KEY = 'finai_dashboard_data_v2';
const ONBOARDING_KEY = 'gestorama_onboarding_completed';


/**
 * @deprecated - Use only for loading legacy theme preference
 * All data is now loaded from Supabase via useSupabaseData hook
 */
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

/**
 * Saves UI preferences only (theme)
 * Data is automatically synced to Supabase via realtime
 */
export const saveState = (state: Partial<AppState>) => {
  try {
    // Only save UI preferences to localStorage
    const stateToSave: Partial<AppState> = {
      themePreference: state.themePreference,
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