"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useI18n } from "@/locales/provider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProducerAvatar } from "@/components/shared/ProducerAvatar";
import { useAuth } from "@/context/AuthContext";
import { getDistance } from "@/lib/geolocation";
import { 
  ArrowRight, 
  Users, 
  Sparkles, 
  Store, 
  Heart,
  MapPin,
  Package,
  Leaf,
  TrendingUp
} from "lucide-react";

interface Producer {
  uid: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  address?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  productsCount?: number;
  distance?: number;
  deleted?: boolean;
}

// Skeleton loader component
const ProducerSkeleton = () => (
  <div className="animate-pulse">
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 h-32"></div>
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-4/5"></div>
      </div>
    </Card>
  </div>
);

// Hero section component
const HeroSection = ({ producerCount }: { producerCount: number }) => {
  const t = useI18n();
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Welcome badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{t('producers.hero.badge')}</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent mb-6">
            {t('producers.title')}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {t('producers.subtitle')}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{producerCount}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('producers.stats.active')}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">2.5k+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('producers.stats.products')}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">98%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('producers.stats.satisfaction')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced producer card with animations
const ProducerCard = ({ producer, index }: { producer: Producer; index: number }) => {
  const t = useI18n();
  const producerName = producer.name || t('producers.unnamed');
  const isNew = Math.random() > 0.7; // Mock new producer logic
  const hasLocation = producer.address || producer.distance !== undefined;

  return (
    <div 
      className="group relative transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* New badge */}
      {isNew && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg animate-pulse">
            {t('producers.new_badge')}
          </Badge>
        </div>
      )}
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
      
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800">
        {/* Gradient header background */}
        <div className="h-24 bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 dark:from-emerald-900 dark:via-green-900 dark:to-teal-900 relative">
          {/* Favorite button */}
          <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-gray-700">
            <Heart className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors" />
          </button>
        </div>

        <CardHeader className="relative -mt-8 pb-0">
          <div className="flex items-center gap-4">
            <ProducerAvatar 
              avatarUrl={producer.avatarUrl}
              name={producerName}
              size="md"
              className="border-4 border-white dark:border-gray-800 shadow-xl"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {producerName}
              </h3>
              {hasLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {producer.address}
                    {producer.distance !== undefined && ` • ${Math.round(producer.distance)} km`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <p className="text-gray-600 dark:text-gray-400 line-clamp-3 min-h-[4.5rem] leading-relaxed">
            {producer.bio || t('producers.no_bio')}
          </p>
          
          {/* Stats badges */}
          <div className="flex gap-2 mt-4 mb-4">
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
              <Package className="w-3 h-3 mr-1" />
              {producer.productsCount || 0} {t('producers.products_label')}
            </Badge>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
              <Store className="w-3 h-3 mr-1" />
              {t('producers.verified')}
            </Badge>
          </div>

          <Button asChild className="w-full group/button">
            <Link href={`/producers/${producer.uid}`}>
              <span>{t('producers.view_shop')}</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ProducersPage() {
  const t = useI18n();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchUserLocation = async () => {
      if (user) {
        // Fetch user's stored location from Firebase
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.location?.latitude && userData.location?.longitude) {
            setUserLocation({
              latitude: userData.location.latitude,
              longitude: userData.location.longitude
            });
          }
        }
      }
    };
    fetchUserLocation();
  }, [user]);

  useEffect(() => {
    const fetchProducers = async () => {
      setLoading(true);
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const producerIds = new Set<string>();
        const producerProductCounts = new Map<string, number>();
        
        productsSnapshot.forEach((doc) => {
          const userId = doc.data().userId;
          if (userId) {
            producerIds.add(userId);
            producerProductCounts.set(userId, (producerProductCounts.get(userId) || 0) + 1);
          }
        });

        if (producerIds.size > 0) {
          const usersQuery = query(
            collection(db, "users"),
            where("uid", "in", Array.from(producerIds))
          );
          const usersSnapshot = await getDocs(usersQuery);
          let producersData = usersSnapshot.docs.map((doc) => {
            const data = doc.data();
            let distance: number | undefined;
            
            // Calculate distance if user location and producer location are available
            if (userLocation && data.location?.latitude && data.location?.longitude) {
              distance = getDistance(
                userLocation.latitude,
                userLocation.longitude,
                data.location.latitude,
                data.location.longitude
              );
            }
            
            return {
              ...data,
              productsCount: producerProductCounts.get(data.uid) || 0,
              distance
            } as Producer;
          });
          
          // Filter out deleted users
          producersData = producersData.filter(producer => !producer.deleted);
          
          setProducers(producersData);
        }
      } catch (error) {
        console.error("Error fetching producers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducers();
  }, [userLocation]);

  return (
    <>
      {/* Hero Section */}
      <HeroSection producerCount={producers.length} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('producers.section_title')}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
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
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4">
                <Users className="w-5 h-5 text-emerald-500" />
              </span>
            </div>
          </div>
        </div>

        {/* Producers Grid or Loading/Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <ProducerSkeleton key={i} />
            ))}
          </div>
        ) : producers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {producers.map((producer, index) => (
              <ProducerCard key={producer.uid} producer={producer} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={t('producers.empty')}
            description={t('producers.empty_description')}
            action={
              <Button asChild className="group">
                <Link href="/">
                  {t('producers.browse_products')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            }
          />
        )}
      </main>
    </>
  );
}
