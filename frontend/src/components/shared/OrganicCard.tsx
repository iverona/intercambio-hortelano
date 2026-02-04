import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrganicCardProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  shadowColor?: string;
  rotate?: number;
  overlay?: React.ReactNode;
  showOverflow?: boolean;
  href?: string;
}

export function OrganicCard({
  children,
  className,
  contentClassName,
  shadowColor = "bg-primary ",
  rotate = 1,
  overlay,
  showOverflow = false,
  href
}: OrganicCardProps) {
  const organicRadius = '255px 15px 225px 15px / 15px 225px 15px 255px';

  return (
    <div className={cn("relative group", className)}>
      {/* Shadow/Border Element */}
      <div
        className={cn("absolute inset-0 rounded-sm shadow-lg transition-transform duration-300", shadowColor)}
        style={{
          borderRadius: organicRadius,
          transform: `rotate(-${rotate * 2}deg)`
        }}
      ></div>

      {/* Main Card Content */}
      <div
        className={cn(
          "relative bg-card p-10 md:p-16 shadow-xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 transition-transform duration-300",
          !showOverflow && "overflow-hidden",
          contentClassName
        )}
        style={{
          borderRadius: organicRadius,
          transform: `rotate(${rotate}deg)`
        }}
      >
        {children}
      </div>

      {href && (
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {overlay}
    </div>
  );
}
