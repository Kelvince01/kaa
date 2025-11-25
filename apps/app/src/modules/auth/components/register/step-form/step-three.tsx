"use client";

import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Label } from "@kaa/ui/components/label";
import type { FormData } from "./registration-form";

type StepThreeProps = {
  formData: FormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof FormData, value: boolean) => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function StepThree({
  formData,
  errors,
  onInputChange,
  onPrevious,
  onSubmit,
  isLoading,
}: StepThreeProps) {
  return (
    <Card className="border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-xl">
      <CardContent className="space-y-6 p-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">
            Review Your Information
          </h3>

          <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-slate-600 text-xs uppercase tracking-wide">
                Name
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {formData.firstName} {formData.lastName}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-xs uppercase tracking-wide">
                Email
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {formData.email}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-xs uppercase tracking-wide">
                Phone
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {formData.phone}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-xs uppercase tracking-wide">
                Account Type
              </p>
              <p className="mt-1 font-medium text-slate-900 capitalize">
                {formData.role}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={formData.agreeToTerms}
              className={`mt-1 ${errors.agreeToTerms ? "border-red-500" : "border-slate-300"}`}
              id="terms"
              onCheckedChange={(checked) =>
                onInputChange("agreeToTerms", checked === true)
              }
            />
            <Label
              className="cursor-pointer font-normal text-slate-600 text-sm"
              htmlFor="terms"
            >
              I agree to the{" "}
              <span className="font-medium text-emerald-600 hover:text-emerald-700">
                Terms of Service
              </span>
              ,{" "}
              <span className="font-medium text-emerald-600 hover:text-emerald-700">
                Privacy Policy
              </span>
              , and confirm I am 18 or older
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-xs">{errors.agreeToTerms}</p>
          )}
        </div>

        <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <Icon
            className="mt-0.5 size-5 shrink-0 text-emerald-600"
            icon="solar:shield-check-bold"
          />
          <div>
            <p className="font-medium text-emerald-900 text-sm">
              Your data is secure
            </p>
            <p className="mt-1 text-emerald-700 text-sm">
              All information is encrypted and protected with industry-standard
              security.
            </p>
          </div>
        </div>

        {errors.submit && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <Icon
              className="mt-0.5 size-5 shrink-0 text-red-600"
              icon="solar:close-circle-bold"
            />
            <div>
              <p className="font-medium text-red-900 text-sm">
                {errors.submit}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            className="h-12 flex-1 border-slate-200 bg-transparent"
            disabled={isLoading}
            onClick={onPrevious}
            variant="outline"
          >
            <Icon className="mr-2 size-5" icon="solar:arrow-left-bold" />
            Back
          </Button>
          <Button
            className="h-12 flex-1 bg-linear-to-r from-emerald-500 to-teal-500 font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            onClick={onSubmit}
          >
            {isLoading ? (
              <>
                <Icon
                  className="mr-2 size-5 animate-spin"
                  icon="solar:atom-bold"
                />
                Creating Account...
              </>
            ) : (
              <>
                <Icon className="mr-2 size-5" icon="solar:rocket-2-bold" />
                Create Account
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
