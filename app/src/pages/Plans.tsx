import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePlan } from '@/hooks/usePlan';
import type { PlanTier } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const PLAN_DETAILS: Record<PlanTier, { title: string; price: string; subtitle: string; features: string[]; highlight?: string; label?: string }> = {
  free: {
    title: 'Free',
    price: '$0/month',
    subtitle: 'Everything you need to get started with AI.',
    highlight: 'Perfect for everyday conversations, quick research, document analysis, and creative tasks.',
    features: [
      'Access to PRV 3.2 Fire — fast AI for everyday use',
      'Real-time Web Search with clickable citations',
      'Upload up to 25 PDFs, Word documents, and images per day',
      'Basic image understanding and visual analysis',
      'Temporary Chats, cloud chat history, and cross-device sync',
      'Generate 3 AI images per day with PRE Image 2.1',
      'Explore the Public Custom PRV Gallery',
      'Create 1 Custom PRV with your own instructions',
    ],
  },
  education: {
    title: 'Education',
    price: '$6.99/month',
    subtitle: 'Learn faster. Study smarter.',
    highlight: 'Designed for students, teachers, and lifelong learners who need more capable AI and higher limits.',
    features: [
      'Everything in Free, plus:',
      'Access to PRV 3.5 Earth (50 messages/day)',
      'Access to PRV 4.0 Lightning (20 messages/day)',
      'Canvas Workspace for essays, homework, notes, and research',
      'Upload up to 50 documents/images per day',
      'Upload up to 15 audio or video files per day',
      'Analyze lecture recordings and long study materials',
      'Create up to 5 Custom PRVs',
      'Add personal knowledge files to your Custom PRVs',
      'Generate 15 AI images per day',
    ],
  },
  pro: {
    title: 'Pro',
    price: '$11/month',
    subtitle: 'Built for creators, developers, professionals, and power users.',
    highlight: 'Unlock advanced AI, professional creative tools, and significantly higher usage limits.',
    features: [
      'Everything in Education, plus:',
      'Unlimited access to PRV 3.5 Earth',
      'High daily limits for PRV 4.0 Lightning',
      'Complete Canvas Suite',
      'AI writing assistant, smart editing, document outlining, tone adjustments, version history',
      'Generate up to 100 AI images every day',
      'Advanced image editing: background removal, object replacement, upscaling, inpainting',
      'Upload up to 30 audio or video files per day',
      'Create up to 25 Custom PRVs',
      'Store up to 5 knowledge files for each Custom PRV',
    ],
    label: 'Most Popular',
  },
  legend: {
    title: 'Legend',
    price: '$24/month',
    subtitle: 'The complete PRV AI experience.',
    highlight: 'Maximum performance, highest limits, and instant access to every premium capability.',
    features: [
      'Everything in Pro, plus:',
      'Unlimited access to PRV 4.0 Lightning',
      'Priority compute for the fastest responses',
      'Expanded 256K+ context window for books, codebases, research papers, and long conversations',
      'Unlimited AI image generation',
      'Faster image generation with priority processing',
      'High-resolution image exports',
      'Create Unlimited Custom PRVs',
      'Large multi-file knowledge bases for every Custom PRV',
      'Early access to upcoming models and experimental features',
      'Priority customer support',
    ],
  },
};

const PLAN_ORDER: PlanTier[] = ['free', 'education', 'pro', 'legend'];

export default function Plans() {
  const navigate = useNavigate();
  const { planTier, activateInviteCode, setPlanTier } = usePlan();
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');

  const activeDetails = useMemo(() => PLAN_DETAILS[planTier], [planTier]);

  const handleSelectPlan = (tier: PlanTier) => {
    setMessage('');
    setPlanTier(tier);
    setMessage('Sorry, payment in your country is not available currently. Please enter your invite code here.');
  };

  const handleApplyCode = () => {
    const tier = activateInviteCode(inviteCode);
    if (!tier) {
      setMessage('That invite code is not valid. Please check the code and try again.');
      return;
    }
    setMessage(`Success! Your account is now set to ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier.`);
    setInviteCode('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090B14] text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-[#111827]/95 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4F46E5]">Subscription</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Choose the plan that fits your work.</h1>
          </div>
          <div className="min-w-[8rem]" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111827]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4F46E5]">Your active plan</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{activeDetails.title} plan</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{activeDetails.highlight}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                  {activeDetails.price}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PLAN_ORDER.map((tier) => {
                const details = PLAN_DETAILS[tier];
                const selected = tier === planTier;
                return (
                  <article key={tier} className={`rounded-[28px] border p-5 shadow-sm transition-all ${selected ? 'border-[#4F46E5] bg-[#EEF2FF]/90 shadow-[#C7D2FE]/40 dark:border-[#4338CA] dark:bg-[#1E293B]' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{details.title}</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{details.price}</p>
                      </div>
                      {details.label ? (
                        <div className="rounded-full bg-[#C7D2FE] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#3730A3] dark:bg-[#312E81] dark:text-[#C7D2FE]">{details.label}</div>
                      ) : null}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{details.subtitle}</p>
                    <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {details.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(tier)}
                      className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${selected ? 'bg-[#4338CA] text-white hover:bg-[#3730A3]' : 'bg-[#E0E7FF] text-[#3730A3] hover:bg-[#C7D2FE] dark:bg-[#1F2937] dark:text-slate-100 dark:hover:bg-[#334155]'}`}
                    >
                      {selected ? 'Current plan' : 'Select'}
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">Invite code?</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Paste your invite code to activate Education, Pro, or Legend plans instantly.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="Enter invite code"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-100"
                />
                <Button onClick={handleApplyCode} className="min-w-[11rem] rounded-2xl bg-[#4F46E5] text-white hover:bg-[#4338CA]">Apply invite code</Button>
              </div>
              {message ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{message}</p> : null}
            </div>
          </section>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111827]">
            <div className="rounded-3xl bg-gradient-to-br from-[#3730A3] via-[#4F46E5] to-[#A855F7] p-6 text-white shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C7D2FE]">Why upgrade?</p>
              <h2 className="mt-4 text-2xl font-semibold">Get more from PRV AI.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-100/90">Higher limits, better models, and priority processing designed to power your most ambitious work.</p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-white" />Unlimited PRV 3.5 Earth access</p>
                <p className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-white" />Advanced image tools and priority rendering</p>
                <p className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-white" />Expanded context for long documents and research</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
