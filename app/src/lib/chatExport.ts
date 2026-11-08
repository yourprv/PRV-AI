import type { Chat, Message } from '@/types/chat';

function safeFilePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'prv-chat';
}

function downloadFile(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatMessage(message: Message): string {
  const speaker = message.role === 'user' ? 'You' : 'PRV';
  const timestamp = new Date(message.timestamp).toLocaleString();
  const sections = [`## ${speaker}`, `_${timestamp}_`, message.content || (message.imageUrl ? 'Generated image' : '_No text_')];

  if (message.attachments?.length) {
    sections.push(`**Files:** ${message.attachments.map((attachment) => attachment.name).join(', ')}`);
  }

  if (message.imageUrl) {
    sections.push(`![Generated image](${message.imageUrl})`);
  }

  if (message.thinking?.trim()) {
    sections.push(`<details>\n<summary>Thinking notes</summary>\n\n${message.thinking.trim()}\n</details>`);
  }

  return sections.join('\n\n');
}

export function exportChatAsMarkdown(chat: Chat): void {
  const messages = chat.messages.map(formatMessage).join('\n\n---\n\n');
  const markdown = [
    `# ${chat.title}`,
    `Exported from PRV on ${new Date().toLocaleString()}`,
    `Model: ${chat.model}`,
    '',
    messages || '_This chat has no messages yet._',
  ].join('\n\n');

  downloadFile(`${safeFilePart(chat.title)}.md`, markdown, 'text/markdown;charset=utf-8');
}

export function exportChatsAsJson(chats: Chat[]): void {
  const archive = {
    format: 'PRV chat archive',
    version: 1,
    exportedAt: new Date().toISOString(),
    chats,
  };
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`prv-chats-${date}.json`, JSON.stringify(archive, null, 2), 'application/json;charset=utf-8');
}
