export interface ChatStreamRequestPayload {
  content: string;
  model?: string;
  mode?: string;
  history?: Array<{ role: string; content: string; attachments?: Array<{ name: string }> }>;
  attachments?: Array<{ name: string; mimeType: string; data: string }>;
  customInstructions?: string;
  turnstileToken?: string;
  authorization?: string;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

export function normalizeChatRequestPayload(body: unknown, headers?: Record<string, string | undefined>): ChatStreamRequestPayload {
  const payload = (body ?? {}) as Record<string, unknown>;
  const normalizedHeaders = headers ?? {};

  return {
    content: asString(payload.content) || asString(payload.message) || '',
    model: asString(payload.model),
    mode: asString(payload.mode),
    history: Array.isArray(payload.history) ? payload.history as ChatStreamRequestPayload['history'] : undefined,
    attachments: Array.isArray(payload.attachments) ? payload.attachments as ChatStreamRequestPayload['attachments'] : undefined,
    customInstructions: asString(payload.customInstructions),
    turnstileToken: asString(payload.turnstileToken)
      || asString(payload.turnstile)
      || asString(payload.token)
      || asString(normalizedHeaders['x-turnstile-token'])
      || asString(normalizedHeaders['x-turnstile'])
      || asString(normalizedHeaders['authorization']?.replace(/^Bearer\s+/i, '').trim()),
    authorization: asString(normalizedHeaders.authorization),
  };
}
