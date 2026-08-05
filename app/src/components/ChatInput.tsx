import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Plus, MoreHorizontal, Sparkles, X, UploadCloud, Globe, ImagePlus, PanelTop } from 'lucide-react';
import { toast } from 'sonner';
import { ModeSelector } from './ModeSelector';
import type { ModeType } from '@/types/chat';

interface ChatInputProps {
  onSend: (message: string, attachments?: File[], createImage?: boolean, canvas?: boolean) => void;
  guestMode?: boolean;
  onGuestFeatureRequest?: () => void;
  isLoading: boolean;
  mode: ModeType;
  onModeChange: (mode: ModeType) => void;
  webSearchEnabled: boolean;
  isSearchingWeb: boolean;
  onToggleWebSearch: () => void;
  onCancel: () => void;
  onEnhancePrompt?: (prompt: string) => Promise<string>;
  isEmptyState?: boolean;
}

export function ChatInput({ onSend, guestMode = false, onGuestFeatureRequest, isLoading, mode, onModeChange, webSearchEnabled, isSearchingWeb, onToggleWebSearch, onCancel, onEnhancePrompt, isEmptyState }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const [canvasEnabled, setCanvasEnabled] = useState(false);
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
    const nextFiles = guestMode ? files.slice(0, Math.max(0, 3 - attachments.length)) : files;
    if (guestMode && nextFiles.length < files.length) {
      toast('Guest uploads are limited to 3 photos. Sign in for a fuller upload experience.', { icon: '📸' });
    }
    setAttachments((prev) => [...prev, ...nextFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachments.length, guestMode]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    const hasContent = trimmed.length > 0 || attachments.length > 0;
    if (!hasContent || isLoading) return;
    if (imageGenerationEnabled && !trimmed) {
      toast.error('Describe the image you want to create first.');
      return;
    }
    setMenuOpen(false);
    onSend(trimmed, attachments.length > 0 ? attachments : undefined, imageGenerationEnabled, canvasEnabled);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isLoading, onSend, attachments, imageGenerationEnabled, canvasEnabled]);

  const handleEnhance = useCallback(async () => {
    if (!onEnhancePrompt || !text.trim() || isLoading || isEnhancing) return;
    setIsEnhancing(true);
    try {
      setText(await onEnhancePrompt(text.trim()));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to enhance this prompt.');
    } finally {
      setIsEnhancing(false);
    }
  }, [isEnhancing, isLoading, onEnhancePrompt, text]);

  const toggleMenu = useCallback(() => {
    if (isLoading) return;
    setMenuOpen((prev) => !prev);
  }, [isLoading]);

  const toggleImageGeneration = useCallback(() => {
    if (guestMode) {
      onGuestFeatureRequest?.();
      setMenuOpen(false);
      toast('Sign in is required to create images.', { icon: '🔐' });
      return;
    }
    setImageGenerationEnabled((previous) => !previous);
    setMenuOpen(false);
  }, [guestMode, onGuestFeatureRequest]);

  const toggleCanvas = useCallback(() => {
    setCanvasEnabled((previous) => !previous);
    setMenuOpen(false);
  }, []);

  const handleAddAttachment = useCallback(() => {
    setMenuOpen(false);
    if (guestMode && attachments.length >= 3) {
      onGuestFeatureRequest?.();
      toast('Guest uploads are limited to 3 photos. Sign in for richer attachment support.', { icon: '📸' });
      return;
    }
    fileInputRef.current?.click();
  }, [attachments.length, guestMode, onGuestFeatureRequest]);

  const handleToggleSearch = useCallback(() => {
    setMenuOpen(false);
    if (guestMode) {
      onGuestFeatureRequest?.();
      toast('Guest mode keeps chats temporary. Sign in to unlock web search and saved history.', { icon: '✨' });
      return;
    }
    onToggleWebSearch();
  }, [guestMode, onGuestFeatureRequest, onToggleWebSearch]);

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
          {(attachments.length > 0 || webSearchEnabled || isSearchingWeb || imageGenerationEnabled || canvasEnabled) && (
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
              {imageGenerationEnabled && (
                <button
                  type="button"
                  onClick={toggleImageGeneration}
                  className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-[11px] text-fuchsia-700 dark:border-fuchsia-500/40 dark:bg-fuchsia-950/40 dark:text-fuchsia-200"
                  aria-label="Disable image creation"
                >
                  <ImagePlus size={14} />
                  <span>Image creation enabled</span>
                  <X size={12} />
                </button>
              )}
              {canvasEnabled && (
                <button type="button" onClick={toggleCanvas} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" aria-label="Disable canvas"><PanelTop size={14} /><span>Canvas enabled</span><X size={12} /></button>
              )}
            </div>
          )}

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={imageGenerationEnabled ? 'Describe the image you want to create...' : 'How can I help you today?'}
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
                onClick={handleAddAttachment}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F9FAFB] shadow-sm transition-all duration-200 active:scale-95"
                aria-label="Open attachment menu"
                title="Add attachment"
              >
                <Plus size={20} />
              </button>
              <button type="button" onClick={toggleMenu} className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F9FAFB] shadow-sm transition-all duration-200" aria-label="More tools" title="More tools"><MoreHorizontal size={19} /></button>
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
                    onClick={toggleImageGeneration}
                    className={`w-full px-3 sm:px-4 py-3 sm:py-4 flex items-start gap-3 text-left transition-colors ${imageGenerationEnabled ? 'bg-fuchsia-50 dark:bg-fuchsia-950/30' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937] active:bg-[#F0F0F0] dark:active:bg-[#2D3748]'}`}
                  >
                    <span className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shrink-0">
                      <ImagePlus size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-[#111827] dark:text-[#F8FAFC]">{imageGenerationEnabled ? 'Disable image creation' : 'Create image'}</div>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Generate with PRE Image 2.1</p>
                    </div>
                  </button>
                  <button type="button" onClick={toggleCanvas} className={`w-full px-3 sm:px-4 py-3 sm:py-4 flex items-start gap-3 text-left transition-colors ${canvasEnabled ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937] active:bg-[#F0F0F0] dark:active:bg-[#2D3748]'}`}><span className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-2xl bg-slate-800 text-white shrink-0"><PanelTop size={18} /></span><div className="min-w-0"><div className="font-medium text-xs sm:text-sm text-[#111827] dark:text-[#F8FAFC]">{canvasEnabled ? 'Disable canvas' : 'Canvas'}</div><p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Write emails, essays, and longer drafts</p></div></button>
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
                type="button"
                onClick={handleEnhance}
                disabled={!text.trim() || isLoading || isEnhancing}
                className="flex h-8 items-center gap-1 rounded-full px-2 text-[#9CA3AF] transition-all duration-200 hover:bg-[#F0F0F2] hover:text-violet-600 disabled:opacity-40 dark:text-[#6B7280] dark:hover:bg-[#374151] dark:hover:text-violet-300"
                aria-label="Enhance prompt"
                title="Enhance prompt"
              >
                <Sparkles size={15} />
                <span className="hidden sm:inline text-[11px] font-medium">Enhance</span>
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
          {guestMode && <p className="mt-1 max-w-md mx-auto text-[10px] leading-4">By using PRV AI you agree to PRV AI Privacy Policy and Terms and Conditions.</p>}
        </div>
      </div>
    );
  }

  // Bottom-fixed input for active chat
  return (
    <div className="w-full max-w-[720px] mx-auto px-1 sm:px-0">
      <div className="relative rounded-2xl sm:rounded-[32px] border border-[#E5E7EB] dark:border-[#374151] bg-white/95 dark:bg-[#111827]/95 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.8)] sm:shadow-[0_20px_70px_-35px_rgba(15,23,42,0.8)] transition-all duration-300 pb-11 sm:pb-12">
        {/* Attachments display */}
          {(attachments.length > 0 || webSearchEnabled || isSearchingWeb || imageGenerationEnabled || canvasEnabled) && (
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
            {imageGenerationEnabled && (
              <button
                type="button"
                onClick={toggleImageGeneration}
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-[11px] text-fuchsia-700 dark:border-fuchsia-500/40 dark:bg-fuchsia-950/40 dark:text-fuchsia-200"
                aria-label="Disable image creation"
              >
                <ImagePlus size={14} />
                <span>Image creation enabled</span>
                <X size={12} />
              </button>
            )}
            {canvasEnabled && (
              <button type="button" onClick={toggleCanvas} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" aria-label="Disable canvas"><PanelTop size={14} /><span>Canvas enabled</span><X size={12} /></button>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={imageGenerationEnabled ? 'Describe the image you want to create...' : 'How can I help you today?'}
          rows={1}
          className="w-full min-h-11 sm:min-h-[58px] rounded-xl sm:rounded-[24px] border border-transparent bg-[#F8FAFC] dark:bg-[#111827] px-3 sm:px-4 py-2 sm:py-3.5 text-[15px] text-[#111827] dark:text-[#E5E7EB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:border-[#6366F1] dark:focus:border-[#8B5CF6] focus:bg-white dark:focus:bg-[#111827] focus:outline-none resize-none leading-relaxed"
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
              onClick={handleAddAttachment}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F9FAFB] shadow-sm transition-all duration-200"
              aria-label="Open attachment menu"
              title="Add attachment"
            >
              <Plus size={20} />
            </button>
            <button type="button" onClick={toggleMenu} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F9FAFB] shadow-sm transition-all duration-200" aria-label="More tools" title="More tools"><MoreHorizontal size={19} /></button>
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
                  onClick={toggleImageGeneration}
                  className={`w-full px-4 py-4 flex items-start gap-3 text-left transition-colors ${imageGenerationEnabled ? 'bg-fuchsia-50 dark:bg-fuchsia-950/30' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937]'}`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shrink-0">
                    <ImagePlus size={18} />
                  </span>
                  <div>
                    <div className="font-medium text-sm text-[#111827] dark:text-[#F8FAFC]">{imageGenerationEnabled ? 'Disable image creation' : 'Create image'}</div>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Generate with PRE Image 2.1</p>
                  </div>
                  </button>
                  <button type="button" onClick={toggleCanvas} className={`w-full px-3 sm:px-4 py-3 sm:py-4 flex items-start gap-3 text-left transition-colors ${canvasEnabled ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937]'}`}><span className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-2xl bg-slate-800 text-white shrink-0"><PanelTop size={18} /></span><div className="min-w-0"><div className="font-medium text-xs sm:text-sm text-[#111827] dark:text-[#F8FAFC]">{canvasEnabled ? 'Disable canvas' : 'Canvas'}</div><p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Write emails, essays, and longer drafts</p></div></button>
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
              type="button"
              onClick={handleEnhance}
              disabled={!text.trim() || isLoading || isEnhancing}
              className="flex h-8 items-center gap-1 rounded-full px-2 text-[#9CA3AF] transition-all duration-200 hover:bg-[#F0F0F2] hover:text-violet-600 disabled:opacity-40 dark:text-[#6B7280] dark:hover:bg-[#374151] dark:hover:text-violet-300"
              aria-label="Enhance prompt"
              title="Enhance prompt"
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline text-[11px] font-medium">Enhance</span>
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
