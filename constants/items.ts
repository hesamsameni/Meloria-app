export const CATEGORY_EMOJI: Record<string, string> = {
  movie: "🎬",
  music: "🎵",
  book: "📚",
  show: "📺",
  article: "📰",
  place: "📍",
  person: "👤",
  idea: "💡",
  note: "📝",
  product: "🛍️",
};

export const STATUS_OPTIONS = [
  { label: "Saved", value: "saved" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" },
  { label: "Skipped", value: "skipped" },
] as const;

export const LIBRARY_CATEGORIES = [
  { value: "movie", label: "Movies", emoji: "🎬" },
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "book", label: "Books", emoji: "📚" },
  { value: "show", label: "Shows", emoji: "📺" },
  { value: "article", label: "Articles", emoji: "📰" },
  { value: "idea", label: "Ideas", emoji: "💡" },
  { value: "note", label: "Notes", emoji: "📝" },
  { value: "place", label: "Places", emoji: "📍" },
] as const;

export const LIBRARY_STATUSES = [
  { value: "all", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
] as const;

export const SUBSCRIPTION_PLANS = [
  { tier: "free", name: "Free", description: "30 per month" },
  { tier: "pro", name: "Pro", description: "120 per month" },
  { tier: "ultimate", name: "Ultimate", description: "Unlimited usage" },
] as const;

export const TIER_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  ultimate: 2,
};
