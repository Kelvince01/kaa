import {
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import NotificationPopover from "@/modules/comms/notifications/components/notification-popup";

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const pathname = usePathname();

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        !(event.target as Element).closest(".user-dropdown")
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white ${
        scrolled ? "shadow-md" : ""
      } transition-shadow duration-300`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <span className="font-bold text-2xl text-primary/60">
                Kaa <span className="text-secondary/60">SaaS</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:ml-6 md:flex md:space-x-8">
            <Link
              className={`inline-flex items-center px-1 pt-1 font-medium text-sm ${
                pathname.startsWith("/properties")
                  ? "border-primary/60 border-b-2 text-primary/60"
                  : "text-gray-500 hover:border-gray-300 hover:border-b-2 hover:text-gray-900"
              }`}
              href="/properties"
            >
              Find Properties
            </Link>
            <Link
              className={`inline-flex items-center px-1 pt-1 font-medium text-sm ${
                pathname.startsWith("/landlords")
                  ? "border-primary/60 border-b-2 text-primary/60"
                  : "text-gray-500 hover:border-gray-300 hover:border-b-2 hover:text-gray-900"
              }`}
              href="/landlords"
            >
              For Landlords
            </Link>
            <Link
              className={`inline-flex items-center px-1 pt-1 font-medium text-sm ${
                pathname.startsWith("/tenants")
                  ? "border-primary/60 border-b-2 text-primary/60"
                  : "text-gray-500 hover:border-gray-300 hover:border-b-2 hover:text-gray-900"
              }`}
              href="/tenants"
            >
              For Tenants
            </Link>
            <Link
              className={`inline-flex items-center px-1 pt-1 font-medium text-sm ${
                pathname.startsWith("/how-it-works")
                  ? "border-primary/60 border-b-2 text-primary/60"
                  : "text-gray-500 hover:border-gray-300 hover:border-b-2 hover:text-gray-900"
              }`}
              href="/how-it-works"
            >
              How It Works
            </Link>
          </nav>

          {/* User Actions (Desktop) */}
          <div className="hidden md:ml-6 md:flex md:items-center">
            {isAuthenticated && (
              <div className="mr-4">
                <NotificationPopover />
              </div>
            )}
            {isAuthenticated ? (
              <div className="user-dropdown relative ml-3">
                <div>
                  <button
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    className="flex max-w-xs items-center rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    id="user-menu-button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    type="button"
                  >
                    <span className="sr-only">Open user menu</span>
                    {user?.avatar ? (
                      <Image
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-9 w-9 rounded-full"
                        height={40}
                        src={process.env.NEXT_PUBLIC_API_URL + user.avatar}
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                        }}
                        width={40}
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/60 text-white">
                        <span>
                          {user?.firstName?.charAt(0)}
                          {user?.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div
                    aria-labelledby="user-menu-button"
                    aria-orientation="vertical"
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    tabIndex={-1}
                  >
                    <div className="py-1" role="none">
                      <div className="border-b px-4 py-2">
                        <p className="font-medium text-gray-900 text-sm">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="truncate text-gray-500 text-xs">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                        href="/dashboard"
                      >
                        <Home className="mr-3 text-gray-500" />
                        Dashboard
                      </Link>
                      <Link
                        className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                        href="/messages"
                      >
                        <MessageCircle className="mr-3 text-gray-500" />
                        Messages
                      </Link>
                      <Link
                        className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                        href="/favorites"
                      >
                        <Heart className="mr-3 text-gray-500" />
                        Favorites
                      </Link>
                      <Link
                        className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                        href="/profile"
                      >
                        <User className="mr-3 text-gray-500" />
                        Profile
                      </Link>
                      <Link
                        className="flex items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                        href="/settings"
                      >
                        <Settings className="mr-3 text-gray-500" />
                        Settings
                      </Link>
                      <button
                        className="flex w-full items-center px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
                        onClick={async () => await logout()}
                        type="button"
                      >
                        <LogOut className="mr-3 text-gray-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  className="inline-flex items-center rounded-md border border-transparent bg-white px-4 py-2 font-medium text-primary/60 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                  href="/auth/login"
                >
                  Log in
                </Link>
                <Link
                  className="inline-flex items-center rounded-md border border-transparent bg-primary/60 px-4 py-2 font-medium text-sm text-white hover:bg-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                  href="/auth/register"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center md:hidden">
            {isAuthenticated && (
              <div className="mr-4">
                <Link href="/dashboard">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/60 text-sm text-white">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </Link>
              </div>
            )}
            <button
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              className="rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-inset"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 pt-2 pb-3">
            <Link
              className={`block py-2 pr-4 pl-3 font-medium text-base ${
                pathname.startsWith("/properties")
                  ? "border-primary/50 border-l-4 bg-primary/50 text-primary/60"
                  : "border-transparent border-l-4 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              }`}
              href="/properties"
            >
              Find Properties
            </Link>
            <Link
              className={`block py-2 pr-4 pl-3 font-medium text-base ${
                pathname.startsWith("/landlords")
                  ? "border-primary/50 border-l-4 bg-primary/50 text-primary/60"
                  : "border-transparent border-l-4 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              }`}
              href="/landlords"
            >
              For Landlords
            </Link>
            <Link
              className={`block py-2 pr-4 pl-3 font-medium text-base ${
                pathname.startsWith("/tenants")
                  ? "border-primary/50 border-l-4 bg-primary/50 text-primary/60"
                  : "border-transparent border-l-4 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              }`}
              href="/tenants"
            >
              For Tenants
            </Link>
            <Link
              className={`block py-2 pr-4 pl-3 font-medium text-base ${
                pathname.startsWith("/how-it-works")
                  ? "border-primary/50 border-l-4 bg-primary/50 text-primary/60"
                  : "border-transparent border-l-4 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              }`}
              href="/how-it-works"
            >
              How It Works
            </Link>
          </div>

          {!isAuthenticated && (
            <div className="border-gray-200 border-t pt-4 pb-3">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <Link
                    className="inline-flex items-center rounded-md border border-transparent bg-white px-4 py-2 font-medium text-primary/60 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                    href="/auth/login"
                  >
                    Log in
                  </Link>
                </div>
                <div className="ml-3">
                  <Link
                    className="inline-flex items-center rounded-md border border-transparent bg-primary/60 px-4 py-2 font-medium text-sm text-white hover:bg-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                    href="/auth/register"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <>
              <Link
                className="block border-transparent border-l-4 py-2 pr-4 pl-3 font-medium text-base text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="block border-transparent border-l-4 py-2 pr-4 pl-3 font-medium text-base text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                href="/messages"
              >
                Messages
              </Link>
              <Link
                className="block border-transparent border-l-4 py-2 pr-4 pl-3 font-medium text-base text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                href="/profile"
              >
                Profile
              </Link>
              <button
                className="block w-full border-transparent border-l-4 py-2 pr-4 pl-3 text-left font-medium text-base text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                onClick={async () => await logout()}
                type="button"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
