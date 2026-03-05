/**
 * Upload user display photo (banner) for public profile.
 * Path: users/{uid}/display_photo_{ts}.jpg
 * Runs moderation (validation + content check) before upload to block invalid/NSFW content.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { validateImageForUpload, checkContentModeration } from '../utils/imageModeration';

/** Run image through validation (type, size) and content moderation. Surfaces clear reason when blocked. */
export async function moderateDisplayPhoto(uri: string): Promise<{ allowed: boolean; reason?: string }> {
  const validation = await validateImageForUpload(uri);
  if (!validation.passed) {
    return { allowed: false, reason: validation.reason ?? 'Image validation failed.' };
  }
  const moderation = await checkContentModeration(uri);
  if (!moderation.safe) {
    return { allowed: false, reason: moderation.reason ?? 'This image cannot be used as a profile photo.' };
  }
  return { allowed: true };
}

export async function uploadDisplayPhoto(uri: string, uid: string): Promise<string> {
  const mod = await moderateDisplayPhoto(uri);
  if (!mod.allowed) {
    throw new Error(mod.reason ?? 'Photo was not approved. Please use a different image.');
  }

  const ext = uri.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] ?? 'jpg';
  const filename = `users/${uid}/display_photo_${Date.now()}.${ext}`;
  const storageRef = ref(storage, filename);

  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type || `image/${ext}`;

  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}
