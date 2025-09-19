"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
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
  Package,
  Eye,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Trash2,
  Edit,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
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
  <Card className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className={`p-3 ${color} rounded-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
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
  <Card className="p-12 text-center bg-gray-50/50 dark:bg-gray-900/50 border-dashed">
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl opacity-30"></div>
        <Icon className="w-16 h-16 text-gray-400 dark:text-gray-600 relative z-10" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  </Card>
);

// Loading skeleton component
const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl h-64"></div>
      </div>
    ))}
  </div>
);

export default function MyGardenPage() {
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
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/product/${id}/edit`);
  };

  // Show loading state while checking authentication
  if (loading || productsLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48 mb-8"></div>
          </div>
          <ProductGridSkeleton />
        </div>
      </main>
    );
  }

  // Don't render content if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-400 to-green-500 rounded-lg">
                <Flower2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  My Garden
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your products and offerings
                </p>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href="/publish">
                <Plus className="mr-2 h-5 w-5" />
                Add New Product
              </Link>
            </Button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={Package}
              label="Active Products"
              value={products.length}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatsCard
              icon={Eye}
              label="Total Views"
              value="234"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatsCard
              icon={MessageSquare}
              label="Inquiries"
              value="12"
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatsCard
              icon={TrendingUp}
              label="Success Rate"
              value="85%"
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Your Products ({products.length})
            </h2>
            {products.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  All Active
                </Badge>
              </div>
            )}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => handleEdit(product.id)}
                  onDelete={() => handleDelete(product.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Flower2}
              title="No products in your garden yet"
              description="Start sharing your garden's bounty with the community. Add your first product to get started!"
              action={
                <Button asChild size="lg">
                  <Link href="/publish">
                    <Plus className="mr-2 h-4 w-4" />
                    Publish Your First Product
                  </Link>
                </Button>
              }
            />
          )}
        </div>

        {/* Tips Section */}
        {products.length > 0 && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              💡 Tips for Success
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Add clear, well-lit photos of your products</li>
              <li>• Update your listings regularly with availability</li>
              <li>• Respond to inquiries promptly to build trust</li>
              <li>• Consider offering variety packs or bundles</li>
            </ul>
          </Card>
        )}
      </div>
    </main>
  );
}
