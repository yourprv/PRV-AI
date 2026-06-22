import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Brain, Sparkles } from 'lucide-react';
import type { ModeType } from '@/types/chat';

const modes: { id: ModeType; name: string; icon: React.ReactNode }[] = [
  { id: 'auto', name: 'Auto', icon: <Sparkles size={14} /> },
  { id: 'thinking', name: 'Thinking', icon: <Brain size={14} /> },
  { id: 'fast', name: 'Fast', icon: <Zap size={14} /> },
];

interface ModeSelectorProps {
  selected: ModeType;
  onSelect: (mode: ModeType) => void;
}

export function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentMode = modes.find(m => m.id === selected) || modes[2];

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
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[13px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors duration-200 rounded-lg px-2 py-1 hover:bg-[#F0F0F2] dark:hover:bg-[#374151]"
        aria-label="Select mode"
        aria-expanded={isOpen}
      >
        {currentMode.name}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 z-50 w-[140px] bg-white dark:bg-[#2D3748] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-[#E5E7EB] dark:border-[#374151] animate-fade-in overflow-hidden p-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                onSelect(mode.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 text-left rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150 ${
                selected === mode.id
                  ? 'bg-[#F5F5F7] dark:bg-[#374151] text-[#111827] dark:text-[#F3F4F6]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F9F9FB] dark:hover:bg-[#374151] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
              }`}
            >
              <span className="text-[#9CA3AF] dark:text-[#6B7280]">{mode.icon}</span>
              <span>{mode.name}</span>
              {selected === mode.id && (
                <Check size={14} className="text-[#4F46E5] dark:text-[#818CF8] ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
