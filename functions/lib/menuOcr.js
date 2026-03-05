"use strict";
/**
 * Partner Menu OCR — extract text from menu photo URLs via Google Cloud Vision API.
 * Callable: menuOcrFromUrls({ urls: string[] }) => { text: string, error?: string }
 * Requires Cloud Vision API enabled on the project. On failure returns { text: '', error }.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuOcrFromUrls = void 0;
const functions = require("firebase-functions/v1");
const vision_1 = require("@google-cloud/vision");
const MAX_IMAGES = 6;
const VISION_API_TIMEOUT_MS = 30000;
exports.menuOcrFromUrls = functions
    .region('us-central1')
    .runWith({ timeoutSeconds: 60, memory: '512MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth)
        return { text: '', error: 'Must be signed in.' };
    const d = data;
    const urls = Array.isArray(d === null || d === void 0 ? void 0 : d.urls) ? d.urls.filter((u) => typeof u === 'string').slice(0, MAX_IMAGES) : [];
    if (urls.length === 0)
        return { text: '', error: 'No image URLs provided.' };
    try {
        const client = new vision_1.ImageAnnotatorClient();
        const results = await Promise.all(urls.map(async (url) => {
            var _a;
            try {
                const [result] = await Promise.race([
                    client.textDetection({ image: { source: { imageUri: url } } }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Vision API timeout')), VISION_API_TIMEOUT_MS)),
                ]);
                const fullText = (_a = result === null || result === void 0 ? void 0 : result.fullTextAnnotation) === null || _a === void 0 ? void 0 : _a.text;
                return fullText && typeof fullText === 'string' ? fullText.trim() : '';
            }
            catch (imgErr) {
                return imgErr instanceof Error ? `[Image error: ${imgErr.message}]` : '[Image error]';
            }
        }));
        const text = results.filter(Boolean).join('\n\n').trim();
        return { text: text || '', error: text ? undefined : 'No text detected in images.' };
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'OCR failed';
        return { text: '', error: message };
    }
});
//# sourceMappingURL=menuOcr.js.map