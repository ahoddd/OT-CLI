/**
 * Admin access — emails that can open Admin Hub and see feature-flag toggles.
 * Add production admin emails here or replace with server check later.
 */

const ADMIN_EMAILS = ['ahoddd@icloud.com'] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const lower = email.toLowerCase();
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === lower);
}
