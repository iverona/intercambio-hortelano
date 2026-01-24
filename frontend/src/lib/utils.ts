import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimeAgo(
  createdAt: { seconds: number; nanoseconds: number } | undefined,
  t: (key: string, options?: any) => string
): { text: string | null; isNew: boolean } {
  if (!createdAt) return { text: null, isNew: false };
  const date = new Date(createdAt.seconds * 1000);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return { text: t('product.time.just_now'), isNew: true };
  if (diffInHours < 24) return { text: t('product.time.hours_ago', { count: diffInHours }), isNew: true };

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return { text: t('product.time.yesterday'), isNew: true };
  if (diffInDays < 7) return { text: t('product.time.days_ago', { count: diffInDays }), isNew: diffInDays <= 7 };
  if (diffInDays < 30) return { text: t('product.time.weeks_ago', { count: Math.floor(diffInDays / 7) }), isNew: false };

  return { text: t('product.time.months_ago', { count: Math.floor(diffInDays / 30) }), isNew: false };
}
