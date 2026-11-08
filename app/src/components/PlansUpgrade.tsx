import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Check, Crown, Gift, KeyRound, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AuthModal } from '@/components/AuthModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getUsageSummary, redeemInviteCode, type UsageSummary } from '@/lib/api';
import type { User } from '@/types/chat';

type PaidTier = 'go' | 'plus' | 'pro';

const plans = [
  {
    id: 'free', name: 'Free', icon: Gift, quota: 'Daily allowances · no Fire cap',
    description: 'Full access to core features with generous daily allowances.',
    features: ['V3.2 Fire unlimited · V3.5 Earth 30/day · V4.0 Lightning locked', 'V1 Pro + V1 Base unlimited · V1 Pro Max 40/day', '10 images/day · 100 enhancements/day · 30 searches/day', '1 new Custom PRV for life (account required)'],
  },
  {
    id: 'go', name: 'Go', icon: Zap, quota: 'Higher daily allowances',
    description: 'More daily capacity and access to the latest model.',
    features: ['V3.2 Fire unlimited · V3.5 Earth 300/day · V4.0 Lightning 20/day', 'V1 Pro + V1 Base unlimited · V1 Pro Max 200/day', '50 images/day · 500 enhancements/day · 100 searches/day', '5 new Custom PRVs for life (account required)'],
  },
  {
    id: 'plus', name: 'Plus', icon: ArrowUpRight, quota: 'Expanded daily allowances',
    description: 'High daily limits for demanding creative and research work.',
    features: ['V3.2 Fire unlimited · V3.5 Earth 1,000/day · V4.0 Lightning 100/day', 'V1 Pro + V1 Base unlimited · V1 Pro Max 800/day', '150 images/day · 1,500 enhancements/day · 300 searches/day', '25 new Custom PRVs for life (account required)'],
  },
  {
    id: 'pro', name: 'Pro', icon: Crown, quota: 'Highest daily allowances',
    description: 'The highest daily allowances for intensive workflows.',
    features: ['V3.2 Fire unlimited · V3.5 Earth 5,000/day · V4.0 Lightning 500/day', 'V1 Pro + V1 Base unlimited · V1 Pro Max 3,000/day', '500 images/day · 5,000 enhancements/day · 1,000 searches/day', 'Unlimited new Custom PRVs (account required)'],
  },
] as const;

interface PlansUpgradeProps {
  user: User | null;
  refreshUser: () => Promise<User | null>;
}

export function PlansUpgrade({ user, refreshUser }: PlansUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<PaidTier | null>(null);
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsageSummary().then((summary) => { if (!cancelled) setUsage(summary); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [user?.id]);

  const onCodeChange = (value: string) => {
    // Format 16 characters as 4 groups while the user types or pastes.
    const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    setCode(compact.match(/.{1,4}/g)?.join('-') || '');
    setInlineError('');
  };

  const handleRedeem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setSelectedPlan(null);
      setShowAuth(true);
      return;
    }
    if (!/^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/.test(code)) {
      setInlineError('Enter all 16 characters of your invite code.');
      return;
    }
    setIsRedeeming(true);
    setInlineError('');
    try {
      const result = await redeemInviteCode(code);
      // Refresh from the API so the UI reflects the server's entitlement.
      await refreshUser();
      setUsage(await getUsageSummary());
      setSelectedPlan(null);
      setCode('');
      toast.success(`Your ${result.tier[0].toUpperCase()}${result.tier.slice(1)} access is now active.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to redeem this code right now.';
      setInlineError(message);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#e7e4dc] bg-white p-6 dark:border-violet-400/20 dark:bg-slate-900 sm:p-8">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#687c68] dark:text-violet-300">Plans for every pace</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="premium-heading text-2xl font-medium tracking-tight text-[#20231f] dark:text-white sm:text-3xl">Choose your PRV tier</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#74766f] dark:text-slate-300">Core features are available on Free. Paid tiers use invite codes while regional availability is limited.</p>
            </div>
            <div className="rounded-full border border-[#e5e2d9] bg-[#f8f7f3] px-3 py-1.5 text-xs font-semibold text-[#59685a] dark:border-violet-400/20 dark:bg-slate-900/70 dark:text-violet-200">
              Current plan: <span className="capitalize">{user?.tier || 'free'}</span>
            </div>
          </div>
          {usage && <p className="mt-4 text-xs font-medium text-slate-600 dark:text-slate-300">Lifetime Custom PRVs used: <strong className="text-slate-900 dark:text-white">{usage.lifetime.customPrvs.used} / {usage.lifetime.customPrvs.limit ?? 'Unlimited'}</strong></p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = (user?.tier || 'free') === plan.id;
            const isPaid = plan.id !== 'free';
            return (
              <article key={plan.id} className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${plan.id === 'pro' ? 'border-[#9eaa9b] ring-1 ring-[#dce2d8] dark:border-violet-400/40 dark:ring-violet-400/20' : 'border-[#e7e4dc] dark:border-slate-700'}`}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf0e9] text-[#536653] dark:bg-violet-400/10 dark:text-violet-300"><Icon size={19} /></span>
                  {isCurrent && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Your plan</span>}
                  {isPaid && !isCurrent && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Invite only</span>}
                </div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{plan.name}</h2>
                <p className="mt-1 text-xs font-semibold text-[#687c68] dark:text-violet-300">{plan.quota}</p>
                <p className="mt-3 min-h-12 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{plan.description}</p>
                <ul className="my-5 flex-1 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />{feature}</li>)}
                </ul>
                {isPaid ? (
                  <button type="button" onClick={() => { setSelectedPlan(plan.id); setInlineError(''); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#35483a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#293b2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#879584] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
                    {isCurrent ? 'Manage access' : `Explore ${plan.name}`} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="button" disabled className="min-h-11 cursor-default rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">{isCurrent ? 'Current plan' : 'Available'}</button>
                )}
              </article>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">Daily model, image, search, and enhancement allowances reset at midnight UTC. Lifetime Custom PRV creation counts do not reset.</p>
      </section>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => { if (!open) setSelectedPlan(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-7">
          <DialogHeader>
          <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#536653] dark:bg-violet-400/10 dark:text-violet-200"><KeyRound size={20} /></span>
            <DialogTitle className="text-left text-xl text-slate-950 dark:text-white">{selectedPlan ? `Access ${selectedPlan[0].toUpperCase()}${selectedPlan.slice(1)}` : 'Redeem invite'}</DialogTitle>
            <DialogDescription className="text-left leading-relaxed text-slate-600 dark:text-slate-300">This service is currently not available in your region. Access is currently invite-code only.</DialogDescription>
          </DialogHeader>
          {user ? (
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="rounded-xl border border-[#e5e2d9] bg-[#f8f7f3] p-3 text-xs leading-relaxed text-[#60655c] dark:border-violet-400/15 dark:bg-violet-400/5 dark:text-violet-200">
                Your code grants the tier it was created for. Codes contain 16 letters or numbers and are not case-sensitive.
              </div>
              <div>
                <label htmlFor="invite-code" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Invite code</label>
                <input
                  id="invite-code"
                  autoComplete="off"
                  autoCapitalize="characters"
                  inputMode="text"
                  maxLength={19}
                  value={code}
                  onChange={(event) => onCodeChange(event.target.value)}
                  placeholder="ABCD-1234-EFGH-5678"
                  aria-describedby={inlineError ? 'invite-error' : 'invite-help'}
                  aria-invalid={Boolean(inlineError)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-mono text-sm tracking-[0.08em] text-slate-950 outline-none transition focus:border-[#879584] focus:ring-4 focus:ring-[#687c68]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                {inlineError ? <p id="invite-error" role="alert" className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{inlineError}</p> : <p id="invite-help" className="mt-2 text-xs text-slate-500 dark:text-slate-400">Hyphens are added automatically as you type.</p>}
              </div>
              <button type="submit" disabled={isRedeeming || code.length !== 19} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#35483a] px-4 text-sm font-semibold text-white transition hover:bg-[#293b2e] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#879584] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
                {isRedeeming ? 'Redeeming…' : 'Redeem invite'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">Sign in to redeem an invite. Your account is updated securely after the server validates your code.</p>
              <button type="button" onClick={() => { setSelectedPlan(null); setShowAuth(true); }} className="h-11 w-full rounded-xl bg-[#35483a] px-4 text-sm font-semibold text-white hover:bg-[#293b2e]">Sign in to redeem</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
