import { useEffect, useRef } from 'react';
import { Settings, Sun, Moon, EyeOff, ArrowUpRight, Download, PenLine, Compass, ListChecks, Menu, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import type { CustomPRV, Message, ModelId, ModeType, User } from '@/types/chat';

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
  onUpgradeClick: () => void;
  onExportChat?: () => void;
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
  onUpgradeClick,
  onExportChat,
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
    <div data-theme-force-dark={isIncognitoMode ? 'true' : undefined} className={`relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${isIncognitoMode ? 'bg-[#191812] text-[#f3eddf]' : ''}`}>
      {/* Top bar */}
      <header className={`workspace-header relative z-20 min-h-14 shrink-0 flex items-center justify-between gap-1.5 border-b px-2.5 py-1.5 sm:h-[62px] sm:px-6 sm:py-0 ${isIncognitoMode ? 'private-workspace border-white/10' : 'dark:border-[#39372c] dark:bg-[#1f1e18]/95'}`}>
        <div className="flex items-center flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5dac3] bg-[#fffdf8] text-[#35483a] transition-colors hover:bg-[#f1eadb] dark:border-[#494638] dark:bg-[#29281f] dark:text-[#d5c49d] dark:hover:bg-[#363429] sm:mr-2 lg:hidden"
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
            tier={user?.tier || 'free'}
            onUpgradeClick={onUpgradeClick}
          />
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={onUpgradeClick}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-[#59685a] transition-colors hover:bg-[#f0eadc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#879584] sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs dark:text-[#ddc995] dark:hover:bg-[#c6ad70]/10"
            aria-label={user?.tier === 'pro' ? 'View Pro plan' : 'Upgrade to Pro'}
          >
            <span className="hidden min-[380px]:inline">{user?.tier === 'pro' ? 'Pro plan' : 'Upgrade to Pro'}</span>
            <ArrowUpRight size={14} />
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onExportChat}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#68766a] transition-colors hover:bg-[#f0eadc] hover:text-[#35483a] dark:text-[#c7bfa9] dark:hover:bg-[#302f25]"
              aria-label="Export this chat as Markdown"
              title="Export this chat"
            >
              <Download size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onSettingsClick}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#746f62] transition-colors hover:bg-[#f1eadb] hover:text-[#29271f] dark:text-[#c3bba5] dark:hover:bg-[#38362a] dark:hover:text-[#f3eddf] lg:flex"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            type="button"
            onClick={onToggleIncognitoMode}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors duration-150 ${isIncognitoMode ? 'bg-[#35483a] text-white shadow-sm' : 'text-[#746f62] hover:text-[#29271f] hover:bg-[#f1eadb] dark:text-[#c3bba5] dark:hover:text-[#f3eddf] dark:hover:bg-[#38362a]'}`}
            aria-label="Toggle incognito mode"
          >
            <EyeOff size={16} />
            <span className="hidden sm:inline">{isIncognitoMode ? 'Private' : 'Incognito'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#746f62] dark:text-[#c3bba5] hover:text-[#29271f] dark:hover:text-[#f3eddf] hover:bg-[#f1eadb] dark:hover:bg-[#38362a] transition-colors duration-200"
            aria-label={isIncognitoMode ? 'Dark mode is enabled in private mode' : 'Toggle theme'}
            disabled={isIncognitoMode}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {customPrv ? <div className="border-b border-[#e7decc] bg-[#f4eddf] px-3 py-2 dark:border-[#39372c] dark:bg-[#24231c]">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-xs text-[#536453] dark:text-[#d4c8a9]"><span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#d8cbb2] bg-[#fffdf8] text-[10px] font-semibold tracking-tight text-[#35483a]">PR</span><span><strong>{customPrv.name}</strong><span className="ml-1.5 rounded-full border border-[#cbd2c8] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#647463] dark:border-[#62583e] dark:text-[#d5c49d]">Experimental</span></span></div>
      </div> : null}

      {/* Main content */}
      {isIncognitoMode ? (
        <div className="border-b border-white/10 bg-[#211f18] px-4 py-3 text-[#eee8d9]">
          <div className="mx-auto flex max-w-5xl items-center gap-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d5c49d]"><LockKeyhole size={17} /></span>
            <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d5c49d]">Private · anonymous chats</p><p className="mt-0.5 text-xs text-[#c5bdab]">This conversation is temporary and won’t be saved to your history.</p></div>
            <ShieldCheck size={18} className="ml-auto hidden shrink-0 text-[#d5c49d] sm:block" />
          </div>
        </div>
      ) : null}
      {guestMode ? (
        <div className="border-b border-[#e6dcc8] bg-[#f2eadb] px-3 py-1.5 text-[#525b50] sm:px-4 sm:py-2.5 dark:border-[#4a402b] dark:bg-[#302b1f] dark:text-[#e7d9b9]">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm font-medium">
              You are using the Free tier. Core chat stays available; sign in to save chats and create a Custom PRV.
            </p>
            <button
              type="button"
              onClick={onGuestFeatureRequest || onOpenAuthModal}
              className="workspace-primary-button inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold sm:text-sm shrink-0"
            >
              View benefits
            </button>
          </div>
        </div>
      ) : null}
      {isEmpty ? (
        // Empty state
        <div className={`workspace-empty relative flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-3 py-5 sm:px-6 sm:py-8 ${isIncognitoMode ? 'private-workspace' : 'dark:bg-[#1b1a15]'}`}>
          <div className="relative w-full max-w-[900px] mx-auto flex flex-col items-center gap-5 sm:gap-7">
            <div className="workspace-kicker flex items-center gap-3 text-[10px] font-semibold uppercase sm:text-[11px]">
              <span className="h-px w-7 bg-[#c6c9bd]" /> PRV · YOUR WORKSPACE <span className="h-px w-7 bg-[#c6c9bd]" />
            </div>
            {user ? (
              <div className="text-center">
                <h1 className={`workspace-welcome-title ${isIncognitoMode ? 'text-white' : 'dark:text-[#f3eddf]'}`}>Good work starts<br className="hidden sm:block" /> with <span className="workspace-welcome-accent">a first thought.</span></h1>
                <p className={`mx-auto mt-4 max-w-md text-sm leading-6 sm:text-[15px] ${isIncognitoMode ? 'text-slate-400' : 'text-[#74766f] dark:text-[#bcb39d]'}`}>{isIncognitoMode ? 'A quiet space for private thinking.' : 'Bring a question, a rough idea, or a blank page. We’ll take it from there.'}</p>
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-[#e7e4dc] bg-white/75 px-4 py-4 text-center sm:max-w-xl sm:px-6 sm:py-5 dark:border-[#62583e]/50 dark:bg-white/5">
                <p className="text-base font-semibold text-[#20231f] sm:text-[18px] dark:text-[#f3eddf]">A thoughtful assistant for everyday work.</p>
                <p className="mt-2 text-xs leading-5 text-[#74766f] sm:text-[14px] dark:text-[#c5b58d]">
                  Your chats stay in this session only. Sign in for saved history and to create a Custom PRV.
                </p>
                <button
                  type="button"
                  onClick={onGuestFeatureRequest || onOpenAuthModal}
                  className="workspace-primary-button mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-xs font-semibold sm:px-5 sm:text-sm"
                >
                  View benefits
                </button>
              </div>
            )}
            {user && <div className="flex w-full max-w-[690px] snap-x snap-mandatory gap-2 overflow-x-auto pb-1 no-scrollbar sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible">
              {[
                { icon: <PenLine size={16} />, label: 'Write a draft', text: 'Start with a clear first version.', prompt: 'Help me write a clear first draft. Ask me only for details that are essential, then shape the result so I can edit it.' },
                { icon: <Compass size={16} />, label: 'Explore an idea', text: 'Find a useful way into the question.', prompt: 'Help me explore this idea. Lay out the most useful angles, surface any assumptions, and suggest where to begin.' },
                { icon: <ListChecks size={16} />, label: 'Make a plan', text: 'Turn a goal into practical next steps.', prompt: 'Help me turn my goal into a practical plan with clear steps, sensible priorities, and a realistic first action.' },
              ].map((card) => <button type="button" key={card.label} onClick={() => onSend(card.prompt)} className="workspace-prompt-card min-w-[76vw] snap-start rounded-xl border p-3.5 text-left sm:min-w-0">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0eadb] text-[#536653] dark:bg-[#c6ad70]/10 dark:text-[#d5c49d]">{card.icon}</div>
                <p className="text-[13px] font-semibold text-[#30342e] dark:text-[#f3eddf]">{card.label}</p><p className="mt-1 text-xs leading-relaxed text-[#7a7b73] dark:text-[#bcb39d]">{card.text}</p><ArrowUpRight size={14} className="mt-3 text-[#85877e]" />
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
            className={`workspace-chat-canvas min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2 py-3 sm:px-4 sm:py-7 space-y-4 sm:space-y-6 ${isIncognitoMode ? 'bg-[#191812]' : 'dark:bg-[#1e1d17]'}`}
          >
            <div className="w-full max-w-[820px] mx-auto space-y-4 sm:space-y-7">
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
          <div className={`shrink-0 px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 sm:px-4 sm:py-3 backdrop-blur-sm border-t ${isIncognitoMode ? 'bg-[#1c1b15]/95 border-white/10' : 'bg-[#fffdf8]/95 dark:bg-[#25241d]/95 border-[#e7decc] dark:border-[#403e32]'}`}>
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
            <p className="mx-auto mt-1.5 max-w-[720px] px-2 text-center text-[10px] leading-4 text-[#858174] dark:text-[#aaa28e]">
              Earlier turns in this chat are included as context.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
