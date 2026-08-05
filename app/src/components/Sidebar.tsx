import { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ChevronDown,
  MessageSquare,
  Pencil,
  Trash2,
  Code2,
} from 'lucide-react';
import { LoginSection } from './LoginSection';
import type { Chat } from '@/types/chat';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onSearchOpen: () => void;
  onRenameChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onCustomPRV: () => void;
}

export function Sidebar({
  isExpanded,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onSearchOpen,
  onRenameChat,
  onDeleteChat,
  onCustomPRV,
}: SidebarProps) {
  const [chatsExpanded, setChatsExpanded] = useState(true);

  const yesterdayChats = chats.filter(
    (c) => Date.now() - c.updatedAt < 86400000 && Date.now() - c.updatedAt > 0
  );
  const weekChats = chats.filter(
    (c) => Date.now() - c.updatedAt >= 86400000 && Date.now() - c.updatedAt < 604800000
  );
  const monthChats = chats.filter(
    (c) => Date.now() - c.updatedAt >= 604800000 && Date.now() - c.updatedAt < 2592000000
  );
  const olderChats = chats.filter(
    (c) => Date.now() - c.updatedAt >= 2592000000
  );

  const renderChatGroup = (title: string, groupChats: Chat[]) => {
    if (groupChats.length === 0) return null;
    return (
      <div key={title} className="mb-2">
        <div className="px-3 py-1.5 text-[11px] font-medium text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wider">
          {title}
        </div>
        {groupChats.map((chat) => (
          <div
            key={chat.id}
            className={`group w-full rounded-lg overflow-hidden transition-colors duration-150 ${
              activeChatId === chat.id ? 'bg-[#F5F5F7] dark:bg-[#374151]' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
              <button
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className={`flex-1 text-left truncate ${
                  activeChatId === chat.id
                    ? 'text-[#111827] dark:text-[#F3F4F6] font-medium'
                    : 'text-[#374151] dark:text-[#D1D5DB] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
                }`}
              >
                {chat.title}
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRenameChat(chat.id);
                  }}
                  className="p-1 rounded-md text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#374151] transition-colors duration-150"
                  aria-label={`Rename ${chat.title}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="p-1 rounded-md text-[#EF4444] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D] transition-colors duration-150"
                  aria-label={`Delete ${chat.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Collapsed sidebar
  if (!isExpanded) {
    return (
      <aside className="hidden sm:flex h-screen w-16 bg-white dark:bg-[#1F2937] border-r border-[#E5E7EB] dark:border-[#374151] flex-col items-center py-3 shrink-0 transition-all duration-300 z-30">
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200 mb-3"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>

        {/* Divider */}
        <div className="w-6 border-t border-[#E5E7EB] dark:border-[#374151] mb-3" />

        {/* AI Logo - Visible when collapsed */}
        <div className="w-16 h-16 rounded-lg overflow-hidden mb-3 shrink-0">
          <img src="/AI.png" alt="AI" className="w-full h-full object-cover" />
        </div>

        {/* Nav icons */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onNewChat}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            aria-label="New chat"
            title="New chat"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onSearchOpen}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            aria-label="Search chats"
            title="Search chats"
          >
            <Search size={18} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Login/Avatar at bottom */}
        <div className="flex justify-center">
          <LoginSection isExpanded={false} />
        </div>
      </aside>
    );
  }

  // Expanded sidebar
  return (
    <aside className="h-screen w-[260px] sm:w-[280px] bg-white dark:bg-[#1F2937] border-r border-[#E5E7EB] dark:border-[#374151] flex flex-col shrink-0 transition-all duration-300 z-30">
      {/* Top section */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
            <img src="/AI.png" alt="PRV AI" className="w-full h-full object-cover" />
          </div>
          <span className="text-[14px] font-semibold text-[#111827] dark:text-[#F3F4F6] hidden sm:inline">PRV AI</span>
        </div>

        {/* Model selector - MOVED OUT OF SIDEBAR */}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-[#E5E7EB] dark:border-[#374151]" />

      {/* Navigation */}
      <div className="px-3 py-2 space-y-0.5">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors duration-200"
        >
          <Plus size={16} className="text-[#6B7280] dark:text-[#9CA3AF]" />
          New Chat
        </button>
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors duration-200"
        >
          <Search size={16} className="text-[#6B7280] dark:text-[#9CA3AF]" />
          Search Chats
        </button>
        <div className="relative">
          <button
            onClick={onCustomPRV}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            title="Open Custom PRV"
          >
            <span className="text-[16px]">⚙️</span>
            <span>Custom PRV</span>
            <span className="ml-auto rounded-full border border-violet-300/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:border-violet-400/30 dark:text-violet-300">Experimental</span>
          </button>
        </div>
        <div className="group relative">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[14px] text-slate-500 opacity-80 transition-colors dark:text-slate-400"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 via-violet-600 to-sky-500 text-white shadow-sm shadow-violet-500/25">
              <Code2 size={14} strokeWidth={2.5} />
            </span>
            <span className="font-medium">Poder</span>
            <span className="ml-auto rounded-full border border-slate-300 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-600 dark:text-slate-400">Coming soon</span>
          </button>
          <div className="pointer-events-none absolute left-2 top-full z-50 mt-2 hidden w-72 rounded-xl border border-slate-200 bg-slate-950 px-3 py-2.5 text-xs leading-5 text-slate-100 shadow-xl group-hover:block group-focus-within:block dark:border-slate-700">
            The same powerful coding agent—now in PRV. The frontier-level No Code AI Builder and AI code editor inside your browser.
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-[#E5E7EB] dark:border-[#374151] my-1" />

      {/* All chats */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-1">
        <button
          onClick={() => setChatsExpanded(!chatsExpanded)}
          className="w-full flex items-center justify-between px-2 py-2 mb-1 text-[12px] font-medium text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wide hover:text-[#6B7280] dark:hover:text-[#9CA3AF] transition-colors duration-200"
        >
          <span>Chat history</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${chatsExpanded ? '' : '-rotate-90'}`}
          />
        </button>

        {chatsExpanded && (
          <div className="animate-fade-in">
            {renderChatGroup('Today', yesterdayChats)}
            {renderChatGroup('Previous 7 days', weekChats)}
            {renderChatGroup('Previous 30 days', monthChats)}
            {renderChatGroup('Older', olderChats)}
            {yesterdayChats.length === 0 && weekChats.length === 0 && monthChats.length === 0 && olderChats.length === 0 && (
              <div className="px-3 py-6 text-center">
                <MessageSquare size={24} className="text-[#E5E7EB] dark:text-[#374151] mx-auto mb-2" />
                <p className="text-[12px] text-[#9CA3AF] dark:text-[#6B7280]">No chats yet</p>
                <p className="text-[11px] text-[#D1D5DB] dark:text-[#4B5563] mt-0.5">Start a new conversation</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-[#E5E7EB] dark:border-[#374151]" />

      {/* Login section */}
      <div className="px-3 py-3">
        <LoginSection isExpanded={true} />
      </div>
    </aside>
  );
}
