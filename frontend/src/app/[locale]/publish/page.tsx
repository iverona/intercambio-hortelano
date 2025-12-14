"use client";

import ProductForm, { ProductSubmitData } from "@/components/shared/ProductForm";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ArrowLeft,
  Sparkles,
  Upload,
  AlertCircle,
  Leaf,
  MapPin,
  Camera
} from "lucide-react";
import { useI18n } from "@/locales/provider";
import { useProductMutations } from "@/hooks/useProduct";
import { useUser as useUserHook } from "@/hooks/useUser";

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 mb-8"></div>
    <div className="space-y-6">
      <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"></div>
      <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"></div>
        <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// Hero section for publish page
const PublishHero = () => {
  const t = useI18n();
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-b">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <Upload className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {t('publish.publish_your_product')}
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                  {t('publish.hero_subtitle')}
                </p>
              </div>
            </div>

            <div className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{t('publish.share_with_community')}</span>
            </div>
          </div>

          {/* Quick tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <Card className="p-3 md:p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
                  <Camera className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t('publish.tip.add_photos')}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{t('publish.tip.add_photos_desc')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t('publish.tip.location')}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{t('publish.tip.location_desc')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                  <Leaf className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t('publish.tip.exchange')}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{t('publish.tip.exchange_desc')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error component
const ErrorMessage = ({ message }: { message: string }) => {
  const t = useI18n();
  return (
    <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-900 dark:text-red-100">{t('publish.error_publishing')}</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Success animation component
const SuccessAnimation = () => {
  const t = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="p-8 bg-white dark:bg-gray-800 shadow-2xl">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('publish.success_title')}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('publish.success_subtitle')}
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function PublishPage() {
  const t = useI18n();
  const { user, loading } = useAuth(); // Assuming useAuth exposes userData? Actually useUser hook exposes userData, useAuth exposes user (firebaseUser).
  // Wait, I need userData for location. 
  // Let's check imports. useAuth handles user session. 
  // In the original file, it was fetching user doc locally.
  // I should probably use `useUser` hook instead of manual fetch if possible, or just fetch since it's one-off.
  // But wait, `useProductMutations` handles the creation. Does it handle location?
  // `createProduct` method in Service takes `data`.
  // The `PublishPage` was adding `location: userData?.location || null`.
  // I need to fetch user data here to get the location.
  // I can use `useUser` hook I just updated? No, `useUser` hook is for current user profile management, `useUserProfile` is for others.
  // The `useUser` hook calls `UserService.getUserProfile`. 
  // Let's assume I can use `useUser` hook here to get `userData`.

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { createProduct, loading: isPublishing } = useProductMutations();

  // Create a local effect to fetch user data for location
  // Or better, update useProductMutations or ProductService to handle it?
  // Service shouldn't depend on auth context state directly if passed as args.
  // I will fetch user profile here. 
  // Wait, `useAuth` usually provides basic user info. Does it provide location? No.
  // Use `useUser` hook from `@/hooks/useUser`.

  const { userData: currentUserProfile } = useUserHook(); // Need to import useUser as useUserHook to avoid naming conflict or just import useUser

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);


  const handlePublish = async (data: ProductSubmitData) => {
    if (!user) {
      setError(t("publish.error.must_be_logged_in"));
      return;
    }

    try {
      await createProduct({
        name: data.name,
        description: data.description,
        category: data.category,
        isForExchange: data.isForExchange,
        isForSale: data.isForSale,
        imageUrls: [], // Service handles images upload
        userId: user.uid,
        location: currentUserProfile?.location || undefined,
      }, data.newImages);

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <PublishHero />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 shadow-xl border-0">
              <LoadingSkeleton />
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {showSuccess && <SuccessAnimation />}

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 pb-20 md:pb-0">
        <PublishHero />

        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 md:mb-6 group -ml-2 md:ml-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">{t('publish.back_to_home')}</span>
              <span className="sm:hidden">{t('product.back')}</span>
            </Button>

            {/* Form Card */}
            <Card className="p-4 md:p-8 shadow-xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-1.5 md:p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {t('publish.product_details')}
                  </h2>
                </div>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  {t('publish.form_subtitle')}
                </p>
              </div>

              {/* Decorative divider */}
              <div className="relative mb-4 md:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-gray-800 px-3 md:px-4">
                    <Leaf className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  </span>
                </div>
              </div>

              <ProductForm
                onSubmit={handlePublish}
                isSubmitting={isPublishing}
              />

              {error && <ErrorMessage message={error} />}
            </Card>

            {/* Help section */}
            <Card className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-lg">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md flex-shrink-0">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t('publish.help_title')}
                </h3>
              </div>
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                {t('publish.help_subtitle')}
              </p>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}


