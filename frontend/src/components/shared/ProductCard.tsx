import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/locales/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Leaf, DollarSign, Clock } from "lucide-react";
import { UserService } from "@/services/user.service";
import { ProducerAvatar } from "@/components/shared/ProducerAvatar";

import { cn, getTimeAgo } from "@/lib/utils";
import { categories, getCategoryColor } from "@/lib/categories";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    imageUrls: string[];
    isForExchange?: boolean;
    isForSale?: boolean;
    isFree?: boolean;
    distance?: number;
    category?: string;
    userId?: string;
    createdAt?: {
      seconds: number;
      nanoseconds: number;
    };
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string; // Allow style overrides
  priority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  className,
  priority = false,
}) => {
  const t = useI18n();
  const [producer, setProducer] = useState<{ name: string; avatarUrl?: string; address?: string } | null>(null);

  useEffect(() => {
    if (product.userId) {
      const fetchProducer = async () => {
        try {
          const userData = await UserService.getUserProfile(product.userId!);
          if (userData) {
            setProducer({
              name: userData.name || "Anonymous",
              avatarUrl: userData.avatarUrl,
              address: userData.address,
            });
          }
        } catch (error) {
          console.error("Error fetching producer:", error);
        }
      };
      fetchProducer();
    }
  }, [product.userId]);

  const timeInfo = getTimeAgo(product.createdAt, t);

  return (
    <Card className={cn("group relative overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800", className)}>


      {/* Image container with overlay */}
      <Link href={`/product/${product.id}`} className="block relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
        {/* Gradient overlay - lighter and only at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10"></div>

        {/* Badges positioned on image */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap gap-2">
          {product.category && (
            <Badge className={`${getCategoryColor(product.category)} border-0 shadow-sm backdrop-blur-sm`}>
              {(() => {
                const categoryInfo = categories.find(c => c.id === product.category);
                return categoryInfo ? (t as any)(categoryInfo.translationKey) : product.category;
              })()}
            </Badge>
          )}
          {timeInfo.isNew && (
            <Badge className="bg-[#EFEAC6] text-[#3E3B34] border-0 shadow-sm">
              <Clock className="w-3 h-3 mr-1" />
              {t('home.products.new_badge')}
            </Badge>
          )}
        </div>

        {/* Price/Exchange badges in bottom right of image */}
        <div className="absolute bottom-3 right-3 left-3 z-20 flex flex-wrap justify-end gap-2">
          {product.isForExchange && (
            <Badge className="bg-[#879385] text-white border-0 shadow-lg backdrop-blur-sm">
              <Leaf className="w-3 h-3 mr-1" />
              {t('product.form.for_exchange_label')}
            </Badge>
          )}
          {product.isForSale && (
            <Badge className="bg-[#A88C8F] text-white border-0 shadow-lg backdrop-blur-sm">
              <DollarSign className="w-3 h-3 mr-1" />
              {t('product.form.for_sale_label')}
            </Badge>
          )}
          {product.isFree && (
            <Badge className="bg-purple-500 text-white border-0 shadow-lg backdrop-blur-sm">
              <Leaf className="w-3 h-3 mr-1" />
              {t('product.form.for_free_label')}
            </Badge>
          )}
        </div>

        {/* Product image */}
        <Image
          src={product.imageUrls?.[0] || `https://placehold.co/400x300/EEE/31343C.png?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          fill={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
          priority={priority}
        />
      </Link>

      {/* Content */}
      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
          {product.description}
        </p>

        {/* Producer Info */}
        {producer && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Link href={`/producers/${product.userId}`} className="shrink-0 group/avatar">
                <ProducerAvatar
                  avatarUrl={producer.avatarUrl}
                  name={producer.name}
                  size="sm"
                  className="w-8 h-8 ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover/avatar:ring-green-500/50 transition-all"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/producers/${product.userId}`} className="block group/name">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover/name:text-green-600 dark:group-hover/name:text-green-400 line-clamp-1 transition-colors" title={producer.name}>
                    {producer.name}
                  </p>
                </Link>
                {producer.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 flex items-center gap-1" title={producer.address}>
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{producer.address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {product.distance !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{Math.round(product.distance)} km</span>
              </div>
            )}
            {timeInfo.text && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeInfo.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit/Delete buttons for user's own products */}
        {(onEdit || onDelete) && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(product.id);
                }}
                className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
              >
                {t('common.edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(product.id);
                }}
                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                {t('common.delete')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
