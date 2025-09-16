import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    isForExchange?: boolean;
    price?: number;
    distance?: number;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative">
      <div className="absolute top-2 right-2 flex space-x-2">
        {product.isForExchange && <Badge variant="secondary">Exchange</Badge>}
        {product.price && (
          <Badge variant="default">${product.price.toFixed(2)}</Badge>
        )}
      </div>
      <img
        src={`https://placehold.co/400x300/EEE/31343C?text=${encodeURIComponent(
          product.name
        )}`}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-600 mt-2 truncate">{product.description}</p>
        {product.distance && (
          <p className="text-gray-500 text-sm mt-2">
            {product.distance.toFixed(2)} km away
          </p>
        )}
        {(onEdit || onDelete) && (
          <div className="mt-4 flex justify-end gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product.id)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(product.id)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
