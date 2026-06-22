import { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquareText } from 'lucide-react';
import type { Chat } from '@/types/chat';

interface SearchOverlayProps {
  chats: Chat[];
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export function SearchOverlay({ chats, isOpen, onClose, onSelectChat }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const filtered = query.trim()
    ? chats.filter((c) => c.title.toLowerCase().includes(query.toLowerCase().trim()))
    : [];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Search modal */}
      <div
        className="relative w-full max-w-[520px] mx-4 bg-white dark:bg-[#1F2937] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#374151]">
          <Search size={18} className="text-[#9CA3AF] dark:text-[#6B7280] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-[15px] text-[#111827] dark:text-[#F3F4F6] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-[#E5E7EB] dark:bg-[#374151] text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#D1D5DB] dark:hover:bg-[#4B5563] transition-colors"
            >
              <X size={12} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[11px] text-[#9CA3AF] dark:text-[#6B7280] bg-[#F5F5F7] dark:bg-[#2D3748] rounded border border-[#E5E7EB] dark:border-[#374151]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto no-scrollbar">
          {query.trim() === '' ? (
            <div className="px-4 py-8 text-center">
              <MessageSquareText size={28} className="text-[#E5E7EB] dark:text-[#374151] mx-auto mb-2" />
              <p className="text-[13px] text-[#9CA3AF] dark:text-[#6B7280]">
                Type to search your conversations
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-[#9CA3AF] dark:text-[#6B7280]">
                No conversations found for "{query}"
              </p>
            </div>
          ) : (
            <div className="py-1.5">
              <div className="px-4 py-1.5 text-[11px] font-medium text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wide">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </div>
              {filtered.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748] transition-colors duration-150"
                >
                  <MessageSquareText size={16} className="text-[#9CA3AF] dark:text-[#6B7280] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#111827] dark:text-[#F3F4F6] truncate">{chat.title}</p>
                    <p className="text-[12px] text-[#9CA3AF] dark:text-[#6B7280] mt-0.5">
                      {new Date(chat.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
