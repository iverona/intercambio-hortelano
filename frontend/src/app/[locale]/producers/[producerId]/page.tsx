"use client";

import { useEffect, useState, use } from "react";
import { useI18n } from "@/locales/provider";
import Link from "next/link";
import OrganicProductCard from "@/components/shared/OrganicProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProducerAvatar } from "@/components/shared/ProducerAvatar";
import { useUser } from "@/hooks/useUser";
import { getDistance } from "@/lib/geolocation";
import { Package, MapPin, ArrowLeft } from "lucide-react";
import { UserService } from "@/services/user.service";
import { ProductService } from "@/services/product.service";
import { Producer } from "@/types/user";
import { Product } from "@/types/product";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { Button } from "@/components/ui/button";

// Skeleton loader component
const ProducerShopSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-64 mb-12"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-64"></div>
          <div className="mt-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function ProducerShopPage({
  params,
}: {
  params: Promise<{ producerId: string }>;
}) {
  const t = useI18n();
  const { producerId } = use(params);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { userData: currentUser } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      if (!producerId) return;
      setLoading(true);
      try {
        const producerData = await UserService.getUserProfile(producerId);
        if (producerData) {
          let distance: number | undefined;
          if (currentUser?.location && producerData.location) {
            distance = getDistance(
              currentUser.location.latitude,
              currentUser.location.longitude,
              producerData.location.latitude,
              producerData.location.longitude
            );
          }
          setProducer({ ...producerData, distance } as Producer);
        }
        const productsData = await ProductService.getProductsByUserId(producerId);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching producer shop data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [producerId, currentUser]);

  if (loading) {
    return (
      <OrganicBackground className="py-12">
        <div className="container mx-auto px-4">
          <ProducerShopSkeleton />
        </div>
      </OrganicBackground>
    );
  }

  if (!producer) {
    return (
      <OrganicBackground className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl font-serif italic text-gray-500">{t("producer_shop.not_found")}</p>
          <Button asChild className="mt-8 bg-primary hover:bg-[#7a8578]">
            <Link href="/producers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>
        </div>
      </OrganicBackground>
    );
  }

  const producerName = producer.name || t("producers.unnamed");
  const hasLocation = producer.address || producer.distance !== undefined;

  return (
    <OrganicBackground className="py-12">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <div className="mb-8">
          <Link href="/producers" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors group">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t('common.back')}
          </Link>
        </div>

        {/* Producer Profile Header */}
        <SectionHeader
          containerClassName="justify-center"
          maxW="max-w-4xl"
          rotate={1}
          banner={producer.bio || t("producers.no_bio")}
          bannerPosition="large"
          bannerRotate={-1}
          centered={false}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <ProducerAvatar
                avatarUrl={producer.avatarUrl}
                name={producerName}
                size="xl"
                className="relative border-4 border-white dark:border-gray-800 shadow-xl scale-110 md:scale-125 transition-transform duration-500 hover:scale-[1.3] z-10"
              />
            </div>
            <div className="text-center md:text-left flex-1 mt-4 md:mt-0">
              <h1 className="text-4xl md:text-5xl font-hand font-bold text-gray-900 dark:text-gray-100 mb-3">
                {producerName}
              </h1>
              {hasLocation && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-serif italic mb-2">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span>
                    {producer.address}
                    {producer.distance !== undefined && ` • ${Math.round(producer.distance)} km`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </SectionHeader>

        {/* Products Section */}
        <div className="mt-28">
          <div className="flex items-center justify-between mb-10 border-b border-[#A6C6B9]/30 dark:border-[#4A5D54]/30 pb-4">
            <h2 className="text-3xl font-hand font-bold text-gray-900 dark:text-gray-100">
              {t("producer_shop.products_title", { count: products.length })}
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 px-2">
              {products.map((product, index) => (
                <OrganicProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title={t("producer_shop.empty_state.title")}
              description={t("producer_shop.empty_state.subtitle")}
            />
          )}
        </div>
      </div>
    </OrganicBackground>
  );
}
