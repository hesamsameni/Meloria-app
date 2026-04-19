export const CATEGORY_ICON: Record<string, string> = {
  movie: "i-lucide-film",
  music: "i-lucide-music-2",
  book: "i-lucide-book-open",
  show: "i-lucide-tv",
  podcast: "i-lucide-mic",
  game: "i-lucide-gamepad-2",
  anime: "i-lucide-tv-2",
};

export const STATUS_OPTIONS = [
  { label: "Want to", value: "want_to" },
  { label: "In progress", value: "in_progress" },
  { label: "Finished", value: "finished" },
  { label: "Not for me", value: "not_for_me" },
] as const;

export const LIBRARY_CATEGORIES = [
  { value: "movie", label: "Movies", icon: "i-lucide-film" },
  { value: "music", label: "Music", icon: "i-lucide-music-2" },
  { value: "book", label: "Books", icon: "i-lucide-book-open" },
  { value: "show", label: "TV Shows", icon: "i-lucide-tv" },
  { value: "podcast", label: "Podcasts", icon: "i-lucide-mic" },
  { value: "game", label: "Games", icon: "i-lucide-gamepad-2" },
  { value: "anime", label: "Anime", icon: "i-lucide-tv-2" },
] as const;

export const LIBRARY_CATEGORY_NAV_ITEMS = [
  { to: "/library/movie", label: "Movies", icon: "i-lucide-film" },
  { to: "/library/music", label: "Music", icon: "i-lucide-music-2" },
  { to: "/library/show", label: "TV Shows", icon: "i-lucide-tv" },
  { to: "/library/book", label: "Books", icon: "i-lucide-book-open" },
  {
    to: "/library/podcast",
    label: "Podcasts",
    icon: "i-lucide-mic",
    comingSoon: true,
  },
  {
    to: "/library/game",
    label: "Games",
    icon: "i-lucide-gamepad-2",
    comingSoon: true,
  },
  {
    to: "/library/anime",
    label: "Anime",
    icon: "i-lucide-tv-2",
    comingSoon: true,
  },
] as const;

export const LIBRARY_STATUSES = [
  { value: "all", label: "All" },
  { value: "want_to", label: "Want to" },
  { value: "in_progress", label: "In progress" },
  { value: "finished", label: "Finished" },
  { value: "not_for_me", label: "Not for me" },
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
