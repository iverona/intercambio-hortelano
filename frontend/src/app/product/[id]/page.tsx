"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Chat {
  id: string;
  listingId: string;
  listingTitle: string;
  participants: string[];
  createdAt?: Timestamp;
  lastMessage?: {
    text: string;
    createdAt: Timestamp;
  } | null;
}

interface Product {
  name: string;
  description: string;
  imageUrl: string;
  userId: string;
  isForExchange?: boolean;
  price?: number;
}

interface User {
  name: string;
  avatarUrl: string;
  bio?: string;
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
    if (!user || !product || !seller) return;

    // 1. Check if a chat already exists
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("listingId", "==", id),
      where("participants", "array-contains", user.uid)
    );

    const querySnapshot = await getDocs(q);
    let existingChat: Chat | null = null;

    querySnapshot.forEach((doc) => {
      const chat = doc.data() as Omit<Chat, "id">;
      if (chat.participants.includes(product.userId)) {
        existingChat = { id: doc.id, ...chat };
      }
    });

    if (existingChat) {
      // 2. If chat exists, navigate to it
      router.push(`/exchanges/${existingChat.id}`);
    } else {
      // 3. If not, create a new chat
      const newChat = {
        listingId: id,
        listingTitle: product.name,
        participants: [user.uid, product.userId],
        createdAt: serverTimestamp(),
        lastMessage: null,
      };
      const docRef = await addDoc(chatsRef, newChat);
      router.push(`/exchanges/${docRef.id}`);
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
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex space-x-2 mb-4">
            {product.isForExchange && (
              <Badge variant="secondary">For Exchange</Badge>
            )}
            {product.price && (
              <Badge variant="default">${product.price.toFixed(2)}</Badge>
            )}
          </div>
          <p className="text-gray-600 mb-4">{product.description}</p>
          {seller && (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center space-x-4 mb-4 cursor-pointer">
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
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-sm">{seller.bio || "No bio available."}</p>
              </PopoverContent>
            </Popover>
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
