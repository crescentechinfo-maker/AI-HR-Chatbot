export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CallOptions {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

// Free-tier fallbacks tried in order when the primary model is rate-limited.
const FREE_FALLBACKS = [
  'openrouter/free',                    // OpenRouter auto-picks any available free model
  'nvidia/nemotron-3-super-120b-a12b:free', // NVIDIA (different provider)
  'google/gemma-4-26b-a4b-it:free',    // Gemma 4 26B (separate quota from 31B)
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOnce(
  model: string,
  apiKey: string,
  messages: ChatMessage[],
  stream: boolean,
  temperature: number,
  maxTokens: number
): Promise<Response> {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'HR Chatbot Malaysia',
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
    }),
  });
}

export async function callOpenRouter(opts: CallOptions): Promise<Response> {
  const {
    apiKey,
    model,
    messages,
    stream = false,
    temperature = 0.7,
    maxTokens = 1500,
  } = opts;

  // Build the full model queue: primary first, then fallbacks (skip duplicates)
  const queue = [model, ...FREE_FALLBACKS.filter((m) => m !== model)];

  for (const candidate of queue) {
    const isLast = candidate === queue[queue.length - 1];
    const MAX_RETRIES = 2; // per-model attempts before moving to next fallback

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetchOnce(candidate, apiKey, messages, stream, temperature, maxTokens);

      if (res.ok) return res;

      const isRateLimit = res.status === 429;
      const isServerError = res.status >= 500;

      // Retry same model on transient server errors (not rate limits)
      if (isServerError && attempt < MAX_RETRIES) {
        await sleep(1500 * (attempt + 1));
        continue;
      }

      // Rate-limited: move immediately to next fallback model (no point waiting)
      if (isRateLimit) break;

      // Other non-retryable error (4xx except 429)
      if (!isLast || attempt === MAX_RETRIES) {
        let body = '';
        try { body = await res.text(); } catch { /* ignore */ }
        throw new Error(`OpenRouter ${res.status}: ${body}`);
      }
    }

    // If this wasn't the last candidate, try the next one
    if (!isLast) continue;

    // All models exhausted — give a helpful message
    throw new Error(
      'All AI models are temporarily rate-limited. Please wait 1–2 minutes and try again, or switch to a paid model in Admin → Settings.'
    );
  }

  throw new Error('Request failed');
}
