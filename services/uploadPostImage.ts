/**
 * Upload post images to Firebase Storage.
 * Used by partner create post (up to 3 images).
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export async function uploadPostImage(
  uri: string,
  partnerId: string,
  postId: string,
  index: number
): Promise<string> {
  const ext = uri.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] ?? 'jpg';
  const filename = `posts/${partnerId}/${postId}_${index}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, filename);

  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type || `image/${ext}`;

  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}
