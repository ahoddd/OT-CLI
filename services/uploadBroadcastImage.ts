/**
 * Upload a broadcast image to Firebase Storage and return its public URL.
 * Used by Admin Hub global message.
 * On React Native, fetch(fileUri) often fails; we use expo-file-system to read the file and upload as Uint8Array.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { storage } from '../firebaseConfig';

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function uploadBroadcastImage(uri: string): Promise<string> {
  const filename = `broadcasts/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const storageRef = ref(storage, filename);

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });
  const bytes = base64ToUint8Array(base64);
  await uploadBytes(storageRef, bytes, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
