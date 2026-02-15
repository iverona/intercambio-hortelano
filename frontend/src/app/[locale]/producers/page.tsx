"use client";

import Link from "next/link";
import { useI18n } from "@/locales/provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useProducers } from "@/hooks/useProducers";
import OrganicProducerCard from "@/components/shared/OrganicProducerCard";
import { OrganicCard } from "@/components/shared/OrganicCard";
import {
    ArrowRight,
    Users,
    Map as MapIcon,
    List
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MapComponent from "@/components/shared/MapComponent";
import { useUser } from "@/hooks/useUser";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { ViewToggle } from "@/components/shared/ViewToggle";
import { BrowseTabs } from "@/components/shared/BrowseTabs";

// Skeleton loader component with organic styling
const ProducerSkeleton = ({ index }: { index: number }) => (
    <div className="animate-pulse">
        <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-64"></div>
        <div className="mt-4 space-y-3">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);

export default function ProducersPage() {
    const t = useI18n();
    const { producers, loading } = useProducers();
    const { userData } = useUser();
    const router = useRouter();
    const [isMapView, setIsMapView] = useState(false);

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
                            <ProducerSkeleton key={i} index={i} />
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 px-4">
                            {producers.map((producer, index) => (
                                <OrganicProducerCard key={producer.uid} producer={producer} index={index} />
                            ))}
                        </div>
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
