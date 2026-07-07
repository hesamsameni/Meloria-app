import { supabase } from "../../../db/supabase.js";
import { extract } from "../../../ai/openrouter.js";
import { reflectionQuestionsPrompt } from "../../../prompts/index.js";

// POST /api/items/:id/reflection-questions — get or generate reflection questions
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, "id");
  try {
    const { data: preGenerated, error: preGenError } = await supabase
      .from("reflection_questions")
      .select("questions")
      .eq("item_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!preGenError && preGenerated) {
      return { questions: preGenerated.questions };
    }

    const [
      { data: item, error: itemError },
      { data: tasteProfile },
      { data: userProfile },
    ] = await Promise.all([
      supabase
        .from("items")
        .select("title, category, creator, release_year, genres")
        .eq("id", id)
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
      setResponseStatus(event, 404);
      return { error: "Item not found" };
    }

    const prompt = reflectionQuestionsPrompt(
      item,
      tasteProfile?.profile || null,
    );
    const preferredModel = userProfile?.preferred_model || "openai/gpt-4o-mini";
    const result = await extract(prompt, preferredModel);

    await supabase.from("reflection_questions").insert({
      item_id: id,
      user_id: userId,
      questions: result.questions,
    });

    return { questions: result.questions };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
