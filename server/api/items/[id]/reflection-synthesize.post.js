import { supabase } from "../../../db/supabase.js";
import { callAI } from "../../../ai/openrouter.js";
import { reflectionSynthesizePrompt } from "../../../prompts/index.js";

// POST /api/items/:id/reflection-synthesize — turn answers into a reflection note
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");
  try {
    const { questions, answers, user_rate, free_text } =
      (await readBody(event)) || {};

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      setResponseStatus(event, 400);
      return { error: "questions and answers arrays are required" };
    }

    const [{ data: item, error: itemError }, { data: userProfile }] =
      await Promise.all([
        supabase
          .from("items")
          .select("title, category")
          .eq("id", id)
          .eq("user_id", userId)
          .single(),
        supabase
          .from("user_profiles")
          .select("preferred_model")
          .eq("id", userId)
          .maybeSingle(),
      ]);

    if (itemError || !item) {
      setResponseStatus(event, 404);
      return { error: "Item not found" };
    }

    const prompt = reflectionSynthesizePrompt(
      item,
      questions,
      answers,
      user_rate,
      free_text,
    );
    const model = userProfile?.preferred_model || "openai/gpt-4o-mini";
    const reflectionNote = await callAI(prompt, model);

    const updates = { reflection_note: reflectionNote };
    if (
      typeof user_rate === "number" &&
      Number.isInteger(user_rate) &&
      user_rate >= 1 &&
      user_rate <= 5
    ) {
      updates.rating = user_rate;
    }

    const { error: updateError } = await supabase
      .from("items")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) throw updateError;

    await supabase
      .from("reflection_questions")
      .delete()
      .eq("item_id", id)
      .eq("user_id", userId);

    return {
      reflection_note: reflectionNote,
      rating: updates.rating ?? null,
    };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
