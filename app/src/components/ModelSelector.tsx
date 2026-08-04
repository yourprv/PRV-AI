import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Flame, Globe2, Sparkles, Zap } from 'lucide-react';
import type { ModelId } from '@/types/chat';
import { AVAILABLE_MODELS } from '@/types/chat';

interface ModelSelectorProps {
  selected: ModelId;
  onSelect: (model: ModelId) => void;
  compact?: boolean;
  disabled?: boolean;
  onDisabledClick?: () => void;
  guestMode?: boolean;
}

const accentClasses = {
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
  sky: 'bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300',
  slate: 'bg-slate-100 text-slate-500 dark:bg-slate-400/15 dark:text-slate-300',
} as const;

type ModelAccent = keyof typeof accentClasses;

function ModelGlyph({ accent }: { accent: ModelAccent }) {
  if (accent === 'orange') return <Flame size={15} />;
  if (accent === 'green') return <Globe2 size={15} />;
  if (accent === 'sky') return <Sparkles size={15} />;
  return accent === 'violet' ? <Zap size={15} /> : <Sparkles size={15} />;
}

export function ModelSelector({ selected, onSelect, compact, disabled, onDisabledClick, guestMode = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selected) || AVAILABLE_MODELS[0];
  const groups = ['PRV models', 'Legacy models'] as const;

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
          if (guestMode) {
            setIsOpen((prev) => !prev);
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        aria-disabled={disabled}
        className={`group flex items-center gap-2 text-xs sm:text-[15px] font-semibold transition-all duration-200 rounded-xl px-2 sm:px-3 py-2 -ml-2 sm:ml-0 w-auto sm:w-full ${disabled ? 'text-[#9CA3AF] dark:text-[#6B7280] bg-[#F3F4F6] dark:bg-[#1F2937] cursor-not-allowed' : 'text-[#111827] dark:text-[#F3F4F6] hover:text-[#4F46E5] dark:hover:text-[#A78BFA] hover:bg-violet-50/70 dark:hover:bg-violet-400/10'}`}
        aria-label="Select model"
        aria-expanded={isOpen}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${accentClasses[currentModel.accent]}`}><ModelGlyph accent={currentModel.accent} /></span>
        <span className="truncate">{currentModel.name}</span>
        {currentModel.badge && <span className="hidden sm:inline rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-sky-600 dark:bg-sky-400/15 dark:text-sky-300">{currentModel.badge}</span>}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 top-full mt-2 z-50 w-screen sm:w-[390px] sm:max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_70px_-20px_rgba(15,23,42,0.3)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 animate-fade-in max-h-[75vh] overflow-y-auto">
          {compact && (
            <div className="px-4 pt-4 pb-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] sticky top-0 bg-white/95 dark:bg-slate-900/95">
              <span>Choose your engine</span><span className="normal-case tracking-normal text-[11px]">{AVAILABLE_MODELS.length} available</span>
            </div>
          )}
          <div className="p-2 sm:p-2.5">
            {groups.map((group) => <div key={group} className="mb-2 last:mb-0">
              {group === 'Legacy models' ? <button type="button" onClick={() => setLegacyOpen((open) => !open)} className="flex w-full items-center gap-2 rounded-xl px-2 pb-2 pt-2 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800/60"><span className={`transition-transform ${legacyOpen ? 'rotate-90' : ''}`}>›</span><span>{group}</span><span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" /><span className="normal-case tracking-normal">{AVAILABLE_MODELS.filter((model) => model.group === group).length}</span></button> : <div className="flex items-center gap-2 px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500"><span>{group}</span><span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" /></div>}
              {(group !== 'Legacy models' || legacyOpen) && AVAILABLE_MODELS.filter((model) => model.group === group).map((model) => <div key={model.id}>
                <button
                  onClick={() => {
                    if (guestMode && model.id !== 'prv-v3.2-fire') {
                      setIsOpen(false);
                      return;
                    }
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
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accentClasses[model.accent]}`}><ModelGlyph accent={model.accent} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-[13px] font-medium text-[#111827] dark:text-[#F3F4F6]">
                          {model.name}
                        </span>
                        {model.badge && (
                          <div className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-sky-600 whitespace-nowrap dark:bg-sky-400/15 dark:text-sky-300">
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
              </div>)}
            </div>)}
          </div>
        </div>
      )}
    </div>
  );
}
