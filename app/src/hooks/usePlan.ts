import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { PlanTier } from '@/types/chat';

const INVITE_CODE_TIER_MAP: Record<string, PlanTier> = {
  '561908427315690284173650928471365019284736501928': 'education',
  '847193605281974630158427960315842791650384271596': 'pro',
  '209684731950182746593017482650391874265918374205': 'legend',
};

const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free Tier',
  education: 'Education Tier',
  pro: 'Pro Tier',
  legend: 'Legend Tier',
};

export function getPlanLabel(tier: PlanTier) {
  return PLAN_LABELS[tier] ?? 'Free Tier';
}

export function usePlan() {
  const [planTier, setPlanTier] = useLocalStorage<PlanTier>('prv_plan_tier', 'free');

  const activateInviteCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.replace(/\s+/g, '').trim();
      const tier = INVITE_CODE_TIER_MAP[code];
      if (tier) {
        setPlanTier(tier);
        return tier;
      }
      return null;
    },
    [setPlanTier]
  );

  return {
    planTier,
    setPlanTier,
    activateInviteCode,
    getPlanLabel,
    inviteCodeMap: INVITE_CODE_TIER_MAP,
  };
}
