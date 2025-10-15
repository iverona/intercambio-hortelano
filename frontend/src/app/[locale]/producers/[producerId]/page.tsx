"use client";

import { useEffect, useState, use } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useI18n } from "@/locales/provider";
import ProductCard from "@/components/shared/ProductCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getDistance } from "@/lib/geolocation";
import { Package, MapPin } from "lucide-react";
import Link from "next/link";

interface Producer {
  uid: string;
  name: string;
  photoURL?: string;
  bio?: string;
  address?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  distance?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrls: string[];
  category: string;
}

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
      <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
        <AvatarImage src={producer.photoURL} alt={producerName} />
        <AvatarFallback className="text-4xl">
          {producerName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
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
    const fetchProducerData = async () => {
      if (!producerId) return;
      setLoading(true);
      try {
        // Fetch producer details
        const userDocRef = doc(db, "users", producerId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const producerData = userDoc.data();
          let distance: number | undefined;
          
          // Calculate distance if user location and producer location are available
          if (userLocation && producerData.location?.latitude && producerData.location?.longitude) {
            distance = getDistance(
              userLocation.latitude,
              userLocation.longitude,
              producerData.location.latitude,
              producerData.location.longitude
            );
          }
          
          setProducer({ ...producerData, distance } as Producer);
        }

        // Fetch producer's products
        const productsQuery = query(
          collection(db, "products"),
          where("userId", "==", producerId)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching producer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducerData();
  }, [producerId, userLocation]);

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
            <Link href={`/product/${product.id}`} key={product.id}>
              <ProductCard product={product} />
            </Link>
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
