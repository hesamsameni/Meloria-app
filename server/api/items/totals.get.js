import { supabase } from "../../db/supabase.js";

// GET /api/items/totals — category/status counts
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  try {
    const { category } = getQuery(event);

    if (category) {
      const { data, error } = await supabase
        .from("items")
        .select("status")
        .eq("user_id", userId)
        .eq("category", category);

      if (error) throw error;

      const counts = {
        total: data.length,
        want_to: 0,
        in_progress: 0,
        finished: 0,
        not_for_me: 0,
      };
      for (const item of data) {
        if (item.status === "want_to") counts.want_to++;
        else if (item.status === "in_progress") counts.in_progress++;
        else if (item.status === "finished") counts.finished++;
        else if (item.status === "not_for_me") counts.not_for_me++;
      }

      const categoryCounts = { movie: 0, music: 0, show: 0, book: 0 };
      if (category === "movie") categoryCounts.movie = counts.total;
      else if (category === "music") categoryCounts.music = counts.total;
      else if (category === "show") categoryCounts.show = counts.total;
      else if (category === "book") categoryCounts.book = counts.total;

      return {
        total: counts.total,
        movies: categoryCounts.movie,
        music: categoryCounts.music,
        show: categoryCounts.show,
        book: categoryCounts.book,
        want_to: counts.want_to,
        in_progress: counts.in_progress,
        finished: counts.finished,
        not_for_me: counts.not_for_me,
      };
    }

    const { data, error } = await supabase
      .from("items")
      .select("category, status")
      .eq("user_id", userId);

    if (error) throw error;

    const totals = {
      total: data.length,
      movies: 0,
      music: 0,
      show: 0,
      book: 0,
      want_to: 0,
      in_progress: 0,
      finished: 0,
      not_for_me: 0,
    };

    for (const item of data) {
      if (item.category === "movie") totals.movies++;
      else if (item.category === "music") totals.music++;
      else if (item.category === "show") totals.show++;
      else if (item.category === "book") totals.book++;

      if (item.status === "want_to") totals.want_to++;
      else if (item.status === "in_progress") totals.in_progress++;
      else if (item.status === "finished") totals.finished++;
      else if (item.status === "not_for_me") totals.not_for_me++;
    }

    return totals;
  } catch (err) {
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});
