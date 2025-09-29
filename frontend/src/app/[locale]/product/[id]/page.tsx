"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
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
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OfferModal from "@/components/shared/OfferModal";
import { useI18n } from "@/locales/provider";
import { createNotification, NotificationMetadata } from "@/lib/notifications";

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
  imageUrls: string[];
  userId: string;
  isForExchange?: boolean;
  isForSale?: boolean;
}

interface User {
  name: string;
  avatarUrl: string;
  bio?: string;
}

export default function ProductDetailPage() {
  const t = useI18n();
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
      // Create a chat for this exchange immediately
      const chatData = {
        participants: [user.uid, product.userId],
        listingId: id,
        listingTitle: product.name,
        createdAt: serverTimestamp(),
        lastMessage: null,
      };

      const chatRef = await addDoc(collection(db, "chats"), chatData);

      // Create an exchange record with the chat already linked
      const exchangesRef = collection(db, "exchanges");
      const exchangeData = {
        productId: id,
        productName: product.name,
        requesterId: user.uid,
        ownerId: product.userId,
        status: "pending",
        chatId: chatRef.id, // Link the chat immediately
        offer: {
          type: offer.type,
          ...(offer.offeredProductId && { offeredProductId: offer.offeredProductId }),
          ...(offer.offeredProductName && { offeredProductName: offer.offeredProductName }),
          ...(offer.amount && { amount: offer.amount }),
          ...(offer.message && { message: offer.message }),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const exchangeDoc = await addDoc(exchangesRef, exchangeData);

      // If there's an initial message, add it to the chat
      if (offer.message) {
        const messagesRef = collection(db, "chats", chatRef.id, "messages");
        await addDoc(messagesRef, {
          text: offer.message,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        });

        // Update the lastMessage field on the chat
        await updateDoc(doc(db, "chats", chatRef.id), {
          lastMessage: {
            text: offer.message,
            createdAt: serverTimestamp(),
          },
        });
      }

      // Create notification for the product owner with detailed metadata
      const notificationMetadata: NotificationMetadata = {
        productName: product.name,
        productId: id,
        offerType: offer.type,
        exchangeId: exchangeDoc.id,
      };

      if (offer.offeredProductName) {
        notificationMetadata.offeredProductName = offer.offeredProductName;
      }
      if (offer.offeredProductId) {
        notificationMetadata.offeredProductId = offer.offeredProductId;
      }
      if (offer.amount !== undefined && offer.amount !== null) {
        notificationMetadata.offerAmount = offer.amount;
      }
      if (offer.message) {
        notificationMetadata.message = offer.message;
      }

      await createNotification({
        recipientId: product.userId,
        senderId: user.uid,
        type: "NEW_OFFER",
        entityId: exchangeDoc.id,
        metadata: notificationMetadata,
      });

      // Navigate to the exchange details page
      router.push(`/exchanges/details/${exchangeDoc.id}`);
    } catch (error) {
      console.error("Error submitting offer:", error);
    }
  };

  if (loading) {
    return <div>{t('product.loading')}</div>;
  }

  if (!product) {
    return <div>{t('product.not_found')}</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <Carousel className="w-full rounded-lg overflow-hidden shadow-md">
              <CarouselContent>
                {product.imageUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative">
                      <Image
                        src={url}
                        alt={`${product.name} - image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-4" />
              <CarouselNext className="absolute right-4" />
            </Carousel>
          ) : (
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">{product.name}</span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex space-x-2 mb-4">
            {product.isForExchange && (
              <Badge variant="secondary">{t('product.for_exchange')}</Badge>
            )}
            {product.isForSale && (
              <Badge variant="default">{t('product.form.for_sale_label')}</Badge>
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
                    <p className="text-sm text-gray-500">{t('product.seller')}</p>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-sm">{seller.bio || t('product.no_bio')}</p>
              </PopoverContent>
            </Popover>
          )}
          {user && product.userId !== user.uid && (
            <Button size="lg" onClick={() => setShowOfferModal(true)}>
              {t('product.interested_button')}
            </Button>
          )}
          {user && product.userId === user.uid && (
            <p className="text-sm text-gray-500 italic">{t('product.your_product')}</p>
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
            imageUrls: product.imageUrls,
            isForExchange: product.isForExchange,
            isForSale: product.isForSale,
          }}
          onOfferSubmit={handleOfferSubmit}
        />
      )}
    </main>
  );
}
