"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/locales/provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useProducers } from "@/hooks/useProducers";
import OrganicProducerCard from "@/components/shared/OrganicProducerCard";
import {
    ArrowRight,
    Users
} from "lucide-react";
import MapComponent from "@/components/shared/MapComponent";
import { useUser } from "@/hooks/useUser";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { ViewToggle } from "@/components/shared/ViewToggle";
import { BrowseTabs } from "@/components/shared/BrowseTabs";
import { Pagination } from "@/components/shared/Pagination";
import { SkeletonCard } from "@/components/shared/SkeletonCard";

const PAGE_SIZE = 12;


export default function ProducersPage() {
    const t = useI18n();
    const { producers, loading } = useProducers();
    const { userData } = useUser();
    const router = useRouter();
    const [isMapView, setIsMapView] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Reset pagination when producers data changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [producers]);

    const visibleProducers = producers.slice(0, visibleCount);

    const mapMarkers = producers
        .filter((p) => p.location)
        .map((p) => ({
            id: p.uid!,
            latitude: p.location!.latitude,
            longitude: p.location!.longitude,
            label: p.productsCount ? `${p.productsCount}` : "",
            title: p.name,
            imageUrl: p.avatarUrl,
            type: 'producer' as const,
        }));

    return (
        <OrganicBackground className="py-12">
            <div className="container mx-auto px-4">
                {/* Mobile Navigation Tabs */}
                <BrowseTabs />

                <SectionHeader
                    title={t('producers.title')}
                    subtitle={t('producers.subtitle')}
                    banner={
                        loading ? (
                            <span className="inline-block w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                        ) : (
                            t('producers.showing', { count: producers.length })
                        )
                    }
                />


                {/* Producers Grid, Map or Loading/Empty State */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4">
                        {[...Array(8)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : producers.length > 0 ? (
                    isMapView ? (
                        <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border-2 border-green-100/50">
                            <MapComponent
                                markers={mapMarkers}
                                userLocation={userData?.location}
                                onMarkerClick={(marker) => router.push(`/producers/${marker.id}`)}
                                className="w-full h-full"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 px-4">
                                {visibleProducers.map((producer, index) => (
                                    <OrganicProducerCard key={producer.uid} producer={producer} index={index} />
                                ))}
                            </div>
                            <Pagination
                                visibleCount={visibleCount}
                                totalCount={producers.length}
                                onLoadMore={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                            />
                        </>
                    )
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
            <ViewToggle isMapView={isMapView} onToggle={setIsMapView} />
        </OrganicBackground>
    );
}
