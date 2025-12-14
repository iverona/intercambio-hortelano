"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProductForm, { ProductSubmitData } from "@/components/shared/ProductForm";
import { useI18n } from "@/locales/provider";
import { useProduct, useProductMutations } from "@/hooks/useProduct";

export default function EditProductPage() {
  const t = useI18n();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { product, loading: productLoading } = useProduct(id);
  const { updateProduct, loading: isUpdating } = useProductMutations();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (data: ProductSubmitData) => {
    if (id && product) {
      // Prepare data for update
      const retainedUrls = data.retainedImageUrls || [];
      const originalUrls = product.imageUrls || [];
      const urlsToDelete = originalUrls.filter(url => !retainedUrls.includes(url));

      await updateProduct(
        id,
        {
          name: data.name,
          description: data.description,
          category: data.category,
          isForExchange: data.isForExchange,
          isForSale: data.isForSale,
          // userId and createdAt are not updated
          // location is not currently editable?
        },
        data.newImages,
        urlsToDelete
      );
      router.push("/my-garden");
    }
  };

  if (authLoading || productLoading || !product) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">{t('product.edit.loading')}</p>
        </div>
      </main>
    );
  }

  // Ensure current user owns the product
  if (user && product.userId !== user.uid) {
    router.push("/"); // Or show unauthorized message
    return null;
  }

  const initialData = {
    name: product.name,
    description: product.description,
    category: product.category,
    isForExchange: product.isForExchange || false,
    isForSale: product.isForSale || false,
    imageUrls: product.imageUrls,
    images: [] // Initial data doesn't have File objects yet
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <ProductForm onSubmit={handleSubmit} initialData={initialData} isEdit={true} isSubmitting={isUpdating} />
    </main>
  );
}
