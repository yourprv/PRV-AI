import { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { Copy, Check, RotateCcw, User, ChevronDown } from 'lucide-react';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
  isLatest?: boolean;
  isLoading?: boolean;
}

export function MessageBubble({ message, onRegenerate, isLatest, isLoading }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy:', err);
    }
  }, [message.content]);

  const isUser = message.role === 'user';
  const hasThinking = !isUser && message.mode === 'thinking' && Boolean(message.thinking && message.thinking.trim());
  const isPlaceholder = !isUser && isLoading && message.content.trim() === '';
  const showTypingBubble = isPlaceholder && !hasThinking;
  const date = new Date(message.timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (hasThinking) {
      setThinkingOpen(true);
    }
  }, [hasThinking]);

  return (
    <div
      className={`flex w-full animate-message-appear ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay: '50ms' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex gap-3 max-w-[92%] md:max-w-[80ch] min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
<div className="w-7 h-7 rounded-full shrink-0 overflow-hidden">
            {isUser ? (
              <User size={14} className="text-white" />
            ) : (
              <img src="/AI.png" alt="AI" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Message content */}
        <div className="flex flex-col gap-1 min-w-0">
          <div
            className={`px-4 py-3 rounded-2xl break-words text-[15px] leading-relaxed ${
              isUser
                ? 'bg-[#4F46E5] dark:bg-[#6366F1] text-white rounded-tr-sm'
                : 'bg-[#F9F9FB] dark:bg-[#2D3748] text-[#374151] dark:text-[#D1D5DB] border border-[#E5E7EB] dark:border-[#374151] rounded-tl-sm'
            }`}
          >
            {isUser ? (
              <div className="flex flex-col gap-2">
                <div className="whitespace-pre-wrap">
                  {message.content || 'Uploaded attachment'}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {message.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#E5E7EB] dark:border-[#374151] bg-[#FFFFFF] dark:bg-[#111827] p-3 text-[13px] text-[#374151] dark:text-[#D1D5DB]"
                      >
                        <div className="font-medium text-[#111827] dark:text-[#F3F4F6] truncate">
                          {attachment.name}
                        </div>
                        <div className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
                          {attachment.mimeType || 'Attachment'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : showTypingBubble ? (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#6B7280] animate-typing-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#6B7280] animate-typing-bounce"
                  style={{ animationDelay: '120ms' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#6B7280] animate-typing-bounce"
                  style={{ animationDelay: '240ms' }}
                />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-black/5 dark:prose-code:bg-white/10">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {hasThinking && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setThinkingOpen((prev) => !prev)}
                className="flex items-center gap-1.5 self-start rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-medium text-[#92400E] transition-colors duration-150 hover:bg-[#FDE68A] dark:border-[#78350F] dark:bg-[#451A03] dark:text-[#FCD34D]"
              >
                <span>Thinking</span>
                <ChevronDown size={12} className={`transition-transform ${thinkingOpen ? 'rotate-180' : ''}`} />
              </button>

              {thinkingOpen && (
                <div className="rounded-xl border border-[#FDE68A]/80 bg-[#FFFBEB] p-3 text-[13px] leading-relaxed text-[#92400E] dark:border-[#78350F] dark:bg-[#2C1304] dark:text-[#FCD34D]">
                  {message.thinking}
                </div>
              )}
            </div>
          )}

          {/* Actions row */}
          <div className={`flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] px-1">{timeStr}</span>

            {!isUser && (
              <div
                className={`flex items-center gap-0.5 transition-opacity duration-200 ${
                  showActions ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-[#F5F5F7] dark:hover:bg-[#374151] text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#6B7280] dark:hover:text-[#9CA3AF] transition-colors duration-150"
                  aria-label="Copy message"
                  title="Copy"
                >
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
                {isLatest && onRegenerate && (
                  <button
                    onClick={() => onRegenerate(message.id)}
                    className="p-1 rounded-md hover:bg-[#F5F5F7] dark:hover:bg-[#374151] text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#6B7280] dark:hover:text-[#9CA3AF] transition-colors duration-150"
                    aria-label="Regenerate response"
                    title="Regenerate"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
