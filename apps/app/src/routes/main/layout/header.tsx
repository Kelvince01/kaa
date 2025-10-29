"use client";

import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@kaa/ui/components/navigation-menu";
import {
  Clock,
  Heart,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";

export function Header() {
  // const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = (): void => {
      const SCROLL_LIMIT = 20;
      setScrolled(window.scrollY > SCROLL_LIMIT);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-menu]")) {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userMenuOpen, mobileMenuOpen]);

  // Toggle user menu
  const toggleUserMenu = (): void => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Toggle mobile menu
  const toggleMobileMenu = (): void => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-emerald-200 border-b bg-white/80 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Mobile menu button */}
            <button
              className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
              onClick={toggleMobileMenu}
              type="button"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <Link className="flex items-center gap-2" href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-emerald-600 to-emerald-700">
                <Icon
                  className="logo h-6 w-6 text-white"
                  icon="material-symbols:home-work"
                />
              </div>
              <span className="font-bold text-emerald-800 text-xl">Kaa</span>
            </Link>

            {/* 
						<div className="flex items-center space-x-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
								<Icon icon="material-symbols:home-work" className="h-6 w-6 text-white" />
							</div>
							<span className="font-bold text-2xl text-emerald-800">RentaKenya</span>
						</div>
						*/}
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="space-x-8">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Link
                    className={`font-medium text-sm ${
                      pathname === "/"
                        ? "text-primary-600"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    href="/"
                  >
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Link
                    className={`font-medium text-sm ${
                      pathname === "/properties"
                        ? "text-primary-600"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    href="/properties"
                  >
                    Find Properties
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Link
                    className={`font-medium text-sm ${
                      pathname === "/for-landlords"
                        ? "text-primary-600"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    href="/for-landlords"
                  >
                    For Landlords
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Link
                    className={`font-medium text-sm ${
                      pathname === "/for-tenants"
                        ? "text-primary-600"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    href="/for-tenants"
                  >
                    For Tenants
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Link
                    className={`font-medium text-sm ${
                      pathname === "/how-it-works"
                        ? "text-primary-600"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    href="/how-it-works"
                  >
                    How It Works
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {user?.role === "landlord" && (
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    <Link
                      className={`font-medium text-sm ${
                        pathname?.startsWith("/dashboard")
                          ? "text-primary-600"
                          : "text-gray-700 hover:text-primary-600"
                      }`}
                      href="/dashboard/properties"
                    >
                      My Properties
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          {user ? (
            <div className="relative">
              <button
                className="flex items-center font-medium text-gray-700 text-sm hover:text-primary-600 focus:outline-none"
                onClick={toggleUserMenu}
                type="button"
              >
                <span className="mr-2">{user.firstName}</span>
                <Image
                  alt={user.firstName}
                  className="h-8 w-8 rounded-full"
                  height={32}
                  src={user.avatar || "/images/default-avatar.png"}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                  }}
                  width={32}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <Link
                      className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                      href="/account"
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                    <Link
                      className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                      href="/account/favorites"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                    <Link
                      className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                      href="/messages"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                    <Link
                      className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                      href="/account/applications"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Applications
                    </Link>
                    <Link
                      className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                      href="/account/settings"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      className="flex w-full items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                      onClick={logout}
                      type="button"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button
                className="text-emerald-700 hover:text-emerald-800"
                variant="ghost"
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="border-emerald-200 border-t bg-white lg:hidden">
            <div className="space-y-4 px-4 py-6">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <Link
                  className={`block rounded-md px-3 py-2 font-medium text-base transition-colors ${
                    pathname === "/"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"
                  }`}
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>

                <Link
                  className={`block rounded-md px-3 py-2 font-medium text-base transition-colors ${
                    pathname === "/properties"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"
                  }`}
                  href="/properties"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Properties
                </Link>

                <Link
                  className={`block rounded-md px-3 py-2 font-medium text-base transition-colors ${
                    pathname === "/for-landlords"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"
                  }`}
                  href="/for-landlords"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Landlords
                </Link>

                <Link
                  className={`block rounded-md px-3 py-2 font-medium text-base transition-colors ${
                    pathname === "/for-tenants"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"
                  }`}
                  href="/for-tenants"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Tenants
                </Link>

                <Link
                  className={`block rounded-md px-3 py-2 font-medium text-base transition-colors ${
                    pathname === "/how-it-works"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"
                  }`}
                  href="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>

                {user?.role === "landlord" && (
                  <Link
                    className={`block rounded-md px-3 py-2 font-medium text-base transition-colors ${
                      pathname?.startsWith("/dashboard")
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-emerald-700"
                    }`}
                    href="/dashboard/properties"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Properties
                  </Link>
                )}
              </div>

              {/* Mobile User Section */}
              {user ? (
                <div className="space-y-3 border-gray-200 border-t pt-4">
                  <div className="flex items-center px-3 py-2">
                    <Image
                      alt={user.firstName}
                      className="mr-3 h-10 w-10 rounded-full"
                      height={10}
                      src={user.avatar || "/images/default-avatar.png"}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                      }}
                      width={10}
                    />
                    <div>
                      <p className="font-medium text-base text-gray-800">
                        {user.firstName}
                      </p>
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                  </div>

                  <Link
                    className="flex items-center rounded-md px-3 py-2 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50 hover:text-emerald-700"
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    My Account
                  </Link>

                  <Link
                    className="flex items-center rounded-md px-3 py-2 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50 hover:text-emerald-700"
                    href="/account/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="mr-3 h-5 w-5" />
                    Favorites
                  </Link>

                  <Link
                    className="flex items-center rounded-md px-3 py-2 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50 hover:text-emerald-700"
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="mr-3 h-5 w-5" />
                    Messages
                  </Link>

                  <Link
                    className="flex items-center rounded-md px-3 py-2 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50 hover:text-emerald-700"
                    href="/account/applications"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Clock className="mr-3 h-5 w-5" />
                    Applications
                  </Link>

                  <Link
                    className="flex items-center rounded-md px-3 py-2 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50 hover:text-emerald-700"
                    href="/account/settings"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Link>

                  <button
                    className="flex w-full items-center rounded-md px-3 py-2 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50 hover:text-emerald-700"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3 border-gray-200 border-t pt-4">
                  <Link
                    className="block rounded-md border border-emerald-200 px-3 py-2 font-medium text-base text-emerald-700 transition-colors hover:bg-emerald-50"
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>

                  <Link
                    className="block rounded-md bg-emerald-600 px-3 py-2 text-center font-medium text-base text-white transition-colors hover:bg-emerald-700"
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
