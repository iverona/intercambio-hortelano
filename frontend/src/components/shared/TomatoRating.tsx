"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TomatoRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showNumber?: boolean;
  className?: string;
}

export function TomatoRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  showNumber = false,
  className,
}: TomatoRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1;
        const isFilled = value <= displayRating;

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            className={cn(
              "transition-all duration-200",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
            aria-label={`Rate ${value} out of ${maxRating}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={cn(sizeClasses[size], "transition-colors")}
            >
              {/* Tomato shape */}
              <path
                d="M12 21C16.5 21 20 17 20 12.5C20 9 18 7 16 6C16 4 14.5 3 12 3C9.5 3 8 4 8 6C6 7 4 9 4 12.5C4 17 7.5 21 12 21Z"
                fill={isFilled ? "#ef4444" : "#fca5a5"}
                stroke={isFilled ? "#dc2626" : "#f87171"}
                strokeWidth="1.5"
              />
              {/* Tomato stem/leaves */}
              <path
                d="M12 3C12 3 10 2 10 1C10 1 11 0 12 0C13 0 14 1 14 1C14 2 12 3 12 3Z"
                fill={isFilled ? "#16a34a" : "#86efac"}
                stroke={isFilled ? "#15803d" : "#4ade80"}
                strokeWidth="1"
              />
              {/* Highlight for depth */}
              {isFilled && (
                <ellipse
                  cx="9"
                  cy="9"
                  rx="2"
                  ry="3"
                  fill="#fca5a5"
                  opacity="0.4"
                  transform="rotate(-20 9 9)"
                />
              )}
            </svg>
          </button>
        );
      })}
      {showNumber && (
        <span className={cn(
          "ml-2 font-medium",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-lg"
        )}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
