import React from "react";
import Link from "next/link";
import { useI18n } from "@/locales/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { ProducerAvatar } from "@/components/shared/ProducerAvatar";
import { Producer } from "@/types/user";
import {
    ArrowRight,
    MapPin,
} from "lucide-react";

interface OrganicProducerCardProps {
    producer: Producer;
    index: number;
}

// Content component for the producer card
const ProducerCardContent: React.FC<{ producer: Producer; priority?: boolean }> = ({ producer, priority = false }) => {
    const t = useI18n();
    const producerName = producer.name || t('producers.unnamed');
    const hasLocation = producer.address || producer.distance !== undefined;

    return (
        <div className="h-full flex flex-col">
            {/* Header with Avatar */}
            <div className="p-4 pb-2">
                <div className="flex items-center gap-3">
                    <ProducerAvatar
                        avatarUrl={producer.avatarUrl}
                        name={producerName}
                        size="md"
                        className="border-2 border-[#A88C8F]/30 shadow-sm h-14 w-14"
                        priority={priority}
                    />
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-foreground font-display leading-tight line-clamp-1">
                            {producerName}
                        </h3>
                        {hasLocation && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                    {producer.address}
                                    {producer.distance !== undefined && ` • ${Math.round(producer.distance)} km`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div className="px-4 py-2 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 font-serif">
                    {producer.bio || t('producers.no_bio')}
                </p>
            </div>

            {/* Button */}
            <div className="p-4 pt-2">
                <Button asChild className="w-full bg-[#879385] hover:bg-[#7a8578] text-white shadow-sm group/button text-sm">
                    <Link href={`/producers/${producer.uid}`}>
                        <span className="font-medium">{t('producers.view_shop')}</span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                    </Link>
                </Button>
            </div>
        </div>
    );
};

const OrganicProducerCard: React.FC<OrganicProducerCardProps> = ({
    producer,
    index,
}) => {
    return (
        <OrganicCard
            className="h-full"
            contentClassName="p-0 border-0 bg-[#FFFBE6] dark:bg-[#e0dcc7]"
            rotate={index % 2 === 0 ? 1 : -1}
            shadowColor="bg-[#A88C8F]"
        >
            <ProducerCardContent producer={producer} priority={index < 8} />
        </OrganicCard>
    );
};

export default OrganicProducerCard;
