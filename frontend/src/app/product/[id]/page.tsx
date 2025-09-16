"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Product {
  name: string;
  description: string;
  imageUrl: string;
  userId: string;
}

interface User {
  name: string;
  avatarUrl: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const productData = docSnap.data() as Product;
        setProduct(productData);

        const userRef = doc(db, "users", productData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setSeller(userSnap.data() as User);
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleContact = async () => {
    if (user && product) {
      const exchangeData = {
        productId: id,
        productName: product.name,
        sellerId: product.userId,
        buyerId: user.uid,
        status: "pending",
        createdAt: new Date(),
      };
      await addDoc(collection(db, "exchanges"), exchangeData);
      router.push("/profile");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={`https://placehold.co/600x400/EEE/31343C?text=${encodeURIComponent(
              product.name
            )}`}
            alt={product.name}
            className="w-full rounded-lg shadow-md"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          {seller && (
            <div className="flex items-center space-x-4 mb-4">
              <Avatar>
                <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                <AvatarFallback>
                  {seller.name
                    ? seller.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{seller.name}</p>
                <p className="text-sm text-gray-500">Vendedor</p>
              </div>
            </div>
          )}
          {user && (
            <Button size="lg" onClick={handleContact}>
              Contactar al Vendedor
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
