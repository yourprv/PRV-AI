import { AVAILABLE_MODELS } from '@/types/chat';
import type { Message, ModeType, Attachment, ModelId } from '@/types/chat';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
if (!GEMINI_API_KEY) {
  // It's safer to fail gracefully in dev; ensure users set VITE_GEMINI_API_KEY in app/.env
  console.warn('VITE_GEMINI_API_KEY is not set. Gemini requests will likely fail.');
}
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiStreamChunk {
  text?: string;
  thinking?: string;
  phase: 'thinking' | 'answer';
  done: boolean;
}

export interface GeminiReply {
  content: string;
  thinking?: string;
}

function getModelApiName(model: ModelId): string {
  const modelEntry = AVAILABLE_MODELS.find((item) => item.id === model);
  return modelEntry?.api ?? 'gemini-3.1-flash-lite';
}

function getModelDisplayName(model: ModelId): string {
  const modelEntry = AVAILABLE_MODELS.find((item) => item.id === model);
  return modelEntry?.name ?? 'PRV AI model';
}

function extractVisibleTextFromStreamPayload(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return (parts as any[])
    .filter((part: any) => !part?.thought)
    .map((part: any) => part?.text || '')
    .join('');
}

function buildConversationHistoryPrompt(messages: Message[]): string {
  if (!messages?.length) return '';

  return messages
    .map((message) => {
      const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
      const attachmentInfo = message.attachments?.length
        ? ` [Attachments: ${message.attachments.map((a) => a.name).join(', ')}]`
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
  onChunk: (chunk: GeminiStreamChunk) => void;
  phase: 'thinking' | 'answer';
  attachments?: Attachment[];
  signal?: AbortSignal;
}): Promise<string> {
  // Build the parts array with text and attachments
  const parts: any[] = [{ text: prompt }];
  
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      parts.push({
        inline_data: {
          mime_type: attachment.mimeType,
          data: attachment.data,
        },
      });
    }
  }

  const response = await fetch(`${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1800,
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gemini stream request failed with status ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  if (!reader) {
    throw new Error('Streaming response body is unavailable');
  }

  let previousText = '';

  try {
    while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

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
        // Ignore malformed stream fragments
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
      // Ignore malformed trailing payload
    }
  }

  onChunk({ phase, done: true });
  return fullText;
}

export async function streamGeminiReply({
  content,
  model,
  mode,
  history,
  onChunk,
  attachments,
  signal,
}: {
  content: string;
  model: ModelId;
  mode: ModeType;
  history?: Message[];
  onChunk: (chunk: GeminiStreamChunk) => void;
  attachments?: Attachment[];
  signal?: AbortSignal;
}): Promise<GeminiReply> {
  const resolvedMode = mode === 'auto' ? 'fast' : mode;
  const apiModel = getModelApiName(model);

  const systemInstructions = `You are PRV AI, developed by PRV AI Team.\n\nWhenever the user asks who you are, reply: "I am PRV AI, developed by PRV AI Team."\nIf asked about your origin, reply: "We don't have info about that."\nNever volunteer any information about your infrastructure, backend provider, model version, or platform unless the user explicitly asks.\nDo not mention Google, Gemini, or Gemma unless the user explicitly asks about the backend provider.\nDo not say you were developed or made by Google.`;

  const historyPrompt = history && history.length > 0
    ? `Conversation history:\n\n${buildConversationHistoryPrompt(history)}\n\n`
    : '';

  const thinkingPrompt = `${systemInstructions}\n\n${historyPrompt}You are producing a concise hidden reasoning outline for the user's request. Keep it short, structured, and useful. Do not provide the final answer.\n\nUser request: ${content}`;
  const answerPrompt = `${systemInstructions}\n\n${historyPrompt}Answer the user's request directly and clearly. Provide a detailed, complete response and avoid overly brief answers. When files are attached, mention each file and explain its relevance. Use the conversation context above when appropriate.\n\nUser request: ${content}`;

  if (resolvedMode === 'thinking') {
    const thinking = await streamGeminiContent({
      prompt: thinkingPrompt,
      model: apiModel,
      onChunk,
      phase: 'thinking',
      attachments,
      signal,
    });

    const finalAnswer = await streamGeminiContent({
      prompt: answerPrompt,
      model: apiModel,
      onChunk,
      phase: 'answer',
      attachments,
      signal,
    });

    return {
      content: finalAnswer || 'I’m ready to help with that.',
      thinking: thinking || 'Working through the request...',
    };
  }

  const finalAnswer = await streamGeminiContent({
    prompt: answerPrompt,
    model: apiModel,
    onChunk,
    phase: 'answer',
    attachments,
    signal,
  });

  return {
    content: finalAnswer || 'I’m ready to help with that.',
  };
}
