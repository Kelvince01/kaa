"use client";

import { Icon } from "@iconify/react";
import { Badge } from "@kaa/ui/components/badge";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { Clock, Home, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function HeroSectionV4() {
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
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/80 to-emerald-800/80" />
      <div className="relative h-[700px] md:h-[800px]">
        <Image
          alt="Modern apartment living room showcasing AI-powered property management"
          className="mix-blend-color-burn"
          layout="fill"
          objectFit="cover"
          priority
          src="/images/hero-home.jpg"
        />

        {/* Content Container */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left Column - Hero Content */}
              <div className="space-y-8 text-white">
                {/* AI Badge */}
                <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800">
                  <Icon
                    className="mr-2 h-4 w-4"
                    icon="material-symbols:auto-awesome"
                  />
                  AI-Powered Property Management
                </Badge>

                {/* Main Heading */}
                <h1 className="font-bold font-heading text-4xl leading-tight md:text-5xl lg:text-6xl">
                  Revolutionize Your Property Rental Business in Kenya
                </h1>

                {/* Description */}
                <p className="text-lg leading-relaxed opacity-90 md:text-xl">
                  Harness the power of AI to automate tenant screening, optimize
                  rent pricing, and manage your properties like never before.
                  Built specifically for the Kenyan rental market.
                </p>

                {/* Search Form */}
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
                      placeholder="City, postcode, or area in Kenya"
                      type="text"
                      value={searchLocation}
                    />
                  </div>
                  <button
                    className="mt-2 w-full rounded-md bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:mt-0 sm:w-auto"
                    type="submit"
                  >
                    Search
                  </button>
                </form>

                {/* Quick Links */}
                <div className="flex flex-wrap items-center gap-4">
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

              {/* Right Column - Dashboard Preview */}
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 rotate-6 transform rounded-3xl bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-20" />
                <Card className="relative border-emerald-200 bg-white/95 shadow-2xl backdrop-blur-md">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-800 text-xl">
                          AI Dashboard
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          Live
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-emerald-50 p-4">
                          <div className="mb-2 flex items-center space-x-2">
                            <Icon
                              className="h-5 w-5 text-emerald-600"
                              icon="material-symbols:trending-up"
                            />
                            <span className="text-emerald-700 text-sm">
                              Occupancy Rate
                            </span>
                          </div>
                          <div className="font-bold text-2xl text-emerald-800">
                            94%
                          </div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-4">
                          <div className="mb-2 flex items-center space-x-2">
                            <Icon
                              className="h-5 w-5 text-emerald-600"
                              icon="material-symbols:payments"
                            />
                            <span className="text-emerald-700 text-sm">
                              Monthly Revenue
                            </span>
                          </div>
                          <div className="font-bold text-2xl text-emerald-800">
                            KES 2.4M
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-700 text-sm">
                            AI Tenant Screening
                          </span>
                          <span className="font-medium text-emerald-800 text-sm">
                            Active
                          </span>
                        </div>
                        <Progress className="h-2" value={85} />
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-700 text-sm">
                            Rent Optimization
                          </span>
                          <span className="font-medium text-emerald-800 text-sm">
                            Running
                          </span>
                        </div>
                        <Progress className="h-2" value={92} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-0 bottom-0 hidden h-full w-1/3 lg:block">
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
