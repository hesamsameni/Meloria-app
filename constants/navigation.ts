export interface NavItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
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
  {
    to: "/settings",
    label: "Settings",
    icon: "i-lucide-settings",
  },
  { to: "/admin", label: "Admin", icon: "i-lucide-shield", adminOnly: true },
];
