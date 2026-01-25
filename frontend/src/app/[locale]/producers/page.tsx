"use client";

import Link from "next/link";
import { useI18n } from "@/locales/provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useProducers } from "@/hooks/useProducers";
import OrganicProducerCard from "@/components/shared/OrganicProducerCard";
import { OrganicCard } from "@/components/shared/OrganicCard";
import {
    ArrowRight,
    Users,
    Sparkles,
    Package,
    TrendingUp
} from "lucide-react";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { BrowseTabs } from "@/components/shared/BrowseTabs";

// Skeleton loader component with organic styling
const ProducerSkeleton = ({ index }: { index: number }) => (
    <OrganicCard
        className="h-full"
        contentClassName="p-0 border-0 bg-[#FFFBE6] dark:bg-[#e0dcc7]"
        rotate={index % 2 === 0 ? 1 : -1}
        shadowColor="bg-[#A88C8F]"
    >
        <div className="animate-pulse p-4 space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
            <div className="flex gap-2 pt-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
            <div className="h-9 bg-gray-200 dark:bg-gray-600 rounded w-full mt-2"></div>
        </div>
    </OrganicCard>
);

// Hero section component (content only)
const HeroSectionContent = ({ producerCount }: { producerCount: number }) => {
    const t = useI18n();
    return (
        <div className="text-center max-w-4xl mx-auto py-8">
            {/* Welcome badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full mb-6 border border-secondary/20">
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">{t('producers.hero.badge')}</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl lg:text-7xl font-bold font-display text-foreground mb-6">
                {t('producers.title')}
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed font-serif">
                {t('producers.subtitle')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <Card className="p-4 bg-card/60 backdrop-blur-sm border border-[#A6C6B9] dark:border-[#4A5D54] shadow-lg">
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-foreground ">{producerCount}</p>
                            <p className="text-sm text-muted-foreground ">{t('producers.stats.active')}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border border-primary dark:border-[#5a6359] shadow-lg">
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-2 bg-primary rounded-lg">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-foreground ">2.5k+</p>
                            <p className="text-sm text-muted-foreground ">{t('producers.stats.products')}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border border-secondary dark:border-[#998676] shadow-lg">
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-2 bg-secondary dark:bg-secondary rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-foreground ">98%</p>
                            <p className="text-sm text-muted-foreground ">{t('producers.stats.satisfaction')}</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ProducerCard component moved to @/components/shared/OrganicProducerCard

export default function ProducersPage() {
    const t = useI18n();
    const { producers, loading } = useProducers();

    return (
        <OrganicBackground className="pb-20 md:pb-0">
            <div className="container mx-auto px-4">
                {/* Mobile Navigation Tabs */}
                <BrowseTabs />

                {/* Hero Section */}
                <HeroSectionContent producerCount={producers.length} />

                {/* Section Header */}
                <div className="mb-10 max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold font-display text-foreground ">
                                {t('producers.section_title')}
                            </h2>
                            <p className="mt-2 text-muted-foreground font-serif">
                                {loading ? (
                                    <span className="inline-block w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                                ) : (
                                    t('producers.showing')
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Decorative divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#A6C6B9]/30 dark:border-[#4A5D54]/30"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-4">
                                <Users className="w-5 h-5 text-primary" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Producers Grid or Loading/Empty State */}
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {[...Array(8)].map((_, i) => (
                                <ProducerSkeleton key={i} index={i} />
                            ))}
                        </div>
                    ) : producers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {producers.map((producer, index) => (
                                <OrganicProducerCard key={producer.uid} producer={producer} index={index} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title={t('producers.empty')}
                            description={t('producers.empty_description')}
                            action={
                                <Button asChild className="group bg-primary hover:bg-[#7a8578]">
                                    <Link href="/">
                                        {t('producers.browse_products')}
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>
        </OrganicBackground>
    );
}
