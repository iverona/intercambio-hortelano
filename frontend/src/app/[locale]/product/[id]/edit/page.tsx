"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProductForm, { ProductSubmitData } from "@/components/shared/ProductForm";
import { useI18n } from "@/locales/provider";
import { useProduct, useProductMutations } from "@/hooks/useProduct";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Leaf, Edit } from "lucide-react";

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
          isFree: data.isFree,
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
      <OrganicBackground className="justify-center">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground ">{t('product.edit.loading')}</p>
        </div>
      </OrganicBackground>
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
    isFree: product.isFree || false,
    imageUrls: product.imageUrls,
    images: [] // Initial data doesn't have File objects yet
  };

  return (
    <OrganicBackground className="pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 md:mb-6 group -ml-2 md:ml-0 text-foreground hover:bg-muted/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">{t('common.back')}</span>
          </Button>

          {/* Form Card */}
          <Card className="p-4 md:p-8 shadow-xl border border-gray-100 dark:border-gray-700 bg-card/95 /95 backdrop-blur-sm relative overflow-hidden">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A6C6B9] via-[#879385] to-[#A88C8F] opacity-70"></div>

            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="p-1.5 md:p-2 bg-secondary dark:bg-secondary rounded-lg shadow-sm">
                  <Edit className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-display text-foreground ">
                  {t('product.edit_title') || "Editar Producto"}
                </h2>
              </div>
            </div>

            {/* Decorative divider */}
            <div className="relative mb-4 md:mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#A6C6B9]/30 dark:border-[#4A5D54]/30"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 md:px-4">
                  <Leaf className="w-4 h-4 md:w-5 md:h-5 text-[#556B2F] dark:text-[#6B8E23]" />
                </span>
              </div>
            </div>

            <ProductForm key={id} onSubmit={handleSubmit} initialData={initialData} isEdit={true} isSubmitting={isUpdating} />
          </Card>
        </div>
      </div>
    </OrganicBackground>
  );
}
