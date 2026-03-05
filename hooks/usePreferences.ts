import { usePreferencesContext } from '../context/PreferencesContext';

export type { ThemePreference, ContentMode, Preferences } from '../context/PreferencesContext';

export const usePreferences = () => usePreferencesContext();
