import { supabase } from "../../../db/supabase.js";
import { streamAI, callAI } from "../../../ai/openrouter.js";
import {
  discussionSystemPrompt,
  conversationSummaryPrompt,
  discussionReflectionExtractPrompt,
} from "../../../prompts/index.js";

// --- Tier helpers (same pattern as processor.js) ---

function effectiveTier(subscription, current_period_end) {
  const tier = subscription || "free";
  if (tier === "free") return "free";
  if (!current_period_end) return tier;
  const expiresAt = new Date(current_period_end);
  if (Number.isNaN(expiresAt.getTime())) return tier;
  return expiresAt <= new Date() ? "free" : tier;
}

const DISCUSSION_LIMITS = {
  free: { dailyNew: 2, maxMessages: 10 },
  test: { dailyNew: 2, maxMessages: 10 },
  pro: { dailyNew: 10, maxMessages: 30 },
  ultimate: { dailyNew: Infinity, maxMessages: 60 },
};

function getLimits(tier) {
  return DISCUSSION_LIMITS[tier] ?? DISCUSSION_LIMITS.free;
}

const WINDOW_SIZE = 10;
const SUMMARY_MODEL = "openai/gpt-4o-mini";

// POST /api/items/:id/discussion — send a message and stream the AI reply (SSE)
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");
  const { messages } = (await readBody(event)) || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    setResponseStatus(event, 400);
    return { error: "messages array is required" };
  }

  // ---- Pre-stream: fetch context, enforce limits, build prompt ----
  let item;
  let preferredModel;
  let systemContent;
  let activeMessages;
  let existingDiscussion;
  let reflectionQuestions;
  let conversationSummary;
  const fullHistory = messages;

  try {
    const [
      { data: profile, error: profileError },
      { data: itemRow, error: itemError },
      { data: tasteProfile },
      { data: existing },
      { data: reflQ },
    ] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("subscription, current_period_end, preferred_model, role")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("items")
        .select(
          "id, title, category, description, creator, tags, ai_notes, rating, your_notes, reflection_note, release_year, genres, status",
        )
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("taste_profiles")
        .select("profile")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("item_discussions")
        .select("id, messages, summary")
        .eq("user_id", userId)
        .eq("item_id", id)
        .maybeSingle(),
      supabase
        .from("reflection_questions")
        .select("questions")
        .eq("item_id", id)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (profileError) throw profileError;
    if (itemError || !itemRow) {
      setResponseStatus(event, 404);
      return { error: "Item not found" };
    }

    item = itemRow;
    existingDiscussion = existing;
    reflectionQuestions = reflQ;

    const isAdmin = profile?.role === "admin";
    const tier = isAdmin
      ? "ultimate"
      : effectiveTier(profile?.subscription, profile?.current_period_end);
    const limits = getLimits(tier);
    preferredModel = profile?.preferred_model || "openai/gpt-4o-mini";

    if (!isAdmin) {
      const isNewConversation = !existingDiscussion;

      if (isNewConversation && limits.dailyNew !== Infinity) {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("item_discussions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", todayStart.toISOString());

        if ((count ?? 0) >= limits.dailyNew) {
          setResponseStatus(event, 429);
          return {
            error: `You've reached your daily limit of ${limits.dailyNew} new discussions. Upgrade your plan to start more.`,
            limit_type: "daily",
            tier,
            limit: limits.dailyNew,
            upgrade_required: true,
          };
        }
      }

      const existingMsgCount = existingDiscussion?.messages?.length ?? 0;
      if (existingMsgCount >= limits.maxMessages) {
        setResponseStatus(event, 429);
        return {
          error: `This conversation has reached the ${limits.maxMessages}-message limit for your plan.`,
          limit_type: "conversation",
          tier,
          limit: limits.maxMessages,
          upgrade_required: true,
        };
      }
    }

    const tasteProfileSummary =
      tasteProfile?.profile?.summary ||
      tasteProfile?.profile?.profile?.summary ||
      null;

    systemContent = discussionSystemPrompt({
      item,
      tasteProfileSummary,
      reflectionNote: item.reflection_note,
      userNotes: item.your_notes,
      userRating: item.rating,
      reflectionQuestions: reflectionQuestions?.questions || null,
      itemStatus: item.status,
    });

    const needsCompression = fullHistory.length > WINDOW_SIZE;
    conversationSummary = existingDiscussion?.summary ?? null;

    if (needsCompression) {
      const oldMessages = fullHistory.slice(0, fullHistory.length - WINDOW_SIZE);
      const recentMessages = fullHistory.slice(-WINDOW_SIZE);

      if (!conversationSummary) {
        conversationSummary = await callAI(
          conversationSummaryPrompt(oldMessages, item.title),
          SUMMARY_MODEL,
          { maxTokens: 300 },
        );
      }

      activeMessages = [
        {
          role: "system",
          content: `Earlier in this conversation (summarized):\n${conversationSummary}`,
        },
        ...recentMessages,
      ];
    } else {
      activeMessages = fullHistory;
    }
  } catch (err) {
    console.error("[Discussion] Error:", err.message);
    setResponseStatus(event, 500);
    return { error: err.message };
  }

  // ---- Stream the AI reply as SSE ----
  const chatMessages = [
    { role: "system", content: systemContent },
    ...activeMessages,
  ];

  setResponseHeader(event, "content-type", "text/event-stream");
  setResponseHeader(event, "cache-control", "no-cache, no-transform");
  setResponseHeader(event, "connection", "keep-alive");

  // Keep the serverless function alive until post-stream persistence settles.
  let resolveDone;
  const donePromise = new Promise((r) => (resolveDone = r));
  background(event, donePromise);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullReply = "";
      let streamFailed = false;

      try {
        for await (const chunk of streamAI(chatMessages, preferredModel)) {
          fullReply += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ t: chunk })}\n\n`),
          );
        }
      } catch (streamErr) {
        console.error("[Discussion] Stream error:", streamErr.message);
        controller.enqueue(encoder.encode(`data: [ERROR]\n\n`));
        streamFailed = true;
      }

      if (!streamFailed) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
      controller.close();

      if (streamFailed) {
        resolveDone();
        return;
      }

      // ---- Post-stream persistence (runs while function is kept alive) ----
      try {
        await finalizeDiscussion({
          userId,
          id,
          item,
          fullHistory,
          fullReply,
          reflectionQuestions,
        });
      } catch (e) {
        console.error("[Discussion] Finalize error:", e?.message);
      } finally {
        resolveDone();
      }
    },
  });

  return stream;
});

async function finalizeDiscussion({
  userId,
  id,
  item,
  fullHistory,
  fullReply,
  reflectionQuestions,
}) {
  const updatedMessages = [
    ...fullHistory,
    { role: "assistant", content: fullReply },
  ];

  // Persist messages
  const { error: upsertErr } = await supabase.from("item_discussions").upsert(
    {
      user_id: userId,
      item_id: id,
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );
  if (upsertErr) console.error("[Discussion] Persist error:", upsertErr.message);

  // Regenerate summary covering everything beyond the window
  if (updatedMessages.length > WINDOW_SIZE) {
    const oldMessagesForSummary = updatedMessages.slice(
      0,
      updatedMessages.length - WINDOW_SIZE,
    );
    try {
      const newSummary = await callAI(
        conversationSummaryPrompt(oldMessagesForSummary, item.title),
        SUMMARY_MODEL,
        { maxTokens: 300 },
      );
      const { error: summaryErr } = await supabase
        .from("item_discussions")
        .update({ summary: newSummary })
        .eq("user_id", userId)
        .eq("item_id", id);
      if (summaryErr)
        console.error("[Discussion] Summary update error:", summaryErr.message);
    } catch (e) {
      console.error("[Discussion] Summary generation error:", e.message);
    }
  }

  // Auto-synthesize a reflection note when the user has engaged enough
  const userMessageCount = updatedMessages.filter(
    (m) => m.role === "user",
  ).length;
  const pendingQuestions = reflectionQuestions?.questions;

  const shouldAttemptExtraction =
    item.status === "finished" &&
    (!item.reflection_note || !item.rating) &&
    pendingQuestions?.length &&
    userMessageCount >= 4;

  if (shouldAttemptExtraction) {
    const REFLECT_MODEL = "openai/gpt-4o-mini";
    try {
      const raw = await callAI(
        discussionReflectionExtractPrompt(item, pendingQuestions, updatedMessages),
        REFLECT_MODEL,
        { maxTokens: 600 },
      );
      let result;
      try {
        const cleaned = raw
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn(
            "[Discussion] Reflection extract: no JSON found in response:",
            raw.slice(0, 200),
          );
          return;
        }
        result = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error(
          "[Discussion] Reflection extract: JSON parse failed:",
          parseErr.message,
          "| raw:",
          raw?.slice(0, 300),
        );
        return;
      }

      const updates = {};
      if (
        result?.synthesized &&
        result?.reflection_note &&
        !item.reflection_note
      ) {
        updates.reflection_note = result.reflection_note;
      }
      if (
        !item.rating &&
        Number.isInteger(result?.rating) &&
        [1, 3, 5].includes(result.rating)
      ) {
        updates.rating = result.rating;
      }

      if (Object.keys(updates).length === 0) return;

      const { error: reflectErr } = await supabase
        .from("items")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);

      if (reflectErr) {
        console.error(
          "[Discussion] Reflection/rating save error:",
          reflectErr.message,
        );
        return;
      }

      if (updates.reflection_note) {
        await supabase
          .from("reflection_questions")
          .delete()
          .eq("item_id", id)
          .eq("user_id", userId);
      }

      console.log(
        `[Discussion] Auto-extracted from discussion for item ${id}: ${[
          updates.reflection_note && "reflection_note",
          updates.rating && "rating",
        ]
          .filter(Boolean)
          .join(", ")}`,
      );
    } catch (e) {
      console.error("[Discussion] Reflection synthesis error:", e.message);
    }
  }
}
