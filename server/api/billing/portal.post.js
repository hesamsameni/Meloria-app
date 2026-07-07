import { stripe } from "../../stripe/stripe.js";
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

// POST /api/billing/portal — create a Stripe Billing Portal session
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!profile?.stripe_customer_id) {
    setResponseStatus(event, 400);
    return { error: "No billing account found" };
  }

  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(userId);

  let customerId = profile.stripe_customer_id;
  try {
    const existingCustomer = await stripe.customers.retrieve(customerId);
    if (existingCustomer?.deleted) {
      customerId = await createAndStoreCustomer({ userId, email: user.email });
    }
  } catch (error) {
    if (!isMissingStripeCustomerError(error)) throw error;
    customerId = await createAndStoreCustomer({ userId, email: user.email });
  }

  const body = (await readBody(event)) || {};
  const returnUrl =
    body?.return_url || `${process.env.FRONTEND_URL}/settings`;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    configuration: process.env.STRIPE_PORTAL_CONFIG_ID || undefined,
  });

  return { url: session.url };
});
