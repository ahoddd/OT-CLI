/**
 * Upload user profile avatar to Firebase Storage.
 * Path: users/{uid}/avatar.jpg
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export async function uploadProfileImage(uri: string, uid: string): Promise<string> {
  const ext = uri.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] ?? 'jpg';
  const filename = `users/${uid}/avatar_${Date.now()}.${ext}`;
  const storageRef = ref(storage, filename);

  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type || `image/${ext}`;

  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

/** Upload partner logo to Firebase Storage. Path: partners/{partnerId}/logo.jpg */
export async function uploadPartnerLogo(uri: string, partnerId: string): Promise<string> {
  const ext = uri.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] ?? 'jpg';
  const filename = `partners/${partnerId}/logo_${Date.now()}.${ext}`;
  const storageRef = ref(storage, filename);

  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type || `image/${ext}`;

  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}
