"use client";

import { useI18n } from "@/locales/provider";
import Link from "next/link";
import ProductCard from "@/components/shared/ProductCard";
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
const AnimatedProductCard = ({ product, index }: { product: Product; index: number }) => {
  return (
    <div
      className="group relative transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>

      <ProductCard product={product} />
    </div>
  );
};

export default function ProductsPage() {
  const t = useI18n();
  const { user } = useAuth();
  const { filters, setFilters } = useFilters();
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
        {/* Section Header */}
        <div className="flex justify-center mb-16">
          <OrganicCard
            className="w-full max-w-3xl"
            rotate={-1}
            overlay={
              <div
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 md:w-full bg-[#FFFBE6] dark:bg-[#e0dcc7] py-3 px-6 shadow-md text-center rotate-[1deg] transition-transform duration-300"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <p className="font-serif text-[#3e3b34] text-lg md:text-xl italic">
                  {loading ? (
                    <span className="inline-block w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                  ) : (
                    <>
                      {filters.searchTerm
                        ? t('home.products.showing_with_search', { count: products.length, searchTerm: filters.searchTerm })
                        : t('home.products.showing', { count: products.length })}
                    </>
                  )}
                </p>
              </div>
            }
          >
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-hand font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('home.products.title')}
              </h1>

              {/* Filter badges */}
              {(filters.categories.length > 0 || filters.distance < 100) && (
                <div className="flex gap-2 flex-wrap justify-center mt-4">
                  {filters.categories.map(cat => (
                    <Badge key={cat} variant="secondary" className="capitalize bg-green-100/50 text-green-800 border-green-200">
                      {cat}
                    </Badge>
                  ))}
                  {filters.distance < 100 && (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-green-100/50 text-green-800 border-green-200">
                      <MapPin className="w-3 h-3" />
                      {t('home.products.filters.within', { distance: filters.distance })}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </OrganicCard>
        </div>

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
              <OrganicCard
                key={product.id}
                className="h-full"
                contentClassName="p-0 border-0"
                rotate={index % 2 === 0 ? 1 : -1}
                shadowColor="bg-[#A88C8F]" // Using the organic color from homepage
              >
                <ProductCard product={product} />
              </OrganicCard>
            ))}
          </div>
        )}
      </div>
    </OrganicBackground>
  );
}
