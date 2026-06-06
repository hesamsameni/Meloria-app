export interface NavItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "i-lucide-layout-dashboard" },
  { to: "/profile", label: "Profile", icon: "i-lucide-user" },
  { to: "/discover", label: "Discover", icon: "i-lucide-compass" },
  { to: "/import", label: "Bulk Import", icon: "i-lucide-list-plus" },
  {
    to: "/settings",
    label: "Settings",
    icon: "i-lucide-settings",
  },
  { to: "/admin", label: "Admin", icon: "i-lucide-shield", adminOnly: true },
];
