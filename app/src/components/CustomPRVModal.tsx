import { useEffect, useState } from 'react';
import { BookOpen, Code2, Calculator, FileText, Lightbulb, Network, Plus, PenLine, SlidersHorizontal, ListChecks, X } from 'lucide-react';
import { toast } from 'sonner';
import { createCustomPRV, enhancePrompt, getUsageSummary, listPublicCustomPRVs, type UsageSummary } from '@/lib/api';
import type { CustomPRV } from '@/types/chat';

interface CustomPRVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customPrv: CustomPRV) => void;
  turnstileToken?: string;
}

const presets = [
  { id: 'wiring', name: 'Wiring & Electronics', description: 'Trace circuits, diagnose connections, and explain electrical work safely.', icon: Network, instructions: 'Act as a patient wiring and electronics assistant. Explain circuits step by step, ask for voltage and component details when needed, prioritize electrical safety, and never encourage unsafe live-wire work.' },
  { id: 'reading', name: 'Reading Companion', description: 'Turn dense books, papers, and notes into clarity and insight.', icon: BookOpen, instructions: 'Act as a deep reading companion. Summarize accurately, explain difficult passages, identify themes and arguments, and ask thoughtful comprehension questions. Distinguish the source text from your interpretation.' },
  { id: 'maths', name: 'Maths Coach', description: 'Work through problems with clean steps instead of unexplained answers.', icon: Calculator, instructions: 'Act as a rigorous mathematics tutor. Solve problems step by step, explain why each step works, check the result, and adapt the explanation to the learner. Do not skip algebra or hide assumptions.' },
  { id: 'coding', name: 'Code Architect', description: 'Design, debug, and improve code with practical engineering judgment.', icon: Code2, instructions: 'Act as a senior software engineering partner. Understand the existing code before changing it, propose maintainable solutions, explain tradeoffs, and provide secure, tested examples with clear file-level guidance.' },
  { id: 'writing', name: 'Writing Studio', description: 'Shape rough ideas into writing with voice, structure, and force.', icon: FileText, instructions: 'Act as an expert writing editor. Preserve the writer’s intent and voice while improving clarity, structure, rhythm, specificity, and persuasion. Offer polished drafts and briefly explain meaningful changes when useful.' },
  { id: 'research', name: 'Research Analyst', description: 'Compare sources, expose uncertainty, and turn information into decisions.', icon: Lightbulb, instructions: 'Act as a careful research analyst. Break questions into claims, compare evidence, identify uncertainty, avoid unsupported conclusions, and present findings in a structured decision-ready format.' },
  { id: 'planner', name: 'Project Planner', description: 'Convert ambitious goals into focused plans, milestones, and next actions.', icon: ListChecks, instructions: 'Act as a pragmatic project strategist. Turn goals into milestones, dependencies, timelines, risks, and next actions. Ask only the highest-value clarifying questions and make reasonable assumptions explicit.' },
] as const;

export function CustomPRVModal({ isOpen, onClose, onSelect, turnstileToken }: CustomPRVModalProps) {
  const [view, setView] = useState<'presets' | 'create'>('presets');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<CustomPRV['model']>('prv-v3.2-fire');
  const [publicPrvs, setPublicPrvs] = useState<CustomPRV[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    listPublicCustomPRVs().then(setPublicPrvs).catch(() => undefined);
    getUsageSummary().then(setUsage).catch(() => undefined);
  }, [isOpen]);

  if (!isOpen) return null;

  const choose = (nameValue: string, descriptionValue: string, instructions: string) => {
    onSelect({
      id: `custom-${Date.now()}`,
      name: nameValue,
      description: descriptionValue,
      instructions,
      model: selectedModel,
    });
    onClose();
  };

  const enhance = async () => {
    if (!description.trim()) return;
    setEnhancing(true);
    try {
      setDescription(await enhancePrompt(description, 'custom', turnstileToken));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to enhance this prompt.');
    } finally {
      setEnhancing(false);
    }
  };

  const create = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error('Add a name and describe the assistant you want to create.');
      return;
    }
    try {
      const published = await createCustomPRV({
        id: `cprv-${Date.now()}`,
        name: name.trim(),
        description: description.trim().slice(0, 140),
        instructions: description.trim(),
        model: selectedModel,
      });
      setPublicPrvs((previous) => [published, ...previous]);
      getUsageSummary().then(setUsage).catch(() => undefined);
      choose(published.name, published.description, published.instructions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in to publish a Custom PRV.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-6">
      <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-[#e5e2d9] bg-[#fff] shadow-[0_24px_70px_-30px_rgba(32,35,31,0.38)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-[#eae8e1] px-5 py-4 dark:border-slate-800 sm:px-7 sm:py-5">
          <div>
            <div className="flex items-center gap-2 text-[#687c68] dark:text-violet-300"><SlidersHorizontal size={16} /><span className="text-[10px] font-semibold uppercase tracking-[0.18em]">PRV · SPECIALISTS</span></div>
            <h2 className="mt-2 text-xl font-semibold text-[#20231f] dark:text-white">Custom PRV</h2>
            <p className="mt-1 text-sm text-[#74766f] dark:text-slate-400">Choose a starting point or shape one around your work.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close Custom PRV"><X size={18} /></button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
          {view === 'presets' ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-[#3c4139] dark:text-slate-200">Start with a specialist</p>{usage && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Custom PRVs used: {usage.lifetime.customPrvs.used} / {usage.lifetime.customPrvs.limit ?? 'Unlimited'} lifetime</p>}</div><button type="button" disabled={usage?.lifetime.customPrvs.limit !== null && usage !== null && usage.lifetime.customPrvs.used >= usage.lifetime.customPrvs.limit} onClick={() => setView('create')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#35483a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#293b2e] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> Create Custom PRV</button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {presets.map((preset) => { const Icon = preset.icon; return <button key={preset.id} type="button" onClick={() => choose(preset.name, preset.description, preset.instructions)} className="group rounded-2xl border border-[#e7e4dc] bg-[#fbfaf7] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#bdc8b9] hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-violet-500 dark:hover:bg-violet-950/30"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#687c68] shadow-sm dark:bg-slate-900 dark:text-violet-300"><Icon size={18} /></span><span className="block text-sm font-semibold text-[#30342e] dark:text-white">{preset.name}</span><span className="mt-1 block text-xs leading-5 text-[#74766f] dark:text-slate-400">{preset.description}</span></button>; })}
              </div>
              {publicPrvs.length > 0 ? <div className="mt-7"><p className="mb-3 text-sm font-medium text-[#3c4139] dark:text-slate-200">Community specialists</p><div className="grid gap-3 sm:grid-cols-2">{publicPrvs.map((customPrv) => <button key={customPrv.id} type="button" onClick={() => { onSelect(customPrv); onClose(); }} className="rounded-2xl border border-[#e7e4dc] bg-[#fbfaf7] p-4 text-left transition hover:border-[#bdc8b9] hover:bg-white dark:border-sky-900 dark:bg-sky-950/20"><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#687c68] dark:bg-slate-900 dark:text-sky-300"><SlidersHorizontal size={15} /></span><span className="block text-sm font-semibold text-[#30342e] dark:text-white">{customPrv.name}</span><span className="mt-1 block text-xs leading-5 text-[#74766f] dark:text-slate-400">{customPrv.description}</span></button>)}</div></div> : null}
            </>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              <button type="button" onClick={() => setView('presets')} className="text-xs font-semibold text-[#687c68] hover:underline dark:text-violet-300">← Back to specialists</button>
              <div><label className="text-sm font-semibold text-slate-800 dark:text-slate-100">What should we call it?</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. My Study Mentor" className="mt-2 w-full rounded-xl border border-[#e5e2d9] bg-[#fbfaf7] px-4 py-3 text-sm outline-none focus:border-[#9eaa9b] dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
              <div><div className="flex items-center justify-between gap-3"><label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Describe the specialist</label><button type="button" onClick={enhance} disabled={enhancing || !description.trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e2d9] px-3 py-1.5 text-xs font-semibold text-[#687c68] disabled:opacity-50 dark:border-violet-500/30 dark:text-violet-300"><PenLine size={13} /> {enhancing ? 'Refining…' : 'Refine instructions'}</button></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe its role, tasks, tone, and any rules to follow…" rows={8} className="mt-2 w-full resize-y rounded-xl border border-[#e5e2d9] bg-[#fbfaf7] px-4 py-3 text-sm leading-6 outline-none focus:border-[#9eaa9b] dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
              <div><label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Powered by</label><div className="mt-2 grid grid-cols-2 gap-2">{([['prv-v3.2-fire', 'PRV V3.2 Fire'], ['prv-v1-flash', 'PRV V1 Pro']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setSelectedModel(id)} className={`rounded-xl border px-3 py-3 text-left text-sm font-medium ${selectedModel === id ? 'border-[#a4b19f] bg-[#f1f4ef] text-[#536653] dark:bg-violet-950/40 dark:text-violet-200' : 'border-[#e5e2d9] text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>{label}</button>)}</div></div>
              {usage && <p className="text-center text-xs text-slate-500 dark:text-slate-400">Lifetime Custom PRV creations: {usage.lifetime.customPrvs.used} / {usage.lifetime.customPrvs.limit ?? 'Unlimited'}</p>}
              <button type="button" disabled={usage?.lifetime.customPrvs.limit !== null && usage !== null && usage.lifetime.customPrvs.used >= usage.lifetime.customPrvs.limit} onClick={create} className="w-full rounded-xl bg-[#35483a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#293b2e] disabled:cursor-not-allowed disabled:opacity-50">Create Custom PRV</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
