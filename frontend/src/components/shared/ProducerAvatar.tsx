"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface ProducerAvatarProps {
  avatarUrl?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-28 h-28",
  xl: "w-32 h-32",
};

const pixelSizes = {
  sm: 48,
  md: 80,
  lg: 112,
  xl: 128,
};

const fallbackTextSize = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export const ProducerAvatar = ({
  avatarUrl,
  name,
  size = "md",
  className,
  priority = false,
}: ProducerAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const avatarSrc = avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : undefined;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarSrc && !imageError ? (
        <div className="relative w-full h-full">
          <Image
            src={avatarSrc}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes={`${pixelSizes[size]}px`}
            priority={priority}
          />
        </div>
      ) : (
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br from-emerald-400 to-green-500 text-white font-bold",
            fallbackTextSize[size]
          )}
        >
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      )}
    </Avatar>
  );
};
