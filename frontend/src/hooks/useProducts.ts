import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/product";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import { getDistance } from "@/lib/geolocation";
import { UserData } from "@/types/user";

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
    const [rawProducts, setRawProducts] = useState<Product[]>([]);
    const [processedProducts, setProcessedProducts] = useState<Product[]>([]);
    const [userProfiles, setUserProfiles] = useState<Map<string, UserData>>(new Map());
    const [loading, setLoading] = useState(true);

    // 1. Subscription - Only re-subscribe if categories change (the only server-side filter used)
    const categoriesKey = filters.categories.sort().join(',');
    useEffect(() => {
        setLoading(true);
        const categoriesFilter = filters.categories.length > 0 ? filters.categories : undefined;

        const unsubscribe = ProductService.subscribeToProducts((productsData) => {
            setRawProducts(productsData);
        }, { categories: categoriesFilter, limitCount: 100 });

        return () => unsubscribe();
    }, [categoriesKey]);

    // 2. Fetch Producer Profiles - Reactive to raw products change
    useEffect(() => {
        const uids = Array.from(new Set(rawProducts.map(p => p.userId).filter(Boolean)));
        if (uids.length === 0) {
            // If we have products but no UIDs (unlikely), stop loading
            if (rawProducts.length > 0) setLoading(false);
            return;
        }

        let active = true;
        const fetchProfiles = async () => {
            try {
                const profiles = await UserService.getUsersProfiles(uids);
                if (active) {
                    setUserProfiles(new Map(profiles.map(u => [u.uid!, u])));
                }
            } catch (error) {
                console.error("Error fetching profiles in useProducts:", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchProfiles();
        return () => { active = false; };
    }, [rawProducts]);

    // 3. Client-side Processing - Distance, Joining, Filtering, and Sorting
    useEffect(() => {
        // Base filtering (own products)
        let data = rawProducts.filter((product) =>
            !excludeUserId || filters.showOwnProducts || product.userId !== excludeUserId
        );

        // Join location and calculate distance
        data = data.map(product => {
            const producer = userProfiles.get(product.userId);
            const location = producer?.location;

            let distance: number | undefined;
            if (userLocation && location) {
                distance = getDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    location.latitude,
                    location.longitude
                );
            }

            return {
                ...product,
                location: location || product.location,
                distance
            };
        });

        // Transaction Type filter
        if (filters.transactionTypes.length > 0) {
            data = data.filter((product) => {
                const matchesExchange = filters.transactionTypes.includes('exchange') && product.isForExchange;
                const matchesFree = filters.transactionTypes.includes('free') && product.isFree;
                return matchesExchange || matchesFree;
            });
        }

        // Distance filter
        if (filters.distance < 100) {
            data = data.filter(
                (product) => (product.distance || Infinity) <= filters.distance
            );
        }

        // Search term filter
        if (filters.searchTerm) {
            const search = filters.searchTerm.toLowerCase();
            data = data.filter((product) =>
                product.name.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search)
            );
        }

        // Sorting
        switch (filters.sortBy) {
            case "date_newest":
                data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                break;
            case "date_oldest":
                data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
                break;
            case "distance":
            default:
                if (userLocation) {
                    data.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
                }
                break;
        }

        setProcessedProducts(data);
    }, [
        rawProducts,
        userProfiles,
        userLocation,
        filters.searchTerm,
        filters.distance,
        filters.sortBy,
        filters.showOwnProducts,
        filters.transactionTypes.join(','),
        excludeUserId
    ]);

    return { products: processedProducts, loading };
};
