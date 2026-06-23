import type { Message, ModeType, Attachment, ModelId } from '@/types/chat';
import { getApiBaseUrl } from '@/lib/api';

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
  const response = await fetch(`${getApiBaseUrl()}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      model,
      mode,
      history,
      attachments,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to reach backend chat endpoint: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let thinkingText = '';

  if (!reader) {
    throw new Error('Streaming response body is unavailable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\n\n/);
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        if (!part.startsWith('event: ')) continue;
        const eventLines = part.split('\n').filter(Boolean);
        const eventName = eventLines[0].replace(/^event:\s*/, '').trim();
        const dataLine = eventLines.find((line) => line.startsWith('data: '));
        if (!dataLine) continue;

        const payload = JSON.parse(dataLine.replace(/^data:\s*/, '').trim());
        if (eventName === 'chunk') {
          const chunk = payload as GeminiStreamChunk;
          if (chunk.phase === 'thinking') {
            if (chunk.thinking) {
              thinkingText += chunk.thinking;
              onChunk({ ...chunk, thinking: chunk.thinking });
            }
          } else if (chunk.phase === 'answer' && chunk.text) {
            fullText += chunk.text;
            onChunk({ ...chunk, text: chunk.text });
          }
        } else if (eventName === 'done') {
          const donePayload = payload as { content?: string; thinking?: string };
          return {
            content: donePayload.content || fullText || 'I’m ready to help with that.',
            thinking: donePayload.thinking || thinkingText || undefined,
          };
        } else if (eventName === 'error') {
          throw new Error((payload as { message?: string }).message || 'Backend chat stream failed.');
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      return {
        content: fullText || 'Response cancelled.',
        thinking: thinkingText || undefined,
      };
    }
    throw error;
  }

  const trailing = buffer.trim();
  if (trailing) {
    const eventLines = trailing.split('\n').filter(Boolean);
    const eventName = eventLines[0].replace(/^event:\s*/, '').trim();
    const dataLine = eventLines.find((line) => line.startsWith('data: '));
    if (dataLine) {
      const payload = JSON.parse(dataLine.replace(/^data:\s*/, '').trim());
      if (eventName === 'done') {
        const donePayload = payload as { content?: string; thinking?: string };
        return {
          content: donePayload.content || fullText || 'I’m ready to help with that.',
          thinking: donePayload.thinking || thinkingText || undefined,
        };
      }
    }
  }

  return {
    content: fullText || 'I’m ready to help with that.',
    thinking: thinkingText || undefined,
  };
}
