import { useState } from 'react';
import { toast } from 'sonner';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Download,
  ChevronDown,
  MessageSquare,
  Pencil,
  Trash2,
  Code2,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { LoginSection } from './LoginSection';
import { BrandMark } from './BrandMark';
import { groupChatsByCreatedAt } from '@/lib/chatHistory';
import type { Chat } from '@/types/chat';
import { issueKiteSsoCode } from '@/lib/api';

const KITE_STUDIO_URL = 'https://kitestudio-prvai.vercel.app';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onSearchOpen: () => void;
  onExportChats?: () => void;
  onRenameChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onCustomPRV: () => void;
  onSettingsClick: () => void;
}

export function Sidebar({
  isExpanded,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onSearchOpen,
  onExportChats,
  onRenameChat,
  onDeleteChat,
  onCustomPRV,
  onSettingsClick,
}: SidebarProps) {
  const [chatsExpanded, setChatsExpanded] = useState(true);

  const chatGroups = groupChatsByCreatedAt(chats);

  const openKiteStudio = async () => {
    const popup = window.open('about:blank', 'kite-studio');
    if (!popup) {
      toast.error('Allow pop-ups from PRV AI to open Kite Studio.');
      return;
    }
    popup.document.open();
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening Kite Studio</title><style>html,body{height:100%;margin:0;background:#11100f;color:#eee8dc;font:15px system-ui,sans-serif}main{height:100%;display:grid;place-content:center;text-align:center;gap:12px}.spinner{width:22px;height:22px;margin:auto;border:2px solid #514a3b;border-top-color:#d5bd8f;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}p{margin:0;color:#aaa18f;font-size:13px}</style></head><body><main><div class="spinner"></div><div>Connecting to Kite Studio…</div><p>Verifying your PRV AI session</p></main></body></html>`);
    popup.document.close();
    try {
      const { code } = await issueKiteSsoCode();
      popup.location.replace(`${KITE_STUDIO_URL}/#sso=${encodeURIComponent(code)}`);
    } catch (error) {
      popup.close();
      toast.error(error instanceof Error ? error.message : 'Could not open Kite Studio.');
    }
  };

  const renderChatGroup = (title: string, groupChats: Chat[]) => {
    if (groupChats.length === 0) return null;
    return (
      <div key={title} className="mb-2">
        <div className="px-3 py-1.5 text-[11px] font-medium text-[#9CA3AF] dark:text-[#a49b83] uppercase tracking-wider">
          {title}
        </div>
        {groupChats.map((chat) => (
          <div
            key={chat.id}
            className={`group w-full rounded-lg overflow-hidden transition-colors duration-150 ${
              activeChatId === chat.id ? 'bg-[#e8ebe4] dark:bg-[#38362a]' : 'hover:bg-white/65'
            }`}
          >
            <div className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
              <button
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className={`flex-1 text-left truncate ${
                  activeChatId === chat.id
                    ? 'text-[#111827] dark:text-[#f3eddf] font-medium'
                    : 'text-[#374151] dark:text-[#e0d9c8] hover:text-[#111827] dark:hover:text-[#f3eddf]'
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
                  className="p-1 rounded-md text-[#6B7280] dark:text-[#bcb39d] hover:bg-[#E5E7EB] dark:hover:bg-[#38362a] transition-colors duration-150"
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
      <aside className="workspace-sidebar hidden sm:flex h-[100dvh] w-16 border-r dark:bg-[#222119] dark:border-[#39372c] flex-col items-center py-3 shrink-0 transition-all duration-200 z-30">
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] transition-colors duration-200 mb-3"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>

        {/* Divider */}
        <div className="w-6 border-t border-[#E5E7EB] dark:border-[#454235] mb-3" />

        {/* PRV mark - visible when collapsed */}
        <div className="mb-3 shrink-0"><BrandMark /></div>

        {/* Nav icons */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onNewChat}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] transition-colors duration-200"
            aria-label="New chat"
            title="New chat"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onSearchOpen}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] transition-colors duration-200"
            aria-label="Search chats"
            title="Search chats"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={onExportChats}
            disabled={!chats.length || !onExportChats}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] transition-colors duration-150 hover:bg-[#F5F5F7] hover:text-[#35483a] disabled:cursor-not-allowed disabled:opacity-35 dark:text-[#bcb39d] dark:hover:bg-[#38362a]"
            aria-label="Export all chats as JSON"
            title="Export all chats"
          >
            <Download size={17} />
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
    <aside className="workspace-sidebar h-[100dvh] w-[min(84vw,288px)] sm:w-[256px] border-r dark:bg-[#222119] dark:border-[#39372c] flex flex-col shrink-0 transition-all duration-200 z-30">
      {/* Top section */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] transition-colors duration-200"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <BrandMark />
          <div className="hidden sm:block">
            <span className="block text-[14px] font-semibold tracking-[-0.03em] text-[#20231f] dark:text-[#f3eddf]">PRV</span>
            <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.13em] text-[#898b82] dark:text-[#bcb39d]">Personal workspace</span>
          </div>
        </div>

        {/* Model selector - MOVED OUT OF SIDEBAR */}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-[#E5E7EB] dark:border-[#454235]" />

      {/* Navigation */}
      <div className="px-3 py-2 space-y-0.5">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] text-[#374151] dark:text-[#e0d9c8] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] hover:text-[#111827] dark:hover:text-[#f3eddf] transition-colors duration-200"
        >
          <Plus size={16} className="text-[#6B7280] dark:text-[#bcb39d]" />
          New Chat
        </button>
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] text-[#374151] dark:text-[#e0d9c8] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] hover:text-[#111827] dark:hover:text-[#f3eddf] transition-colors duration-200"
        >
          <Search size={16} className="text-[#6B7280] dark:text-[#bcb39d]" />
          Search Chats
        </button>
        <button
          type="button"
          onClick={onExportChats}
          disabled={!chats.length || !onExportChats}
          className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-[14px] text-[#374151] transition-colors duration-150 hover:bg-[#F5F5F7] hover:text-[#35483a] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#e0d9c8] dark:hover:bg-[#38362a]"
          aria-label="Export all chats as JSON"
          title="Export all chats"
        >
          <Download size={16} className="text-[#6B7280] dark:text-[#bcb39d]" />
          Export Chats
        </button>
        <button
          type="button"
          onClick={onSettingsClick}
          className="lg:hidden w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] text-[#374151] dark:text-[#e0d9c8] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] hover:text-[#111827] dark:hover:text-[#f3eddf] transition-colors duration-200"
        >
          <Settings size={16} className="text-[#6B7280] dark:text-[#bcb39d]" />
          Settings
        </button>
        <div className="relative">
          <button
            onClick={onCustomPRV}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[14px] text-[#374151] dark:text-[#e0d9c8] hover:bg-[#F5F5F7] dark:hover:bg-[#38362a] transition-colors duration-200"
            title="Open Custom PRV"
          >
          <SlidersHorizontal size={16} className="text-[#70756b] dark:text-[#bcb39d]" />
            <span>Custom PRV</span>
            <span className="ml-auto rounded-full border border-[#cbd2c8] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#647463] dark:border-[#62583e] dark:text-[#d5c49d]">Experimental</span>
          </button>
        </div>
        <div className="group relative">
          <button
            type="button"
            onClick={() => { void openKiteStudio(); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[14px] text-[#374151] transition-colors hover:bg-[#F5F5F7] dark:text-[#e0d9c8] dark:hover:bg-[#38362a]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#dedbd2] bg-white text-[#73776e] dark:border-[#514d3e] dark:bg-[#302f25] dark:text-[#d0c7b3]">
              <Code2 size={13} />
            </span>
            <span className="font-medium">Kite Studio</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-300 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-950 shadow-[0_0_12px_rgba(245,190,70,0.28)] dark:border-[#b89a56] dark:from-[#80662e] dark:via-[#b89a56] dark:to-[#80662e] dark:text-[#fff2c4]">
              <Sparkles size={10} /> Preview
            </span>
          </button>
          <div className="pointer-events-none absolute left-2 top-full z-50 mt-2 hidden w-72 rounded-xl border border-slate-200 bg-slate-950 px-3 py-2.5 text-xs leading-5 text-slate-100 shadow-xl group-hover:block group-focus-within:block dark:border-[#454235]">
            Build and preview code with your PRV AI account. Your current PRV plan controls Kite Studio credits and limits.
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-[#E5E7EB] dark:border-[#454235] my-1" />

      {/* All chats */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-1">
        <button
          onClick={() => setChatsExpanded(!chatsExpanded)}
          className="w-full flex items-center justify-between px-2 py-2 mb-1 text-[12px] font-medium text-[#9CA3AF] dark:text-[#a49b83] uppercase tracking-wide hover:text-[#6B7280] dark:hover:text-[#9CA3AF] transition-colors duration-200"
        >
          <span>Chat history</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${chatsExpanded ? '' : '-rotate-90'}`}
          />
        </button>

        {chatsExpanded && (
          <div className="animate-fade-in">
            {renderChatGroup('Today', chatGroups.today)}
            {renderChatGroup('Yesterday', chatGroups.yesterday)}
            {renderChatGroup('Previous 7 Days', chatGroups.previous7Days)}
            {renderChatGroup('Previous 30 Days', chatGroups.previous30Days)}
            {renderChatGroup('Older', chatGroups.older)}
            {chats.length === 0 && (
              <div className="px-3 py-6 text-center">
                <MessageSquare size={24} className="text-[#ded3bd] dark:text-[#776e58] mx-auto mb-2" />
                <p className="text-[12px] text-[#9CA3AF] dark:text-[#a49b83]">No chats yet</p>
                <p className="text-[11px] text-[#8b8473] dark:text-[#9b927b] mt-0.5">Start a new conversation</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-[#E5E7EB] dark:border-[#454235]" />

      {/* Login section */}
      <div className="px-3 py-3">
        <LoginSection isExpanded={true} />
      </div>
    </aside>
  );
}
