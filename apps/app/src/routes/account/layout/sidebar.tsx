import { FileText, Settings, Shield, UserIcon, Wallet } from "lucide-react";

export const accountSidebarItems = {
  navMain: [
    { title: "Profile", url: "/account/profile", icon: UserIcon },
    { title: "Wallet", url: "/account/wallet", icon: Wallet },
    { title: "Documents", url: "/account/documents", icon: FileText },
    { title: "Security", url: "/account/security", icon: Shield },
    { title: "Settings", url: "/account/settings", icon: Settings },
  ],
};
