export const CATEGORY_ICON: Record<string, string> = {
  movie: "i-lucide-film",
  music: "i-lucide-music-2",
  book: "i-lucide-book-open",
  show: "i-lucide-tv",
  article: "i-lucide-newspaper",
  place: "i-lucide-map-pin",
  person: "i-lucide-user-round",
  idea: "i-lucide-lightbulb",
  note: "i-lucide-notebook-pen",
  product: "i-lucide-shopping-bag",
};

export const STATUS_OPTIONS = [
  { label: "Saved", value: "saved" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" },
  { label: "Skipped", value: "skipped" },
] as const;

export const LIBRARY_CATEGORIES = [
  { value: "movie", label: "Movies", icon: "i-lucide-film" },
  { value: "music", label: "Music", icon: "i-lucide-music-2" },
  { value: "book", label: "Books", icon: "i-lucide-book-open" },
  { value: "show", label: "TV Shows", icon: "i-lucide-tv" },
  { value: "article", label: "Articles", icon: "i-lucide-newspaper" },
  { value: "idea", label: "Ideas", icon: "i-lucide-lightbulb" },
  { value: "note", label: "Notes", icon: "i-lucide-notebook-pen" },
  { value: "place", label: "Places", icon: "i-lucide-map-pin" },
] as const;

export const LIBRARY_CATEGORY_NAV_ITEMS = [
  { to: "/library/movie", label: "Movies", icon: "i-lucide-film" },
  { to: "/library/music", label: "Music", icon: "i-lucide-music-2" },
  { to: "/library/show", label: "TV Shows", icon: "i-lucide-tv" },
  { to: "/library/book", label: "Books", icon: "i-lucide-book-open" },
  { to: "/library/place", label: "Places", icon: "i-lucide-map-pin" },
  { to: "/library/note", label: "Notes", icon: "i-lucide-notebook-pen" },
  { to: "/library/article", label: "Articles", icon: "i-lucide-newspaper" },
  { to: "/library/idea", label: "Ideas", icon: "i-lucide-lightbulb" },
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
