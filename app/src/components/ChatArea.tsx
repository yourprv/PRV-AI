import { useEffect, useRef } from 'react';
import { Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import type { Message, ModelId, ModeType, User } from '@/types/chat';

interface ChatAreaProps {
  user?: User | null;
  onOpenAuthModal: () => void;
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
  authAttemptCount,
  onOpenAuthModal,
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
      <header className="h-12 flex items-center justify-between px-4 border-b border-[#E5E7EB] dark:border-[#374151] bg-white/80 dark:bg-[#1F2937]/80 backdrop-blur-sm shrink-0 z-20">
        <div className="flex items-center flex-1">
          <ModelSelector
            selected={currentModel}
            onSelect={onModelChange}
            disabled={modelSelectorDisabled}
            onDisabledClick={onModelSelectorClick}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSettingsClick}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      {!user ? (
        <div className="bg-[#FEF3C7] dark:bg-[#92400E]/20 text-[#92400E] dark:text-[#FEF3C7] px-4 py-3">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium">
              Please login/signup to continue using our AI Chatbot.
            </p>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center justify-center rounded-full bg-[#92400E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12] transition-colors duration-200"
            >
              Log in / Sign up
            </button>
          </div>
        </div>
      ) : null}
      {isEmpty ? (
        // Empty state
        <div className="flex-1 flex flex-col items-center justify-center px-4 bg-white dark:bg-[#111827]">
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6">
            {user ? (
              <h1 className="text-[28px] font-semibold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                Ready when you are.
              </h1>
            ) : (
              <div className="w-full rounded-[32px] border border-[#E5E7EB] dark:border-[#374151] bg-[#E0F2FE] dark:bg-[#0F172A] px-6 py-5 text-center">
                <p className="text-[18px] font-semibold text-[#0F172A] dark:text-[#EFF6FF]">Please login to continue using PRV AI.</p>
                <p className="mt-2 text-[14px] text-[#475569] dark:text-[#A5B4FC]">
                  To keep your experience secure, please sign in before using the chatbot.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-colors duration-200"
                >
                  Log in / Sign up
                </button>
              </div>
            )}
            <ChatInput
              onSend={onSend}
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
            className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-white dark:bg-[#111827]"
          >
            <div className="w-full max-w-5xl mx-auto space-y-6">
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
          <div className="shrink-0 px-4 py-3 bg-white/80 dark:bg-[#1F2937]/80 backdrop-blur-sm border-t border-[#E5E7EB] dark:border-[#374151]">
            <ChatInput
              onSend={onSend}
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
