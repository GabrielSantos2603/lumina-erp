import { loadStripe, Stripe } from '@stripe/stripe-js';

// Chave pública do Stripe (Test Mode)
// IMPORTANTE: Substituir pela sua chave pública em produção
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_...';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Price ID do plano Starter (obtido do Dashboard do Stripe)
export const STRIPE_PRICE_IDS = {
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER || 'price_starter_monthly',
} as const;

// Mapear plan ID para Stripe Price ID
export const getPriceId = (planId: string): string => {
  if (planId === 'starter') {
    return STRIPE_PRICE_IDS.starter;
  }
  throw new Error(`Invalid plan ID: ${planId}. Only 'starter' is available.`);
};
