import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { ProductService } from "@/services/product.service";
import { ExchangeService } from "@/services/exchange.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useProduct(productId: string | null) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, _setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = ProductService.getProduct(productId, (data) => {
            setProduct(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [productId]);

    return { product, loading, error };
}

export function useProductMutations() {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const createProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt" | "deleted">, images: File[]) => {
        setLoading(true);
        try {
            const id = await ProductService.createProduct(data, images);
            toast.success("Product created successfully!");
            return id;
        } catch (err) {
            console.error(err);
            toast.error("Failed to create product");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (
        id: string,
        data: Partial<Product>,
        newImages: File[] = [],
        imagesToDelete: string[] = []
    ) => {
        setLoading(true);
        try {
            await ProductService.updateProduct(id, data, newImages, imagesToDelete);
            toast.success("Product updated successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update product");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        setLoading(true);
        try {
            await ProductService.deleteProduct(id);
            toast.success("Product deleted successfully");
            router.push("/my-garden");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete product");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createOffer = async (data: {
        productId: string;
        productName: string;
        requesterId: string;
        ownerId: string;
        offer: {
            type: "exchange" | "chat" | "purchase";
            offeredProductId?: string;
            offeredProductName?: string;
            message?: string;
            amount?: number;
        };
    }) => {
        setLoading(true);
        try {
            const exchangeId = await ExchangeService.createOffer(data);
            toast.success("Offer sent successfully!");
            router.push(`/exchanges/details/${exchangeId}`);
            return exchangeId;
        } catch (err) {
            console.error(err);
            toast.error("Failed to send offer");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createProduct, updateProduct, deleteProduct, createOffer, loading };
}
