"use client";

import { Clock, Home, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function HeroSectionV2() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [searchLocation, setSearchLocation] = useState<string>("");

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();

    if (searchLocation.trim()) {
      router.push(`/properties?location=${encodeURIComponent(searchLocation)}`);
    }
  };

  // Use useEffect to run client-side code
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Return null on server render to avoid hydration issues
  }

  return (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-primary/80 opacity-90" />
      <div className="relative h-[600px] md:h-[700px]">
        <Image
          alt="Modern apartment living room"
          className="mix-blend-color-burn"
          fill
          priority
          sizes="100vw"
          src="/images/hero-home.jpg"
          style={{
            objectFit: "cover",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4">
            {/* max-w-3xl */}
            <div className="flex flex-col items-center justify-center">
              <h1 className="mb-6 font-bold text-4xl text-white md:text-5xl lg:text-6xl">
                Find Your Perfect Home
              </h1>
              <p className="mb-8 text-white text-xl opacity-90 md:text-2xl">
                Browse thousands of properties from trusted landlords across the
                County
              </p>

              {/* Search form */}
              <form
                className="search-container flex w-5/12 flex-col rounded-lg bg-white p-2 shadow-lg sm:w-10/12 sm:flex-row"
                onSubmit={handleSearch}
              >
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full border-0 py-3 pr-3 pl-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0"
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="City, postcode, or area"
                    type="text"
                    value={searchLocation}
                  />
                </div>
                <button
                  className="mt-2 w-full rounded-md bg-primary/60 px-6 py-3 font-medium text-white hover:bg-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 sm:mt-0 sm:w-auto"
                  type="submit"
                >
                  Search
                </button>
              </form>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex items-center text-white hover:underline"
                  href="/properties"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Browse All Properties
                </Link>
                <Link
                  className="inline-flex items-center text-white hover:underline"
                  href="/how-it-works"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  How It Works
                </Link>
                <Link
                  className="inline-flex items-center text-white hover:underline"
                  href="/auth/register?role=landlord"
                >
                  <Users className="mr-2 h-5 w-5" />
                  List Your Property
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-0 bottom-0 hidden h-full w-full lg:block">
          <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent to-emerald-600/20" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <svg
              height="100%"
              viewBox="0 0 400 400"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Decorative grid pattern overlay</title>
              <defs>
                <pattern
                  height="40"
                  id="grid"
                  patternUnits="userSpaceOnUse"
                  width="40"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect fill="url(#grid)" height="100%" width="100%" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
