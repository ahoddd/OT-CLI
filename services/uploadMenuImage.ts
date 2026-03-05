/**
 * Upload menu photos to Firebase Storage.
 * Path: menus/{storagePathSegment}/...
 * Storage rules require request.auth.uid == storagePathSegment; pass auth.uid when signed in.
 * Retries on transient errors (e.g. storage/retry-limit-exceeded).
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function isRetryableStorageError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  return (
    code === 'storage/retry-limit-exceeded' ||
    code === 'storage/network-request-failed' ||
    code === 'storage/canceled'
  );
}

export type UploadMenuImageOptions = {
  /** Use auth.uid here so Storage rules (uid == path segment) allow write. Falls back to partnerId if not set. */
  storagePathUid?: string | null;
};

export async function uploadMenuImage(
  uri: string,
  partnerId: string,
  menuId: string,
  versionId: string,
  index: number,
  options?: UploadMenuImageOptions
): Promise<string> {
  const pathSegment = options?.storagePathUid ?? partnerId;
  const ext = uri.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] ?? 'jpg';
  const filename = `menus/${pathSegment}/${menuId}_${versionId}_${index}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, filename);

  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type || `image/${ext}`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await uploadBytes(storageRef, blob, { contentType });
      return getDownloadURL(storageRef);
    } catch (e) {
      lastError = e;
      if (attempt < MAX_RETRIES && isRetryableStorageError(e)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}
