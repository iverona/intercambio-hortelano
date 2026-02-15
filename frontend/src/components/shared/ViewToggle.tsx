"use client";

import { List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/locales/provider";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
    isMapView: boolean;
    onToggle: (isMap: boolean) => void;
    className?: string;
}

export function ViewToggle({ isMapView, onToggle, className }: ViewToggleProps) {
    const t = useI18n();

    return (
        <div className={cn(
            "fixed bottom-28 left-1/2 -translate-x-1/2 z-[200]",
            className
        )}>
            <Button
                onClick={() => onToggle(!isMapView)}
                className={cn(
                    "rounded-full h-12 px-6 transition-all duration-300",
                    "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
                    "shadow-[0_8px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)]",
                    "hover:scale-105 active:scale-95",
                    "flex items-center gap-3 font-semibold text-sm tracking-wide"
                )}
            >
                {isMapView ? (
                    <>
                        <List className="w-5 h-5" />
                        <span>{t('common.show_list') || "Ver lista"}</span>
                    </>
                ) : (
                    <>
                        <MapIcon className="w-5 h-5" />
                        <span>{t('common.show_map') || "Ver mapa"}</span>
                    </>
                )}
            </Button>
        </div>
    );
}
