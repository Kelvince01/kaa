import {
  Calendar,
  ClipboardCheck,
  DollarSign,
  FileText,
  Home,
  Lock,
  MessageCircle,
  MessageSquare,
  Settings,
  Shield,
  UserIcon,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Get dashboard sidebar items based on user role
 * Uses role name from context instead of user object
 */
export const getDashboardSidebarItems = (roleName?: string) => {
  const commonItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, isActive: true },
  ];

  // Tenant-specific items
  const tenantItems = [
    {
      title: "My Property",
      url: "/dashboard/properties",
      icon: Home,
    },
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
      title: "Rent Payments",
      url: "/dashboard/payments",
      icon: DollarSign,
    },
    {
      title: "My References",
      url: "/dashboard/references",
      icon: ClipboardCheck,
    },
    { title: "Documents", url: "/dashboard/documents", icon: FileText },
  ];

  // Landlord/Manager/Admin items
  const landlordItems = [
    {
      title: "Properties",
      url: "/dashboard/properties",
      icon: Home,
      items: [
        {
          title: "My Properties",
          url: "/dashboard/properties",
        },
        {
          title: "Units",
          url: "/dashboard/properties/units",
        },
        {
          title: "Amenities",
          url: "/dashboard/properties/amenities",
        },
        {
          title: "Virtual Tours",
          url: "/dashboard/properties/virtual-tours",
        },
      ],
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
      items: [
        {
          title: "All Bookings",
          url: "/dashboard/bookings",
        },
        {
          title: "Booking Requests",
          url: "/dashboard/bookings/requests",
        },
      ],
    },
    {
      title: "Maintenance",
      url: "/dashboard/maintenance",
      icon: Wrench,
    },
    {
      title: "Finances",
      url: "/dashboard/financials",
      icon: DollarSign,
      items: [
        {
          title: "Overview",
          url: "/dashboard/financials",
        },
        {
          title: "Analytics",
          url: "/dashboard/financials/analytics",
        },
        {
          title: "Receipts",
          url: "/dashboard/financials/receipts",
        },
      ],
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
      title: "Legal Documents",
      url: "/dashboard/documents",
      icon: Shield,
    },
  ];

  // Communication (common for all)
  const communicationItems = {
    title: "Communication",
    url: "/dashboard/communication",
    icon: MessageCircle,
    items: [
      {
        title: "Messages",
        url: "/messages",
      },
      {
        title: "Video Calls",
        url: "/dashboard/calls",
      },
    ],
  };

  // Settings items (common for all)
  const settingsItems = [
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
  ];

  // Build navigation based on role
  if (roleName === "tenant") {
    return {
      navMain: [
        ...commonItems,
        ...tenantItems,
        communicationItems,
        ...settingsItems,
      ],
    };
  }

  // Landlord, manager, admin, agent
  if (
    roleName === "landlord" ||
    roleName === "manager" ||
    roleName === "property_manager" ||
    roleName === "agent" ||
    roleName === "admin"
  ) {
    return {
      navMain: [
        ...commonItems,
        ...landlordItems,
        communicationItems,
        ...settingsItems,
      ],
    };
  }

  // Default fallback
  return {
    navMain: [...commonItems, communicationItems, ...settingsItems],
  };
};
