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
import { useState, useEffect } from "react";
import OfferModal from "@/components/shared/OfferModal";
import { ExchangeService } from "@/services/exchange.service";
import { useI18n } from "@/locales/provider";
import {
  ArrowLeft,
  Calendar,
  Package,
  Sparkles,
  Star,
  User as UserIcon,
  Leaf,
  DollarSign,
  ChevronRight,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { useProduct, useProductMutations } from "@/hooks/useProduct";
import { useUserProfile } from "@/hooks/useUser";
import { ProductService } from "@/services/product.service";
import { Product } from "@/types/product";
import ProductCard from "@/components/shared/ProductCard";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { categories, getCategoryColor } from "@/lib/categories";
import { cn, getTimeAgo } from "@/lib/utils";

// Category colors mapping - using shared source of truth

export default function ProductDetailPage() {
  const t = useI18n();
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const { product, loading: productLoading } = useProduct(id);
  const { user: seller, loading: sellerLoading } = useUserProfile(product?.userId);
  const { createOffer } = useProductMutations();

  // Fetch similar products using one-time query (more memory efficient)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (product?.category && id) {
      ProductService.getSimilarProducts(product.category, id, 4)
        .then(setSimilarProducts);
    }
  }, [product?.category, id]);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [hasPendingExchange, setHasPendingExchange] = useState(false);

  useEffect(() => {
    if (currentUser && product) {
      ExchangeService.hasPendingExchange(currentUser.uid, product.id).then(setHasPendingExchange);
    }
  }, [currentUser, product]);

  const loading = productLoading;
  const isUnavailable = !loading && (!product || product.deleted);

  const handleOfferSubmit = async (offer: {
    type: "exchange" | "chat";
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
        ...offer
      }
    });
  };

  if (loading) {
    return (
      <OrganicBackground className="justify-center">
        <div className="animate-spin text-primary">
          <Leaf className="w-12 h-12" />
        </div>
      </OrganicBackground>
    );
  }

  if (isUnavailable || !product) {
    return (
      <OrganicBackground className="justify-center">
        <div className="relative w-full max-w-lg mx-auto">
          <div className="absolute inset-0 bg-primary transform -rotate-1 rounded-sm shadow-lg opacity-20" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}></div>
          <div className="relative bg-card p-10 transform rotate-1 shadow-xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 text-center" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            <Package className="w-24 h-24 text-secondary mx-auto mb-4" />
            <h2 className="text-4xl font-display font-bold text-foreground mb-2">
              {isUnavailable ? t('product.unavailable') || "Product Unavailable" : t('product.not_found')}
            </h2>
            <p className="font-sans text-gray-600 dark:text-gray-400 mb-6">
              {isUnavailable
                ? "This product is no longer available because it has been removed or the user is no longer active."
                : "The product you are looking for does not exist."}
            </p>
            <Button asChild className="mt-4 bg-primary hover:bg-[#7a8578] text-white rounded-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('product.back_to_home')}
              </Link>
            </Button>
          </div>
        </div>
      </OrganicBackground>
    );
  }

  const isOwner = currentUser && product.userId === currentUser.uid;

  return (
    <OrganicBackground className="pb-20 md:pb-0 p-0">
      {/* Breadcrumb Navigation - Simplified and styled */}
      <div className="bg-background/90 dark:bg-background/90 backdrop-blur-sm sticky top-0 z-20 border-b border-primary/20 w-full -mt-8 mb-8">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-serif text-foreground/60">
            <Link href="/" className="hover:text-primary transition-colors">
              {t('product.breadcrumb.home')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-primary transition-colors">
              {t('product.breadcrumb.products')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 w-full">
        <div className="max-w-6xl mx-auto">
          {/* Main Content Card */}
          <div className="relative mb-12">
            {/* Organic background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-muted rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-card relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                {/* Left Column: Images */}
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-black/20 aspect-square">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <Carousel className="w-full h-full group">
                        <CarouselContent>
                          {product.imageUrls.map((url, index) => (
                            <CarouselItem key={index} className="h-full">
                              <div className="relative w-full h-full aspect-square">
                                <Image
                                  src={url}
                                  alt={`${product.name} - Image ${index + 1}`}
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
                            <CarouselPrevious className="left-2 bg-white/80 hover:bg-white text-foreground" />
                            <CarouselNext className="right-2 bg-white/80 hover:bg-white text-foreground" />
                          </>
                        )}
                      </Carousel>
                    ) : (
                      <div className="aspect-square bg-card dark:bg-card flex items-center justify-center shadow-inner" style={{ borderRadius: '20px 225px 20px 225px / 225px 20px 225px 20px' }}>
                        <Package className="w-24 h-24 text-primary opacity-50" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="flex flex-col h-full">
                  {/* Title & Category */}
                  {/* Category Eyebrow */}
                  <div className="mb-2">
                    {product.category && (
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${getCategoryColor(product.category)}`}>
                        {/* @ts-ignore */}
                        {t(`categories.${product.category.toLowerCase()}`)}
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 leading-none">
                    {product.name}
                  </h1>

                  {/* Transaction Types */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {product.isFree && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm">
                        <Gift className="w-4 h-4" />
                        <span className="font-bold font-serif text-sm uppercase tracking-wide">{t('product.form.for_free_label')}</span>
                      </div>
                    )}

                    {product.isForExchange && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 shadow-sm">
                        <Leaf className="w-4 h-4" />
                        <span className="font-bold font-serif text-sm uppercase tracking-wide">{t('product.for_exchange')}</span>
                      </div>
                    )}

                    {product.isForSale && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg border border-secondary/20 shadow-sm">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold font-serif text-sm uppercase tracking-wide">{t('product.form.for_sale_label')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm font-sans text-foreground/70 mt-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{getTimeAgo(product.createdAt, t).text}</span>
                    </div>

                  </div>


                  {/* Busco a cambio / Description */}
                  <div className="flex-grow space-y-6">
                    {/* Exchange/Description Section */}
                    <div className="bg-background dark:bg-card p-6 rounded-xl border border-card shadow-sm relative">
                      {/* Tape effect */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-card/80 rotate-1 backdrop-blur-sm shadow-sm z-10"></div>

                      <h2 className="text-2xl font-serif font-bold text-secondary mb-3">
                        {t('product.description')}
                      </h2>
                      <p className="font-sans text-lg text-foreground leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Seller Snippet */}
                    {seller && (
                      <Link
                        href={`/producers/${product.userId}`}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-card/30 transition-colors cursor-pointer group"
                      >
                        <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-[#FDFBF7] dark:ring-offset-[#2e2c28]">
                          <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                          <AvatarFallback className="bg-muted text-foreground font-display font-bold text-xl">
                            {seller.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {seller.name}
                          </p>
                          <div className="flex items-center gap-1 text-secondary">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-sans font-medium">4.8</span>
                            <span className="text-xs opacity-70">({t('product.seller_stats.response')}: 95%)</span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-6 mt-6 border-t border-[#A6C6B9]/20">
                    {isOwner ? (
                      <div className="flex gap-4">
                        <Button asChild variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-white font-serif text-lg h-12 rounded-full">
                          <Link href={`/product/${id}/edit`}>
                            {t('product.edit_button')}
                          </Link>
                        </Button>
                        <Button asChild className="flex-1 bg-primary hover:bg-[#7a8578] text-white font-serif text-lg h-12 rounded-full shadow-md hover:shadow-lg transition-all">
                          <Link href="/my-garden">
                            {t('product.view_garden')}
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      currentUser ? (
                        <Button
                          size="lg"
                          className="w-full bg-primary hover:bg-[#7a8578] text-white font-serif text-xl h-14 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                          onClick={() => setShowOfferModal(true)}
                          disabled={hasPendingExchange}
                        >
                          {hasPendingExchange ? (
                            <>
                              <Package className="mr-2 h-6 w-6" />
                              {t('product.pending_exchange') || "Solicitud Pendiente"}
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-6 w-6" />
                              {t('product.interested_button')}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button asChild className="w-full bg-secondary hover:bg-[#8b6b6e] text-white font-serif text-lg h-12 rounded-full">
                          <Link href="/login">
                            {t('common.login')}
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
                <h2 className="text-3xl font-display font-bold text-foreground ">
                  {t('product.similar_products') || "Productos Similares"}
                </h2>
                <Link href="/products" className="text-primary hover:underline font-serif">
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

      {
        product && (
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
            //  @ts-ignore
            onOfferSubmit={handleOfferSubmit}
          />
        )
      }
    </OrganicBackground >
  );
}
