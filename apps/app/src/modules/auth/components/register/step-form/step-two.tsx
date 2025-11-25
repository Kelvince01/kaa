"use client";

import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { PasswordStrengthIndicator } from "./password-strength-indicator";
import type { FormData } from "./registration-form";

type StepTwoProps = {
  formData: FormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof FormData, value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function StepTwo({
  formData,
  errors,
  onInputChange,
  onPrevious,
  onNext,
}: StepTwoProps) {
  return (
    <Card className="border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-xl">
      <CardContent className="space-y-6 p-8">
        <div className="space-y-2">
          <Label className="text-slate-700" htmlFor="password">
            Create Password
          </Label>
          <div className="relative">
            <Icon
              className="-translate-y-1/2 absolute top-1/2 left-3 size-5 text-slate-400"
              icon="solar:lock-password-bold"
            />
            <Input
              className={`border-slate-200 bg-white pl-10 focus:border-emerald-500 focus:ring-emerald-500 ${
                errors.password ? "border-red-500" : ""
              }`}
              id="password"
              onChange={(e) => onInputChange("password", e.target.value)}
              placeholder="Create a strong password"
              type="password"
              value={formData.password}
            />
          </div>
          <PasswordStrengthIndicator password={formData.password} />
          {errors.password && (
            <p className="text-red-500 text-xs">{errors.password}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-slate-700">I am a</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`flex h-12 items-center justify-center gap-2 rounded-lg border-2 px-4 font-medium transition-all ${
                formData.role === "landlord"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
              onClick={() => onInputChange("role", "landlord")}
              type="button"
            >
              <Icon className="size-5" icon="solar:home-2-bold" />
              Landlord
            </button>
            <button
              className={`flex h-12 items-center justify-center gap-2 rounded-lg border-2 px-4 font-medium transition-all ${
                formData.role === "tenant"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
              onClick={() => onInputChange("role", "tenant")}
              type="button"
            >
              <Icon className="size-5" icon="solar:user-bold" />
              Tenant
            </button>
          </div>
          {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
        </div>

        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Icon
            className="mt-0.5 size-5 shrink-0 text-blue-600"
            icon="solar:info-circle-bold"
          />
          <div>
            <p className="font-medium text-blue-900 text-sm">Security Tip</p>
            <p className="mt-1 text-blue-700 text-sm">
              Use a mix of uppercase, lowercase, numbers, and symbols for a
              strong password.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            className="h-12 flex-1 border-slate-200 bg-transparent"
            onClick={onPrevious}
            variant="outline"
          >
            <Icon className="mr-2 size-5" icon="solar:arrow-left-bold" />
            Back
          </Button>
          <Button
            className="h-12 flex-1 bg-linear-to-r from-emerald-500 to-teal-500 font-semibold hover:from-emerald-600 hover:to-teal-600"
            onClick={onNext}
          >
            Continue
            <Icon className="ml-2 size-5" icon="solar:arrow-right-bold" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
