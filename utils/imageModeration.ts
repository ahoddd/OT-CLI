/**
 * Basic image validation for partner post uploads.
 * Enforces allowed types and max file size.
 * When imageContentModerationEnabled is true, call checkContentModeration() after validation
 * (stub: integrate with Cloud Function or Google Cloud Vision when ready).
 */
import { logger } from './logger';

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type ImageValidationResult = { passed: boolean; reason?: string };

export type ContentModerationResult = { safe: boolean; reason?: string };

/**
 * Stub for optional content moderation (e.g. Cloud Vision Safe Search or custom Cloud Function).
 * When imageContentModerationEnabled is on, call this after validateImageForUpload; integrate
 * with your backend and return { safe: false, reason } to block uploads.
 * Intentionally returns { safe: true } until Vision API or Cloud Function is wired.
 */
export async function checkContentModeration(
  _uri: string,
  _options?: { partnerId?: string }
): Promise<ContentModerationResult> {
  return { safe: true };
}

export async function validateImageForUpload(uri: string): Promise<ImageValidationResult> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const mime = (blob.type || '').toLowerCase().split(';')[0].trim();
    const extMatch = uri.match(/\.(jpe?g|png|webp)$/i);
    if (!ALLOWED_MIMES.includes(mime) && !extMatch) {
      return {
        passed: false,
        reason: 'Only JPEG, PNG, or WebP images are allowed.',
      };
    }
    if (blob.size > MAX_SIZE_BYTES) {
      return {
        passed: false,
        reason: `Image must be under 5MB. This file is ${(blob.size / (1024 * 1024)).toFixed(1)}MB.`,
      };
    }
    return { passed: true };
  } catch (e) {
    logger.warn('Image validation error:', e);
    return {
      passed: false,
      reason: 'Could not validate the image. Please try another file.',
    };
  }
}
