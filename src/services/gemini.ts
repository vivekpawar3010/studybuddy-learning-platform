import { GoogleGenAI, type Content } from '@google/genai';

// ─────────────────────────────────────────────────────────────────────────────
//  Gemini Key Rotation Service   (@google/genai v1.x API)
// ─────────────────────────────────────────────────────────────────────────────
//  • Reads VITE_GOOGLE_AI_API_KEY  (primary)
//  • Reads VITE_GOOGLE_AI_API_KEY_2 (fallback — auto-used on quota/rate errors)
//  • Both AITutor and AIPanel use this — no duplicated SDK instances
// ─────────────────────────────────────────────────────────────────────────────

const KEY_1 = import.meta.env.VITE_GOOGLE_AI_API_KEY   as string | undefined;
const KEY_2 = import.meta.env.VITE_GOOGLE_AI_API_KEY_2 as string | undefined;

const DEFAULT_MODEL = 'gemini-2.0-flash';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns every non-empty key, in priority order */
function getKeys(): string[] {
  return [KEY_1, KEY_2].filter((k): k is string => Boolean(k?.trim()));
}

/**
 * True ONLY for errors that are worth retrying with a different key.
 * Deliberately narrow — avoid retrying on bad request / malformed content.
 */
function isQuotaOrAuthError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? '').toLowerCase();
  return (
    msg.includes('quota')            ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit')       ||
    msg.includes('rateLimitExceeded')||
    msg.includes('too many requests')||
    msg.includes('429')              ||
    // key-specific auth errors
    msg.includes('api_key_invalid')  ||
    msg.includes('api key not valid')||
    msg.includes('permission_denied')||
    msg.includes('403')
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiRequest {
  /** Conversation history + current user message at the end */
  messages: GeminiMessage[];
  /** Optional system instruction (plain string) */
  systemInstruction?: string;
  /** Override model — defaults to gemini-2.0-flash */
  model?: string;
}

export interface GeminiResult {
  text: string;
  keyUsed: number; // 1 or 2 — handy for console debugging
}

/**
 * Calls Gemini generateContent with automatic key fallback.
 * Throws a descriptive Error if ALL configured keys fail.
 */
export async function geminiGenerate(req: GeminiRequest): Promise<GeminiResult> {
  const keys = getKeys();

  if (keys.length === 0) {
    throw new Error(
      'No Gemini API key configured. Add VITE_GOOGLE_AI_API_KEY to your .env file.'
    );
  }

  // ── Validate: contents must start with 'user' ──────────────────────────────
  const firstUserIdx = req.messages.findIndex(m => m.role === 'user');
  // Trim leading 'model' messages so the array always starts with 'user'
  const safeMessages =
    firstUserIdx > 0 ? req.messages.slice(firstUserIdx) : req.messages;

  if (safeMessages.length === 0 || safeMessages[0].role !== 'user') {
    throw new Error('Gemini request must contain at least one user message.');
  }

  // ── Build the Contents array ───────────────────────────────────────────────
  const contents: Content[] = safeMessages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  let lastErr: unknown;

  for (let i = 0; i < keys.length; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey: keys[i] });

      const response = await ai.models.generateContent({
        model: req.model ?? DEFAULT_MODEL,
        contents,
        ...(req.systemInstruction && {
          config: {
            systemInstruction: req.systemInstruction,
          },
        }),
      });

      const text = response.text?.trim();
      if (!text) throw new Error('Empty response — the model returned no text.');

      console.debug(`[Gemini] ✅ key ${i + 1} succeeded`);
      return { text, keyUsed: i + 1 };

    } catch (err: unknown) {
      lastErr = err;
      const isLast = i === keys.length - 1;

      if (!isLast && isQuotaOrAuthError(err)) {
        console.warn(
          `[Gemini] Key ${i + 1} hit quota/auth error — retrying with key ${i + 2}…`,
          (err as any)?.message
        );
        continue;
      }

      throw err; // non-retryable or out of keys
    }
  }

  throw lastErr; // unreachable but satisfies TypeScript
}

// ─── User-facing error messages ───────────────────────────────────────────────

export function geminiErrorMessage(err: unknown): string {
  const raw = String((err as any)?.message ?? '');
  const low = raw.toLowerCase();

  if (
    low.includes('api_key_invalid') ||
    low.includes('api key not valid') ||
    low.includes('no gemini api key')
  ) return '⚠️ Invalid or missing Gemini API key. Check VITE_GOOGLE_AI_API_KEY in your .env file, then restart the dev server.';

  if (
    low.includes('quota') ||
    low.includes('resource_exhausted') ||
    low.includes('rate limit') ||
    low.includes('too many requests') ||
    low.includes('429')
  ) return '⚠️ API quota limit reached. Please wait a minute and try again, or add a second API key (VITE_GOOGLE_AI_API_KEY_2) in your .env file.';

  if (low.includes('safety') || low.includes('blocked'))
    return '⚠️ This message was blocked by Gemini safety filters. Try rephrasing your question.';

  if (low.includes('empty response'))
    return '⚠️ The AI returned an empty response. Please try again.';

  if (low.includes('must contain at least one user message'))
    return '⚠️ Chat history error. Please start a new chat session.';

  // Fallback — show the real error so it's debuggable
  return `⚠️ AI Error: ${raw || 'Unknown error. Check the browser console for details.'}`;
}
