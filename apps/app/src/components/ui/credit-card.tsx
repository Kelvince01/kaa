"use client";

import { Card } from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";

import { cn } from "@kaa/ui/lib/utils";
import { CreditCard as CreditCardIcon, Lock } from "lucide-react";
import { motion, motionValue, spring, transform } from "motion/react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";

// Enhanced Card vendor SVG icons with better styling
const CardIcons = {
  visa: (
    <svg className="h-6 w-10" viewBox="0 0 40 24">
      <rect fill="#1A1F71" height="24" rx="4" width="40" />
      <text
        fill="white"
        fontFamily="Arial, sans-serif"
        fontSize="8"
        fontWeight="bold"
        textAnchor="middle"
        x="20"
        y="15"
      >
        VISA
      </text>
    </svg>
  ),
  mastercard: (
    <svg className="h-6 w-10" viewBox="0 0 40 24">
      <rect fill="#000" height="24" rx="4" width="40" />
      <circle cx="15" cy="12" fill="#EB001B" r="7" />
      <circle cx="25" cy="12" fill="#FF5F00" r="7" />
    </svg>
  ),
  amex: (
    <svg className="h-6 w-10" viewBox="0 0 40 24">
      <rect fill="#006FCF" height="24" rx="4" width="40" />
      <text
        fill="white"
        fontFamily="Arial, sans-serif"
        fontSize="6"
        fontWeight="bold"
        textAnchor="middle"
        x="20"
        y="15"
      >
        AMEX
      </text>
    </svg>
  ),
  discover: (
    <svg className="h-6 w-10" viewBox="0 0 40 24">
      <rect fill="#FF6000" height="24" rx="4" width="40" />
      <text
        fill="white"
        fontFamily="Arial, sans-serif"
        fontSize="5"
        fontWeight="bold"
        textAnchor="middle"
        x="20"
        y="15"
      >
        DISCOVER
      </text>
    </svg>
  ),
  generic: <CreditCardIcon className="h-6 w-10 opacity-60" />,
};

// Card style variants with improved base style
export type CardStyle =
  | "base"
  | "shiny-silver"
  | "amex-green"
  | "amex-black"
  | "metal";

const cardStyles: Record<CardStyle, string> = {
  // Base style matching shadcn card (white/clean)
  base: "bg-card border text-card-foreground shadow-sm",
  "shiny-silver":
    "bg-gradient-to-br from-gray-300 via-gray-100 to-gray-300 border-gray-400 text-gray-800 shadow-2xl",
  "amex-green":
    "bg-gradient-to-br from-green-700 via-green-600 to-green-800 border-green-500 text-white shadow-xl",
  "amex-black":
    "bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-600 text-white shadow-2xl",
  metal:
    "bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700 border-slate-400 text-white shadow-2xl backdrop-blur-sm",
};

const cardBackStyles: Record<CardStyle, string> = {
  base: "bg-muted border text-muted-foreground shadow-sm",
  "shiny-silver":
    "bg-gradient-to-br from-gray-400 via-gray-200 to-gray-400 border-gray-500 text-gray-800",
  "amex-green":
    "bg-gradient-to-br from-green-800 via-green-700 to-green-900 border-green-600 text-white",
  "amex-black":
    "bg-gradient-to-br from-black via-gray-900 to-black border-gray-700 text-white",
  metal:
    "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 border-slate-500 text-white",
};

export type CreditCardValue = {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

export type CreditCardProps = {
  value?: CreditCardValue;
  onChange?: (value: CreditCardValue) => void;
  onValidationChange?: (isValid: boolean, errors: ValidationErrors) => void;
  className?: string;
  ref?: React.RefObject<CreditCardRef>;
  cvvLabel?: "CCV" | "CVC";
  cardStyle?: CardStyle;
  showVendor?: boolean;
};

export type CreditCardRef = {
  validate: () => boolean;
  isValid: () => boolean;
  focus: () => void;
  reset: () => void;
  getErrors: () => ValidationErrors;
};

type ValidationErrors = {
  cardholderName?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  general?: string;
};

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = matches?.[0] || "";
  const parts: string[] = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(" ");
  }
  return v;
};

const getCardType = (number: string): keyof typeof CardIcons => {
  const cleanNumber = number.replace(/\s/g, "");

  // Visa: starts with 4
  if (cleanNumber.startsWith("4")) return "visa";

  // Mastercard: starts with 5 or 2221-2720
  if (
    cleanNumber.startsWith("5") ||
    (cleanNumber.startsWith("2") &&
      Number.parseInt(cleanNumber.substring(0, 4), 10) >= 2221 &&
      Number.parseInt(cleanNumber.substring(0, 4), 10) <= 2720)
  ) {
    return "mastercard";
  }

  // American Express: starts with 34 or 37
  if (cleanNumber.startsWith("34") || cleanNumber.startsWith("37"))
    return "amex";

  // Discover: starts with 6011, 622126-622925, 644-649, 65
  if (
    cleanNumber.startsWith("6011") ||
    cleanNumber.startsWith("65") ||
    cleanNumber.startsWith("644") ||
    cleanNumber.startsWith("645") ||
    cleanNumber.startsWith("646") ||
    cleanNumber.startsWith("647") ||
    cleanNumber.startsWith("648") ||
    cleanNumber.startsWith("649")
  ) {
    return "discover";
  }

  return "generic";
};

const validateCreditCard = (
  value: CreditCardValue,
  cvvLabel: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate cardholder name
  if (!value.cardholderName?.trim()) {
    errors.cardholderName = "Cardholder name is required";
  } else if (value.cardholderName.trim().length < 2) {
    errors.cardholderName = "Name must be at least 2 characters";
  }

  // Validate card number
  const cleanCardNumber = value.cardNumber?.replace(/\s/g, "") || "";
  if (!cleanCardNumber) {
    errors.cardNumber = "Card number is required";
  } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
    errors.cardNumber = "Invalid card number length";
    // biome-ignore lint/performance/useTopLevelRegex: ignore
  } else if (!/^\d+$/.test(cleanCardNumber)) {
    errors.cardNumber = "Card number must contain only digits";
  }

  // Validate expiry month
  if (!value.expiryMonth?.trim()) {
    errors.expiryMonth = "Expiry month is required";
  }

  // Validate expiry year
  if (!value.expiryYear?.trim()) {
    errors.expiryYear = "Expiry year is required";
  } else if (value.expiryMonth && value.expiryYear) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const expiryYear = Number.parseInt(value.expiryYear, 10);
    const expiryMonth = Number.parseInt(value.expiryMonth, 10);

    if (
      expiryYear < currentYear ||
      (expiryYear === currentYear && expiryMonth < currentMonth)
    ) {
      errors.expiryYear = "Card has expired";
    }
  }

  // Validate CVV
  const cardType = getCardType(value.cardNumber || "");
  const expectedCvvLength = cardType === "amex" ? 4 : 3;
  if (!value.cvv?.trim()) {
    errors.cvv = `${cvvLabel} is required`;
  } else if (value.cvv.length !== expectedCvvLength) {
    errors.cvv = `${cvvLabel} must be ${expectedCvvLength} digits`;
    // biome-ignore lint/performance/useTopLevelRegex: ignore
  } else if (!/^\d+$/.test(value.cvv)) {
    errors.cvv = `${cvvLabel} must contain only digits`;
  }

  return errors;
};

function CreditCard({
  value,
  onChange,
  onValidationChange,
  className,
  ref,
  cvvLabel = "CVC",
  cardStyle = "base",
  showVendor = true,
}: CreditCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // 3D hover effect using motion
  const x = motionValue(0);
  const y = motionValue(0);
  const rotateX = spring(transform(y.get(), [-0.5, 0.5], [15, -15]));
  const rotateY = spring(transform(x.get(), [-0.5, 0.5], [-15, 15]));

  // Internal refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const cardholderInputRef = useRef<HTMLInputElement>(null);
  const cardNumberInputRef = useRef<HTMLInputElement>(null);
  const cvvInputRef = useRef<HTMLInputElement>(null);

  const currentValue = value || {
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  };

  const validateAndUpdate = (newValue: CreditCardValue) => {
    const validationErrors = validateCreditCard(newValue, cvvLabel);
    setErrors(validationErrors);

    const isValid = Object.keys(validationErrors).length === 0;
    onValidationChange?.(isValid, validationErrors);

    return isValid;
  };

  const handleInputChange = (
    field: keyof CreditCardValue,
    newValue: string
  ) => {
    const updatedValue = { ...currentValue, [field]: newValue };
    onChange?.(updatedValue);
    validateAndUpdate(updatedValue);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 19) {
      handleInputChange("cardNumber", formatted);
    }
  };

  const handleCvvFocus = () => {
    setIsFlipped(true);
    setFocusedField("cvv");
  };

  const handleCvvBlur = () => {
    setIsFlipped(false);
    setFocusedField(null);
  };

  const handleFieldFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleValidate = () => {
    const isValid = validateAndUpdate(currentValue);

    if (!isValid) {
      if (errors.cardholderName) {
        cardholderInputRef.current?.focus();
      } else if (errors.cardNumber) {
        cardNumberInputRef.current?.focus();
      } else if (errors.cvv) {
        cvvInputRef.current?.focus();
      }
    }

    return isValid;
  };

  const handleReset = () => {
    setErrors({});
    setFocusedField(null);
    setIsFlipped(false);
    onChange?.({
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    });
  };

  const handleFocus = () => {
    cardholderInputRef.current?.focus();
  };

  const getErrors = () => errors;

  // React 19: Expose imperative methods via ref callback
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    if (ref && "current" in ref) {
      ref.current = {
        validate: handleValidate,
        isValid: () =>
          Object.keys(validateCreditCard(currentValue, cvvLabel)).length === 0,
        focus: handleFocus,
        reset: handleReset,
        getErrors,
      };
    }
  }, [ref, currentValue, cvvLabel]);

  const cardType = getCardType(currentValue.cardNumber);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      value: month.toString().padStart(2, "0"),
      label: month.toString().padStart(2, "0"),
    };
  });

  // Get chip color based on card style
  const getChipColor = () => {
    switch (cardStyle) {
      case "base":
        return "bg-yellow-500";
      case "shiny-silver":
        return "bg-yellow-600";
      case "amex-green":
      case "amex-black":
        return "bg-yellow-400";
      case "metal":
        return "bg-yellow-300";
      default:
        return "bg-yellow-400";
    }
  };

  return (
    <div className={cn("w-full max-w-sm py-2", className)} ref={containerRef}>
      {/* Card Container with 3D effects using Tailwind CSS utilities */}
      <div className="relative mb-6 h-56 [perspective:1000px]">
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          className="relative h-full w-full [transform-style:preserve-3d]"
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          style={{
            rotateX: rotateX as any,
            rotateY: isFlipped ? 180 : (rotateY as any),
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front of Card */}
          <Card
            className={cn(
              "absolute inset-0 flex h-full w-full flex-col justify-between p-6 shadow-xl [backface-visibility:hidden]",
              cardStyles[cardStyle]
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className={cn("h-8 w-12 rounded shadow-md", getChipColor())}
              />
              {/* Vendor logo moved to top right for now, will be repositioned */}
            </div>

            <div className="space-y-4">
              <div className="font-bold font-mono text-xl tracking-wider">
                {currentValue.cardNumber || "•••• •••• •••• ••••"}
              </div>

              {/* Bottom row: cardholder - expires - vendor logo */}
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <div className="font-medium text-xs uppercase opacity-70">
                    Card Holder
                  </div>
                  <div className="font-bold text-sm">
                    {currentValue.cardholderName || "YOUR NAME"}
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="font-medium text-xs uppercase opacity-70">
                    Expires
                  </div>
                  <div className="font-bold text-sm">
                    {currentValue.expiryMonth && currentValue.expiryYear
                      ? `${currentValue.expiryMonth}/${currentValue.expiryYear.slice(-2)}`
                      : "MM/YY"}
                  </div>
                </div>
                <div className="flex flex-1 justify-end">
                  {showVendor && CardIcons[cardType]}
                </div>
              </div>
            </div>
          </Card>

          {/* Back of Card */}
          <Card
            className={cn(
              "absolute inset-0 flex h-full w-full flex-col justify-between p-6 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]",
              cardBackStyles[cardStyle]
            )}
          >
            <div className="mt-4 h-12 w-full bg-black shadow-inner" />

            <div className="flex items-center justify-end space-x-4">
              <div className="text-right">
                <div className="font-medium text-xs uppercase opacity-70">
                  {cvvLabel}
                </div>
                <div className="rounded bg-white px-3 py-1 text-center font-bold font-mono text-black">
                  {currentValue.cvv || "•••"}
                </div>
              </div>
              <Lock className="h-6 w-6 opacity-60" />
            </div>

            <div className="text-center font-medium text-xs opacity-60">
              This card is protected by advanced security features
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            className="mb-2 block font-medium text-sm"
            htmlFor="cardholderName"
          >
            Cardholder Name
          </label>
          <Input
            className={cn(
              "transition-all duration-200",
              focusedField === "cardholderName" && "ring-2 ring-primary",
              errors.cardholderName && "border-destructive"
            )}
            onBlur={handleFieldBlur}
            onChange={(e) =>
              handleInputChange("cardholderName", e.target.value.toUpperCase())
            }
            onFocus={() => handleFieldFocus("cardholderName")}
            placeholder="John Doe"
            ref={cardholderInputRef}
            type="text"
            value={currentValue.cardholderName}
          />
          {errors.cardholderName && (
            <p className="mt-1 text-destructive text-xs">
              {errors.cardholderName}
            </p>
          )}
        </div>

        <div>
          <label
            className="mb-2 block font-medium text-sm"
            htmlFor="cardNumber"
          >
            Card Number
          </label>
          <Input
            className={cn(
              "font-mono transition-all duration-200",
              focusedField === "cardNumber" && "ring-2 ring-primary",
              errors.cardNumber && "border-destructive"
            )}
            maxLength={19}
            onBlur={handleFieldBlur}
            onChange={handleCardNumberChange}
            onFocus={() => handleFieldFocus("cardNumber")}
            placeholder="1234 5678 9012 3456"
            ref={cardNumberInputRef}
            type="text"
            value={currentValue.cardNumber}
          />
          {errors.cardNumber && (
            <p className="mt-1 text-destructive text-xs">{errors.cardNumber}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="expiryMonth"
            >
              Month
            </label>
            <Select
              onValueChange={(value) => handleInputChange("expiryMonth", value)}
              value={currentValue.expiryMonth}
            >
              <SelectTrigger
                className={cn(
                  "transition-all duration-200",
                  focusedField === "expiryMonth" && "ring-2 ring-primary",
                  errors.expiryMonth && "border-destructive"
                )}
              >
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.expiryMonth && (
              <p className="mt-1 text-destructive text-xs">
                {errors.expiryMonth}
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="expiryYear"
            >
              Year
            </label>
            <Select
              onValueChange={(value) => handleInputChange("expiryYear", value)}
              value={currentValue.expiryYear}
            >
              <SelectTrigger
                className={cn(
                  "transition-all duration-200",
                  focusedField === "expiryYear" && "ring-2 ring-primary",
                  errors.expiryYear && "border-destructive"
                )}
              >
                <SelectValue placeholder="YYYY" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.expiryYear && (
              <p className="mt-1 text-destructive text-xs">
                {errors.expiryYear}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="cvv">
              {cvvLabel}
            </label>
            <Input
              className={cn(
                "text-center font-mono transition-all duration-200",
                focusedField === "cvv" && "ring-2 ring-primary",
                errors.cvv && "border-destructive"
              )}
              maxLength={cardType === "amex" ? 4 : 3}
              onBlur={handleCvvBlur}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= (cardType === "amex" ? 4 : 3)) {
                  handleInputChange("cvv", value);
                }
              }}
              onFocus={handleCvvFocus}
              placeholder="123"
              ref={cvvInputRef}
              type="text"
              value={currentValue.cvv}
            />
            {errors.cvv && (
              <p className="mt-1 text-destructive text-xs">{errors.cvv}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

CreditCard.displayName = "CreditCard";

export { CreditCard };
