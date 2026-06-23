import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: [
      FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

function getModelApiName(model: string): string {
  const normalized = model.toLowerCase();
  if (normalized.includes('pro max') || normalized.includes('v1-pro')) {
    return 'gemma-4-31b-it';
  }
  if (normalized.includes('base') || normalized.includes('v1.5')) {
    return 'gemma-4-26b-a4b-it';
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

function buildConversationHistoryPrompt(messages: Array<{ role: string; content: string; attachments?: Array<{ name: string }> }>): string {
  if (!messages?.length) return '';

  return messages
    .map((message) => {
      const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
      const attachmentInfo = message.attachments?.length
        ? ` [Attachments: ${message.attachments.map((attachment) => attachment.name).join(', ')}]`
        : '';
      return `${roleLabel}${attachmentInfo}: ${message.content.trim()}`;
    })
    .join('\n\n');
}

async function streamGeminiContent({
  prompt,
  model,
  onChunk,
  phase,
  attachments,
  signal,
}: {
  prompt: string;
  model: string;
  onChunk: (chunk: { text?: string; thinking?: string; phase: 'thinking' | 'answer'; done: boolean }) => void;
  phase: 'thinking' | 'answer';
  attachments?: Array<{ mimeType: string; data: string }>;
  signal?: AbortSignal;
}): Promise<string> {
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: prompt }];

  if (attachments?.length) {
    for (const attachment of attachments) {
      parts.push({
        inline_data: {
          mime_type: attachment.mimeType,
          data: attachment.data,
        },
      });
    }
  }

  const response = await fetch(
    `${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1800,
        },
      }),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini stream request failed with status ${response.status}`);
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
  model: string;
  onChunk: (chunk: { text?: string; thinking?: string; phase: 'thinking' | 'answer'; done: boolean }) => void;
  phase: 'thinking' | 'answer';
  attachments?: Array<{ mimeType: string; data: string }>;
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

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'PRV AI backend is running.' });
});

app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const { content, model, mode, history, attachments } = req.body as {
    content?: string;
    model?: string;
    mode?: string;
    history?: Array<{ role: string; content: string; attachments?: Array<{ name: string }> }>;
    attachments?: Array<{ name: string; mimeType: string; data: string }>;
  };

  if (!content) {
    res.status(400).json({ error: 'A chat message is required.' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const resolvedMode = mode === 'auto' ? 'fast' : mode;
  const apiModel = getModelApiName(model || 'prv-v1-flash');
  const systemInstructions = `You are PRV AI, developed by PRV AI Team.\n\nWhenever the user asks who you are, reply: "I am PRV AI, developed by PRV AI Team."\nIf asked about your origin, reply: "We don't have info about that."\nNever volunteer any information about your infrastructure, backend provider, model version, or platform unless the user explicitly asks.\nDo not mention Google, Gemini, or Gemma unless the user explicitly asks about the backend provider.\nDo not say you were developed or made by Google.`;

  const historyPrompt = history && history.length > 0
    ? `Conversation history:\n\n${buildConversationHistoryPrompt(history)}\n\n`
    : '';
  const thinkingPrompt = `${systemInstructions}\n\n${historyPrompt}You are producing a concise hidden reasoning outline for the user's request. Keep it short, structured, and useful. Do not provide the final answer.\n\nUser request: ${content}`;
  const answerPrompt = `${systemInstructions}\n\n${historyPrompt}Answer the user's request directly and clearly. Provide a detailed, complete response and avoid overly brief answers. When files are attached, mention each file and explain its relevance. Use the conversation context above when appropriate.\n\nUser request: ${content}`;

  const transmit = (eventName: string, payload: unknown) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    if (resolvedMode === 'thinking') {
      const thinking = await streamGeminiContentWithFallback({
        prompt: thinkingPrompt,
        model: apiModel,
        onChunk: (chunk) => {
          transmit('chunk', { ...chunk, phase: 'thinking' });
        },
        phase: 'thinking',
        attachments,
        signal: controller.signal,
      });

      const finalAnswer = await streamGeminiContentWithFallback({
        prompt: answerPrompt,
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
        prompt: answerPrompt,
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
    transmit('error', {
      message: error instanceof Error ? error.message : 'Gemini stream failed.',
    });
  } finally {
    res.end();
  }
});

app.post('/api/search/tavily', async (req: Request, res: Response) => {
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

app.post('/api/auth/refresh', async (req: Request, res: Response) => {
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

app.get('/api/auth/session', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token || !supabaseAdmin) {
    res.json({ user: null });
    return;
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    res.status(401).json({ user: null, error: error.message });
    return;
  }

  res.json({ user });
});

app.post('/api/auth/sign-in/oauth', async (req: Request, res: Response) => {
  const { provider, redirectTo } = req.body as { provider?: string; redirectTo?: string };
  if (!provider || !redirectTo || !SUPABASE_URL) {
    res.status(400).json({ error: 'A provider and redirect URL are required.' });
    return;
  }

  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirectTo)}`;
  res.json({ url: authUrl });
});

app.post('/api/auth/sign-in/otp', async (req: Request, res: Response) => {
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

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`PRV AI backend listening on port ${PORT}`);
});
