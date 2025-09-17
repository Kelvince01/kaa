import {
  Calendar,
  ClipboardCheck,
  DollarSign,
  FileText,
  GalleryVerticalEnd,
  Heart,
  Home,
  Lock,
  MessageCircle,
  Settings,
  SquareTerminal,
  UserIcon,
  Users,
  Wrench,
} from "lucide-react";
import type { User } from "@/modules/users/user.type";

export const dashboardSidebarItems = (user: User) => {
  return {
    organizations: [
      {
        name: "Acme Inc",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
    ],
    navMain: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      ...(user?.role === "tenant"
        ? [
            {
              title: "My Bookings",
              url: "/dashboard/bookings",
              icon: Calendar,
            },
            {
              title: "Maintenance Requests",
              url: "/dashboard/maintenance",
              icon: Wrench,
            },
            {
              title: "My References",
              url: "/dashboard/references",
              icon: ClipboardCheck,
            },
            {
              title: "Favorite Properties",
              url: "/dashboard/favorites",
              icon: Heart,
            },
          ]
        : []),
      ...(user?.role === "landlord" ||
      user.role === "agent" ||
      user.role === "admin"
        ? [
            {
              title: "My Properties",
              url: "/dashboard/properties",
              icon: Home,
            },
            {
              title: "My Units",
              url: "/dashboard/units",
              icon: Users,
            },
            {
              title: "My Tenants",
              url: "/dashboard/tenants",
              icon: Users,
            },
            {
              title: "Maintenance",
              url: "/dashboard/maintenance",
              icon: Wrench,
            },
            {
              title: "References",
              url: "/dashboard/references",
              icon: ClipboardCheck,
            },
            {
              title: "Booking Requests",
              url: "/dashboard/booking-requests",
              icon: Calendar,
            },
            {
              title: "Finances",
              url: "/dashboard/finances",
              icon: DollarSign,
            },
          ]
        : []),
      {
        title: "Messages",
        url: "/messages",
        icon: MessageCircle,
      },
      {
        title: "My Profile",
        url: "/dashboard/profile",
        icon: UserIcon,
      },
      {
        title: "Security",
        url: "/dashboard/security",
        icon: Lock,
      },
      {
        title: "Contracts",
        url: "/dashboard/contracts",
        icon: FileText,
      },

      { title: "Settings", url: "/dashboard/settings", icon: Settings },
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
};
