import { useState } from 'react';
import { Bot, BookOpen, Code2, Calculator, FileText, Lightbulb, Network, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { enhanceCustomPrompt } from '@/lib/api';
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
  { id: 'planner', name: 'Project Planner', description: 'Convert ambitious goals into focused plans, milestones, and next actions.', icon: Sparkles, instructions: 'Act as a pragmatic project strategist. Turn goals into milestones, dependencies, timelines, risks, and next actions. Ask only the highest-value clarifying questions and make reasonable assumptions explicit.' },
] as const;

export function CustomPRVModal({ isOpen, onClose, onSelect, turnstileToken }: CustomPRVModalProps) {
  const [view, setView] = useState<'presets' | 'create'>('presets');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<CustomPRV['model']>('prv-v3.2-fire');

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
      setDescription(await enhanceCustomPrompt(description, turnstileToken));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to enhance this prompt.');
    } finally {
      setEnhancing(false);
    }
  };

  const create = () => {
    if (!name.trim() || !description.trim()) {
      toast.error('Add a name and describe the assistant you want to create.');
      return;
    }
    choose(name.trim(), description.trim().slice(0, 140), description.trim());
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-6">
      <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7 sm:py-5">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300"><Bot size={18} /><span className="text-[11px] font-bold uppercase tracking-[0.2em]">PRV Studio</span></div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Custom PRV</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Build a focused AI for the way you work.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close Custom PRV"><X size={18} /></button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
          {view === 'presets' ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Start with a specialist</p><button type="button" onClick={() => setView('create')} className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"><Plus size={14} /> Create Custom PRV</button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {presets.map((preset) => { const Icon = preset.icon; return <button key={preset.id} type="button" onClick={() => choose(preset.name, preset.description, preset.instructions)} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-violet-500 dark:hover:bg-violet-950/30"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-300"><Icon size={18} /></span><span className="block text-sm font-semibold text-slate-900 dark:text-white">{preset.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{preset.description}</span></button>; })}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              <button type="button" onClick={() => setView('presets')} className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-300">← Back to specialists</button>
              <div><label className="text-sm font-semibold text-slate-800 dark:text-slate-100">What should we call it?</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. My Study Mentor" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
              <div><div className="flex items-center justify-between gap-3"><label className="text-sm font-semibold text-slate-800 dark:text-slate-100">What kind of AI do you need?</label><button type="button" onClick={enhance} disabled={enhancing || !description.trim()} className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-600 disabled:opacity-50 dark:border-violet-500/30 dark:text-violet-300"><Sparkles size={13} /> {enhancing ? 'Enhancing…' : 'Enhance prompt'}</button></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the role, tasks, style, and rules you want this AI to follow…" rows={8} className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
              <div><label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Powered by</label><div className="mt-2 grid grid-cols-2 gap-2">{([['prv-v3.2-fire', 'PRV V3.2 Fire'], ['prv-v1-flash', 'PRV V1 Pro']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setSelectedModel(id)} className={`rounded-xl border px-3 py-3 text-left text-sm font-medium ${selectedModel === id ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>{label}</button>)}</div></div>
              <button type="button" onClick={create} className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700">Create Custom PRV</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
