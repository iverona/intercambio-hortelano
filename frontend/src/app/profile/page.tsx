"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProductCard from "@/components/shared/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface Exchange {
  id: string;
  productName: string;
  status: string;
  buyerId: string;
  sellerId: string;
}

interface UserData {
  name: string;
  email: string;
  avatarUrl: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        }
      });

      const productsQuery = query(
        collection(db, "products"),
        where("userId", "==", user.uid)
      );
      const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      });

      const exchangesQuery = query(
        collection(db, "exchanges"),
        where("buyerId", "==", user.uid)
      );
      const unsubscribeExchanges = onSnapshot(exchangesQuery, (snapshot) => {
        const exchangesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Exchange[];
        setExchanges(exchangesData);
      });

      return () => {
        unsubscribeProducts();
        unsubscribeExchanges();
      };
    }
  }, [user]);

  const handleExchange = async (exchangeId: string, status: string) => {
    const exchangeRef = doc(db, "exchanges", exchangeId);
    await updateDoc(exchangeRef, { status });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {userData && (
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={userData.avatarUrl} alt={userData.name} />
            <AvatarFallback>
              {userData.name
                ? userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : ""}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{userData.name}</h1>
            <p className="text-gray-600">{userData.email}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">My Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">My Exchanges</h2>
        <div className="space-y-4">
          {exchanges.map((exchange) => (
            <div
              key={exchange.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{exchange.productName}</p>
                <p className="text-sm text-gray-500">{exchange.status}</p>
              </div>
              {user?.uid === exchange.sellerId &&
                exchange.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExchange(exchange.id, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleExchange(exchange.id, "rejected")}
                      variant="destructive"
                    >
                      Reject
                    </Button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
