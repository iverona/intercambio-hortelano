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
import OfferModal from "@/components/shared/OfferModal";
import { createNotification } from "@/lib/notifications";

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
  const [showOfferModal, setShowOfferModal] = useState(false);

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

  const handleOfferSubmit = async (offer: {
    type: "exchange" | "purchase" | "chat";
    offeredProductId?: string;
    offeredProductName?: string;
    amount?: number;
    message?: string;
  }) => {
    if (!user || !product || !seller) return;

    try {
      // 1. Create an exchange/transaction record
      const exchangesRef = collection(db, "exchanges");
      const exchangeData = {
        productId: id,
        productName: product.name,
        requesterId: user.uid,
        ownerId: product.userId,
        status: "pending",
        offer: {
          type: offer.type,
          ...(offer.offeredProductId && { offeredProductId: offer.offeredProductId }),
          ...(offer.offeredProductName && { offeredProductName: offer.offeredProductName }),
          ...(offer.amount && { amount: offer.amount }),
          ...(offer.message && { message: offer.message }),
        },
        createdAt: serverTimestamp(),
      };

      // For backwards compatibility, also add buyerId and sellerId
      const exchangeWithLegacy = {
        ...exchangeData,
        buyerId: user.uid,
        sellerId: product.userId,
      };

      const exchangeDoc = await addDoc(exchangesRef, exchangeWithLegacy);

      // Create notification for the product owner
      await createNotification({
        recipientId: product.userId,
        senderId: user.uid,
        type: "NEW_PROPOSAL",
        entityId: exchangeDoc.id,
      });

      // 2. Check if a chat already exists
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("listingId", "==", id),
        where("participants", "array-contains", user.uid)
      );

      const querySnapshot = await getDocs(q);
      let existingChat: Chat | null = null;

      querySnapshot.forEach((docSnapshot) => {
        const chat = docSnapshot.data() as Omit<Chat, "id">;
        if (chat.participants.includes(product.userId)) {
          existingChat = { id: docSnapshot.id, ...chat };
        }
      });

      if (existingChat) {
        // 3. If chat exists, navigate to it
        router.push(`/exchanges/${existingChat.id}`);
      } else {
        // 4. If not, create a new chat
        const newChat = {
          listingId: id,
          listingTitle: product.name,
          participants: [user.uid, product.userId],
          createdAt: serverTimestamp(),
          lastMessage: null,
        };
        const docRef = await addDoc(chatsRef, newChat);
        
        // If there's an initial message, add it
        if (offer.message) {
          const messagesRef = collection(db, "chats", docRef.id, "messages");
          await addDoc(messagesRef, {
            text: offer.message,
            senderId: user.uid,
            createdAt: serverTimestamp(),
          });
        }

        router.push(`/exchanges/${docRef.id}`);
      }
    } catch (error) {
      console.error("Error submitting offer:", error);
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
          {user && product.userId !== user.uid && (
            <Button size="lg" onClick={() => setShowOfferModal(true)}>
              I&apos;m Interested
            </Button>
          )}
          {user && product.userId === user.uid && (
            <p className="text-sm text-gray-500 italic">This is your product</p>
          )}
        </div>
      </div>
      
      {product && (
        <OfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          product={{
            id,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            isForExchange: product.isForExchange,
            price: product.price,
          }}
          onOfferSubmit={handleOfferSubmit}
        />
      )}
    </main>
  );
}
