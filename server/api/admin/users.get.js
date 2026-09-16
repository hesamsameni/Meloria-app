import { supabase } from "../../db/supabase.js";
import { withSignedAvatarUrl } from "../../services/profile.js";

const USER_FIELDS =
  "id, username, display_name, avatar_url, subscription, subscription_status, preferred_model, role, current_period_end, created_at, updated_at";

// GET /api/admin/users — list users with profile info
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  try {
    const q = getQuery(event);
    const page = Math.max(1, parseInt(q.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(q.limit) || 50));
    const offset = (page - 1) * limit;
    const search = q.search?.trim() || "";

    let query = supabase
      .from("user_profiles")
      .select(USER_FIELDS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const userIds = (data || []).map((u) => u.id);
    let emailMap = {};

    if (userIds.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });

      if (authUsers?.users) {
        emailMap = Object.fromEntries(
          authUsers.users.map((u) => [u.id, u.email]),
        );
      }
    }

    const users = await Promise.all(
      (data || []).map((u) =>
        withSignedAvatarUrl({ ...u, email: emailMap[u.id] || null }),
      ),
    );

    return { users, total: count ?? 0, page, limit };
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
