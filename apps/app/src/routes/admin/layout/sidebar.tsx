import {
  Brain,
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  GalleryVerticalEnd,
  Home,
  Settings,
  Shield,
  SquareTerminal,
  Users,
  Webhook,
} from "lucide-react";

export const adminSidebarItems = {
  organizations: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Organizations", url: "/admin/organizations", icon: Briefcase },
    { title: "Properties", url: "/admin/properties", icon: Briefcase },
    { title: "Landlords", url: "/admin/landlords", icon: Building },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Members", url: "/admin/members", icon: Users },
    { title: "Bookings", url: "/admin/bookings", icon: Calendar },
    { title: "Finances", url: "/admin/financials", icon: DollarSign },
    { title: "Webhooks", url: "/admin/webhooks", icon: Webhook },
    {
      title: "AI Management",
      url: "/admin/ai",
      icon: Brain,
      items: [
        {
          title: "Overview",
          url: "/admin/ai",
        },
        {
          title: "Models",
          url: "/admin/ai/models",
        },
        {
          title: "Predictions",
          url: "/admin/ai/predictions",
        },
      ],
    },
    {
      title: "RBAC",
      url: "/admin/rbac",
      icon: Shield,
      items: [
        {
          title: "Overview",
          url: "/admin/rbac",
        },
        {
          title: "Roles",
          url: "/admin/rbac/roles",
        },
        {
          title: "Permissions",
          url: "/admin/rbac/permissions",
        },
        {
          name: "Bulk Assignment",
          href: "/admin/rbac/bulk-assign",
          icon: Users,
        },
      ],
    },
    { title: "Settings", url: "/admin/settings", icon: Settings },
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
  ],
};
