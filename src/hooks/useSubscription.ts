import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";

export type MockPlanId = "premium_monthly" | "premium_yearly" | "premium_lifetime";

export interface MockSubscription {
  price_id: MockPlanId;
  status: "active" | "canceled";
  started_at: string;
  current_period_end: string | null; // null = lifetime
  cancel_at_period_end: boolean;
}

const storageKey = (userId: string) => `linkup:mock_subscription:${userId}`;

const PLAN_DURATIONS: Record<MockPlanId, number | null> = {
  premium_monthly: 30 * 24 * 60 * 60 * 1000,
  premium_yearly: 365 * 24 * 60 * 60 * 1000,
  premium_lifetime: null,
};

function readSub(userId: string): MockSubscription | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as MockSubscription;
  } catch {
    return null;
  }
}

function writeSub(userId: string, sub: MockSubscription | null) {
  if (sub === null) localStorage.removeItem(storageKey(userId));
  else localStorage.setItem(storageKey(userId), JSON.stringify(sub));
  window.dispatchEvent(new CustomEvent("linkup:subscription-changed"));
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<MockSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setSubscription(readSub(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("linkup:subscription-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("linkup:subscription-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  const subscribe = useCallback(
    (planId: MockPlanId) => {
      if (!user) return;
      const duration = PLAN_DURATIONS[planId];
      const sub: MockSubscription = {
        price_id: planId,
        status: "active",
        started_at: new Date().toISOString(),
        current_period_end: duration ? new Date(Date.now() + duration).toISOString() : null,
        cancel_at_period_end: false,
      };
      writeSub(user.id, sub);
    },
    [user]
  );

  const cancel = useCallback(() => {
    if (!user) return;
    const current = readSub(user.id);
    if (!current) return;
    if (current.price_id === "premium_lifetime") return; // can't cancel lifetime
    writeSub(user.id, { ...current, cancel_at_period_end: true });
  }, [user]);

  const reset = useCallback(() => {
    if (!user) return;
    writeSub(user.id, null);
  }, [user]);

  const isActive = (() => {
    if (!subscription) return false;
    if (subscription.price_id === "premium_lifetime") return true;
    if (!subscription.current_period_end) return false;
    return new Date(subscription.current_period_end) > new Date();
  })();

  return { subscription, isActive, loading, subscribe, cancel, reset, refetch: refresh };
}
