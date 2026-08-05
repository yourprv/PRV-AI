import { useEffect, useRef } from 'react';
import { Settings, Sun, Moon, EyeOff, ArrowUpRight, Sparkles, Waves, Menu, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import type { CustomPRV, Message, ModelId, ModeType, PlanTier, User } from '@/types/chat';

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
  onEnhancePrompt: (prompt: string) => Promise<string>;
  mode: ModeType;
  onModeChange: (mode: ModeType) => void;
  onSend: (message: string, attachments?: File[], createImage?: boolean, canvas?: boolean) => void;
  onRegenerate: (messageId: string) => void;
  customPrv?: CustomPRV | null;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onSettingsClick: () => void;
  onOpenPlans: () => void;
  planTier?: PlanTier;
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
  onEnhancePrompt,
  mode,
  onModeChange,
  onSend,
  onRegenerate,
  customPrv,
  onToggleSidebar,
  onSettingsClick,
  onOpenPlans,
  planTier = 'free',
}: ChatAreaProps) {
  // Private mode temporarily forces the UI dark without changing the saved preference.
  // This means light mode returns when private mode ends, while an existing dark
  // preference remains dark throughout.
  const { isDark, toggleTheme } = useTheme(isIncognitoMode);
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
    <div className={`relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${isIncognitoMode ? 'bg-[#090b14] text-white' : ''}`}>
      {/* Top bar */}
      <header className={`relative z-20 min-h-14 shrink-0 flex items-center justify-between gap-1.5 border-b px-2.5 py-1.5 backdrop-blur-xl sm:h-16 sm:px-5 sm:py-0 ${isIncognitoMode ? 'border-white/10 bg-[#0d1020]/95' : 'border-violet-100/80 bg-white/90 dark:border-slate-800 dark:bg-[#111426]/90'}`}>
        <div className="flex items-center flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#4F46E5] shadow-sm transition-colors hover:bg-violet-50 hover:text-[#4338CA] dark:border-slate-700 dark:bg-slate-800 dark:text-violet-300 dark:hover:bg-slate-700 lg:hidden"
            aria-label="Open chat history"
            title="Open chat history"
          >
            <Menu size={21} />
          </button>
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
            onClick={onSettingsClick}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F5F5F7] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:bg-[#374151] dark:hover:text-[#F3F4F6] lg:flex"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          {user ? (
            <button
              type="button"
              onClick={onOpenPlans}
              className="hidden lg:inline-flex h-9 rounded-full items-center justify-center bg-[#4F46E5] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-colors duration-200"
            >
              Upgrade to Pro
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleIncognitoMode}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors duration-200 ${isIncognitoMode ? 'bg-[#4F46E5] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F7] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] dark:hover:bg-[#374151]'}`}
            aria-label="Toggle incognito mode"
          >
            <EyeOff size={16} />
            <span className="hidden sm:inline">{isIncognitoMode ? 'Private' : 'Incognito'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            aria-label={isIncognitoMode ? 'Dark mode is enabled in private mode' : 'Toggle theme'}
            disabled={isIncognitoMode}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {customPrv ? <div className="border-b border-violet-200/70 bg-gradient-to-r from-violet-50 to-sky-50 px-3 py-2 dark:border-violet-400/20 dark:from-violet-950/40 dark:to-slate-900">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-xs text-violet-800 dark:text-violet-200"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600 text-white">✦</span><span><strong>{customPrv.name}</strong><span className="ml-1.5 rounded-full border border-violet-300/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:border-violet-400/30 dark:text-violet-300">Experimental</span></span></div>
      </div> : null}

      {/* Main content */}
      {isIncognitoMode ? (
        <div className="border-b border-white/10 bg-[#101426] px-4 py-3 text-slate-200">
          <div className="mx-auto flex max-w-5xl items-center gap-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><LockKeyhole size={17} /></span>
            <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">Private · anonymous chats</p><p className="mt-0.5 text-xs text-slate-400">This conversation is temporary and won’t be saved to your history.</p></div>
            <ShieldCheck size={18} className="ml-auto hidden shrink-0 text-emerald-300 sm:block" />
          </div>
        </div>
      ) : null}
      {guestMode ? (
        <div className="bg-[#FEF3C7] dark:bg-[#92400E]/20 text-[#92400E] dark:text-[#FEF3C7] px-3 py-1.5 sm:px-4 sm:py-3">
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
        <div className={`relative flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-3 py-4 sm:px-4 sm:py-0 ${isIncognitoMode ? 'bg-[#090b14]' : 'bg-[#fbfbfe] dark:bg-[#0d1020]'}`}>
          <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-600/15" />
          <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-96 w-96 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-600/10" />
          <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center gap-5 sm:gap-7">
            {user ? (
              <button
                type="button"
                onClick={onOpenPlans}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 shadow-sm transition-colors hover:bg-violet-50 backdrop-blur dark:border-violet-400/20 dark:bg-violet-950/80 dark:text-violet-200 dark:hover:bg-violet-900"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Upgrade to Pro
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 shadow-sm backdrop-blur dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> PRV studio · online
              </div>
            )}
            {user ? (
              <div className="text-center">
                <h1 className={`text-3xl sm:text-5xl font-semibold tracking-[-0.04em] ${isIncognitoMode ? 'text-white' : 'text-slate-950 dark:text-white'}`}>Make something <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">remarkable.</span></h1>
                <p className={`mt-3 text-sm sm:text-base ${isIncognitoMode ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{isIncognitoMode ? 'A quiet space for private thinking.' : 'A calmer space for fast ideas, deep work, and everything in between.'}</p>
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
            {user && <div className="hidden w-full max-w-3xl grid-cols-2 gap-3 sm:grid">
              {[
                { icon: <Sparkles size={17} />, label: 'Shape an idea', text: 'Turn a rough thought into a clear direction.', prompt: 'Help me turn this rough idea into a clear direction. Ask one useful question, then give me a concise starting point.', tone: 'violet' },
                { icon: <Waves size={17} />, label: 'Think it through', text: 'Explore a complex question with steady focus.', prompt: 'Help me think this through carefully. Break down the question, surface the key tradeoffs, and recommend a practical next step.', tone: 'sky' },
              ].map((card) => <button type="button" key={card.label} onClick={() => onSend(card.prompt)} className="rounded-2xl border border-slate-200/80 bg-white/65 p-4 text-left shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-white/[0.04]">
                <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl ${card.tone === 'violet' ? 'bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300' : card.tone === 'sky' ? 'bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300'}`}>{card.icon}</div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{card.label}</p><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{card.text}</p><ArrowUpRight size={14} className="mt-3 text-slate-400" />
              </button>)}
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
              onEnhancePrompt={onEnhancePrompt}
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
            className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2 py-3 sm:px-4 sm:py-6 space-y-4 sm:space-y-6 ${isIncognitoMode ? 'bg-[#090b14]' : 'bg-white dark:bg-[#111827]'}`}
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
          <div className={`shrink-0 px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 sm:px-4 sm:py-3 backdrop-blur-sm border-t ${isIncognitoMode ? 'bg-[#0d1020]/95 border-white/10' : 'bg-white/95 dark:bg-[#1F2937]/95 border-[#E5E7EB] dark:border-[#374151]'}`}>
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
              onEnhancePrompt={onEnhancePrompt}
            />
          </div>
        </>
      )}
    </div>
  );
}
