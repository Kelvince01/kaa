import {
  Clock,
  Heart,
  Home,
  Info,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuthStore } from "@/modules/auth/auth.store";

/**
 * Main navigation component used across all pages
 */
const MainNavigation: React.FC = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Function to close menus when route changes
  const handleRouteChange = useCallback((): void => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, []);

  // In App Router, we track pathname changes manually
  useEffect(() => {
    // Close menus when pathname changes
    handleRouteChange();
  }, [handleRouteChange]);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    await logout();
    router.push("/");
  };

  // Toggle mobile menu
  const toggleMobileMenu = (): void => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Close user menu if open
    if (userMenuOpen) setUserMenuOpen(false);
  };

  // Toggle user menu
  const toggleUserMenu = (): void => {
    setUserMenuOpen(!userMenuOpen);
    // Close mobile menu if open
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link className="flex items-center" href="/">
              <span className="font-bold text-primary-600 text-xl">Kaa</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
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
            <Link
              className={`font-medium text-sm ${
                pathname?.startsWith("/properties")
                  ? "text-primary-600"
                  : "text-gray-700 hover:text-primary-600"
              }`}
              href="/properties"
            >
              Find Properties
            </Link>
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
            {user?.role === "landlord" && (
              <Link
                className={`font-medium text-sm ${
                  pathname?.startsWith("/landlord")
                    ? "text-primary-600"
                    : "text-gray-700 hover:text-primary-600"
                }`}
                href="/landlord/properties"
              >
                My Properties
              </Link>
            )}

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
                    src={user.avatar || "/images/default-avatar.png"}
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
                        onClick={handleLogout}
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
              <div className="flex space-x-4">
                <Link
                  className="inline-flex items-center rounded-md border border-transparent bg-white px-4 py-2 font-medium text-primary-600 text-sm hover:bg-gray-50"
                  href="/accounts/login"
                >
                  <LogIn className="-ml-1 mr-2 h-4 w-4" />
                  Log In
                </Link>
                <Link
                  className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 font-medium text-sm text-white hover:bg-primary-700"
                  href="/accounts/register"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {user && (
              <button
                className="mr-2 rounded-md p-2 text-gray-700 hover:text-primary-600 focus:outline-none"
                onClick={toggleUserMenu}
                type="button"
              >
                <Image
                  alt={user.firstName}
                  className="h-8 w-8 rounded-full"
                  src={user.avatar || "/images/default-avatar.png"}
                />
              </button>
            )}
            <button
              className="rounded-md p-2 text-gray-700 hover:text-primary-600 focus:outline-none"
              onClick={toggleMobileMenu}
              type="button"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="bg-white shadow-lg md:hidden">
          <div className="space-y-1 pt-2 pb-4">
            <Link
              className={`block px-4 py-2 font-medium text-base ${
                pathname === "/"
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              }`}
              href="/"
            >
              <div className="flex items-center">
                <Home className="mr-3 h-5 w-5" />
                Home
              </div>
            </Link>
            <Link
              className={`block px-4 py-2 font-medium text-base ${
                pathname?.startsWith("/properties")
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              }`}
              href="/properties"
            >
              <div className="flex items-center">
                <Search className="mr-3 h-5 w-5" />
                nd Properties
              </div>
            </Link>
            <Link
              className={`block px-4 py-2 font-medium text-base ${
                pathname === "/how-it-works"
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              }`}
              href="/how-it-works"
            >
              <div className="flex items-center">
                <Info className="mr-3 h-5 w-5" />
                How It Works
              </div>
            </Link>

            {user?.role === "landlord" && (
              <Link
                className={`block px-4 py-2 font-medium text-base ${
                  pathname?.startsWith("/landlord")
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                }`}
                href="/landlord/properties"
              >
                <div className="flex items-center">
                  <Home className="mr-3 h-5 w-5" />
                  My Properties
                </div>
              </Link>
            )}

            {!user && (
              <>
                <Link
                  className="block px-4 py-2 font-medium text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  href="/accounts/login"
                >
                  <div className="flex items-center">
                    <LogIn className="mr-3 h-5 w-5" />
                    Log In
                  </div>
                </Link>
                <Link
                  className="block bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
                  href="/accounts/register"
                >
                  <div className="flex items-center justify-center">
                    <User className="mr-3 h-5 w-5" />
                    Sign Up
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      {/* Mobile user menu */}
      {userMenuOpen && user && (
        <div className="bg-white shadow-lg md:hidden">
          <div className="space-y-1 pt-2 pb-4">
            <div className="border-gray-200 border-b px-4 py-3">
              <div className="font-medium text-base text-gray-800">{`${user.firstName} ${user.lastName}`}</div>
              <div className="font-medium text-gray-500 text-sm">
                {user.email}
              </div>
            </div>
            <Link
              className="block px-4 py-2 font-medium text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              href="/account"
            >
              <div className="flex items-center">
                <User className="mr-3 h-5 w-5" />
                My Account
              </div>
            </Link>
            <Link
              className="block px-4 py-2 font-medium text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              href="/account/favorites"
            >
              <div className="flex items-center">
                <Heart className="mr-3 h-5 w-5" />
                Favorites
              </div>
            </Link>
            <Link
              className="block px-4 py-2 font-medium text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              href="/messages"
            >
              <div className="flex items-center">
                <MessageSquare className="mr-3 h-5 w-5" />
                Messages
              </div>
            </Link>
            <Link
              className="block px-4 py-2 font-medium text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              href="/account/applications"
            >
              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5" />
                Applications
              </div>
            </Link>
            <Link
              className="block px-4 py-2 font-medium text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              href="/account/settings"
            >
              <div className="flex items-center">
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </div>
            </Link>
            <ModeToggle />
            <button
              className="block w-full px-4 py-2 text-left font-medium text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              onClick={handleLogout}
              type="button"
            >
              <div className="flex items-center">
                <LogOut className="mr-3 h-5 w-5" />
                Log Out
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default MainNavigation;
