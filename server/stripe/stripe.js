import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  ultimate: process.env.STRIPE_ULTIMATE_PRICE_ID,
  test: process.env.STRIPE_TEST_PRICE_ID,
};

export const PLAN_FROM_PRICE = {
  [process.env.STRIPE_PRO_PRICE_ID]: "pro",
  [process.env.STRIPE_ULTIMATE_PRICE_ID]: "ultimate",
  [process.env.STRIPE_TEST_PRICE_ID]: "test",
};

// Map Stripe subscription statuses to our internal statuses
export const SUBSCRIPTION_STATUS_MAP = {
  active: "active",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "incomplete_expired",
  past_due: "past_due",
  trialing: "trialing",
  unpaid: "unpaid",
};
