/**
 * Resize and compress an image for menu (or other) upload to reduce size and speed up uploads.
 * Max width 1600px (aspect preserved), JPEG 80% compress.
 * On failure (e.g. unsupported format), returns the original URI so upload can proceed.
 */

import * as ImageManipulator from 'expo-image-manipulator';

const MAX_WIDTH = 1600;
const COMPRESS = 0.8;

export async function resizeForMenuUpload(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri;
  }
}
