import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { ModelId } from '@/types/chat';
import { AVAILABLE_MODELS } from '@/types/chat';

interface ModelSelectorProps {
  selected: ModelId;
  onSelect: (model: ModelId) => void;
  compact?: boolean;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

export function ModelSelector({ selected, onSelect, compact, disabled, onDisabledClick }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selected) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => {
          if (disabled) {
            onDisabledClick?.();
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        aria-disabled={disabled}
        className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-[15px] md:text-[16px] font-semibold transition-colors duration-200 rounded-lg px-2 sm:px-3 py-2 -ml-2 sm:ml-0 w-auto sm:w-full ${disabled ? 'text-[#9CA3AF] dark:text-[#6B7280] bg-[#F3F4F6] dark:bg-[#1F2937] cursor-not-allowed' : 'text-[#111827] dark:text-[#F3F4F6] hover:text-[#4F46E5] dark:hover:text-[#818CF8] hover:bg-[#F5F5F7] dark:hover:bg-[#374151]'}`}
        aria-label="Select model"
        aria-expanded={isOpen}
      >
        <span className="truncate">{currentModel.name}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-screen sm:w-[360px] sm:max-w-md bg-white dark:bg-[#2D3748] rounded-t-2xl sm:rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-[#E5E7EB] dark:border-[#374151] sm:border-t animate-fade-in overflow-hidden max-h-[70vh] overflow-y-auto">
          {compact && (
            <div className="px-3 sm:px-4 pt-3 pb-1 flex items-center gap-2 text-[10px] sm:text-[11px] text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-wide sticky top-0 bg-white dark:bg-[#2D3748]">
              <span>Model</span>
            </div>
          )}
          <div className="p-1 sm:p-1.5">
            {AVAILABLE_MODELS.map((model) => (
              <div key={model.id}>
                <button
                  onClick={() => {
                    onSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 transition-colors duration-150 active:bg-[#E5E7EB] dark:active:bg-[#2D3748] ${
                    selected === model.id
                      ? 'bg-[#F5F5F7] dark:bg-[#374151]'
                      : 'hover:bg-[#F9F9FB] dark:hover:bg-[#374151]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 sm:gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-[13px] font-medium text-[#111827] dark:text-[#F3F4F6]">
                          {model.name}
                        </span>
                        {model.badge && (
                          <div className="bg-[#6366F1] text-white text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                            {model.badge}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
                        {model.description}
                      </p>
                    </div>
                    {selected === model.id && (
                      <Check size={14} className="text-[#4F46E5] dark:text-[#818CF8] mt-0.5 shrink-0 sm:w-4 sm:h-4" />
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
