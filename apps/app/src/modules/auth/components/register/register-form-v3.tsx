"use client";

import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Separator } from "@kaa/ui/components/separator";

export function PropertyRentalSaaSRegistration() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA1OTY2OSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-60" />
      <div className="absolute top-20 left-20 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-teal-500/6 blur-3xl" />
      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
        <div className="hidden space-y-8 lg:block">
          <div className="pointer-events-none absolute inset-0 opacity-5">
            <svg className="h-full w-full" viewBox="0 0 800 600">
              <defs />
              <rect
                fill="url(#pavement)"
                height="150"
                opacity="0.2"
                width="700"
                x="50"
                y="400"
              />
              <rect
                fill="none"
                height="300"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="120"
                x="100"
                y="100"
              />
              <rect
                fill="none"
                height="320"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="140"
                x="250"
                y="80"
              />
              <rect
                fill="none"
                height="280"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="110"
                x="420"
                y="120"
              />
              <rect
                fill="none"
                height="310"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                width="130"
                x="560"
                y="90"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="110"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="135"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="160"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="185"
                y="120"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="110"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="135"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="160"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="185"
                y="160"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="260"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="285"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="310"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="335"
                y="100"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="260"
                y="140"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="285"
                y="140"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="310"
                y="140"
              />
              <rect
                fill="none"
                height="20"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="1"
                width="15"
                x="335"
                y="140"
              />
              <circle
                cx="150"
                cy="450"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="200"
                cy="460"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="300"
                cy="440"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="350"
                cy="470"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="450"
                cy="450"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="500"
                cy="465"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="600"
                cy="445"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <circle
                cx="650"
                cy="455"
                fill="currentColor"
                opacity="0.4"
                r="3"
              />
              <path
                d="M 140 450 Q 160 440 180 450"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M 290 440 Q 310 430 330 440"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M 440 450 Q 460 440 480 450"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M 590 445 Q 610 435 630 445"
                fill="none"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm">
              <Icon
                className="size-5 text-emerald-600"
                icon="solar:stars-bold"
              />
              <span className="font-medium text-emerald-700 text-sm">
                AI-Powered Property Management
              </span>
            </div>
            <h1 className="font-bold font-heading text-5xl text-slate-900 tracking-tight">
              Welcome to Kaa Kenya
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Revolutionize your rental business with intelligent automation,
              smart analytics, and seamless tenant management tailored for the
              Kenyan market.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25 shadow-lg">
                <Icon
                  className="size-6 text-white"
                  icon="solar:home-smile-bold"
                />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Smart Property Listings
                </h3>
                <p className="text-slate-600 text-sm">
                  AI-optimized listings that attract quality tenants faster
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/25">
                <Icon
                  className="size-6 text-white"
                  icon="solar:chart-square-bold"
                />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Real-Time Analytics
                </h3>
                <p className="text-slate-600 text-sm">
                  Track occupancy, revenue, and performance metrics instantly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 shadow-emerald-600/25 shadow-lg">
                <Icon
                  className="size-6 text-white"
                  icon="solar:shield-check-bold"
                />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Automated Rent Collection
                </h3>
                <p className="text-slate-600 text-sm">
                  M-Pesa integration with automatic reminders and receipts
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-4">
            <div className="-space-x-3 flex">
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/1.webp"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/3.webp"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/5.webp"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/residential-listings/portrait/2.webp"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1">
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
                <Icon
                  className="size-4 text-emerald-500 [&>path]:fill-emerald-500"
                  icon="solar:star-bold"
                />
              </div>
              <p className="text-slate-600 text-sm">
                <span className="font-semibold text-slate-900">2,500+</span>{" "}
                property owners trust Kaa
              </p>
            </div>
          </div>
        </div>
        <Card className="border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30 shadow-lg">
              <Icon className="size-8 text-white" icon="solar:home-2-bold" />
            </div>
            <CardTitle className="font-bold font-heading text-2xl text-slate-900">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Join thousands of Kenyan property owners modernizing their rental
              business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="w-full border-slate-200 hover:bg-slate-50"
                variant="outline"
              >
                <Icon className="size-5" icon="solar:login-3-bold" />
                Google
              </Button>
              <Button
                className="w-full border-slate-200 hover:bg-slate-50"
                variant="outline"
              >
                <Icon className="size-5" icon="solar:smartphone-bold" />
                M-Pesa
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  Or continue with email
                </span>
              </div>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700" htmlFor="firstName">
                    First Name
                  </Label>
                  <Input
                    className="border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500"
                    id="firstName"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700" htmlFor="lastName">
                    Last Name
                  </Label>
                  <Input
                    className="border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500"
                    id="lastName"
                    placeholder="Kamau"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700" htmlFor="email">
                  Email Address
                </Label>
                <div className="relative">
                  <Icon
                    className="-translate-y-1/2 absolute top-1/2 left-3 size-5 text-slate-400"
                    icon="solar:letter-bold"
                  />
                  <Input
                    className="border-slate-200 bg-white pl-10 focus:border-emerald-500 focus:ring-emerald-500"
                    id="email"
                    placeholder="john@example.com"
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700" htmlFor="phone">
                  Phone Number
                </Label>
                <div className="relative">
                  <Icon
                    className="-translate-y-1/2 absolute top-1/2 left-3 size-5 text-slate-400"
                    icon="solar:phone-bold"
                  />
                  <Input
                    className="border-slate-200 bg-white pl-10 focus:border-emerald-500 focus:ring-emerald-500"
                    id="phone"
                    placeholder="+254 712 345 678"
                    type="tel"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700" htmlFor="password">
                  Password
                </Label>
                <div className="relative">
                  <Icon
                    className="-translate-y-1/2 absolute top-1/2 left-3 size-5 text-slate-400"
                    icon="solar:lock-password-bold"
                  />
                  <Input
                    className="border-slate-200 bg-white pl-10 focus:border-emerald-500 focus:ring-emerald-500"
                    id="password"
                    placeholder="Create a strong password"
                    type="password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">I am a</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="h-12 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    type="button"
                    variant="outline"
                  >
                    <Icon className="mr-2 size-5" icon="solar:home-2-bold" />
                    Landlord
                  </Button>
                  <Button
                    className="h-12 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    type="button"
                    variant="outline"
                  >
                    <Icon className="mr-2 size-5" icon="solar:user-bold" />
                    Tenant
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  className="border-slate-300 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                  id="terms"
                />
                <Label
                  className="font-normal text-slate-600 text-sm"
                  htmlFor="terms"
                >
                  I agree to the{" "}
                  <span className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-700">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-700">
                    Privacy Policy
                  </span>
                </Label>
              </div>
              <Button
                className="h-12 w-full bg-linear-to-r from-emerald-500 to-teal-500 font-semibold text-base shadow-emerald-500/25 shadow-lg hover:from-emerald-600 hover:to-teal-600"
                size="lg"
              >
                <Icon className="size-5" icon="solar:rocket-2-bold" />
                Create Account
              </Button>
            </form>
            <div className="text-center text-sm">
              <span className="text-slate-500">Already have an account?</span>
              <Button
                className="px-1 font-semibold text-emerald-600 hover:text-emerald-700"
                variant="link"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
