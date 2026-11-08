import { Children, isValidElement, useState, useCallback, useEffect, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { Copy, Check, RotateCcw, User, ChevronDown } from 'lucide-react';
import type { Message } from '@/types/chat';
import { BrandMark } from './BrandMark';

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy code:', err);
    }
  }, [code]);

  return (
    <div className="not-prose my-3 overflow-hidden rounded-xl border border-[#e3e1d9] bg-[#f4f3ee] text-[#343831]">
      <div className="flex items-center justify-between border-b border-[#e3e1d9] bg-white/70 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#81847b]">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-[#6d7268] transition-colors hover:bg-[#efeee8] hover:text-[#252a24]"
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? <Check size={13} className="text-[#526b55]" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-w-full overflow-x-hidden whitespace-pre-wrap break-words p-4 text-[13px] leading-6"><code className="break-all">{code}</code></pre>
    </div>
  );
}

function CanvasBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="not-prose my-1 overflow-hidden rounded-xl border border-[#e3e1d9] bg-[#f4f3ee] text-[#343831]">
      <div className="flex items-center justify-between border-b border-[#e3e1d9] bg-white/70 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#81847b]">Canvas</span>
        <button type="button" onClick={copy} className="rounded-md px-2 py-1 text-[11px] text-[#6d7268] hover:bg-[#efeee8] hover:text-[#252a24]">{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <div className="whitespace-pre-wrap break-words p-4 text-[14px] leading-6">{content || ' '}</div>
    </div>
  );
}

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
      <div className={`flex min-w-0 max-w-full gap-1.5 overflow-hidden sm:gap-3 sm:max-w-[92%] md:max-w-[80ch] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center sm:h-7 sm:w-7">
            {isUser ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf0e9] text-[#536653] sm:h-7 sm:w-7"><User size={14} /></span>
            ) : (
              <BrandMark size="sm" />
          )}
        </div>

        {/* Message content */}
        <div className="flex min-w-0 max-w-full flex-col gap-1 overflow-hidden">
          <div
            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl break-words text-sm sm:text-[15px] leading-relaxed ${
              isUser
                ? 'bg-[#35483a] dark:bg-[#6366F1] text-white rounded-tr-md shadow-sm'
                : 'bg-transparent text-[#343831] dark:bg-[#2D3748] dark:text-[#D1D5DB] rounded-tl-md'
            }`}
          >
            {isUser ? (
              <div className="flex flex-col gap-2">
                <div className="whitespace-pre-wrap">
                  {message.content || 'Uploaded attachment'}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    {message.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg sm:rounded-2xl border border-[#E5E7EB] dark:border-[#374151] bg-[#FFFFFF] dark:bg-[#111827] p-2 sm:p-3 text-[12px] sm:text-[13px] text-[#374151] dark:text-[#D1D5DB]"
                      >
                        <div className="font-medium text-[#111827] dark:text-[#F3F4F6] truncate text-xs sm:text-sm">
                          {attachment.name}
                        </div>
                        <div className="text-[11px] sm:text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
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
              <>
                {message.canvas ? <CanvasBlock content={message.content} /> : <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-black/5 dark:prose-code:bg-white/10">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                    pre({ children }) {
                      const codeElement = Children.toArray(children)[0];
                      if (isValidElement(codeElement)) {
                        const props = codeElement.props as { children?: ReactNode; className?: string };
                        const language = props.className?.match(/language-([\w-]+)/)?.[1];
                        const code = Children.toArray(props.children)
                          .map((child) => (typeof child === 'string' ? child : String(child)))
                          .join('')
                          .replace(/\n$/, '');

                        return <CodeBlock code={code} language={language} />;
                      }
                      return <pre>{children}</pre>;
                    },
                    code({ children, className, ...props }) {
                      return (
                        <code className={`rounded bg-black/5 px-1 py-0.5 dark:bg-white/10 ${className ?? ''}`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>}
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="AI generated image"
                    className="mt-3 max-h-[min(70vh,40rem)] w-full rounded-xl border border-slate-700/80 object-contain shadow-lg"
                  />
                )}
              </>
            )}
          </div>

          {hasThinking && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setThinkingOpen((prev) => !prev)}
                className="flex items-center gap-1.5 self-start rounded-full border border-[#e5e4dc] bg-[#f4f3ee] px-2.5 py-1 text-[11px] font-medium text-[#73786e] transition-colors duration-150 hover:bg-[#ecebe4] dark:border-[#78350F] dark:bg-[#451A03] dark:text-[#FCD34D]"
              >
                <span>Thinking</span>
                <ChevronDown size={12} className={`transition-transform ${thinkingOpen ? 'rotate-180' : ''}`} />
              </button>

              {thinkingOpen && (
                <div className="rounded-xl border border-[#e8e6de] bg-[#f8f7f3] p-3 text-[13px] leading-relaxed text-[#73766e] dark:border-[#78350F] dark:bg-[#2C1304] dark:text-[#FCD34D]">
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
                  showActions ? 'opacity-100' : 'opacity-100 sm:opacity-0'
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
