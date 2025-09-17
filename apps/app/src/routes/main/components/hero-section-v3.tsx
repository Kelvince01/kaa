"use client";

import { Clock, Home, Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function HeroSectionV3() {
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
    <section className="relative bg-gradient-to-r from-primary/70 to-primary/90 px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center md:w-1/2 md:text-left">
          <h1 className="mb-4 font-extrabold text-4xl tracking-tight md:text-5xl">
            Find Your Perfect Rental Home
          </h1>
          <p className="mb-8 text-gray-100 text-xl">
            Browse thousands of properties and connect directly with landlords.
            No middleman, no fees.
          </p>

          {/* Search form */}
          <form
            className="flex flex-col rounded-lg bg-white p-2 shadow-lg sm:flex-row"
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

          <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
            {/* <button
								type="button"
								onClick={() => router.push("/properties")}
								className="bg-white text-primary-700 py-3 px-6 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors"
							>
								Search Properties
							</button>
							<button
								type="button"
								onClick={() => router.push("/how-it-works")}
								className="bg-transparent border-2 border-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-white/10 transition-colors"
							>
								How It Works
							</button>  */}
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
              href="/register?role=landlord"
            >
              <Users className="mr-2 h-5 w-5" />
              List Your Property
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 bottom-0 hidden h-full w-1/3 md:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent to-primary/80" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          {/* biome-ignore lint/a11y/noSvgWithoutTitle: false positive */}
          <svg
            height="100%"
            viewBox="0 0 400 400"
            width="100%"
            xmlns="http://www.w3.org/2000/svg"
          >
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
    </section>
  );
}
