import {
  stripe,
  PLAN_FROM_PRICE,
  SUBSCRIPTION_STATUS_MAP,
} from "../../stripe/stripe.js";
import { supabase } from "../../db/supabase.js";

// ---------------------------------------------------------------------------
// Internal helper — syncs a Stripe subscription object to user_profiles
// ---------------------------------------------------------------------------
async function syncSubscription(stripeSubscription) {
  const priceId = stripeSubscription.items.data[0]?.price?.id;
  const plan = PLAN_FROM_PRICE[priceId];
  const customerId = stripeSubscription.customer;

  if (!plan) {
    console.warn(
      "[syncSubscription] unknown priceId, not modifying subscription tier:",
      priceId,
    );
    return;
  }

  const periodEndTs =
    stripeSubscription.items?.data[0]?.current_period_end ??
    stripeSubscription.current_period_end;
  console.log(
    `[syncSubscription] id=${stripeSubscription.id} status=${stripeSubscription.status} cancel_at_period_end=${stripeSubscription.cancel_at_period_end} cancel_at=${stripeSubscription.cancel_at} current_period_end=${periodEndTs} (type: ${typeof periodEndTs})`,
  );
  const periodEnd =
    periodEndTs != null && periodEndTs > 0
      ? new Date(periodEndTs * 1000).toISOString()
      : null;

  const isCancelingScheduled =
    stripeSubscription.cancel_at_period_end || !!stripeSubscription.cancel_at;
  const subscriptionStatus = isCancelingScheduled
    ? "canceling"
    : SUBSCRIPTION_STATUS_MAP[stripeSubscription.status] ||
      stripeSubscription.status;

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profileError) {
    console.error(
      "[syncSubscription] error fetching profile by stripe_customer_id:",
      profileError,
    );
    return;
  }

  if (!profile) {
    console.warn(
      "[syncSubscription] no profile found for customerId:",
      customerId,
    );
    return;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      subscription: plan,
      stripe_subscription_id: stripeSubscription.id,
      subscription_status: subscriptionStatus,
      current_period_end: periodEnd,
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("[syncSubscription] supabase update failed:", updateError);
  } else {
    console.log("[syncSubscription] profile updated successfully");
  }
}

// POST /api/billing/webhook — raw body required for signature verification
export default defineEventHandler(async (event) => {
  const sig = getHeader(event, "stripe-signature");
  const rawBody = await readRawBody(event, false); // Buffer

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    console.error("[webhook] signature verification failed:", e.message);
    setResponseStatus(event, 400);
    return { error: `Webhook error: ${e.message}` };
  }

  console.log(`[webhook] received event: ${stripeEvent.type}`);

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const uid = session.metadata?.user_id;
      const plan = session.metadata?.plan;

      if (!uid || !plan) {
        console.warn(
          "[webhook] missing metadata on session:",
          session.id,
          "metadata:",
          session.metadata,
        );
      } else {
        console.log(
          "[webhook] checkout.session.completed for userId:",
          uid,
          "plan:",
          plan,
        );
      }
    }

    if (stripeEvent.type === "customer.subscription.created") {
      const sub = await stripe.subscriptions.retrieve(
        stripeEvent.data.object.id,
      );
      await syncSubscription(sub);
    }

    if (stripeEvent.type === "customer.subscription.updated") {
      const sub = await stripe.subscriptions.retrieve(
        stripeEvent.data.object.id,
      );
      await syncSubscription(sub);
    }

    if (stripeEvent.type === "customer.subscription.deleted") {
      const stripeSubscription = stripeEvent.data.object;
      const customerId = stripeSubscription.customer;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase
          .from("user_profiles")
          .update({
            subscription: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq("id", profile.id);
        console.log("[webhook] subscription canceled for user:", profile.id);
      }
    }

    if (stripeEvent.type === "invoice.payment_failed") {
      const invoice = stripeEvent.data.object;
      const customerId = invoice.customer;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase
          .from("user_profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", profile.id);
        console.log("[webhook] payment failed for user:", profile.id);
      }
    }

    if (stripeEvent.type === "invoice.payment_succeeded") {
      const invoice = stripeEvent.data.object;
      console.log(
        `[webhook] invoice.payment_succeeded — invoice.id=${invoice.id} invoice.subscription=${invoice.subscription}`,
      );

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription,
        );
        console.log(
          `[webhook] retrieved subscription ${subscription.id} current_period_end=${subscription.current_period_end}`,
        );
        await syncSubscription(subscription);
      } else {
        console.warn(
          `[webhook] invoice.payment_succeeded has no subscription field — skipping sync`,
        );
      }
    }

    return { received: true };
  } catch (error) {
    console.error(
      "[webhook] error processing event:",
      stripeEvent.type,
      error,
    );
    // Still return 200 to prevent Stripe from retrying
    return { received: true, error: error.message };
  }
});
