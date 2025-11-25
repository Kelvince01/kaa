"use client";

import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Separator } from "@kaa/ui/components/separator";
import type { FormData } from "./registration-form";

type StepOneProps = {
  formData: FormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof FormData, value: string) => void;
  onNext: () => void;
};

export function StepOne({
  formData,
  errors,
  onInputChange,
  onNext,
}: StepOneProps) {
  return (
    <Card className="border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-xl">
      <CardContent className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="w-full border-slate-200 bg-transparent hover:bg-slate-50"
            variant="outline"
          >
            <Icon className="mr-2 size-5" icon="solar:login-3-bold" />
            Google
          </Button>
          <Button
            className="w-full border-slate-200 bg-transparent hover:bg-slate-50"
            variant="outline"
          >
            <Icon className="mr-2 size-5" icon="solar:smartphone-bold" />
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
                className={`border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500 ${
                  errors.firstName ? "border-red-500" : ""
                }`}
                id="firstName"
                onChange={(e) => onInputChange("firstName", e.target.value)}
                placeholder="John"
                value={formData.firstName}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700" htmlFor="lastName">
                Last Name
              </Label>
              <Input
                className={`border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500 ${
                  errors.lastName ? "border-red-500" : ""
                }`}
                id="lastName"
                onChange={(e) => onInputChange("lastName", e.target.value)}
                placeholder="Kamau"
                value={formData.lastName}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs">{errors.lastName}</p>
              )}
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
                className={`border-slate-200 bg-white pl-10 focus:border-emerald-500 focus:ring-emerald-500 ${
                  errors.email ? "border-red-500" : ""
                }`}
                id="email"
                onChange={(e) => onInputChange("email", e.target.value)}
                placeholder="john@example.com"
                type="email"
                value={formData.email}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
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
                className={`border-slate-200 bg-white pl-10 focus:border-emerald-500 focus:ring-emerald-500 ${
                  errors.phone ? "border-red-500" : ""
                }`}
                id="phone"
                onChange={(e) => onInputChange("phone", e.target.value)}
                placeholder="+254 712 345 678"
                type="tel"
                value={formData.phone}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs">{errors.phone}</p>
            )}
          </div>

          <Button
            className="h-12 w-full bg-linear-to-r from-emerald-500 to-teal-500 font-semibold text-base hover:from-emerald-600 hover:to-teal-600"
            onClick={onNext}
          >
            Continue to Next Step
            <Icon className="ml-2 size-5" icon="solar:arrow-right-bold" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
