"use client";

import { useState } from "react";
import { StepOne } from "./step-one";
import { StepThree } from "./step-three";
import { StepTwo } from "./step-two";
import { SuccessConfirmation } from "./success-confirmation";

export type UserRole = "landlord" | "tenant" | null;

export type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  agreeToTerms: boolean;
};

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: null,
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
        newErrors.email = "Valid email is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    } else if (step === 2) {
      if (formData.password.length < 8)
        newErrors.password = "Password must be at least 8 characters";
      if (!formData.role) newErrors.role = "Please select your role";
    } else if (step === 3 && !formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production, replace with actual API call:
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      setIsSuccess(true);
    } catch (error) {
      console.error("[v0] Registration error:", error);
      setErrors({ submit: "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return <SuccessConfirmation formData={formData} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 p-4">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-20 left-20 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-8 flex gap-3">
          {[1, 2, 3].map((step) => (
            <div className="flex flex-1 items-center" key={step}>
              <div
                className={`h-2 w-full rounded-full transition-colors ${
                  currentStep >= step ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            </div>
          ))}
        </div>

        <div className="mb-8 text-center">
          <p className="font-medium text-emerald-600 text-sm">
            Step {currentStep} of 3
          </p>
          <h1 className="mt-2 font-bold text-3xl text-slate-900">
            {currentStep === 1 && "Create Your Account"}
            {currentStep === 2 && "Secure Your Account"}
            {currentStep === 3 && "Review & Confirm"}
          </h1>
        </div>

        {currentStep === 1 && (
          <StepOne
            errors={errors}
            formData={formData}
            onInputChange={handleInputChange}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <StepTwo
            errors={errors}
            formData={formData}
            onInputChange={handleInputChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}

        {currentStep === 3 && (
          <StepThree
            errors={errors}
            formData={formData}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
