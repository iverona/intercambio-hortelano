import React from "react";
import { Product } from "@/types/product";
import { OrganicCard } from "@/components/shared/OrganicCard";
import ProductCard from "@/components/shared/ProductCard";

interface OrganicProductCardProps {
    product: Product;
    index: number;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const OrganicProductCard: React.FC<OrganicProductCardProps> = ({
    product,
    index,
    onEdit,
    onDelete,
}) => {
    return (
        <OrganicCard
            key={product.id}
            className="h-full"
            contentClassName="p-0 border-0 bg-[#FFFBE6] dark:bg-[#e0dcc7]" // Light paper background
            rotate={index % 2 === 0 ? 1 : -1}
            shadowColor="bg-[#A88C8F]" // Using the organic color from homepage
        >
            <ProductCard
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
                className="border-0 shadow-none rounded-none bg-transparent h-full"
            />
        </OrganicCard>
    );
};

export default OrganicProductCard;
