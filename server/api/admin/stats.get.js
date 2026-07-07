import { supabase } from "../../db/supabase.js";

// GET /api/admin/stats — quick summary counts
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  try {
    const [usersResult, itemsTodayResult, activeSubsResult] = await Promise.all(
      [
        supabase
          .from("user_profiles")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("items")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date().toISOString().slice(0, 10)),
        supabase
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .neq("subscription", "free"),
      ],
    );

    return {
      total_users: usersResult.count ?? 0,
      items_today: itemsTodayResult.count ?? 0,
      active_subscriptions: activeSubsResult.count ?? 0,
    };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
