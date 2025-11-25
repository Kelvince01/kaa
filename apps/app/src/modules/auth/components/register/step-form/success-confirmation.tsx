"use client";

import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import type { FormData } from "./registration-form";

type SuccessConfirmationProps = {
  formData: FormData;
};

export function SuccessConfirmation({ formData }: SuccessConfirmationProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 p-4">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-20 left-20 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-xl">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30 shadow-lg">
            <Icon
              className="size-10 text-white"
              icon="solar:check-circle-bold"
            />
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-3xl text-slate-900">
              Welcome to Kaa!
            </h2>
            <p className="text-slate-600">
              Your account has been created successfully
            </p>
          </div>

          <div className="space-y-2 rounded-lg bg-slate-50 p-4 text-left">
            <p className="text-slate-600 text-sm">
              <span className="font-medium text-slate-900">Account:</span>{" "}
              {formData.email}
            </p>
            <p className="text-slate-600 text-sm">
              <span className="font-medium text-slate-900">Role:</span>{" "}
              <span className="capitalize">{formData.role}</span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-slate-900 text-sm">Next Steps:</p>
            <ol className="space-y-2 text-left text-slate-600 text-sm">
              <li className="flex gap-2">
                <span className="font-bold text-emerald-600">1.</span>
                <span>Verify your email address (check your inbox)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-600">2.</span>
                <span>Complete your {formData.role} profile</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-600">3.</span>
                <span>Start managing your properties or find rentals</span>
              </li>
            </ol>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              className="h-12 flex-1 border-slate-200 bg-transparent"
              variant="outline"
            >
              Go to Dashboard
            </Button>
            <Button className="h-12 flex-1 bg-linear-to-r from-emerald-500 to-teal-500 font-semibold hover:from-emerald-600 hover:to-teal-600">
              Verify Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
