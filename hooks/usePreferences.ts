import { usePreferencesContext } from '../context/PreferencesContext';

export type { ThemePreference, Preferences } from '../context/PreferencesContext';

export const usePreferences = () => usePreferencesContext();
