import Image from "next/image";
import React from "react";
import { useI18n } from "@/locales/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Leaf, DollarSign, Clock, Heart } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    imageUrls: string[];
    isForExchange?: boolean;
    isForSale?: boolean;
    distance?: number;
    category?: string;
    createdAt?: {
      seconds: number;
      nanoseconds: number;
    };
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  const t = useI18n();
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
    if (!createdAt) return { text: null, isNew: false };
    const date = new Date(createdAt.seconds * 1000);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return { text: "Just now", isNew: true };
    if (diffInHours < 24) return { text: `${diffInHours}h ago`, isNew: true };
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return { text: "Yesterday", isNew: false };
    if (diffInDays < 7) return { text: `${diffInDays} days ago`, isNew: false };
    if (diffInDays < 30) return { text: `${Math.floor(diffInDays / 7)} weeks ago`, isNew: false };
    return { text: `${Math.floor(diffInDays / 30)} months ago`, isNew: false };
  };

  const timeInfo = getTimeAgo(product.createdAt);

  return (
    <Card className="group relative overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
      {/* Favorite button */}
      <button className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-gray-700">
        <Heart className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors" />
      </button>

      {/* Image container with overlay */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
        {/* Gradient overlay - lighter and only at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10"></div>
        
        {/* Badges positioned on image */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
          {product.category && (
            <Badge className={`${getCategoryColor(product.category)} border-0 shadow-sm backdrop-blur-sm`}>
              {product.category}
            </Badge>
          )}
          {timeInfo.isNew && (
            <Badge className="bg-red-500 text-white border-0 shadow-sm">
              <Clock className="w-3 h-3 mr-1" />
              New
            </Badge>
          )}
        </div>

        {/* Price/Exchange badges in bottom right of image */}
        <div className="absolute bottom-3 right-3 z-20 flex gap-2">
          {product.isForExchange && (
            <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg backdrop-blur-sm">
              <Leaf className="w-3 h-3 mr-1" />
              Exchange
            </Badge>
          )}
          {product.isForSale && (
            <Badge className="bg-blue-500/90 text-white border-0 shadow-lg backdrop-blur-sm">
              <DollarSign className="w-3 h-3 mr-1" />
              {t('product.form.for_sale_label')}
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
        />
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>

        {/* Footer info */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {product.distance !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{product.distance.toFixed(1)} km</span>
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
                Edit
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
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
