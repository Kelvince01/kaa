"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Calendar,
  DollarSign,
  FileText,
  Heart,
  Home,
  Lock,
  LogOut,
  Menu,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import Header from "./header";

type DashboardLayoutProps = {
  children: React.ReactNode;
  title: string;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Navigation items based on user role
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      exact: true,
    },
    ...(user?.role === "tenant"
      ? [
          {
            name: "My Bookings",
            href: "/dashboard/bookings",
            icon: Calendar,
          },
          {
            name: "Favorite Properties",
            href: "/dashboard/favorites",
            icon: Heart,
          },
        ]
      : []),
    ...(user?.role === "landlord"
      ? [
          {
            name: "My Properties",
            href: "/dashboard/properties",
            icon: Home,
          },
          {
            name: "Booking Requests",
            href: "/dashboard/bookings/requests",
            icon: Calendar,
          },
          {
            name: "Finances",
            href: "/dashboard/financials",
            icon: DollarSign,
          },
        ]
      : []),
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
    },
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      name: "Security",
      href: "/dashboard/security",
      icon: Lock,
    },
    {
      name: "Contracts",
      href: "/dashboard/contracts",
      icon: FileText,
    },
  ];

  const isActivePath = (path: string) => {
    const currentPath = pathname;
    if (path === "/dashboard" && currentPath === "/dashboard") {
      return true;
    }
    return currentPath.startsWith(path) && path !== "/dashboard";
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">{title}</h1>

        {/* Mobile menu button */}
        <Button
          aria-label="Toggle menu"
          className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar - visible on mobile only when toggled */}
        <aside
          className={`w-full overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 md:w-64 ${
            isSidebarOpen ? "max-h-screen" : "max-h-0 md:max-h-screen"
          }`}
        >
          <nav className="border-gray-200 border-r p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    className={`flex items-center rounded-md px-4 py-2 transition-colors ${
                      isActivePath(item.href)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    href={item.href}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}

              <li>
                <Button
                  className="flex w-full items-center rounded-md px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="flex-1">
          <Header />
          {/* Main content */}
          <main className="flex-1 rounded-lg bg-white p-6 shadow-md">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
