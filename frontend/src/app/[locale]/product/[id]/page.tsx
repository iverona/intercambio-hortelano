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
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import OfferModal from "@/components/shared/OfferModal";
import { useI18n } from "@/locales/provider";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  Package,
  Share2,
  Sparkles,
  Star,
  User as UserIcon,
  Leaf,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useProduct, useProductMutations } from "@/hooks/useProduct";
import { useUserProfile } from "@/hooks/useUser";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/shared/ProductCard";

// Category colors mapping - updated to match earthy theme better if needed, but keeping logic
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
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const { product, loading: productLoading } = useProduct(id);
  const { user: seller, loading: sellerLoading } = useUserProfile(product?.userId);
  const { createOffer } = useProductMutations();

  // Fetch similar products
  const { products: allSimilarProducts } = useProducts(null, {
    searchTerm: "",
    categories: product?.category ? [product.category] : [],
    distance: 10000,
    sortBy: "date_newest"
  });

  // Filter out current product and limit to 4
  const similarProducts = allSimilarProducts
    .filter(p => p.id !== id)
    .slice(0, 4);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const loading = productLoading;
  const isUnavailable = !loading && (!product || product.deleted);

  const handleOfferSubmit = async (offer: {
    type: "exchange" | "chat" | "purchase";
    offeredProductId?: string;
    offeredProductName?: string;
    message?: string;
  }) => {
    if (!currentUser || !product || !seller) return;

    await createOffer({
      productId: product.id,
      productName: product.name,
      requesterId: currentUser.uid,
      ownerId: product.userId,
      offer: {
        ...offer,
        amount: undefined
      }
    });
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
      <main className="min-h-screen bg-[#FFFBE6] dark:bg-[#2C2A25] p-4 flex items-center justify-center">
        <div className="animate-spin text-[#879385]">
          <Leaf className="w-12 h-12" />
        </div>
      </main>
    );
  }

  if (isUnavailable || !product) {
    return (
      <main className="min-h-screen bg-[#FFFBE6] dark:bg-[#2C2A25] p-4 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-lg mx-auto">
          <div className="absolute inset-0 bg-[#879385] dark:bg-[#5a6359] transform -rotate-1 rounded-sm shadow-lg opacity-20" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}></div>
          <div className="relative bg-[#FDFBF7] dark:bg-[#2e2c28] p-10 transform rotate-1 shadow-xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 text-center" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            <Package className="w-24 h-24 text-[#A88C8F] mx-auto mb-4" />
            <h2 className="text-4xl font-display font-bold text-[#594a42] dark:text-[#d6c7b0] mb-2">
              {isUnavailable ? t('product.unavailable') || "Product Unavailable" : t('product.not_found')}
            </h2>
            <p className="font-sans text-gray-600 dark:text-gray-400 mb-6">
              {isUnavailable
                ? "This product is no longer available because it has been removed or the user is no longer active."
                : "The product you are looking for does not exist."}
            </p>
            <Button asChild className="mt-4 bg-[#879385] hover:bg-[#7a8578] text-white rounded-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('product.back_to_home')}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const isOwner = currentUser && product.userId === currentUser.uid;

  return (
    <main className="min-h-screen bg-[#FFFBE6] dark:bg-[#2C2A25] overflow-x-hidden">
      {/* Breadcrumb Navigation - Simplified and styled */}
      <div className="bg-[#FFFBE6]/90 dark:bg-[#2C2A25]/90 backdrop-blur-sm sticky top-0 z-20 border-b border-[#879385]/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-serif text-[#594a42]/60 dark:text-[#d6c7b0]/60">
            <Link href="/" className="hover:text-[#879385] transition-colors">
              {t('product.breadcrumb.home')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-[#879385] transition-colors">
              {t('product.breadcrumb.products')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#594a42] dark:text-[#d6c7b0] font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">

          {/* Main Content Card with Organic Shape */}
          <div className="relative group mb-16">
            {/* Shadow/Border Element */}
            <div className="absolute inset-0 bg-[#879385] dark:bg-[#5a6359] transform -rotate-1 rounded-sm shadow-lg pointer-events-none" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}></div>

            {/* Content Container */}
            <div
              className="relative bg-[#FDFBF7] dark:bg-[#2e2c28] p-6 md:p-12 transform rotate-1 shadow-xl border border-[#A6C6B9]/30 dark:border-[#4A5D54]/30"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              {/* Back Button inside card */}
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="absolute top-8 left-8 hidden md:flex hover:bg-transparent hover:text-[#879385] text-[#594a42]/60 dark:text-[#d6c7b0]/60"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('product.back')}
              </Button>


              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
                {/* Left Column: Images */}
                <div className="space-y-6">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
                    {/* Decorative elements behind image */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#A88C8F]/20 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>

                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {product.imageUrls.map((url, index) => (
                            <CarouselItem key={index}>
                              <div className="aspect-square relative overflow-hidden shadow-md" style={{ borderRadius: '20px 225px 20px 225px / 225px 20px 225px 20px' }}>
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
                            <CarouselPrevious className="left-2 bg-white/80 hover:bg-white text-[#594a42]" />
                            <CarouselNext className="right-2 bg-white/80 hover:bg-white text-[#594a42]" />
                          </>
                        )}
                      </Carousel>
                    ) : (
                      <div className="aspect-square bg-[#EFEAC6] dark:bg-[#3E3B34] flex items-center justify-center shadow-inner" style={{ borderRadius: '20px 225px 20px 225px / 225px 20px 225px 20px' }}>
                        <Package className="w-24 h-24 text-[#879385] opacity-50" />
                      </div>
                    )}

                    {/* Action Buttons Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <Button
                        size="icon"
                        className="rounded-full bg-white/90 dark:bg-black/40 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform text-[#A88C8F] hover:text-[#8b6b6e]"
                        onClick={() => setIsFavorite(!isFavorite)}
                      >
                        <Heart
                          className={`h-5 w-5 ${isFavorite ? "fill-[#A88C8F]" : ""}`}
                        />
                      </Button>
                      <Button
                        size="icon"
                        className="rounded-full bg-white/90 dark:bg-black/40 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform text-[#879385] hover:text-[#6f7a6d]"
                        onClick={handleShare}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="flex flex-col h-full">
                  {/* Title & Category */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.category && (
                        <Badge className={`${getCategoryColor(product.category)} border-0 rounded-full px-3 py-1 text-xs font-serif uppercase tracking-wider`}>
                          {product.category}
                        </Badge>
                      )}
                      {product.isForExchange && (
                        <Badge className="bg-[#879385] text-white border-0 rounded-full px-3 py-1 text-xs font-serif uppercase tracking-wider">
                          <Leaf className="w-3 h-3 mr-1" />
                          {t('product.for_exchange')}
                        </Badge>
                      )}
                      {product.isForSale && (
                        <Badge className="bg-[#A88C8F] text-white border-0 rounded-full px-3 py-1 text-xs font-serif uppercase tracking-wider">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {t('product.form.for_sale_label')}
                        </Badge>
                      )}
                    </div>

                    <h1 className="text-6xl font-display font-bold text-[#594a42] dark:text-[#d6c7b0] mb-2 leading-none">
                      {product.name}
                    </h1>

                    <div className="flex flex-wrap gap-4 text-sm font-sans text-[#594a42]/70 dark:text-[#d6c7b0]/70 mt-4">
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

                  {/* Busco a cambio / Description */}
                  <div className="flex-grow space-y-6">
                    {/* Exchange/Description Section */}
                    <div className="bg-[#FFFBE6] dark:bg-[#3E3B34] p-6 rounded-xl border border-[#EFEAC6] dark:border-[#4a463a] shadow-sm relative">
                      {/* Tape effect */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#EFEAC6]/80 dark:bg-[#4a463a]/80 rotate-1 backdrop-blur-sm shadow-sm z-10"></div>

                      <h2 className="text-2xl font-serif font-bold text-[#A88C8F] mb-3">
                        {t('product.description')}
                      </h2>
                      <p className="font-sans text-lg text-[#594a42] dark:text-[#d6c7b0] leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Seller Snippet */}
                    {seller && (
                      <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#EFEAC6]/30 transition-colors cursor-pointer group"
                        onClick={() => {/* Navigate to profile maybe? */ }}>
                        <Avatar className="h-16 w-16 ring-2 ring-[#879385] ring-offset-2 ring-offset-[#FDFBF7] dark:ring-offset-[#2e2c28]">
                          <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                          <AvatarFallback className="bg-[#A6C6B9] text-[#2C2A25] font-display font-bold text-xl">
                            {seller.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-serif font-bold text-lg text-[#594a42] dark:text-[#d6c7b0] group-hover:text-[#879385] transition-colors">
                            {seller.name}
                          </p>
                          <div className="flex items-center gap-1 text-[#A88C8F]">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-sans font-medium">4.8</span>
                            <span className="text-xs opacity-70">({t('product.seller_stats.response')}: 95%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-6 mt-6 border-t border-[#A6C6B9]/20">
                    {isOwner ? (
                      <div className="flex gap-4">
                        <Button asChild variant="outline" className="flex-1 border-[#879385] text-[#879385] hover:bg-[#879385] hover:text-white font-serif text-lg h-12 rounded-full">
                          <Link href={`/product/${id}/edit`}>
                            {t('product.edit_button')}
                          </Link>
                        </Button>
                        <Button asChild className="flex-1 bg-[#879385] hover:bg-[#7a8578] text-white font-serif text-lg h-12 rounded-full shadow-md hover:shadow-lg transition-all">
                          <Link href="/my-garden">
                            {t('product.view_garden')}
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      currentUser ? (
                        <Button
                          size="lg"
                          className="w-full bg-[#879385] hover:bg-[#7a8578] text-white font-serif text-xl h-14 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                          onClick={() => setShowOfferModal(true)}
                        >
                          <Sparkles className="mr-2 h-6 w-6" />
                          {t('product.interested_button')}
                        </Button>
                      ) : (
                        <Button asChild className="w-full bg-[#A88C8F] hover:bg-[#8b6b6e] text-white font-serif text-lg h-12 rounded-full">
                          <Link href="/login">
                            {t('product.login_button')}
                          </Link>
                        </Button>
                      )
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-display font-bold text-[#594a42] dark:text-[#d6c7b0]">
                  {t('product.similar_products') || "Productos Similares"}
                </h2>
                <Link href="/products" className="text-[#879385] hover:underline font-serif">
                  {t('product.view_all') || "Ver todos"}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {product && (
        <OfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            imageUrls: product.imageUrls,
            isForExchange: product.isForExchange,
            isForSale: product.isForSale,
          }}
          //   @ts-ignore
          onOfferSubmit={handleOfferSubmit}
        />
      )}
    </main>
  );
}
