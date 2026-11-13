import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Flame, Globe2, LockKeyhole, Zap, CircleDot, Layers } from 'lucide-react';
import type { ModelId } from '@/types/chat';
import { AVAILABLE_MODELS } from '@/types/chat';

interface ModelSelectorProps {
  selected: ModelId;
  onSelect: (model: ModelId) => void;
  compact?: boolean;
  disabled?: boolean;
  onDisabledClick?: () => void;
  guestMode?: boolean;
  tier?: 'free' | 'go' | 'plus' | 'pro';
  onUpgradeClick?: () => void;
}

const accentClasses = {
  violet: 'bg-[#f0eadb] text-[#776442] dark:bg-[#c6ad70]/15 dark:text-[#d5c49d]',
  orange: 'bg-[#f3eee5] text-[#927348] dark:bg-orange-400/15 dark:text-orange-300',
  green: 'bg-[#edf0e9] text-[#536653] dark:bg-emerald-400/15 dark:text-emerald-300',
  sky: 'bg-[#edf0eb] text-[#65705f] dark:bg-[#87977a]/15 dark:text-[#c6d1b7]',
  slate: 'bg-[#f0eadb] text-[#766e5c] dark:bg-[#c6ad70]/10 dark:text-[#d0c7b3]',
} as const;

type ModelAccent = keyof typeof accentClasses;

function ModelGlyph({ accent }: { accent: ModelAccent }) {
  if (accent === 'orange') return <Flame size={15} />;
  if (accent === 'green') return <Globe2 size={15} />;
  if (accent === 'sky') return <CircleDot size={15} />;
  if (accent === 'slate') return <Layers size={15} />;
  return accent === 'violet' ? <Zap size={15} /> : <CircleDot size={15} />;
}

export function ModelSelector({ selected, onSelect, compact, disabled, onDisabledClick, guestMode = false, tier = 'free', onUpgradeClick }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selected) || AVAILABLE_MODELS[0];
  const groups = ['PRV models', 'Legacy models', 'Kite Studio'] as const;
  const selectableCount = AVAILABLE_MODELS.filter((model) => model.selectable !== false).length;

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
    <div ref={ref} className="relative min-w-0 w-full">
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
        className={`group flex min-w-0 max-w-full items-center gap-1.5 text-xs font-semibold transition-all duration-150 rounded-xl px-1.5 py-2 -ml-1 sm:gap-2 sm:px-3 sm:ml-0 sm:text-[15px] sm:w-full ${disabled ? 'text-[#92948b] dark:text-[#a49b83] bg-[#efeee8] dark:bg-[#2b2921] cursor-not-allowed' : 'text-[#282c26] dark:text-[#f3eddf] hover:text-[#536653] dark:hover:text-[#d5c49d] hover:bg-[#f0f1eb] dark:hover:bg-[#c6ad70]/10'}`}
        aria-label="Select model"
        aria-expanded={isOpen}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${accentClasses[currentModel.accent]}`}><ModelGlyph accent={currentModel.accent} /></span>
        <span className="min-w-0 truncate">{currentModel.name}</span>
        {currentModel.badge && <span className="hidden sm:inline rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-sky-600 dark:bg-[#bda76b]/15 dark:text-[#c4b484]">{currentModel.badge}</span>}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="mobile-model-menu absolute left-0 top-full z-50 mt-2 w-[24rem] max-w-[calc(100vw_-_3.5rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-[#e5dac3] bg-[#fffdf8]/95 shadow-[0_20px_70px_-20px_rgba(48,42,29,0.24)] backdrop-blur-xl animate-fade-in max-h-[75vh] sm:w-[390px] sm:max-w-md dark:border-[#454235] dark:bg-[#24231d]/95">
          {compact && (
            <div className="sticky top-0 flex items-center justify-between bg-[#fffdf8]/95 px-4 pb-2 pt-4 text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:bg-[#24231d]/95 dark:text-[#a49b83]">
              <span>Choose a model</span><span className="normal-case tracking-normal text-[11px]">{selectableCount} available · 1 preview</span>
            </div>
          )}
          <div className="p-2 sm:p-2.5">
            {groups.map((group) => <div key={group} className="mb-2 last:mb-0">
              {group === 'Legacy models' ? <button type="button" onClick={() => setLegacyOpen((open) => !open)} className="flex w-full items-center gap-2 rounded-xl px-2 pb-2 pt-2 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:bg-slate-50 dark:text-[#a49b83] dark:hover:bg-[#302f25]/60"><span className={`transition-transform ${legacyOpen ? 'rotate-90' : ''}`}>›</span><span>{group}</span><span className="h-px flex-1 bg-slate-100 dark:bg-[#302f25]" /><span className="normal-case tracking-normal">{AVAILABLE_MODELS.filter((model) => model.group === group).length}</span></button> : <div className="flex items-center gap-2 px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-[#a49b83]"><span>{group}</span><span className="h-px flex-1 bg-slate-100 dark:bg-[#302f25]" /></div>}
              {(group !== 'Legacy models' || legacyOpen) && AVAILABLE_MODELS.filter((model) => model.group === group).map((model) => <div key={model.id}>
                <button
                  type="button"
                  disabled={model.selectable === false}
                  aria-label={model.selectable === false ? `${model.name}: use in Kite Studio` : undefined}
                  onClick={() => {
                    if (model.selectable === false) return;
                    if (model.id === 'prv-v4-light' && tier === 'free') {
                      setIsOpen(false);
                      onUpgradeClick?.();
                      return;
                    }
                    onSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 transition-colors duration-150 active:bg-[#E5E7EB] dark:active:bg-[#37352b] ${
                    model.selectable === false
                      ? 'cursor-not-allowed opacity-75'
                      : selected === model.id
                      ? 'bg-[#f0f1eb] dark:bg-[#38362a]'
                      : 'hover:bg-[#f7f6f2] dark:hover:bg-[#38362a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 sm:gap-2">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accentClasses[model.accent]}`}><ModelGlyph accent={model.accent} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-[13px] font-medium text-[#111827] dark:text-[#f3eddf]">
                          {model.name}
                        </span>
                        {model.badge && (
                          <div className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-sky-600 whitespace-nowrap dark:bg-[#bda76b]/15 dark:text-[#c4b484]">
                            {model.badge}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-[#6B7280] dark:text-[#bcb39d] mt-0.5 leading-relaxed">
                        {model.description}
                      </p>
                    </div>
                    {model.id === 'prv-v4-light' && tier === 'free' ? (
                      <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><LockKeyhole size={11} /> Go+</span>
                    ) : selected === model.id && (
                      <Check size={14} className="text-[#536653] dark:text-[#d5c49d] mt-0.5 shrink-0 sm:w-4 sm:h-4" />
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
