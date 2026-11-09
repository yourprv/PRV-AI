import type { Chat } from '@/types/chat';

export interface ChatHistoryGroups {
  today: Chat[];
  yesterday: Chat[];
  previous7Days: Chat[];
  previous30Days: Chat[];
  older: Chat[];
}

function getCreatedAt(chat: Chat): number {
  const value: unknown = chat.createdAt;
  const timestamp = typeof value === 'number' ? value : Date.parse(String(value ?? ''));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortChatsNewestFirst(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => getCreatedAt(b) - getCreatedAt(a));
}

export function groupChatsByCreatedAt(chats: Chat[], now = Date.now()): ChatHistoryGroups {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const sevenDaysStart = new Date(todayStart);
  sevenDaysStart.setDate(sevenDaysStart.getDate() - 7);

  const thirtyDaysStart = new Date(todayStart);
  thirtyDaysStart.setDate(thirtyDaysStart.getDate() - 30);

  const groups: ChatHistoryGroups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    older: [],
  };

  for (const chat of sortChatsNewestFirst(chats)) {
    const createdAt = getCreatedAt(chat);
    if (createdAt >= todayStart.getTime()) {
      groups.today.push(chat);
    } else if (createdAt >= yesterdayStart.getTime()) {
      groups.yesterday.push(chat);
    } else if (createdAt >= sevenDaysStart.getTime()) {
      groups.previous7Days.push(chat);
    } else if (createdAt >= thirtyDaysStart.getTime()) {
      groups.previous30Days.push(chat);
    } else {
      groups.older.push(chat);
    }
  }

  return groups;
}
