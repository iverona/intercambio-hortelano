"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Package,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  User as UserIcon,
  Leaf,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

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
  category?: string;
  isForExchange?: boolean;
  isForSale?: boolean;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

interface User {
  name: string;
  avatarUrl: string;
  bio?: string;
}

// Category colors mapping
const getCategoryColor = (category?: string) => {
  const colors: { [key: string]: string } = {
    vegetables: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    fruits: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    herbs: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    flowers: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    seeds: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    tools: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    other: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  return colors[category?.toLowerCase() || "other"] || colors.other;
};

// Format time ago
const getTimeAgo = (createdAt: { seconds: number; nanoseconds: number } | undefined) => {
  if (!createdAt) return "Recently";
  const date = new Date(createdAt.seconds * 1000);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};

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
  const [isFavorite, setIsFavorite] = useState(false);

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
    type: "exchange" | "chat";
    offeredProductId?: string;
    offeredProductName?: string;
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

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center py-20">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('product.not_found')}
          </h2>
          <Button asChild className="mt-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('product.back_to_home')}
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const isOwner = user && product.userId === user.uid;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Breadcrumb Navigation */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-primary transition-colors">
              {t('product.breadcrumb.home')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/" className="hover:text-primary transition-colors">
              {t('product.breadcrumb.products')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t('product.back')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <Carousel className="w-full rounded-2xl overflow-hidden shadow-2xl">
                    <CarouselContent>
                      {product.imageUrls.map((url, index) => (
                        <CarouselItem key={index}>
                          <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <Image
                              src={url}
                              alt={`${product.name} - image ${index + 1}`}
                              fill
                              className="object-cover"
                              priority={index === 0}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {product.imageUrls.length > 1 && (
                      <>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Package className="w-24 h-24 text-gray-400" />
                  </div>
                )}

                {/* Floating Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFavorite ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Title and Badges */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.category && (
                    <Badge className={`${getCategoryColor(product.category)} border-0`}>
                      {product.category}
                    </Badge>
                  )}
                  {product.isForExchange && (
                    <Badge className="bg-emerald-500 text-white border-0">
                      <Leaf className="w-3 h-3 mr-1" />
                      {t('product.for_exchange')}
                    </Badge>
                  )}
                  {product.isForSale && (
                    <Badge className="bg-blue-500 text-white border-0">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {t('product.form.for_sale_label')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {product.name}
                </h1>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{getTimeAgo(product.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>234 {t('product.views')}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    {t('product.description')}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>

              {/* Seller Information */}
              {seller && (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-lg">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      {t('product.seller_info')}
                    </h2>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex items-center gap-4 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 p-3 rounded-lg transition-colors">
                          <Avatar className="h-14 w-14 ring-2 ring-green-200 dark:ring-green-800">
                            <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                            <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                              {seller.name
                                ? seller.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {seller.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('product.seller')}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
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
                              <div className="flex items-center gap-1 text-sm text-yellow-600">
                                <Star className="w-3 h-3 fill-yellow-600" />
                                <span>4.8</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {seller.bio || t('product.no_bio')}
                          </p>
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            <div className="text-center">
                              <p className="text-lg font-bold">12</p>
                              <p className="text-xs text-gray-500">{t('product.seller_stats.products')}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold">8</p>
                              <p className="text-xs text-gray-500">{t('product.seller_stats.exchanges')}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold">95%</p>
                              <p className="text-xs text-gray-500">{t('product.seller_stats.response')}</p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isOwner && user && (
                  <>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all group"
                      onClick={() => setShowOfferModal(true)}
                    >
                      <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                      {t('product.interested_button')}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowOfferModal(true)}
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      {t('product.send_message')}
                    </Button>
                  </>
                )}
                {!user && (
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {t('product.login_to_contact')}
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/login">
                        {t('product.login_button')}
                      </Link>
                    </Button>
                  </Card>
                )}
                {isOwner && (
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-3">
                      <Sparkles className="w-5 h-5" />
                      <p className="font-medium">{t('product.your_product')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/product/${id}/edit`}>
                          {t('product.edit_button')}
                        </Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href="/my-garden">
                          {t('product.view_garden')}
                        </Link>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
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
