"use client";

import { useEffect, useState, use } from "react";
import { useI18n } from "@/locales/provider";
import ProductCard from "@/components/shared/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProducerAvatar } from "@/components/shared/ProducerAvatar";
import { useUser } from "@/hooks/useUser";
import { getDistance } from "@/lib/geolocation";
import { Package, MapPin } from "lucide-react";
import { UserService } from "@/services/user.service";
import { ProductService } from "@/services/product.service";
import { UserData, Producer } from "@/types/user";
import { Product } from "@/types/product";

const ProducerProfile = ({
  producer,
  t,
}: {
  producer: Producer;
  t: ReturnType<typeof useI18n>;
}) => {
  const producerName = producer.name || t("producers.unnamed");
  const hasLocation = producer.address || producer.distance !== undefined;

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 p-8 rounded-lg mb-12 flex flex-col md:flex-row items-center gap-8">
      <ProducerAvatar
        avatarUrl={producer.avatarUrl}
        name={producerName}
        size="xl"
        className="border-4 border-white shadow-lg"
      />
      <div className="text-center md:text-left flex-1">
        <h1 className="text-4xl font-bold">{producerName}</h1>
        {hasLocation && (
          <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 mt-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">
              {producer.address}
              {producer.distance !== undefined && ` • ${Math.round(producer.distance)} km away`}
            </span>
          </div>
        )}
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
          {producer.bio || t("producers.no_bio")}
        </p>
      </div>
    </div>
  );
};

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

  // Use useUser hook to get current user's location
  const { userData: currentUser } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      if (!producerId) return;
      setLoading(true);
      try {
        // Fetch producer details using UserService
        const producerData = await UserService.getUserProfile(producerId);

        if (producerData) {
          let distance: number | undefined;

          // Calculate distance if user location and producer location are available
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

        // Fetch producer's products using ProductService
        const productsData = await ProductService.getProductsByUserId(producerId);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching producer shop data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [producerId, currentUser]); // Re-fetch if currentUser location changes (e.g. loaded later)

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!producer) {
    return (
      <main className="container mx-auto px-4 py-12">
        <p className="text-center">{t("producer_shop.not_found")}</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <ProducerProfile producer={producer} t={t} />
      <h2 className="text-3xl font-bold mb-8">
        {t("producer_shop.products_title")}
      </h2>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
            /* Link removed to prevent nested <a> tags, handled inside ProductCard */
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={t("producer_shop.empty_state.title")}
          description={t("producer_shop.empty_state.subtitle")}
        />
      )}
    </main>
  );
}
