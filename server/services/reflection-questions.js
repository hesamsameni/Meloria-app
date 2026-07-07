import { supabase } from "../db/supabase.js";
import { extract } from "../ai/openrouter.js";
import { reflectionQuestionsPrompt } from "../prompts/index.js";

export async function generateAndStoreQuestions(itemId, userId) {
  try {
    const [
      { data: item, error: itemError },
      { data: tasteProfile },
      { data: userProfile },
    ] = await Promise.all([
      supabase
        .from("items")
        .select("title, category, creator, release_year, genres")
        .eq("id", itemId)
        .eq("user_id", userId)
        .single(),
      supabase
        .from("taste_profiles")
        .select("profile")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_profiles")
        .select("preferred_model")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    if (itemError || !item) {
      console.error(
        `[ReflectionQuestions] Item not found: ${itemId}`,
        itemError,
      );
      return;
    }

    const prompt = reflectionQuestionsPrompt(
      item,
      tasteProfile?.profile || null,
    );

    const preferredModel = userProfile?.preferred_model || "openai/gpt-4o-mini";
    const result = await extract(prompt, preferredModel);

    const { error: insertError } = await supabase
      .from("reflection_questions")
      .insert({
        item_id: itemId,
        user_id: userId,
        questions: result.questions,
      });

    if (insertError) {
      console.error(
        `[ReflectionQuestions] Failed to store questions for item ${itemId}:`,
        insertError,
      );
      return;
    }
  } catch (err) {
    console.error(
      `[ReflectionQuestions] Error generating questions for item ${itemId}:`,
      err.message,
    );
  }
}
