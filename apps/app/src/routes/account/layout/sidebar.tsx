import {
  ClipboardCheck,
  FileText,
  Heart,
  Search,
  Settings,
  Shield,
  UserIcon,
  Wallet,
} from "lucide-react";

export const accountSidebarItems = {
  navMain: [
    { title: "Profile", url: "/account/profile", icon: UserIcon },
    { title: "Saved Searches", url: "/account/saved-searches", icon: Search },
    { title: "Favourites", url: "/account/favourites", icon: Heart },
    {
      title: "Applications",
      url: "/account/applications-v2 ",
      icon: ClipboardCheck,
    },
    { title: "Wallet", url: "/account/wallet", icon: Wallet },
    { title: "Documents", url: "/account/documents", icon: FileText },
    { title: "Security", url: "/account/security", icon: Shield },
    { title: "Settings", url: "/account/settings", icon: Settings },
  ],
};
