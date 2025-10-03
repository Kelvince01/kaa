import { FileText, Settings, Shield, UserIcon } from "lucide-react";

export const accountSidebarItems = {
  navMain: [
    { title: "Profile", url: "/account/profile", icon: UserIcon },
    { title: "Documents", url: "/account/documents", icon: FileText },
    { title: "Security", url: "/account/security", icon: Shield },
    { title: "Settings", url: "/account/settings", icon: Settings },
  ],
};
