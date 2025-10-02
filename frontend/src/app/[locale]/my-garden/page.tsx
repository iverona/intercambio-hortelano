"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flower2,
  Plus,
  Package,
  Eye,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Trash2,
  Edit,
  Leaf,
} from "lucide-react";
import { useI18n } from "@/locales/provider";

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

// Stats card component
const StatsCard = ({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) => (
  <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
    <div className="flex items-center gap-4">
      <div className={`p-3 ${color} rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </Card>
);

// Empty state component
const EmptyState = ({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-dashed border-2 shadow-lg">
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 bg-green-200 dark:bg-green-800 rounded-full blur-2xl opacity-30 animate-pulse"></div>
        <Icon className="w-20 h-20 text-gray-400 dark:text-gray-600 relative z-10" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  </Card>
);

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
      try {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data() as Product;
          if (productData.imageUrls && productData.imageUrls.length > 0) {
            const deletePromises = productData.imageUrls.map((url) => {
              // Extract the path from the URL
              const imagePath = url.split("/o/")[1].split("?")[0];
              const decodedPath = decodeURIComponent(imagePath);
              const imageRef = ref(storage, decodedPath);
              return deleteObject(imageRef).catch((error) => {
                // If the image doesn't exist, we can ignore the error
                if (error.code === "storage/object-not-found") {
                  console.log(`Image not found, skipping deletion: ${url}`);
                } else {
                  // For other errors, we might want to throw them to stop the process
                  throw error;
                }
              });
            });
            await Promise.all(deletePromises);
          }
        }
        await deleteDoc(productRef);
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/product/${id}/edit`);
  };

  // Show loading state while checking authentication
  if (loading || productsLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl"></div>
              <ProductGridSkeleton />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Don't render content if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-b">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <Flower2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {t('my_garden.title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t('my_garden.subtitle')}
                  </p>
                </div>
              </div>
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all group"
              >
                <Link href="/publish">
                  <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                  {t('my_garden.add_new_product')}
                </Link>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={Package}
                label={t('my_garden.stats.active_products')}
                value={products.length}
                color="bg-gradient-to-br from-blue-500 to-indigo-500"
              />
              <StatsCard
                icon={Eye}
                label={t('my_garden.stats.total_views')}
                value="234"
                color="bg-gradient-to-br from-purple-500 to-pink-500"
              />
              <StatsCard
                icon={MessageSquare}
                label={t('my_garden.stats.inquiries')}
                value="12"
                color="bg-gradient-to-br from-orange-500 to-red-500"
              />
              <StatsCard
                icon={TrendingUp}
                label={t('my_garden.stats.success_rate')}
                value="85%"
                color="bg-gradient-to-br from-green-500 to-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Products Section Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('my_garden.your_products', { count: products.length })}
              </h2>
              {products.length > 0 && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t('my_garden.all_active')}
                </Badge>
              )}
            </div>

            {/* Decorative divider */}
            {products.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4">
                    <Leaf className="w-5 h-5 text-green-500" />
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
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                  
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
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg group"
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
            <Card className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t('my_garden.tips.title')}
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('my_garden.tips.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('my_garden.tips.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('my_garden.tips.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('my_garden.tips.item4')}</span>
                </li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
