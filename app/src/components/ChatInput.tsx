import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Plus, PenLine, X, UploadCloud, Globe, ImagePlus, PanelTop } from 'lucide-react';
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
  const isComposingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
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
      // Do not submit while an IME is composing a character. This keeps the
      // composer reliable for languages that confirm text with Enter.
      if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
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
      <div className="w-full max-w-[720px] mx-auto px-1 sm:px-0">
        <div className="workspace-composer relative rounded-[18px] border dark:border-[#374151] dark:bg-[#111827]/95">
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
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe2d8] bg-[#f1f4ef] dark:border-[#60A5FA] dark:bg-[#1E40AF] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#536653] dark:text-[#DBEAFE]">
                  <Globe size={14} />
                  <span className="flex items-center gap-1">
                    Searching the web
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#758c73] dark:bg-[#BFDBFE] animate-pulse" />
                  </span>
                </div>
              ) : webSearchEnabled ? (
                <button
                  type="button"
                  onClick={onToggleWebSearch}
                  className="inline-flex items-center gap-2 rounded-full border border-[#dbe2d8] bg-[#f1f4ef] dark:border-[#4F46E5] dark:bg-[#4338CA] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#536653] dark:text-[#E0E7FF] hover:bg-[#e6eee4] dark:hover:bg-[#4F46E5] transition-colors duration-150"
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
                  className="inline-flex items-center gap-2 rounded-full border border-[#e5e2d9] bg-[#f4f3ee] px-3 py-1.5 text-[11px] text-[#62675e] dark:border-fuchsia-500/40 dark:bg-fuchsia-950/40 dark:text-fuchsia-200"
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
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            placeholder={imageGenerationEnabled ? 'Describe the image you want to create...' : 'How can I help you today?'}
            rows={1}
            className="block w-full min-h-[82px] rounded-t-[18px] border border-transparent bg-transparent px-4 pt-4 pb-2 text-[15px] text-[#111827] dark:text-[#E5E7EB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:ring-0 focus:outline-none resize-none leading-6"
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
          <div ref={menuRootRef} className="flex items-center justify-between gap-2 border-t border-[#efeee9] px-3 py-2 dark:border-slate-800">
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMenu}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e2d9] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6c7168] hover:text-[#20231f] dark:hover:text-[#F9FAFB] transition-all duration-150 active:scale-95"
                aria-label="Open attachment menu"
                title="Add attachment"
              >
                <Plus size={18} />
              </button>
              {menuOpen && (
                <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827] shadow-xl z-50">
                  <button type="button" onClick={handleAddAttachment} className="w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left hover:bg-[#f8f7f3] dark:hover:bg-[#1F2937] transition-colors"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] dark:bg-[#4338CA] dark:text-[#E0E7FF]"><UploadCloud size={15} /></span><span><span className="block text-xs font-medium text-[#111827] dark:text-[#F8FAFC]">Add photos &amp; files</span><span className="block text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Upload from your computer</span></span></button>
                  <button
                    type="button"
                    onClick={toggleImageGeneration}
                    className={`w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left transition-colors ${imageGenerationEnabled ? 'bg-[#f4f3ee] dark:bg-fuchsia-950/30' : 'hover:bg-[#f8f7f3] dark:hover:bg-[#1F2937]'}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] shrink-0">
                      <ImagePlus size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-[#111827] dark:text-[#F8FAFC]">{imageGenerationEnabled ? 'Disable image creation' : 'Create image'}</div>
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Generate with PRE Image 2.1</p>
                    </div>
                  </button>
                  <button type="button" onClick={toggleCanvas} className={`w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left transition-colors ${canvasEnabled ? 'bg-[#f1f0ea] dark:bg-slate-800' : 'hover:bg-[#f8f7f3] dark:hover:bg-[#1F2937] active:bg-[#efeee8] dark:active:bg-[#2D3748]'}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] shrink-0"><PanelTop size={15} /></span><div className="min-w-0"><div className="font-medium text-xs text-[#111827] dark:text-[#F8FAFC]">{canvasEnabled ? 'Disable canvas' : 'Canvas'}</div><p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Write emails, essays, and longer drafts</p></div></button>
                  <button
                    type="button"
                    onClick={handleToggleSearch}
                    className="w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937] active:bg-[#F0F0F0] dark:active:bg-[#2D3748] transition-colors"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] dark:bg-[#3730A3] dark:text-[#E0E7FF] shrink-0">
                      <Globe size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-[#111827] dark:text-[#F8FAFC]">{webSearchEnabled ? 'Disable web search' : 'Enable web search'}</div>
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{webSearchEnabled ? 'Search is active for the next query' : 'Include live web results once'}</p>
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
                className="flex h-8 items-center gap-1 rounded-lg px-2 text-[#898b82] transition-all duration-150 hover:bg-[#f1f0ea] hover:text-[#536653] disabled:opacity-40 dark:text-[#6B7280] dark:hover:bg-[#374151] dark:hover:text-violet-300"
                aria-label="Refine prompt"
                title="Refine prompt"
              >
                <PenLine size={14} />
                <span className="hidden sm:inline text-[11px] font-medium">Refine</span>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || isLoading}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
                  canSend
                    ? 'workspace-primary-button cursor-pointer'
                    : 'bg-[#e9e8e2] dark:bg-[#4B5563] text-[#a0a197] dark:text-[#6B7280] cursor-default'
                }`}
                aria-label="Send message"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Subtle hint */}
        <div className="mt-3 text-center text-[11px] leading-5 text-[#92938c] dark:text-[#9CA3AF]">
          <p>PRV can make mistakes. Check important information.</p>
          {guestMode && <p className="mt-1 max-w-md mx-auto text-[10px] leading-4">By using PRV AI you agree to PRV AI Privacy Policy and Terms and Conditions.</p>}
        </div>
      </div>
    );
  }

  // Bottom-fixed input for active chat
  return (
    <div className="w-full max-w-[720px] mx-auto px-1 sm:px-0">
      <div className="workspace-composer relative rounded-[18px] border dark:border-[#374151] dark:bg-[#111827]/95">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe2d8] bg-[#f1f4ef] dark:border-[#60A5FA] dark:bg-[#1E40AF] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#536653] dark:text-[#DBEAFE]">
                <Globe size={14} />
                <span className="flex items-center gap-1">
                  Searching the web
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#758c73] dark:bg-[#BFDBFE] animate-pulse" />
                </span>
              </div>
              ) : webSearchEnabled ? (
              <button
                type="button"
                onClick={onToggleWebSearch}
                className="inline-flex items-center gap-2 rounded-full border border-[#dbe2d8] bg-[#f1f4ef] dark:border-[#4F46E5] dark:bg-[#4338CA] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#536653] dark:text-[#E0E7FF] hover:bg-[#e6eee4] dark:hover:bg-[#4F46E5] transition-colors duration-150"
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
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e2d9] bg-[#f4f3ee] px-3 py-1.5 text-[11px] text-[#62675e] dark:border-fuchsia-500/40 dark:bg-fuchsia-950/40 dark:text-fuchsia-200"
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
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={() => { isComposingRef.current = false; }}
          placeholder={imageGenerationEnabled ? 'Describe the image you want to create...' : 'How can I help you today?'}
          rows={1}
          className="block w-full min-h-[76px] rounded-t-[18px] border border-transparent bg-transparent px-4 pt-4 pb-2 text-[15px] text-[#111827] dark:text-[#E5E7EB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:ring-0 focus:outline-none resize-none leading-6"
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

        <div ref={menuRootRef} className="flex items-center justify-between gap-2 border-t border-[#efeee9] px-3 py-2 dark:border-slate-800">
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMenu}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e2d9] dark:border-[#374151] bg-white dark:bg-[#0F172A] text-[#6c7168] hover:text-[#20231f] dark:hover:text-[#F9FAFB] transition-all duration-150"
              aria-label="Open attachment menu"
              title="Add attachment"
            >
              <Plus size={18} />
            </button>
            {menuOpen && (
                <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827] shadow-xl z-50">
                <button type="button" onClick={handleAddAttachment} className="w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left hover:bg-[#f8f7f3] dark:hover:bg-[#1F2937]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] dark:bg-[#4338CA] dark:text-[#E0E7FF]"><UploadCloud size={15} /></span><span><span className="block text-xs font-medium text-[#111827] dark:text-[#F8FAFC]">Add photos &amp; files</span><span className="block text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Upload from your computer</span></span></button>
                <button
                  type="button"
                  onClick={toggleImageGeneration}
                  className={`w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left transition-colors ${imageGenerationEnabled ? 'bg-[#f4f3ee] dark:bg-fuchsia-950/30' : 'hover:bg-[#f8f7f3] dark:hover:bg-[#1F2937]'}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] shrink-0">
                    <ImagePlus size={15} />
                  </span>
                  <div>
                    <div className="font-medium text-xs text-[#111827] dark:text-[#F8FAFC]">{imageGenerationEnabled ? 'Disable image creation' : 'Create image'}</div>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Generate with PRE Image 2.1</p>
                  </div>
                  </button>
                  <button type="button" onClick={toggleCanvas} className={`w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left transition-colors ${canvasEnabled ? 'bg-[#f1f0ea] dark:bg-slate-800' : 'hover:bg-[#f8f7f3] dark:hover:bg-[#1F2937]'}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] shrink-0"><PanelTop size={15} /></span><div className="min-w-0"><div className="font-medium text-xs text-[#111827] dark:text-[#F8FAFC]">{canvasEnabled ? 'Disable canvas' : 'Canvas'}</div><p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Write emails, essays, and longer drafts</p></div></button>
                <button
                  type="button"
                  onClick={handleToggleSearch}
                  className="w-full min-h-12 px-3 py-2 flex items-center gap-2.5 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf0e9] text-[#536653] dark:bg-[#3730A3] dark:text-[#E0E7FF]">
                    <Globe size={15} />
                  </span>
                  <div>
                    <div className="font-medium text-xs text-[#111827] dark:text-[#F8FAFC]">{webSearchEnabled ? 'Disable web search' : 'Enable web search'}</div>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{webSearchEnabled ? 'Search is active for the next query' : 'Include live web results once'}</p>
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
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-[#898b82] transition-all duration-150 hover:bg-[#f1f0ea] hover:text-[#536653] disabled:opacity-40 dark:text-[#6B7280] dark:hover:bg-[#374151] dark:hover:text-violet-300"
              aria-label="Refine prompt"
              title="Refine prompt"
            >
              <PenLine size={14} />
              <span className="hidden sm:inline text-[11px] font-medium">Refine</span>
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
                type="button"
                onClick={handleSend}
                disabled={!canSend || isLoading}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                  canSend
                    ? 'workspace-primary-button active:scale-95 cursor-pointer'
                    : 'bg-[#e9e8e2] dark:bg-[#4B5563] text-[#a0a197] dark:text-[#6B7280] cursor-default'
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
