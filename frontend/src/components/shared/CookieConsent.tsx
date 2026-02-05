"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n, useCurrentLocale } from "@/locales/provider";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
    const t = useI18n();
    const locale = useCurrentLocale();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // We use a small delay to avoid hydration mismatch if the component renders before localStorage is checked
        const timer = setTimeout(() => {
            const consent = localStorage.getItem("cookie-consent");
            if (!consent) {
                setIsVisible(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "granted");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-md border shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-stone-200/50">
                <div className="flex-1 text-center md:text-left space-y-2">
                    <p className="text-stone-700 text-sm md:text-base leading-relaxed font-medium">
                        {t("cookies.banner.message")}
                    </p>
                    <Link
                        href={`/${locale}/cookies`}
                        className="text-[#64841c] hover:text-[#4d6614] text-sm hover:underline inline-flex items-center gap-1 font-semibold transition-colors"
                    >
                        {t("cookies.banner.policy")}
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </Link>
                </div>
                <div className="flex shrink-0">
                    <Button
                        onClick={handleAccept}
                        className="bg-[#d26c3c] hover:bg-[#b05a30] text-white px-10 py-6 rounded-2xl text-base font-bold shadow-lg transform transition hover:scale-105 active:scale-95"
                    >
                        {t("cookies.banner.accept")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
