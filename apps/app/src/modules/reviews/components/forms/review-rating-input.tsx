"use client";

import { Star } from "lucide-react";

type ReviewRatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  required?: boolean;
  label?: string;
  showValue?: boolean;
  allowHalf?: boolean;
};

export function ReviewRatingInput({
  value,
  onChange,
  size = "md",
  disabled = false,
  required = false,
  label,
  showValue = true,
  allowHalf = false,
}: ReviewRatingInputProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const starSize = sizeClasses[size];

  const handleStarClick = (starIndex: number) => {
    if (disabled) return;

    if (allowHalf) {
      // For half stars, we need to handle click position
      const newRating = starIndex + 1;
      onChange(newRating);
    } else {
      onChange(starIndex + 1);
    }
  };

  const handleStarHover = (_starIndex: number) => {
    if (disabled) return;
    // Could add hover preview functionality here
  };

  const getStarState = (starIndex: number) => {
    if (allowHalf) {
      if (starIndex < Math.floor(value)) {
        return "full";
      }
      if (starIndex < value) {
        return "half";
      }
      return "empty";
    }
    return starIndex < value ? "full" : "empty";
  };

  const renderStar = (starIndex: number) => {
    const state = getStarState(starIndex);

    return (
      <button
        aria-label={`Rate ${starIndex + 1} star${starIndex !== 0 ? "s" : ""}`}
        className={`relative transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:scale-110"
        } rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1`}
        disabled={disabled}
        key={starIndex}
        onClick={() => handleStarClick(starIndex)}
        onMouseEnter={() => handleStarHover(starIndex)}
        type="button"
      >
        <Star
          className={`${starSize} transition-colors ${
            state === "full"
              ? "fill-yellow-400 text-yellow-400"
              : state === "half"
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300 hover:text-yellow-400"
          }`}
        />
        {state === "half" && (
          <Star
            className={`${starSize} absolute inset-0 fill-yellow-400 text-yellow-400`}
            style={{
              clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
            }}
          />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block font-medium text-sm" htmlFor="label">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => renderStar(i))}
        </div>

        {showValue && (
          <span className="ml-2 text-muted-foreground text-sm">
            {value > 0
              ? `${value} star${value !== 1 ? "s" : ""}`
              : "Click to rate"}
          </span>
        )}
      </div>
    </div>
  );
}
