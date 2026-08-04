import { useEffect, useRef } from 'react';
import { Settings, Sun, Moon, EyeOff, ArrowUpRight, Sparkles, Waves, Layers3 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import type { Message, ModelId, ModeType, User } from '@/types/chat';

interface ChatAreaProps {
  user?: User | null;
  onOpenAuthModal: () => void;
  guestMode?: boolean;
  isIncognitoMode?: boolean;
  onToggleIncognitoMode?: () => void;
  onGuestFeatureRequest?: () => void;
  messages: Message[];
  isLoading: boolean;
  isSearchingWeb: boolean;
  currentModel: ModelId;
  onModelChange: (model: ModelId) => void;
  modelSelectorDisabled?: boolean;
  onModelSelectorClick?: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onCancel: () => void;
  mode: ModeType;
  onModeChange: (mode: ModeType) => void;
  onSend: (message: string, attachments?: File[]) => void;
  onRegenerate: (messageId: string) => void;
  sidebarExpanded: boolean;
  onSettingsClick: () => void;
}

export function ChatArea({
  user,
  onOpenAuthModal,
  guestMode = false,
  isIncognitoMode = false,
  onToggleIncognitoMode,
  onGuestFeatureRequest,
  messages,
  isLoading,
  currentModel,
  onModelChange,
  modelSelectorDisabled,
  onModelSelectorClick,
  webSearchEnabled,
  onToggleWebSearch,
  isSearchingWeb,
  onCancel,
  mode,
  onModeChange,
  onSend,
  onRegenerate,
  onSettingsClick,
}: ChatAreaProps) {
  const { isDark, toggleTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const hasAssistantPlaceholder =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].content.trim() === '';

  return (
    <div className="flex-1 flex flex-col h-screen relative">
      {/* Top bar */}
      <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-5 border-b border-violet-100/80 dark:border-slate-800 bg-white/75 dark:bg-[#111426]/80 backdrop-blur-xl shrink-0 z-20 gap-2">
        <div className="flex items-center flex-1 min-w-0">
          <ModelSelector
            selected={currentModel}
            onSelect={onModelChange}
            disabled={modelSelectorDisabled}
            onDisabledClick={onModelSelectorClick}
            guestMode={guestMode}
          />
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleIncognitoMode}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors duration-200 ${isIncognitoMode ? 'bg-[#4F46E5] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F7] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-[#374151]'}`}
            aria-label="Toggle incognito mode"
          >
            <EyeOff size={16} />
            <span className="hidden sm:inline">Incognito</span>
          </button>
          <button
            onClick={onSettingsClick}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      {isIncognitoMode ? (
        <div className="bg-[#F5F3FF] px-3 py-2 text-[#5B21B6] dark:bg-[#2E1065]/30 dark:text-[#DDD6FE] sm:px-4">
          <div className="mx-auto flex max-w-5xl items-center justify-center text-center text-xs sm:text-sm">
            <p>
              Private chats are anonymous. Your chats are permanently removed and are not saved once you leave this chat.
            </p>
          </div>
        </div>
      ) : null}
      {guestMode ? (
        <div className="bg-[#FEF3C7] dark:bg-[#92400E]/20 text-[#92400E] dark:text-[#FEF3C7] px-3 sm:px-4 py-2 sm:py-3">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm font-medium">
              You are in guest mode. You can use PRV V3.2 Fire now, and sign in later for more features.
            </p>
            <button
              type="button"
              onClick={onGuestFeatureRequest || onOpenAuthModal}
              className="inline-flex items-center justify-center rounded-full bg-[#92400E] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#7C2D12] transition-colors duration-200 shrink-0"
            >
              View benefits
            </button>
          </div>
        </div>
      ) : null}
      {isEmpty ? (
        // Empty state
        <div className="relative flex-1 overflow-hidden flex flex-col items-center justify-center px-3 sm:px-4 bg-[#fbfbfe] dark:bg-[#0d1020]">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-600/15" />
          <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-96 w-96 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-600/10" />
          <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center gap-5 sm:gap-7">
            <div className="flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 shadow-sm backdrop-blur dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> PRV studio · online
            </div>
            {user ? (
              <div className="text-center">
                <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">Make something <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">remarkable.</span></h1>
                <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">A calmer space for fast ideas, deep work, and everything in between.</p>
              </div>
            ) : (
              <div className="w-full rounded-2xl sm:rounded-[32px] border border-violet-200/80 dark:border-violet-400/20 bg-white/75 dark:bg-white/5 px-4 sm:px-6 py-4 sm:py-5 text-center shadow-[0_20px_70px_-35px_rgba(91,33,182,0.35)] backdrop-blur">
                <p className="text-base sm:text-[18px] font-semibold text-[#0F172A] dark:text-[#EFF6FF]">Continue as a guest with PRV V3.2 Fire.</p>
                <p className="mt-2 text-xs sm:text-[14px] text-[#475569] dark:text-[#A5B4FC]">
                  Your chats stay in this session only. Sign in later for saved history, web search, and more models.
                </p>
                <button
                  type="button"
                  onClick={onGuestFeatureRequest || onOpenAuthModal}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-[#4F46E5] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-colors duration-200"
                >
                  View benefits
                </button>
              </div>
            )}
            {user && <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: <Sparkles size={17} />, label: 'Spark an idea', text: 'Turn a rough thought into a clear direction.', tone: 'violet' },
                { icon: <Waves size={17} />, label: 'Go deeper', text: 'Explore complex questions with steady focus.', tone: 'sky' },
                { icon: <Layers3 size={17} />, label: 'Build a plan', text: 'Shape scattered notes into next steps.', tone: 'emerald' },
              ].map((card) => <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white/65 p-4 text-left shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-white/[0.04]">
                <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl ${card.tone === 'violet' ? 'bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300' : card.tone === 'sky' ? 'bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300'}`}>{card.icon}</div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{card.label}</p><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{card.text}</p><ArrowUpRight size={14} className="mt-3 text-slate-400" />
              </div>)}
            </div>}
            <ChatInput
              onSend={onSend}
              guestMode={guestMode}
              onGuestFeatureRequest={onGuestFeatureRequest}
              isLoading={isLoading}
              mode={mode}
              onModeChange={onModeChange}
              webSearchEnabled={webSearchEnabled}
              isSearchingWeb={isSearchingWeb}
              onToggleWebSearch={onToggleWebSearch}
              onCancel={onCancel}
              isEmptyState
            />
          </div>
        </div>
      ) : (
        // Active chat
        <>
          {/* Messages area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-white dark:bg-[#111827]"
          >
            <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLoading={isLoading}
                  onRegenerate={
                    message.role === 'assistant' && index === messages.length - 1
                      ? onRegenerate
                      : undefined
                  }
                  isLatest={index === messages.length - 1}
                />
              ))}
              {isLoading && !hasAssistantPlaceholder && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input at bottom */}
          <div className="shrink-0 px-3 sm:px-4 py-2 sm:py-3 bg-white/80 dark:bg-[#1F2937]/80 backdrop-blur-sm border-t border-[#E5E7EB] dark:border-[#374151]">
            <ChatInput
              onSend={onSend}
              guestMode={guestMode}
              onGuestFeatureRequest={onGuestFeatureRequest}
              isLoading={isLoading}
              mode={mode}
              onModeChange={onModeChange}
              webSearchEnabled={webSearchEnabled}
              isSearchingWeb={isSearchingWeb}
              onToggleWebSearch={onToggleWebSearch}
              onCancel={onCancel}
            />
          </div>
        </>
      )}
    </div>
  );
}
