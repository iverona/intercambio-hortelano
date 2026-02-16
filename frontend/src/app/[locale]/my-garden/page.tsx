"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Flower2,
    Plus,
    Sparkles,
    Leaf,
} from "lucide-react";
import { useI18n } from "@/locales/provider";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { useProductMutations } from "@/hooks/useProduct";

interface Product {
    id: string;
    name: string;
    description: string;
    imageUrls: string[];
    createdAt?: {
        seconds: number;
        nanoseconds: number;
    };
}

// Loading skeleton component
const ProductGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
                <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-64"></div>
                <div className="mt-4 space-y-3">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);

export default function MyGardenPage() {
    const t = useI18n();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const { deleteProduct } = useProductMutations();

    useEffect(() => {
        // Redirect to home if not authenticated
        if (!loading && !user) {
            router.push("/");
            return;
        }

        if (user) {
            const productsQuery = query(
                collection(db, "products"),
                where("userId", "==", user.uid)
            );

            const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
                const productsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Product[];
                setProducts(productsData);
                setProductsLoading(false);
            });

            return () => {
                unsubscribeProducts();
            };
        }
    }, [user, loading, router]);

    const handleDelete = async (id: string) => {
        if (confirm(t("my_garden.delete_confirm"))) {
            await deleteProduct(id);
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/product/${id}/edit`);
    };

    // Show loading state while checking authentication
    if (loading || productsLoading) {
        return (
            <OrganicBackground className="">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="animate-pulse space-y-8">
                            <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl"></div>
                            <ProductGridSkeleton />
                        </div>
                    </div>
                </div>
            </OrganicBackground>
        );
    }

    // Don't render content if no user (will redirect)
    if (!user) {
        return null;
    }

    return (
        <OrganicBackground className="pb-20 md:pb-0">
            <div className="container mx-auto px-4">
                {/* Hero Header */}
                <div className="max-w-6xl mx-auto py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary rounded-xl shadow-lg">
                                <Flower2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold font-display text-foreground ">
                                    {t('my_garden.title')}
                                </h1>
                                <p className="text-muted-foreground mt-1 font-serif">
                                    {t('my_garden.subtitle')}
                                </p>
                            </div>
                        </div>
                        <Button
                            asChild
                            size="lg"
                            className="bg-secondary hover:bg-[#8f7477] text-white shadow-lg transition-all group"
                        >
                            <Link href="/publish">
                                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                                {t('my_garden.add_new_product')}
                            </Link>
                        </Button>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-6xl mx-auto">
                        {/* Products Section Header */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold font-display text-foreground ">
                                    {t('my_garden.your_products', { count: products.length })}
                                </h2>
                                {products.length > 0 && (
                                    <Badge className="bg-primary text-white border-0 shadow-md">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {t('my_garden.all_active')}
                                    </Badge>
                                )}
                            </div>

                            {/* Decorative divider */}
                            {products.length > 0 && (
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[#A6C6B9]/30 dark:border-[#4A5D54]/30"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-background px-4">
                                            <Leaf className="w-5 h-5 text-primary dark:text-[#A6C6B9]" />
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {products.map((product) => (
                                    <div key={product.id} className="group relative transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 bg-muted/20 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>

                                        <ProductCard
                                            product={product}
                                            onEdit={() => handleEdit(product.id)}
                                            onDelete={() => handleDelete(product.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Flower2}
                                title={t('my_garden.empty_state.title')}
                                description={t('my_garden.empty_state.subtitle')}
                                action={
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-primary hover:bg-[#7a8578] text-white shadow-lg group"
                                    >
                                        <Link href="/publish">
                                            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                                            {t('my_garden.empty_state.cta')}
                                        </Link>
                                    </Button>
                                }
                            />
                        )}

                        {/* Tips Section */}
                        {products.length > 0 && (
                            <Card className="mt-8 p-6 bg-card border border-card shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-muted rounded-lg shadow-md">
                                        <Sparkles className="w-5 h-5 text-foreground dark:text-card-foreground" />
                                    </div>
                                    <h3 className="text-lg font-bold font-display text-foreground ">
                                        {t('my_garden.tips.title')}
                                    </h3>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground font-serif">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{t('my_garden.tips.item1')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{t('my_garden.tips.item2')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{t('my_garden.tips.item3')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{t('my_garden.tips.item4')}</span>
                                    </li>
                                </ul>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </OrganicBackground>
    );
}
