"use client";

import { useI18n } from "@/locales/provider";
import Link from "next/link";
import ProductCard from "@/components/shared/ProductCard";
import OrganicProductCard from "@/components/shared/OrganicProductCard";
import { useAuth } from "@/context/AuthContext";
import { useFilters } from "@/context/FilterContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Package,
  ArrowRight,
  Leaf,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Product } from "@/types/product";
import { useProducts } from "@/hooks/useProducts";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { BrowseTabs } from "@/components/shared/BrowseTabs";
import { SectionHeader } from "@/components/shared/SectionHeader";

// Skeleton loader component
const ProductSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-64"></div>
    <div className="mt-4 space-y-3">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Enhanced product card wrapper with animations
// Removed in favor of shared OrganicProductCard

import { SearchAndFilter } from "@/components/shared/SearchAndFilter";

export default function ProductsPage() {
  const t = useI18n();
  const { user } = useAuth();
  const { filters } = useFilters();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Fetch user location
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((doc) => {
        if (doc.exists() && doc.data().location) {
          setUserLocation(doc.data().location);
        }
      });
    }
  }, [user]);

  // Use custom hook for product data logic
  const { products, loading } = useProducts(userLocation, filters, user?.uid);

  return (
    <OrganicBackground className="py-12">
      <div className="container mx-auto px-4">
        {/* Mobile Navigation Tabs */}
        <BrowseTabs />

        {/* Section Header */}
        <SectionHeader
          title={t('home.products.title')}
          subtitle={t('home.products.subtitle')}
          banner={
            loading ? (
              <span className="inline-block w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            ) : (
              filters.searchTerm
                ? t('home.products.showing_with_search', { count: products.length, searchTerm: filters.searchTerm })
                : t('home.products.showing', { count: products.length })
            )
          }
        />

        {/* Search and Filters UI */}
        <SearchAndFilter />

        {/* Products Grid or Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('home.empty_state.title')}
            description={t('home.empty_state.subtitle')}
            action={
              user ? (
                <Button asChild className="group bg-primary hover:bg-[#7a8578]">
                  <Link href="/publish">
                    {t('home.empty_state.cta')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 px-4">
            {products.map((product, index) => (
              <OrganicProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </OrganicBackground>
  );
}
