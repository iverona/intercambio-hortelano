"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShoppingBag, Users } from "lucide-react";
import { useI18n, useCurrentLocale } from "@/locales/provider";

export const BrowseTabs = () => {
    const pathname = usePathname();
    const t = useI18n();
    const locale = useCurrentLocale();

    const tabs = [
        {
            href: `/${locale}/products`,
            label: t('nav.products'),
            icon: ShoppingBag,
            isActive: (path: string) => path.includes("/products"),
        },
        {
            href: `/${locale}/producers`,
            label: t('nav.community'), // Using 'community' as it maps to Producers in Header usually
            icon: Users,
            isActive: (path: string) => path.includes("/producers"),
        }
    ];

    return (
        <div className="md:hidden w-full px-4 mb-6">
            <div className="flex p-1 bg-[#FDFBF7] dark:bg-[#2C2C2C] border border-[#E6E2D5] dark:border-[#444] rounded-full shadow-sm">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.isActive(pathname);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300",
                                isActive
                                    ? "bg-[#879385] text-white shadow-md transform scale-[1.02]"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                            <span className={isActive ? "font-bold" : "font-medium"}>{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
