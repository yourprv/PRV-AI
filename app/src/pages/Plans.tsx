import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePlan } from '@/hooks/usePlan';
import type { PlanTier } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

const PLAN_DETAILS: Record<PlanTier, { title: string; price: string; subtitle: string; features: string[]; label?: string }> = {
  free: {
    title: 'Free',
    price: '$0/mo',
    subtitle: 'Access core AI features and light usage for everyday needs.',
    features: [
      'PRV 3.2 Fire access',
      'Basic web search and document handling',
      '3 AI images per day',
      'Saved chats and cross-device sync',
    ],
  },
  education: {
    title: 'Go',
    price: '$5/mo',
    subtitle: 'Learn faster and get more work done with extra power.',
    features: [
      'PRV 3.5 Earth access',
      'Higher document and image limits',
      'Canvas workspace for study and notes',
      'More custom PRVs and knowledge files',
    ],
  },
  pro: {
    title: 'Plus',
    price: '$20/mo',
    subtitle: 'Better models, faster responses, and advanced tools.',
    label: 'Most popular',
    features: [
      'Unlimited PRV 3.5 Earth',
      'High limits for PRV 4.0 Lightning',
      'Advanced image editing tools',
      '25 custom PRVs and richer uploads',
    ],
  },
  legend: {
    title: 'Pro',
    price: '$113/mo',
    subtitle: 'The full premium experience with top-tier performance.',
    features: [
      'Unlimited PRV 4.0 Lightning',
      'Priority compute and speed',
      'Expanded context for long content',
      'Unlimited custom PRVs and exports',
    ],
  },
};

const PLAN_ORDER: PlanTier[] = ['free', 'education', 'pro', 'legend'];
const PLAN_DISPLAY: Record<PlanTier, string> = {
  free: 'Free',
  education: 'Go',
  pro: 'Plus',
  legend: 'Pro',
};

export default function Plans() {
  const navigate = useNavigate();
  const { planTier, activateInviteCode, setPlanTier } = usePlan();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');

  const activeDetails = useMemo(() => PLAN_DETAILS[planTier], [planTier]);
  const selectedDetails = selectedPlan ? PLAN_DETAILS[selectedPlan] : null;

  const openPlanModal = (tier: PlanTier) => {
    if (tier === 'free') {
      if (planTier !== 'free') {
        setPlanTier('free');
        setMessage('You are now back on the Free plan.');
      } else {
        setMessage('You are already on the Free plan.');
      }
      return;
    }

    setSelectedPlan(tier);
    setPaymentError('');
    setShowInviteInput(false);
    setInviteCode('');
    setMessage('');
    setIsLoading(true);
    setIsModalOpen(true);
    window.setTimeout(() => setIsLoading(false), 700);
  };

  const handlePayNow = () => {
    if (!selectedPlan) return;
    setPaymentError('');
    setShowInviteInput(false);
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setPaymentError("Oops! Sorry payment method is not available in your country. It's invite code only.");
      setShowInviteInput(true);
    }, 1200);
  };

  const handleApplyInvite = () => {
    const tier = activateInviteCode(inviteCode);
    if (!tier) {
      setPaymentError('That invite code is not valid. Please check the code and try again.');
      return;
    }
    setPlanTier(tier);
    setMessage(`Success! Your account is now on the ${tier === 'free' ? 'Free' : PLAN_DETAILS[tier].title} plan.`);
    setSelectedPlan(null);
    setIsModalOpen(false);
    setShowInviteInput(false);
    setInviteCode('');
    setPaymentError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
    setIsLoading(false);
    setPaymentError('');
    setShowInviteInput(false);
    setInviteCode('');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/80 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Premium access</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Choose the plan that fits your workflow.</h1>
              <p className="mt-4 text-sm leading-7 text-slate-300">Paid plans are available by invite code only. Selecting a plan opens the checkout flow, then lets you apply an invite code to activate it.</p>
            </div>
            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/90 px-6 py-5 text-center shadow-lg shadow-cyan-500/10">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current plan</p>
              <p className="mt-3 text-2xl font-semibold text-white">{planTier === 'free' ? 'Free' : activeDetails.title}</p>
            </div>
          </div>
        </div>

        {message ? (
          <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/80 px-6 py-4 text-sm text-slate-200 shadow-sm shadow-white/5">
            {message}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 xl:grid-cols-4">
          {PLAN_ORDER.map((tier) => {
            const details = PLAN_DETAILS[tier];
            const active = tier === planTier;
            return (
              <div key={tier} className={`rounded-[32px] border p-6 shadow-xl transition-all ${active ? 'border-cyan-400/30 bg-slate-900/95 shadow-cyan-500/20' : 'border-white/10 bg-slate-900/80 hover:border-white/20 hover:bg-slate-900/95'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">{PLAN_DISPLAY[tier]}</p>
                    <p className="mt-5 text-4xl font-semibold tracking-tight text-white">{details.price}</p>
                  </div>
                  {details.label ? (
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">{details.label}</span>
                  ) : null}
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-400">{details.subtitle}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {details.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  onClick={() => openPlanModal(tier)}
                  className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${active ? 'bg-white text-slate-950 hover:bg-slate-200' : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'}`}
                >
                  {active ? 'Current plan' : tier === 'free' ? 'Select free' : 'Upgrade'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-xl rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">Checkout</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-400">
              {selectedDetails
                ? `Prepare to upgrade to ${selectedDetails.title}. Payments are unavailable in your country — invite code only.`
                : 'Select a paid plan to continue.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center rounded-[28px] border border-white/10 bg-slate-900/90 p-8">
                <Spinner className="h-6 w-6 text-cyan-300" />
                <span className="ml-4 text-sm text-slate-300">Loading checkout details…</span>
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Selected plan</p>
                    <p className="mt-2 text-xl font-semibold text-white">{selectedDetails?.title || 'None'}</p>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-200">{selectedDetails?.price || '--'}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{selectedDetails?.subtitle}</p>
              </div>
            )}

            {paymentError ? (
              <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                {paymentError}
              </div>
            ) : null}

            {showInviteInput ? (
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-4">
                  <label className="block text-sm font-medium text-slate-200">Invite code</label>
                  <input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder="Enter your invite code"
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={handleApplyInvite} className="w-full rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">Apply invite code</Button>
                  <Button variant="outline" onClick={closeModal} className="w-full rounded-full border-white/10 text-white hover:border-white/20 hover:bg-white/5">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button onClick={handlePayNow} className="w-full rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">Pay now</Button>
                <Button variant="outline" onClick={() => setShowInviteInput(true)} className="w-full rounded-full border-white/10 text-white hover:border-white/20 hover:bg-white/5">Use invite code instead</Button>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 justify-between">
            <span className="text-xs text-slate-500">Invite code is required because payment is unavailable.</span>
            <DialogClose asChild>
              <button className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Close</button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
