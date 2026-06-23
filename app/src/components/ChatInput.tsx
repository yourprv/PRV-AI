import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Plus, Mic, X, UploadCloud, Globe } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import type { ModeType } from '@/types/chat';

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  isLoading: boolean;
  mode: ModeType;
  onModeChange: (mode: ModeType) => void;
  webSearchEnabled: boolean;
  isSearchingWeb: boolean;
  onToggleWebSearch: () => void;
  onCancel: () => void;
  isEmptyState?: boolean;
}

export function ChatInput({ onSend, isLoading, mode, onModeChange, webSearchEnabled, isSearchingWeb, onToggleWebSearch, onCancel, isEmptyState }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
  }, [text]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        menuRootRef.current?.contains(event.target as Node) ||
        menuRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setMenuOpen(false);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [menuOpen]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    const hasContent = trimmed.length > 0 || attachments.length > 0;
    if (!hasContent || isLoading) return;
    setMenuOpen(false);
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isLoading, onSend, attachments]);

  const toggleMenu = useCallback(() => {
    if (isLoading) return;
    setMenuOpen((prev) => !prev);
  }, [isLoading]);

  const handleAddAttachment = useCallback(() => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleToggleSearch = useCallback(() => {
    setMenuOpen(false);
    onToggleWebSearch();
  }, [onToggleWebSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = text.trim().length > 0 || attachments.length > 0;

  if (isEmptyState) {
    // Centered empty state input
    return (
      <div className="w-full max-w-[720px] mx-auto px-3 sm:px-0">
        <div className="relative rounded-2xl sm:rounded-[32px] border border-[#E5E7EB] dark:border-[#374151] bg-white/95 dark:bg-[#111827]/95 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.8)] transition-all duration-300 pb-12 sm:pb-12">
          {/* Attachments display */}
          {(attachments.length > 0 || webSearchEnabled || isSearchingWeb) && (
            <div className="px-3 sm:px-4 pt-3 pb-2 space-y-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#E5E7EB] dark:bg-[#374151] rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-[12px] text-[#374151] dark:text-[#D1D5DB]">
                    <span className="truncate">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="hover:text-[#111827] dark:hover:text-[#F3F4F6] shrink-0"
                      aria-label="Remove attachment"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {isSearchingWeb ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EFF6FF] dark:border-[#60A5FA] dark:bg-[#1E40AF] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#1D4ED8] dark:text-[#DBEAFE]">
                  <Globe size={14} />
                  <span className="flex items-center gap-1">
                    Searching the web
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#1D4ED8] dark:bg-[#BFDBFE] animate-pulse" />
                  </span>
                </div>
              ) : webSearchEnabled ? (
                <button
                  type="button"
                  onClick={onToggleWebSearch}
                  className="inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] dark:border-[#4F46E5] dark:bg-[#4338CA] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#1E3A8A] dark:text-[#E0E7FF] hover:bg-[#E0E7FF] dark:hover:bg-[#4F46E5] transition-colors duration-200"
                  aria-label="Disable web search"
                >
                  <Globe size={14} />
                  <span>Web search enabled</span>
                  <X size={12} />
                </button>
              ) : null}
            </div>
          )}

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={1}
            className="w-full min-h-11 sm:min-h-[42px] rounded-xl sm:rounded-[24px] border border-transparent bg-[#F8FAFC] dark:bg-[#111827] px-3 sm:px-4 py-2 sm:py-2 text-sm sm:text-[15px] text-[#111827] dark:text-[#E5E7EB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:border-[#D1D5DB] dark:focus:border-[#4B5563] focus:ring-0 focus:bg-white dark:focus:bg-[#111827] focus:outline-none resize-none leading-relaxed"
            aria-label="Chat input"
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            multiple
            className="hidden"
            accept=".pdf,.txt,.csv,.json,.html,.md,.png,.jpeg,.webp,.heic,.gif,.mp3,.wav,.aac,.flac,.m4a,.opus,.mp4,.mov,.webm,.avi,.mpeg,.wmv,.3gpp"
          />

          {/* Bottom controls */}
          <div ref={menuRootRef} className="absolute bottom-2 sm:bottom-2.5 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between">
            <div className="relative">
              <button
                type="button"
                onClick={toggleMenu}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F9FAFB] shadow-sm transition-all duration-200 active:scale-95"
                aria-label="Open attachment menu"
                title="Add attachments or enable web search"
              >
                <Plus size={20} />
              </button>
              {menuOpen && (
                <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-64 sm:w-72 overflow-hidden rounded-2xl sm:rounded-[28px] border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827] shadow-xl z-50">
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 flex items-start gap-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937] active:bg-[#F0F0F0] dark:active:bg-[#2D3748] transition-colors"
                  >
                    <span className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#4338CA] text-[#1E40AF] dark:text-[#E0E7FF] shrink-0">
                      <UploadCloud size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-[#111827] dark:text-[#F8FAFC]">Upload attachment</div>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Files, images, video, or audio</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleSearch}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 flex items-start gap-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937] active:bg-[#F0F0F0] dark:active:bg-[#2D3748] transition-colors"
                  >
                    <span className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-2xl bg-[#E0E7FF] dark:bg-[#3730A3] text-[#1E40AF] dark:text-[#E0E7FF] shrink-0">
                      <Globe size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-[#111827] dark:text-[#F8FAFC]">{webSearchEnabled ? 'Disable web search' : 'Enable web search'}</div>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{webSearchEnabled ? 'Search is active for the next query' : 'Include live web results once'}</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Mode + Mic + Send */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <ModeSelector selected={mode} onSelect={onModeChange} />
              <button
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#6B7280] dark:hover:text-[#9CA3AF] hover:bg-[#F0F0F2] dark:hover:bg-[#374151] transition-all duration-200 active:scale-95"
                aria-label="Voice input"
                title="Voice input"
              >
                <Mic size={16} />
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend || isLoading}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
                  canSend
                    ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA] dark:bg-[#6366F1] dark:hover:bg-[#4F46E5] cursor-pointer'
                    : 'bg-[#E5E7EB] dark:bg-[#4B5563] text-[#9CA3AF] dark:text-[#6B7280] cursor-default'
                }`}
                aria-label="Send message"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Subtle hint */}
        <div className="mt-3 text-center text-xs sm:text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
          <p>PRV AI can make mistakes. Consider checking important information.</p>
          <p className="mt-1">Powered by Google</p>
        </div>
      </div>
    );
  }

  // Bottom-fixed input for active chat
  return (
    <div className="w-full max-w-[720px] mx-auto px-3 sm:px-0">
      <div className="relative rounded-2xl sm:rounded-[32px] border border-[#E5E7EB] dark:border-[#374151] bg-white/95 dark:bg-[#111827]/95 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.8)] transition-all duration-300 pb-12">
        {/* Attachments display */}
        {(attachments.length > 0 || webSearchEnabled || isSearchingWeb) && (
          <div className="px-3 sm:px-4 pt-3 pb-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#E5E7EB] dark:bg-[#374151] rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-[12px] text-[#374151] dark:text-[#D1D5DB]">
                  <span className="truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-[#111827] dark:hover:text-[#F3F4F6] shrink-0"
                    aria-label="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            {isSearchingWeb ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EFF6FF] dark:border-[#60A5FA] dark:bg-[#1E40AF] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#1D4ED8] dark:text-[#DBEAFE]">
                <Globe size={14} />
                <span className="flex items-center gap-1">
                  Searching the web
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#1D4ED8] dark:bg-[#BFDBFE] animate-pulse" />
                </span>
              </div>
            ) : webSearchEnabled ? (
              <button
                type="button"
                onClick={onToggleWebSearch}
                className="inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] dark:border-[#4F46E5] dark:bg-[#4338CA] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#1E3A8A] dark:text-[#E0E7FF] hover:bg-[#E0E7FF] dark:hover:bg-[#4F46E5] transition-colors duration-200"
                aria-label="Disable web search"
              >
                <Globe size={14} />
                <span>Web search enabled</span>
                <X size={12} />
              </button>
            ) : null}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="How can I help you today?"
          rows={1}
          className="w-full min-h-12 sm:min-h-[58px] rounded-xl sm:rounded-[24px] border border-transparent bg-[#F8FAFC] dark:bg-[#111827] px-3 sm:px-4 py-2 sm:py-3.5 text-sm sm:text-[15px] text-[#111827] dark:text-[#E5E7EB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:border-[#6366F1] dark:focus:border-[#8B5CF6] focus:bg-white dark:focus:bg-[#111827] focus:outline-none resize-none leading-relaxed"
          aria-label="Chat input"
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept=".pdf,.txt,.csv,.json,.html,.md,.png,.jpeg,.webp,.heic,.gif,.mp3,.wav,.aac,.flac,.m4a,.opus,.mp4,.mov,.webm,.avi,.mpeg,.wmv,.3gpp"
        />

        <div ref={menuRootRef} className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <div className="relative">
            <button
              type="button"
              onClick={toggleMenu}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F9FAFB] shadow-sm transition-all duration-200"
              aria-label="Open attachment menu"
              title="Add attachments or enable web search"
            >
              <Plus size={20} />
            </button>
            {menuOpen && (
              <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-[28px] border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827] shadow-xl z-50">
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#4338CA] text-[#1E40AF] dark:text-[#E0E7FF]">
                    <UploadCloud size={18} />
                  </span>
                  <div>
                    <div className="font-medium text-sm text-[#111827] dark:text-[#F8FAFC]">Upload attachment</div>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Files, images, video, or audio</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleToggleSearch}
                  className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E0E7FF] dark:bg-[#3730A3] text-[#1E40AF] dark:text-[#E0E7FF]">
                    <Globe size={18} />
                  </span>
                  <div>
                    <div className="font-medium text-sm text-[#111827] dark:text-[#F8FAFC]">{webSearchEnabled ? 'Disable web search' : 'Enable web search'}</div>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{webSearchEnabled ? 'Search is active for the next query' : 'Include live web results once'}</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ModeSelector selected={mode} onSelect={onModeChange} />
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#6B7280] dark:hover:text-[#9CA3AF] hover:bg-[#F0F0F2] dark:hover:bg-[#374151] transition-all duration-200"
              aria-label="Voice input"
              title="Voice input"
            >
              <Mic size={16} />
            </button>
            {isLoading ? (
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F87171] text-white hover:bg-[#EF4444] active:scale-95 transition-all duration-200"
                aria-label="Cancel response"
              >
                <X size={16} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend || isLoading}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                  canSend
                    ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA] dark:bg-[#6366F1] dark:hover:bg-[#4F46E5] active:scale-95 cursor-pointer'
                    : 'bg-[#E5E7EB] dark:bg-[#4B5563] text-[#9CA3AF] dark:text-[#6B7280] cursor-default'
                }`}
                aria-label="Send message"
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
