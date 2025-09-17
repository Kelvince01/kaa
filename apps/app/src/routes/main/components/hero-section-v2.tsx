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
          layout="fill"
          objectFit="cover"
          priority
          src="/images/hero-home.jpg"
        />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="mb-6 font-bold text-4xl text-white md:text-5xl lg:text-6xl">
                Find Your Perfect Home
              </h1>
              <p className="mb-8 text-white text-xl opacity-90 md:text-2xl">
                Browse thousands of properties from trusted landlords across the
                UK
              </p>

              {/* Search form */}
              <form
                className="search-container flex flex-col rounded-lg bg-white p-2 shadow-lg sm:flex-row"
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
                  href="/accounts/register?role=landlord"
                >
                  <Users className="mr-2 h-5 w-5" />
                  List Your Property
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
