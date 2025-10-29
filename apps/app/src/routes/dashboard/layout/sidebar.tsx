import {
  Calendar,
  Check,
  ClipboardCheck,
  DollarSign,
  FileText,
  GalleryVerticalEnd,
  Heart,
  Home,
  Lock,
  MessageCircle,
  MessageSquare,
  Settings,
  Shield,
  UserIcon,
  Users,
  Video,
  Wrench,
} from "lucide-react";
import type { User } from "@/modules/users/user.type";

export const dashboardSidebarItems = (user: User) => ({
  organizations: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: Home, isActive: true },
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
            title: "Properties",
            url: "/dashboard/properties",
            icon: Home,
            items: [
              {
                title: "My Properties",
                url: "/dashboard/properties",
                icon: Home,
              },
              {
                title: "Units",
                url: "/dashboard/units",
                icon: Users,
              },
              {
                title: "Tenants",
                url: "/dashboard/tenants",
                icon: Users,
              },
              {
                title: "Bookings",
                url: "/dashboard/bookings",
                icon: Calendar,
              },
              {
                title: "Virtual Tours",
                url: "/dashboard/virtual-tours",
                icon: Video,
              },
              {
                title: "Inspections",
                url: "/dashboard/inspections",
                icon: Check,
              },
              {
                title: "Conditions",
                url: "/dashboard/conditions",
                icon: Check,
              },
            ],
          },
          {
            title: "Maintenance",
            url: "/dashboard/maintenance",
            icon: Wrench,
          },
          {
            title: "Reviews",
            url: "/dashboard/reviews",
            icon: MessageSquare,
          },
          {
            title: "References",
            url: "/dashboard/references",
            icon: ClipboardCheck,
          },
          {
            title: "Booking Requests",
            url: "/dashboard/bookings/requests",
            icon: Calendar,
          },
          {
            title: "Finances",
            url: "/dashboard/financials",
            icon: DollarSign,
          },
          {
            title: "Legal Documents",
            url: "/dashboard/documents",
            icon: Shield,
          },
        ]
      : []),
    {
      title: "Communication",
      url: "/dashboard/communication",
      icon: MessageCircle,
      items: [
        {
          title: "Messages",
          url: "/messages",
          icon: MessageCircle,
        },
        {
          title: "Video Calls",
          url: "/dashboard/calls",
          icon: Video,
        },
      ],
    },
    {
      title: "Templates",
      url: "/dashboard/templates",
      icon: FileText,
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
  ],
});
