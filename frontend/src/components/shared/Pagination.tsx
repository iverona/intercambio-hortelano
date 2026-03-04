"use client";

import { useI18n } from "@/locales/provider";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";

interface PaginationProps {
    visibleCount: number;
    totalCount: number;
    onLoadMore: () => void;
    pageSize?: number;
    endAction?: React.ReactNode;
}

export const Pagination = ({
    visibleCount,
    totalCount,
    onLoadMore,
    pageSize = 12,
    endAction,
}: PaginationProps) => {
    const t = useI18n();
    const hasMore = visibleCount < totalCount;
    const displayedCount = Math.min(visibleCount, totalCount);

    if (totalCount === 0) return null;

    return (
        <div className="flex flex-col items-center gap-3 mt-10 mb-4">
            {/* Counter */}
            <p className="text-sm text-muted-foreground">
                {t("pagination.showing", {
                    visible: String(displayedCount),
                    total: String(totalCount),
                })}
            </p>

            {/* Load More or All Loaded */}
            {hasMore ? (
                <Button
                    onClick={(e) => {
                        // Prevent browser from scrolling to follow the button
                        const scrollY = window.scrollY;
                        onLoadMore();
                        requestAnimationFrame(() => {
                            window.scrollTo({ top: scrollY });
                        });
                    }}
                    variant="outline"
                    className="w-full sm:w-auto min-w-[200px] border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                >
                    {t("pagination.load_more")}
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <div className="flex flex-col items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 text-sm text-green-600/70">
                        <Check className="h-4 w-4" />
                        <span>{t("pagination.all_loaded")}</span>
                    </div>
                    {endAction && (
                        <div className="mt-2">
                            {endAction}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
