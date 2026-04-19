export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "i-lucide-layout-dashboard" },
  { to: "/library", label: "Library", icon: "i-lucide-library" },
  { to: "/import", label: "Bulk Import", icon: "i-lucide-list-plus" },
  { to: "/reflect", label: "Reflect", icon: "i-lucide-notebook-pen" },
  { to: "/suggestions", label: "Suggestions", icon: "i-lucide-sparkles" },
  {
    to: "/taste-profile",
    label: "Taste Profile",
    icon: "i-lucide-fingerprint",
  },
  { to: "/settings", label: "Settings", icon: "i-lucide-settings" },
] as const;
