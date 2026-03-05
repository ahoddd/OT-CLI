/**
 * Normalize Firebase callable error into a user-facing message.
 * Handles functions/not-found, permission-denied, unauthenticated, invalid-argument, internal.
 * Tries message, details, and details.message (Firebase can put server message in different places).
 */
export function getCallableErrorMessage(err: unknown, fallback = 'Update failed'): string {
  const e = err as { code?: string; message?: string; details?: unknown };
  const code = e?.code ?? '';
  const details = e?.details;
  const msgFromDetails =
    details != null && typeof details === 'object' && 'message' in details
      ? String((details as { message?: string }).message || '').trim()
      : typeof details === 'string'
        ? details.trim()
        : '';
  const msg =
    (e?.message && String(e.message).trim()) ||
    msgFromDetails ||
    fallback;
  if (code === 'functions/not-found') {
    return 'Backend not available. Try again after deployment or check your connection.';
  }
  if (code === 'functions/permission-denied') return msg || 'Admin only.';
  if (code === 'functions/unauthenticated') return msg || 'Please sign in.';
  if (code === 'functions/internal') return msg || 'Something went wrong. Try again.';
  if (code === 'functions/invalid-argument') return msg || 'Invalid request.';
  if (code === 'functions/resource-exhausted') return msg || 'Limit reached.';
  return msg;
}
