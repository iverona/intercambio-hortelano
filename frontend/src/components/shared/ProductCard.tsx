import React from "react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: {
    name: string;
    description: string;
    imageUrl: string;
    isForExchange?: boolean;
    price?: number;
    distance?: number;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative">
      <div className="absolute top-2 right-2 flex space-x-2">
        {product.isForExchange && <Badge variant="secondary">Exchange</Badge>}
        {product.price && <Badge variant="default">${product.price.toFixed(2)}</Badge>}
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
      </div>
    </div>
  );
};

export default ProductCard;
