/**
 * Partner Menu OCR — extract text from menu photo URLs via Google Cloud Vision API.
 * Callable: menuOcrFromUrls({ urls: string[] }) => { text: string, error?: string }
 * Requires Cloud Vision API enabled on the project. On failure returns { text: '', error }.
 */

import * as functions from 'firebase-functions/v1';
import { ImageAnnotatorClient } from '@google-cloud/vision';

const MAX_IMAGES = 6;
const VISION_API_TIMEOUT_MS = 30_000;

export const menuOcrFromUrls = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) return { text: '', error: 'Must be signed in.' };
    const d = data as Record<string, unknown> | null | undefined;
    const urls = Array.isArray(d?.urls) ? (d.urls as string[]).filter((u) => typeof u === 'string').slice(0, MAX_IMAGES) : [];
    if (urls.length === 0) return { text: '', error: 'No image URLs provided.' };

    try {
      const client = new ImageAnnotatorClient();
      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const [result] = await Promise.race([
              client.textDetection({ image: { source: { imageUri: url } } }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Vision API timeout')), VISION_API_TIMEOUT_MS)
              ),
            ]);
            const fullText = result?.fullTextAnnotation?.text;
            return fullText && typeof fullText === 'string' ? fullText.trim() : '';
          } catch (imgErr) {
            return imgErr instanceof Error ? `[Image error: ${imgErr.message}]` : '[Image error]';
          }
        })
      );
      const text = results.filter(Boolean).join('\n\n').trim();
      return { text: text || '', error: text ? undefined : 'No text detected in images.' };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'OCR failed';
      return { text: '', error: message };
    }
  });
