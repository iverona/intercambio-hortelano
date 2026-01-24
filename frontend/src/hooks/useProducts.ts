import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { ProductService } from "@/services/product.service";
import { getDistance } from "@/lib/geolocation";

export const useProducts = (
    userLocation: { latitude: number; longitude: number } | null,
    filters: {
        searchTerm: string;
        categories: string[];
        distance: number;
        sortBy: string;
        showOwnProducts: boolean;
        transactionTypes: string[];
    },
    excludeUserId?: string
) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Optimization: Pass single category filter to Firestore if exactly one is selected
        // Note: Firestore 'in' query could be used for multiple, but let's keep it simple for now
        // and just pass the category if there's only one, or none.
        const categoryFilter = filters.categories.length === 1 ? filters.categories[0] : undefined;

        const unsubscribe = ProductService.subscribeToProducts((productsData) => {
            // Filter out excluded user's products based on showOwnProducts setting
            // If showOwnProducts is false (default), exclude user's own products
            // If showOwnProducts is true, include all products
            let processedData = productsData.filter((product) =>
                !excludeUserId || filters.showOwnProducts || product.userId !== excludeUserId
            );

            // Add distance calculation if userLocation is available
            if (userLocation) {
                processedData = processedData
                    .map((product) => {
                        if (product.location) {
                            const distance = getDistance(
                                userLocation.latitude,
                                userLocation.longitude,
                                product.location.latitude,
                                product.location.longitude
                            );
                            return { ...product, distance };
                        }
                        return product;
                    })
                    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            }

            // Apply sorting logic
            let sortedData = [...processedData];
            switch (filters.sortBy) {
                case "date_newest":
                    sortedData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                    break;
                case "date_oldest":
                    sortedData.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
                    break;
                case "distance":
                default:
                    if (userLocation) {
                        sortedData.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
                    }
                    break;
            }

            // Apply filtering logic
            let filteredData = sortedData;

            // Transaction Type filter
            if (filters.transactionTypes.length > 0) {
                filteredData = filteredData.filter((product) => {
                    const matchesSale = filters.transactionTypes.includes('sale') && product.isForSale;
                    const matchesExchange = filters.transactionTypes.includes('exchange') && product.isForExchange;
                    const matchesFree = filters.transactionTypes.includes('free') && product.isFree;
                    return matchesSale || matchesExchange || matchesFree;
                });
            }

            // Category filter
            if (filters.categories.length > 0) {
                filteredData = filteredData.filter((product) =>
                    filters.categories.includes(product.category)
                );
            }

            // Distance filter
            if (filters.distance < 100) {
                filteredData = filteredData.filter(
                    (product) => (product.distance || Infinity) <= filters.distance
                );
            }

            // Search term filter
            if (filters.searchTerm) {
                filteredData = filteredData.filter((product) =>
                    product.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
                );
            }

            setProducts(filteredData);
            setLoading(false);
        }, { category: categoryFilter, limitCount: 100 });

        return () => unsubscribe();
    }, [userLocation, filters]);

    return { products, loading };
};
