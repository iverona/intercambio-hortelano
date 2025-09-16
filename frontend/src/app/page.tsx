"use client";

import Link from "next/link";
import ProductCard from "@/components/shared/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useFilters } from "@/context/FilterContext";
import { db } from "@/lib/firebase";
import { getDistance } from "@/lib/geolocation";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name:string;
  description: string;
  imageUrl: string;
  category: string;
  isForExchange?: boolean;
  price?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
}

export default function Home() {
  const { user } = useAuth();
  const { filters } = useFilters();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((doc) => {
        if (doc.exists() && doc.data().location) {
          setUserLocation(doc.data().location);
        } else {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      let productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      if (userLocation) {
        productsData = productsData
          .map((product) => {
            if (product.location) {
              const distance = getDistance(
                userLocation.latitude,
                userLocation.longitude,
                product.location.latitude,
                product.location.longitude
              );
              return { ...product, distance };
            }
            return product;
          })
          .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      // Apply filters
      let filteredData = productsData;
      if (filters.categories.length > 0) {
        filteredData = filteredData.filter((product) =>
          filters.categories.includes(product.category)
        );
      }

      if (filters.distance < 100) {
        filteredData = filteredData.filter(
          (product) => (product.distance || Infinity) <= filters.distance
        );
      }

      if (filters.searchTerm) {
        filteredData = filteredData.filter((product) =>
          product.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }

      setProducts(filteredData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userLocation, filters]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <Link href={`/product/${product.id}`} key={product.id}>
            <ProductCard product={product} />
          </Link>
        ))}
      </div>
    </main>
  );
}
