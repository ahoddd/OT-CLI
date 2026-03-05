/**
 * Capitalize the first character of a string if it's a letter.
 * Use in TextInput onChangeText for a professional look across the app.
 */
export function capitalizeFirstLetter(text: string): string {
  if (!text || text.length === 0) return text;
  if (/^[a-z]/.test(text)) return text[0].toUpperCase() + text.slice(1);
  return text;
}
