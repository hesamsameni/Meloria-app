import { stripe, PRICE_IDS } from "../../stripe/stripe.js";
import { supabase } from "../../db/supabase.js";

function isMissingStripeCustomerError(error) {
  return (
    error?.type === "StripeInvalidRequestError" &&
    error?.code === "resource_missing" &&
    error?.param === "customer"
  );
}

async function createAndStoreCustomer({ userId, email }) {
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await supabase
    .from("user_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

// POST /api/billing/checkout — create a Stripe Checkout session
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const { plan } = (await readBody(event)) || {};
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    setResponseStatus(event, 400);
    return { error: "Invalid plan" };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id, subscription, stripe_subscription_id, subscription_status")
    .eq("id", userId)
    .single();

  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(userId);

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    customerId = await createAndStoreCustomer({ userId, email: user.email });
  } else {
    try {
      const existingCustomer = await stripe.customers.retrieve(customerId);
      if (existingCustomer?.deleted) {
        customerId = await createAndStoreCustomer({
          userId,
          email: user.email,
        });
      }
    } catch (error) {
      if (!isMissingStripeCustomerError(error)) throw error;
      customerId = await createAndStoreCustomer({ userId, email: user.email });
    }
  }

  const hasActiveSubscription =
    profile?.stripe_subscription_id &&
    profile?.subscription !== "free" &&
    (profile?.subscription_status === "active" ||
      profile?.subscription_status === "canceling");

  let sessionConfig = {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.FRONTEND_URL}/settings`,
    metadata: { user_id: userId, plan },
  };

  if (hasActiveSubscription) {
    sessionConfig = {
      ...sessionConfig,
      subscription_data: {
        metadata: { user_id: userId, plan },
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return { url: session.url };
});
