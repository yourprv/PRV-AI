import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createHmac, createHash, randomUUID } from 'crypto';
import express, { type Request, type Response as ExpressResponse, type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { normalizeChatRequestPayload } from './chatRequest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../app/.env.local'),
].find((candidate) => existsSync(candidate));
dotenv.config({ path: envPath });

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const INVITE_RATE_LIMIT_SECRET = process.env.INVITE_RATE_LIMIT_SECRET || '';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const ALLOWED_ORIGINS = [
  FRONTEND_URL,
  'https://prvai.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

const app = express();
// The backend runs behind one trusted deployment proxy in production; this
// makes req.ip resolve to the client address used for the invite limiter.
app.set('trust proxy', 1);
// A Cloudflare Turnstile response token can only be validated once.  After the
// gate validates it, retain a short-lived, opaque ticket for this Render
// instance so subsequent chat messages do not try to reuse that one-time token.
const turnstileSessions = new Map<string, number>();
const TURNSTILE_SESSION_TTL_MS = 30 * 60 * 1000;
app.use(helmet());
const corsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Explicitly allow Turnstile header variants for preflight
  allowedHeaders: ['Content-Type', 'Authorization', 'x-turnstile-token', 'X-Turnstile-Token'],
};
app.use(cors(corsOptions));
// Ensure preflight responses include the allowed headers
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', Array.isArray(corsOptions.origin) ? req.header('Origin') || '' : (corsOptions.origin as string));
  res.header('Access-Control-Allow-Credentials', String(Boolean(corsOptions.credentials)));
  res.header('Access-Control-Allow-Methods', (corsOptions.methods || ['GET', 'POST', 'OPTIONS']).join(', '));
  res.header('Access-Control-Allow-Headers', (corsOptions.allowedHeaders || ['Content-Type', 'Authorization']).join(', '));
  res.sendStatus(204);
});
app.use(express.json({ limit: '10mb' }));

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

type StoredChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: string;
  mode?: string;
};

async function getAuthenticatedUser(req: Request, res: ExpressResponse) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token || !supabaseAdmin) {
    res.status(401).json({ error: 'Sign in is required to access saved chats.' });
    return null;
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: error?.message || 'Your session is no longer valid.' });
    return null;
  }
  return user;
}

type Tier = 'free' | 'go' | 'plus' | 'pro';
const tierRank: Record<Tier, number> = { free: 0, go: 1, plus: 2, pro: 3 };
type DailyFeature = 'model_earth' | 'model_light' | 'model_v1_max' | 'images' | 'enhance' | 'search';
const TIER_DAILY_LIMITS: Record<Tier, Record<DailyFeature, number> & { customPrvs: number | null }> = {
  free: { model_earth: 30, model_light: 0, model_v1_max: 40, images: 10, enhance: 100, search: 30, customPrvs: 1 },
  go: { model_earth: 300, model_light: 20, model_v1_max: 200, images: 50, enhance: 500, search: 100, customPrvs: 5 },
  plus: { model_earth: 1000, model_light: 100, model_v1_max: 800, images: 150, enhance: 1500, search: 300, customPrvs: 25 },
  pro: { model_earth: 5000, model_light: 500, model_v1_max: 3000, images: 500, enhance: 5000, search: 1000, customPrvs: null },
};
const UNLIMITED_MODELS = new Set(['prv-v3.2-fire', 'prv-v1-flash', 'prv-v1.5-beta']);
const VALID_MODELS = new Set(['prv-v3.2-fire', 'prv-v3.5-earth', 'prv-v4-light', 'prv-v1-flash', 'prv-v1-pro', 'prv-v1.5-beta']);

// Use a keyed digest so raw IP addresses and account IDs are not stored in the
// rate-limit table. Configure a long, random secret in production.
function rateLimitKey(kind: 'ip' | 'user', value: string): string {
  return createHmac('sha256', INVITE_RATE_LIMIT_SECRET).update(`${kind}:${value}`).digest('hex');
}

// Add this middleware to any server route that serves Plus or Pro features.
function requireTier(minimumTier: Exclude<Tier, 'free'>): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = await getAuthenticatedUser(req, res);
      if (!user || !supabaseAdmin) return;

      const { data, error } = await supabaseAdmin
        .from('user_entitlements')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Failed to check user tier:', error);
        res.status(503).json({ error: 'Unable to verify your account access.' });
        return;
      }
      const currentTier = data?.tier as Tier | undefined;
      if (!currentTier || tierRank[currentTier] < tierRank[minimumTier]) {
        const label = `${minimumTier[0].toUpperCase()}${minimumTier.slice(1)}`;
        res.status(403).json({ error: `${label} access is required.` });
        return;
      }
      next();
    } catch (error) {
      console.error('Tier access check failed:', error);
      res.status(503).json({ error: 'Unable to verify your account access.' });
    }
  };
}

interface UsageContext { usageKey: string; tier: Tier; userId: string | null }

async function getUsageContext(req: Request): Promise<UsageContext> {
  let userId: string | null = null;
  let tier: Tier = 'free';
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (token && supabaseAdmin) {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (!authError && user) {
      userId = user.id;
      const { data, error } = await supabaseAdmin.from('user_entitlements').select('tier').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      const activeTier = data?.tier as Tier | undefined;
      if (activeTier && activeTier in tierRank) tier = activeTier;
    }
  }
  if (!INVITE_RATE_LIMIT_SECRET) throw new Error('INVITE_RATE_LIMIT_SECRET is required for usage tracking.');
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const usageKey = userId
    ? `user:${userId}`
    : `guest:${createHmac('sha256', INVITE_RATE_LIMIT_SECRET).update(ip).digest('hex')}`;
  return { usageKey, tier, userId };
}

function utcUsageDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function utcResetEpoch(now = new Date()): number {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) / 1000);
}

async function consumeDailyQuota(req: Request, res: ExpressResponse, feature: DailyFeature, quotaKey: string = feature): Promise<boolean> {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Usage limits are not configured on the server.' });
    return false;
  }
  const context = await getUsageContext(req);
  const limit = TIER_DAILY_LIMITS[context.tier][feature];
  const resetAt = utcResetEpoch();
  const { data, error } = await supabaseAdmin.rpc('consume_tier_daily_quota', {
    p_usage_key: context.usageKey,
    p_feature_key: quotaKey,
    p_usage_date: utcUsageDate(),
    p_daily_limit: limit,
  });
  if (error) throw error;
  const result = data as { allowed?: boolean; used?: number; limit?: number };
  const remaining = Math.max(0, limit - (result.used || 0));
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetAt));
  if (!result.allowed) {
    res.setHeader('Retry-After', String(Math.max(1, resetAt - Math.floor(Date.now() / 1000))));
    res.status(429).json({ error: 'Daily limit reached. Your allowance resets at midnight UTC.' });
    return false;
  }
  return true;
}

function dailyQuota(feature: DailyFeature): RequestHandler {
  return async (req, res, next) => {
    try {
      if (await consumeDailyQuota(req, res, feature)) next();
    } catch (error) {
      console.error(`Failed to enforce ${feature} quota:`, error);
      res.status(503).json({ error: 'Usage limits are temporarily unavailable.' });
    }
  };
}

const modelQuota: RequestHandler = async (req, res, next) => {
  const model = typeof req.body?.model === 'string' ? req.body.model : 'prv-v3.2-fire';
  if (!VALID_MODELS.has(model)) {
    res.status(400).json({ error: 'Choose a supported PRV model.' });
    return;
  }
  if (UNLIMITED_MODELS.has(model)) {
    res.setHeader('X-RateLimit-Limit', 'unlimited');
    res.setHeader('X-RateLimit-Remaining', 'unlimited');
    res.setHeader('X-RateLimit-Reset', String(utcResetEpoch()));
    next();
    return;
  }
  try {
    const context = await getUsageContext(req);
    const feature: DailyFeature = model === 'prv-v3.5-earth' ? 'model_earth' : model === 'prv-v4-light' ? 'model_light' : 'model_v1_max';
    if (TIER_DAILY_LIMITS[context.tier][feature] === 0) {
      res.setHeader('X-RateLimit-Limit', '0');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(utcResetEpoch()));
      res.status(403).json({ error: 'This model is not available on your current tier. Upgrade with an invite code to unlock it.' });
      return;
    }
    if (await consumeDailyQuota(req, res, feature, `model:${model}`)) next();
  } catch (error) {
    console.error('Failed to enforce model quota:', error);
    res.status(503).json({ error: 'Usage limits are temporarily unavailable.' });
  }
};

app.get('/api/usage', async (req: Request, res: ExpressResponse) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Usage tracking is not configured on the server.' });
    return;
  }
  try {
    const context = await getUsageContext(req);
    const usageDate = utcUsageDate();
    const [{ data: dailyRows, error: dailyError }, { data: lifetimeRow, error: lifetimeError }] = await Promise.all([
      supabaseAdmin.from('tier_daily_usage').select('feature_key, used').eq('usage_key', context.usageKey).eq('usage_date', usageDate),
      supabaseAdmin.from('tier_lifetime_usage').select('used').eq('usage_key', context.usageKey).eq('feature_key', 'custom_prv_create').maybeSingle(),
    ]);
    if (dailyError || lifetimeError) throw dailyError || lifetimeError;
    const dailyCounts = Object.fromEntries((dailyRows || []).map((row) => [row.feature_key, row.used])) as Record<string, number>;
    const limits = TIER_DAILY_LIMITS[context.tier];
    res.json({
      tier: context.tier,
      resetsAt: utcResetEpoch(),
      daily: {
        modelEarth: { used: dailyCounts['model:prv-v3.5-earth'] || 0, limit: limits.model_earth },
        modelLight: { used: dailyCounts['model:prv-v4-light'] || 0, limit: limits.model_light },
        modelV1ProMax: { used: dailyCounts['model:prv-v1-pro'] || 0, limit: limits.model_v1_max },
        images: { used: dailyCounts.images || 0, limit: limits.images },
        enhancement: { used: dailyCounts.enhance || 0, limit: limits.enhance },
        webSearch: { used: dailyCounts.search || 0, limit: limits.search },
      },
      lifetime: { customPrvs: { used: lifetimeRow?.used || 0, limit: limits.customPrvs } },
    });
  } catch (error) {
    console.error('Failed to load usage summary:', error);
    res.status(503).json({ error: 'Usage summary is temporarily unavailable.' });
  }
});

function serializeChatMessages(value: unknown): StoredChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.map((message) => {
    const item = (message || {}) as Record<string, unknown>;
    const role = item.role === 'assistant' ? 'assistant' : 'user';
    return {
      id: typeof item.id === 'string' ? item.id : randomUUID(),
      role,
      content: typeof item.content === 'string' ? item.content : '',
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
      ...(typeof item.thinking === 'string' ? { thinking: item.thinking } : {}),
      ...(typeof item.mode === 'string' ? { mode: item.mode } : {}),
    };
  });
}

function formatStoredChat(row: Record<string, any>) {
  return {
    id: row.id,
    title: row.title,
    messages: serializeChatMessages(row.messages),
    createdAt: typeof row.created_at === 'number' ? row.created_at : Date.parse(row.created_at),
    updatedAt: typeof row.updated_at === 'number' ? row.updated_at : Date.parse(row.updated_at),
    model: row.model,
    customPrv: row.custom_prv || undefined,
  };
}

function formatCustomPrv(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    model: row.model,
  };
}

function getModelApiName(model: string): string {
  const normalized = model.toLowerCase();
  if (normalized.includes('v3.5') || normalized.includes('earth') || normalized.includes('pro max') || normalized.includes('v1-pro')) {
    return 'gemma-4-31b-it';
  }
  if (normalized.includes('v4') || normalized.includes('light') || normalized.includes('base') || normalized.includes('v1.5')) {
    return 'gemma-4-27b-it';
  }
  return 'gemini-3.1-flash-lite';
}

function extractVisibleTextFromStreamPayload(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return (parts as any[])
    .filter((part: any) => !part?.thought)
    .map((part: any) => part?.text || '')
    .join('');
}

function getGeminiApiKey(): string {
  const apiKey = (GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Server configuration error: GEMINI_API_KEY (or GOOGLE_API_KEY) is not configured.');
  }
  return apiKey;
}

function getErrorInfo(error: unknown): { status?: number; message: string; details?: unknown } {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: number }).status)
    : undefined;
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Unknown error';
  const details = typeof error === 'object' && error !== null && 'details' in error
    ? (error as { details?: unknown }).details
    : undefined;

  return { status, message, details };
}

type GeminiPart = { text?: string; inline_data?: { mime_type: string; data: string } };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

function buildConversationContents(
  messages: Array<{ role: string; content: string; attachments?: Array<{ name: string }> }> | undefined,
  prompt: string,
  attachments?: Array<{ mimeType: string; data: string; name: string }>,
): GeminiContent[] {
  const earlierTurns: GeminiContent[] = (messages ?? [])
    .filter((message) => message.content.trim() || message.attachments?.length)
    .map((message) => {
      const fileNames = message.attachments?.map((attachment) => attachment.name).filter(Boolean) ?? [];
      const text = [
        message.content.trim(),
        fileNames.length ? `Files shared earlier: ${fileNames.join(', ')}` : '',
      ].filter(Boolean).join('\n');

      return {
        role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text }],
      };
    });

  const currentParts: GeminiPart[] = [{ text: prompt }];
  for (const attachment of attachments ?? []) {
    currentParts.push({
      inline_data: {
        mime_type: attachment.mimeType,
        data: attachment.data,
      },
    });
  }

  return [...earlierTurns, { role: 'user', parts: currentParts }];
}

function isIdentityQuestion(content: string): boolean {
  return /\b(who are you|what are you|what(?:'|’)s your name|your name|who made you|who created you|who developed you|are you prv ai|tell me about yourself)\b/i.test(content.trim());
}

async function streamGeminiContent({
  prompt,
  history,
  systemInstruction,
  model,
  onChunk,
  phase,
  attachments,
  signal,
}: {
  prompt: string;
  history?: Array<{ role: string; content: string; attachments?: Array<{ name: string }> }>;
  systemInstruction: string;
  model: string;
  onChunk: (chunk: { text?: string; thinking?: string; phase: 'thinking' | 'answer'; done: boolean }) => void;
  phase: 'thinking' | 'answer';
  attachments?: Array<{ mimeType: string; data: string; name: string }>;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = getGeminiApiKey();
  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: buildConversationContents(history, prompt, attachments),
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 1800,
          },
        }),
        signal,
      },
    );
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error('Gemini stream request failed', errorInfo);
    throw new Error(errorInfo.message || 'Gemini stream request failed.');
  }

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      errorBody = '';
    }

    const errorMessage = errorBody ? `Gemini stream request failed with status ${response.status}: ${errorBody}` : `Gemini stream request failed with status ${response.status}`;
    console.error('Gemini stream returned a non-OK response', {
      status: response.status,
      message: errorMessage,
      details: errorBody,
    });
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  let previousText = '';

  if (!reader) {
    throw new Error('Streaming response body is unavailable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.replace(/^data: /, '').trim();
        if (!payload) continue;
        if (payload === '[DONE]') {
          onChunk({ phase, done: true });
          return fullText;
        }

        try {
          const parsed = JSON.parse(payload);
          const piece = extractVisibleTextFromStreamPayload(parsed);
          if (!piece) continue;

          let delta = piece;
          if (piece.startsWith(previousText)) {
            delta = piece.slice(previousText.length);
          }

          if (delta) {
            fullText += delta;
            previousText = piece;
            onChunk({
              text: phase === 'answer' ? delta : undefined,
              thinking: phase === 'thinking' ? delta : undefined,
              phase,
              done: false,
            });
          }
        } catch {
          // Ignore malformed stream fragments.
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      return fullText;
    }
    throw error;
  }

  if (buffer.trim().startsWith('data: ')) {
    const payload = buffer.replace(/^data: /, '').trim();
    if (payload === '[DONE]') {
      onChunk({ phase, done: true });
      return fullText;
    }

    try {
      const parsed = JSON.parse(payload);
      const piece = extractVisibleTextFromStreamPayload(parsed);
      if (piece) {
        let delta = piece;
        if (piece.startsWith(previousText)) {
          delta = piece.slice(previousText.length);
        }
        if (delta) {
          fullText += delta;
          previousText = piece;
          onChunk({
            text: phase === 'answer' ? delta : undefined,
            thinking: phase === 'thinking' ? delta : undefined,
            phase,
            done: false,
          });
        }
      }
    } catch {
      // Ignore malformed trailing payload.
    }
  }

  onChunk({ phase, done: true });
  return fullText;
}

type GeminiStreamParams = {
  prompt: string;
  history?: Array<{ role: string; content: string; attachments?: Array<{ name: string }> }>;
  systemInstruction: string;
  model: string;
  onChunk: (chunk: { text?: string; thinking?: string; phase: 'thinking' | 'answer'; done: boolean }) => void;
  phase: 'thinking' | 'answer';
  attachments?: Array<{ mimeType: string; data: string; name: string }>;
  signal?: AbortSignal;
};

async function streamGeminiContentWithFallback(params: GeminiStreamParams): Promise<string> {
  try {
    return await streamGeminiContent(params);
  } catch (error) {
    const requestedModel = params.model;
    if (
      requestedModel.startsWith('gemma-4') &&
      requestedModel !== 'gemini-3.1-flash-lite' &&
      !params.signal?.aborted
    ) {
      console.warn(`Gemma model ${requestedModel} failed, falling back to gemini-3.1-flash-lite.`, error);
      return await streamGeminiContent({ ...params, model: 'gemini-3.1-flash-lite' });
    }
    throw error;
  }
}

app.get('/health', (_req: Request, res: ExpressResponse) => {
  res.json({ ok: true, message: 'PRV AI backend is running.' });
});

app.get('/wake-up', (_req: Request, res: ExpressResponse) => {
  res.json({ status: 'awake' });
});

async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY || !token) {
    return false;
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token }).toString(),
  });

  const data = await response.json() as { success?: boolean };
  return Boolean(data.success);
}

function createTurnstileSession(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TURNSTILE_SESSION_TTL_MS;
  const token = randomUUID();
  turnstileSessions.set(token, expiresAt);

  // Keep the in-memory store bounded even on a long-running service.
  for (const [sessionToken, sessionExpiresAt] of turnstileSessions) {
    if (sessionExpiresAt <= Date.now()) turnstileSessions.delete(sessionToken);
  }

  return { token, expiresAt };
}

function hasValidTurnstileSession(token: string): boolean {
  const expiresAt = turnstileSessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    turnstileSessions.delete(token);
    return false;
  }
  return true;
}

app.post('/api/turnstile/verify', async (req: Request, res: ExpressResponse) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ message: 'Turnstile token is required.' });
    return;
  }

  try {
    const isValid = await verifyTurnstileToken(token);
    if (!isValid) {
      res.status(403).json({ message: 'Turnstile verification failed.' });
      return;
    }

    const session = createTurnstileSession();
    res.json({ success: true, verificationToken: session.token, expiresAt: session.expiresAt });
  } catch (error) {
    console.error('Turnstile verification error:', error);
    res.status(500).json({ message: 'Unable to verify Turnstile token.' });
  }
});

app.post('/api/images/generate', dailyQuota('images'), async (req: Request, res: ExpressResponse) => {
  const { prompt, turnstileToken } = req.body as { prompt?: string; turnstileToken?: string };
  const trimmedPrompt = prompt?.trim().slice(0, 2048) || '';

  if (!trimmedPrompt) {
    res.status(400).json({ error: 'A prompt is required to create an image.' });
    return;
  }
  if (!turnstileToken || !(hasValidTurnstileSession(turnstileToken) || await verifyTurnstileToken(turnstileToken))) {
    res.status(403).json({ error: 'Turnstile verification failed.' });
    return;
  }
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    res.status(500).json({ error: 'Image generation is not configured on the server.' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: trimmedPrompt, steps: 4 }),
      },
    );
    const data = await response.json() as { result?: { image?: string }; errors?: Array<{ message?: string }> };
    if (!response.ok || !data.result?.image) {
      const providerError = data.errors?.map((error) => error.message).filter(Boolean).join(', ');
      res.status(502).json({ error: providerError || `Cloudflare image generation failed with status ${response.status}.` });
      return;
    }

    res.json({ imageUrl: `data:image/jpeg;base64,${data.result.image}` });
  } catch (error) {
    console.error('Cloudflare image generation error:', error);
    res.status(502).json({ error: error instanceof Error ? error.message : 'Image generation failed.' });
  }
});

app.post('/api/redeem-invite', async (req: Request, res: ExpressResponse) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user || !supabaseAdmin) return;

  if (!INVITE_RATE_LIMIT_SECRET) {
    console.error('INVITE_RATE_LIMIT_SECRET is not configured.');
    res.status(503).json({ error: 'Invite redemption is temporarily unavailable.' });
    return;
  }

  const rawCode = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!/^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/.test(rawCode)) {
    res.status(400).json({ error: 'Enter a valid invite code.' });
    return;
  }

  // The SQL function increments both the IP and user buckets atomically.
  const { data: rateLimitAllowed, error: rateLimitError } = await supabaseAdmin.rpc('consume_invite_attempt', {
    p_ip_key: rateLimitKey('ip', req.ip || req.socket.remoteAddress || 'unknown'),
    p_user_key: rateLimitKey('user', user.id),
  });
  if (rateLimitError) {
    console.error('Invite rate-limit check failed:', rateLimitError);
    res.status(503).json({ error: 'Invite redemption is temporarily unavailable.' });
    return;
  }
  if (rateLimitAllowed !== true) {
    res.setHeader('Retry-After', '900');
    res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    return;
  }

  // Only a digest is stored in Postgres. The submitted plaintext code is never
  // logged or persisted by the API.
  const codeHash = createHash('sha256').update(rawCode, 'ascii').digest('hex');
  const { data, error } = await supabaseAdmin.rpc('redeem_invite_code', {
    p_code_hash: codeHash,
    p_user_id: user.id,
  });
  if (error) {
    console.error('Invite redemption failed:', error);
    res.status(500).json({ error: 'Unable to redeem this invite right now.' });
    return;
  }

  const result = data as { redeemed?: boolean; tier?: Tier } | null;
  if (!result?.redeemed || !result.tier) {
    // Do not tell an unauthenticated attacker whether a guessed code exists.
    res.status(400).json({ error: 'This invite code is invalid, expired, inactive, or fully used.' });
    return;
  }
  res.json({ tier: result.tier });
});

// Example protected endpoint. Apply requireTier('plus') or requireTier('pro')
// to each paid feature route; hiding UI controls is not authorization.
app.get('/api/plus/access-check', requireTier('plus'), (_req, res) => res.json({ allowed: true }));
app.get('/api/pro/access-check', requireTier('pro'), (_req, res) => res.json({ allowed: true }));

app.get('/api/chats', async (req: Request, res: ExpressResponse) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user || !supabaseAdmin) return;

  const { data, error } = await supabaseAdmin
    .from('chats')
    .select('id, title, model, messages, custom_prv, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load chats:', error);
    res.status(500).json({ error: 'Unable to load your saved chats.' });
    return;
  }

  res.json({ chats: (data || []).map((row) => formatStoredChat(row)) });
});

app.put('/api/chats/:chatId', async (req: Request, res: ExpressResponse) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user || !supabaseAdmin) return;

  const chatId = String(req.params.chatId);
  if (!/^c[a-zA-Z0-9_-]{8,100}$/.test(chatId)) {
    res.status(400).json({ error: 'Invalid chat URL.' });
    return;
  }

  const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 160) : '';
  const model = typeof req.body?.model === 'string' ? req.body.model : 'prv-v3.2-fire';
  const messages = serializeChatMessages(req.body?.messages);
  if (!title) {
    res.status(400).json({ error: 'A chat title is required.' });
    return;
  }

  const customPrv = req.body?.customPrv && typeof req.body.customPrv === 'object'
    ? {
        id: String(req.body.customPrv.id || '').slice(0, 120),
        name: String(req.body.customPrv.name || '').slice(0, 120),
        description: String(req.body.customPrv.description || '').slice(0, 300),
        instructions: String(req.body.customPrv.instructions || '').slice(0, 12000),
        model: req.body.customPrv.model === 'prv-v1-flash' ? 'prv-v1-flash' : 'prv-v3.2-fire',
      }
    : null;
  const payload = { id: chatId, user_id: user.id, title, model, messages, custom_prv: customPrv };
  if (JSON.stringify(payload).length > 1_500_000) {
    res.status(413).json({ error: 'This chat is too large to save.' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('chats')
    .upsert(payload, { onConflict: 'id' })
    .select('id, title, model, messages, custom_prv, created_at, updated_at')
    .single();

  if (error) {
    console.error('Failed to save chat:', error);
    res.status(500).json({ error: 'Unable to save this chat.' });
    return;
  }

  res.json(formatStoredChat(data));
});

app.delete('/api/chats/:chatId', async (req: Request, res: ExpressResponse) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user || !supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from('chats')
    .delete()
    .eq('id', String(req.params.chatId))
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete chat:', error);
    res.status(500).json({ error: 'Unable to delete this chat.' });
    return;
  }
  res.status(204).end();
});

app.get('/api/custom-prvs', async (_req: Request, res: ExpressResponse) => {
  if (!supabaseAdmin) {
    res.json({ customPrvs: [] });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('custom_prvs')
    .select('id, name, description, instructions, model')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to load public Custom PRVs:', error);
    res.status(500).json({ error: 'Unable to load public Custom PRVs.' });
    return;
  }
  res.json({ customPrvs: (data || []).map((row) => formatCustomPrv(row)) });
});

// Custom PRV lifetime usage counts only creations after this quota system ships.
app.post('/api/custom-prvs', async (req: Request, res: ExpressResponse) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user || !supabaseAdmin) return;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim().slice(0, 300) : '';
  const instructions = typeof req.body?.instructions === 'string' ? req.body.instructions.trim().slice(0, 12000) : '';
  if (!name || !instructions) {
    res.status(400).json({ error: 'A name and instruction are required.' });
    return;
  }
  const model = req.body?.model === 'prv-v1-flash' ? 'prv-v1-flash' : 'prv-v3.2-fire';
  try {
    const context = await getUsageContext(req);
    const limit = TIER_DAILY_LIMITS[context.tier].customPrvs;
    const { data, error } = await supabaseAdmin.rpc('create_custom_prv_with_quota', {
      p_usage_key: context.usageKey,
      p_lifetime_limit: limit,
      p_id: `cprv${randomUUID().replace(/-/g, '')}`,
      p_creator_id: user.id,
      p_name: name,
      p_description: description,
      p_instructions: instructions,
      p_model: model,
    });
    if (error) throw error;
    const result = data as { allowed?: boolean; used?: number; limit?: number; custom_prv?: Record<string, any> };
    res.setHeader('X-RateLimit-Limit', result.limit === null ? 'unlimited' : String(result.limit ?? limit ?? 'unlimited'));
    res.setHeader('X-RateLimit-Remaining', result.limit === null || limit === null ? 'unlimited' : String(Math.max(0, limit - (result.used || 0))));
    res.setHeader('X-RateLimit-Reset', '0');
    if (!result.allowed || !result.custom_prv) {
      res.status(429).json({ error: 'Your lifetime Custom PRV creation limit has been reached. Upgrade with an invite code for a larger allowance.' });
      return;
    }
    res.status(201).json(formatCustomPrv(result.custom_prv));
  } catch (error) {
    console.error('Failed to create Custom PRV:', error);
    res.status(503).json({ error: 'Unable to publish this Custom PRV right now.' });
  }
});

app.post('/api/custom-prv/enhance', dailyQuota('enhance'), async (req: Request, res: ExpressResponse) => {
  const { prompt, kind, turnstileToken } = req.body as { prompt?: string; kind?: 'chat' | 'custom'; turnstileToken?: string };
  if (!prompt?.trim()) {
    res.status(400).json({ error: 'A custom PRV description is required.' });
    return;
  }
  if (!turnstileToken || !(hasValidTurnstileSession(turnstileToken) || await verifyTurnstileToken(turnstileToken))) {
    res.status(403).json({ error: 'Turnstile verification failed.' });
    return;
  }

  try {
    const apiKey = getGeminiApiKey();
    const response = await fetch(
      `${GEMINI_BASE_URL}/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: kind === 'chat'
                ? `Improve the following user prompt so an AI can answer it more accurately. Return only the improved prompt, with no preface, no quotation marks, and no labels such as "Enhanced prompt". Preserve the user's intent, add useful missing context or structure, and do not answer the prompt.\n\nRaw prompt:\n${prompt.trim()}`
                : `Rewrite the following rough description into a precise system instruction for a specialized AI assistant. Return only the rewritten instruction, with no preface, no quotation marks, and no labels such as "Enhanced prompt". Preserve the user's intent, define the assistant's role, workflow, quality bar, and output style.\n\nRough description:\n${prompt.trim()}`,
            }],
          }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 900 },
        }),
      },
    );
    if (!response.ok) {
      res.status(502).json({ error: `Prompt enhancement failed with status ${response.status}.` });
      return;
    }
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const enhanced = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!enhanced) {
      res.status(502).json({ error: 'Prompt enhancement returned no text.' });
      return;
    }
    res.json({ prompt: enhanced });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Prompt enhancement failed.' });
  }
});

app.post('/api/chat/stream', modelQuota, async (req: Request, res: ExpressResponse) => {
  const payload = normalizeChatRequestPayload(req.body, req.headers as Record<string, string | undefined>);
  const { content, model, mode, history, attachments, customInstructions, turnstileToken } = payload;

  if (!turnstileToken) {
    res.status(403).json({ message: 'Turnstile verification token is required.' });
    return;
  }

  // The browser normally sends the opaque ticket returned by
  // /api/turnstile/verify.  Accepting a fresh Cloudflare token as a fallback
  // also keeps direct API clients working.
  const isTurnstileValid = hasValidTurnstileSession(turnstileToken)
    || await verifyTurnstileToken(turnstileToken);
  if (!isTurnstileValid) {
    res.status(403).json({ message: 'Turnstile verification failed.' });
    return;
  }

  if (!content) {
    res.status(400).json({ error: 'A chat message is required.' });
    return;
  }

  try {
    getGeminiApiKey();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server configuration error.';
    console.error('Gemini chat stream route configuration error', { message });
    res.status(500).json({ error: message });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const resolvedMode = mode === 'auto' ? 'fast' : mode;
  const apiModel = getModelApiName(model || 'prv-v1-flash');
  const customInstructionBlock = customInstructions?.trim()
    ? `\n\nSpecialized Custom PRV instructions:\n${customInstructions.trim().slice(0, 12000)}`
    : '';
  const systemInstructions = `You are PRV AI, developed by PRV AI Team. Answer the user's current request directly and do not add an introduction about your identity. Never begin a normal answer with "I am PRV AI" or mention the PRV AI Team unless the user explicitly asks who you are, what your name is, who made or developed you, or asks a closely related identity question. Do not mention your infrastructure, backend provider, model version, or platform unless the user explicitly asks. Do not mention Google, Gemini, or Gemma unless the user explicitly asks about the backend provider.${customInstructionBlock}`;
  const identityInstruction = isIdentityQuestion(content)
    ? '\nThe user explicitly asked about your identity. Identify yourself briefly as: "I am PRV AI, developed by PRV AI Team."'
    : '\nThis is not an identity question. Do not mention your identity or development team in the answer.';

  const continuityInstructions = '\nUse every earlier user and assistant turn in this conversation as context. Keep facts, preferences, names, and decisions consistent across turns. If the user refers to something earlier, resolve it from this chat before asking them to repeat it.';
  const thinkingSystemInstruction = `${systemInstructions}${identityInstruction}${continuityInstructions}\nFor thinking mode, produce a concise hidden reasoning outline for the latest user request. Keep it short, structured, and useful. Do not provide the final answer.`;
  const answerSystemInstruction = `${systemInstructions}${identityInstruction}${continuityInstructions}\nAnswer the latest user request directly and clearly. Provide a detailed, complete response and avoid overly brief answers. When files are attached to the latest request, mention each file and explain its relevance.`;

  const transmit = (eventName: string, payload: unknown) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    if (resolvedMode === 'thinking') {
      const thinking = await streamGeminiContentWithFallback({
        prompt: content,
        history,
        systemInstruction: thinkingSystemInstruction,
        model: apiModel,
        onChunk: (chunk) => {
          transmit('chunk', { ...chunk, phase: 'thinking' });
        },
        phase: 'thinking',
        attachments,
        signal: controller.signal,
      });

      const finalAnswer = await streamGeminiContentWithFallback({
        prompt: content,
        history,
        systemInstruction: answerSystemInstruction,
        model: apiModel,
        onChunk: (chunk) => {
          transmit('chunk', { ...chunk, phase: 'answer' });
        },
        phase: 'answer',
        attachments,
        signal: controller.signal,
      });

      transmit('done', { content: finalAnswer || 'I’m ready to help with that.', thinking: thinking || 'Working through the request...' });
    } else {
      const finalAnswer = await streamGeminiContentWithFallback({
        prompt: content,
        history,
        systemInstruction: answerSystemInstruction,
        model: apiModel,
        onChunk: (chunk) => {
          transmit('chunk', { ...chunk, phase: 'answer' });
        },
        phase: 'answer',
        attachments,
        signal: controller.signal,
      });

      transmit('done', { content: finalAnswer || 'I’m ready to help with that.' });
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error('Gemini chat stream route error', errorInfo);
    transmit('error', {
      message: errorInfo.message || 'Gemini stream failed.',
    });
  } finally {
    res.end();
  }
});

app.post('/api/search/tavily', dailyQuota('search'), async (req: Request, res: ExpressResponse) => {
  const { query } = req.body as { query?: string };

  if (!query) {
    res.status(400).json({ error: 'A search query is required.' });
    return;
  }

  if (!TAVILY_API_KEY) {
    res.status(500).json({ error: 'TAVILY_API_KEY is not configured on the server.' });
    return;
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'advanced',
      max_results: 6,
      include_answer: true,
      include_raw_content: true,
      topic: 'general',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    res.status(502).json({ error: `Tavily search failed with status ${response.status}: ${body}` });
    return;
  }

  const data = (await response.json()) as {
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string; raw_content?: string }>;
  };

  const answer = data.answer?.trim() || '';
  const results = Array.isArray(data.results) ? data.results.slice(0, 6) : [];
  const formattedResults = results
    .map((result, index) => {
      const title = result.title?.trim() || result.url || `Source ${index + 1}`;
      const url = result.url ? `URL: ${result.url}` : '';
      const content = (result.content || result.raw_content || '').trim();
      return [`Source ${index + 1}: ${title}`, url, content ? `Snippet: ${content}` : '']
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const parts: string[] = [];
  if (answer) parts.push(`Tavily summary:\n${answer}`);
  if (formattedResults) parts.push(`Web search results:\n${formattedResults}`);

  res.json({ result: parts.join('\n\n') });
});

app.post('/api/auth/refresh', async (req: Request, res: ExpressResponse) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({ error: 'A refresh token is required.' });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Supabase refresh endpoint is not configured.' });
    return;
  }

  try {
    const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      res.status(502).json({ error: data?.error_description || data?.error || 'Failed to refresh auth token.' });
      return;
    }

    res.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Failed to refresh auth token.' });
  }
});

app.get('/api/auth/session', async (req: Request, res: ExpressResponse) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token || !supabaseAdmin) {
    res.json({ user: null });
    return;
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ user: null, error: error?.message || 'Your session is no longer valid.' });
    return;
  }

  const { data: entitlement, error: entitlementError } = await supabaseAdmin
    .from('user_entitlements')
    .select('tier')
    .eq('user_id', user.id)
    .maybeSingle();
  if (entitlementError) {
    console.error('Failed to load account tier:', entitlementError);
    res.status(500).json({ error: 'Unable to load your account.' });
    return;
  }
  res.json({ user: { ...user, tier: entitlement?.tier || 'free' } });
});

app.post('/api/auth/sign-in/oauth', async (req: Request, res: ExpressResponse) => {
  const { provider, redirectTo } = req.body as { provider?: string; redirectTo?: string };
  if (!provider || !redirectTo || !SUPABASE_URL) {
    res.status(400).json({ error: 'A provider and redirect URL are required.' });
    return;
  }

  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirectTo)}`;
  res.json({ url: authUrl });
});

app.post('/api/auth/sign-in/otp', async (req: Request, res: ExpressResponse) => {
  const { email, redirectTo } = req.body as { email?: string; redirectTo?: string };
  if (!email || !redirectTo || !supabaseAdmin) {
    res.status(400).json({ error: 'Email and redirect URL are required.' });
    return;
  }

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ ok: true });
});

app.post('/api/auth/logout', (_req: Request, res: ExpressResponse) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`PRV AI backend listening on port ${PORT}`);
});
