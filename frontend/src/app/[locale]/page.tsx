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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MapPin,
  Package,
  ArrowRight,
  Leaf,
  Users,
  TrendingUp
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Product } from "@/types/product";
import { useProducts } from "@/hooks/useProducts";

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

// Hero section component
const HeroSection = ({ productCount, user }: { productCount: number; user: { uid: string } | null }) => {
  const t = useI18n();
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Animated background elements - constrained within container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Welcome badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{t('home.hero.badge')}</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-6">
            {t('home.hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {t('home.hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <Button asChild size="lg" className="group">
                <Link href="/publish">
                  {t('home.hero.cta.primary')}
                  <Leaf className="ml-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="group">
                <Link href="/signup">
                  {t('home.hero.cta.primary.unauthenticated')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="group">
              <Link href="#products">
                {t('home.hero.cta.secondary')}
                <Package className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="group">
              <Link href="/producers">
                {t('home.hero.cta.explore_producers')}
                <Users className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{productCount}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.hero.stats.products')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">500+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.hero.stats.gardeners')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">1.2k</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.hero.stats.exchanges')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default function Home() {
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
  const { products, loading } = useProducts(userLocation, filters);

  return (
    <>
      {/* Hero Section */}
      <HeroSection productCount={products.length} user={user} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12" id="products">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('home.products.title')}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
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

            {/* Filter badges */}
            {(filters.categories.length > 0 || filters.distance < 100) && (
              <div className="flex gap-2">
                {filters.categories.map(cat => (
                  <Badge key={cat} variant="secondary" className="capitalize">
                    {cat}
                  </Badge>
                ))}
                {filters.distance < 100 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t('home.products.filters.within', { distance: filters.distance })}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Decorative divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4">
                <Leaf className="w-5 h-5 text-green-500" />
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid or Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
                <Button asChild className="group">
                  <Link href="/publish">
                    {t('home.empty_state.cta')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <AnimatedProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
