import { supabase } from "../db/supabase.js";
import { extract } from "../ai/openrouter.js";
import { whatTonightPrompt } from "../prompts/index.js";

function formatTimeAgo(dateString) {
  if (!dateString) return "unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  if (diffMonths > 0)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return "today";
}

export async function runTonightPipeline({ userId, mood = null, excludeTitle = null }) {
  const { data: tasteProfile } = await supabase
    .from("taste_profiles")
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: wantToItems },
    { data: inProgressItems },
    { data: finishedItems },
    { data: userProfile },
  ] = await Promise.all([
    supabase
      .from("items")
      .select("title, category, creator, created_at")
      .eq("user_id", userId)
      .eq("status", "want_to")
      .order("created_at", { ascending: false }),
    supabase
      .from("items")
      .select("title, category")
      .eq("user_id", userId)
      .eq("status", "in_progress"),
    supabase
      .from("items")
      .select("title, category, reflection_note, finished_at")
      .eq("user_id", userId)
      .eq("status", "finished")
      .gte("finished_at", thirtyDaysAgo.toISOString())
      .order("finished_at", { ascending: false }),
    supabase
      .from("user_profiles")
      .select("preferred_model")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const shuffledWantTo = wantToItems ? [...wantToItems] : [];
  for (let i = shuffledWantTo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledWantTo[i], shuffledWantTo[j]] = [shuffledWantTo[j], shuffledWantTo[i]];
  }

  const formattedWantTo = shuffledWantTo.map((item) => ({
    title: item.title,
    category: item.category,
    creator: item.creator,
    saved_at: formatTimeAgo(item.created_at),
  }));

  const formattedFinished = (finishedItems || []).map((item) => ({
    title: item.title,
    category: item.category,
    reflection_note: item.reflection_note,
    finished_at: formatTimeAgo(item.finished_at),
  }));

  const now = new Date();
  const hour = now.getHours();
  const timeOfDay =
    hour >= 6 && hour < 12
      ? "morning"
      : hour >= 12 && hour < 18
        ? "afternoon"
        : hour >= 18 && hour < 23
          ? "evening"
          : "late night";

  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

  const prompt = whatTonightPrompt({
    tasteProfileSummary: tasteProfile?.profile?.summary || null,
    wantToItems: formattedWantTo,
    inProgressItems: inProgressItems || [],
    recentlyFinishedItems: formattedFinished,
    mood,
    excludeTitle,
    timeOfDay,
    dayOfWeek,
  });

  const model = userProfile?.preferred_model || "openai/gpt-4o-mini";
  const recommendation = await extract(prompt, model);

  recommendation.is_from_library =
    recommendation.is_from_library === true ||
    recommendation.is_from_library === "true";

  if (recommendation.is_from_library) {
    const { data: item } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .eq("title", recommendation.title)
      .eq("status", "want_to")
      .maybeSingle();

    return {
      ...recommendation,
      item: item || null,
      saved_at: item?.created_at || null,
    };
  }

  return recommendation;
}
