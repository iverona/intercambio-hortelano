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
  Leaf
} from "lucide-react";
import { useI18n } from "@/locales/provider";
import { useProductMutations } from "@/hooks/useProduct";
import { useUser as useUserHook } from "@/hooks/useUser";
import { OrganicBackground } from "@/components/shared/OrganicBackground";

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

// Hero content without background
const PublishHeroContent = () => {
  const t = useI18n();
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-primary text-white shadow-lg transform -rotate-2" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            <Upload className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold font-display text-foreground ">
              {t('publish.publish_your_product')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 font-serif italic">
              {t('publish.hero_subtitle')}
            </p>
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
      <Card className="p-8 bg-card shadow-2xl border border-[#A6C6B9]/30">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-4 bg-primary rounded-full shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold font-display text-foreground ">
            {t('publish.success_title')}
          </h2>
          <p className="mt-2 text-muted-foreground ">
            {t('publish.success_subtitle')}
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function PublishPage() {
  const t = useI18n();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { createProduct, loading: isPublishing } = useProductMutations();
  const { userData: currentUserProfile } = useUserHook();

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
        isFree: data.isFree,
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
      <OrganicBackground className="">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 shadow-xl border border-gray-100 dark:border-gray-700 bg-card ">
              <LoadingSkeleton />
            </Card>
          </div>
        </div>
      </OrganicBackground>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <OrganicBackground className="pb-20 md:pb-0">
      {showSuccess && <SuccessAnimation />}

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Hero Content */}
        <PublishHeroContent />

        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 md:mb-6 group -ml-2 md:ml-0 text-foreground hover:bg-muted/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">{t('publish.back_to_home')}</span>
            <span className="sm:hidden">{t('common.back')}</span>
          </Button>

          {/* Form Card */}
          <Card className="p-4 md:p-8 shadow-xl border border-gray-100 dark:border-gray-700 bg-card/95 /95 backdrop-blur-sm relative overflow-hidden">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A6C6B9] via-[#879385] to-[#A88C8F] opacity-70"></div>


            <ProductForm
              onSubmit={handlePublish}
              isSubmitting={isPublishing}
            />

            {error && <ErrorMessage message={error} />}
          </Card>

          {/* Help section */}
          <Card className="mt-6 md:mt-8 p-4 md:p-6 bg-card border-none shadow-lg relative overflow-hidden transform rotate-1">
            {/* Decorative tape effect */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-secondary/20 dark:bg-secondary/10 rotate-1 backdrop-blur-sm shadow-sm"></div>

            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 relative z-10">
              <div className="p-1.5 md:p-2 bg-primary rounded-lg shadow-md flex-shrink-0">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-[#3E3B34] dark:text-card-foreground font-serif">
                {t('publish.help_title')}
              </h3>
            </div>
            <p className="text-xs md:text-sm text-[#3E3B34]/80 dark:text-card-foreground/80 relative z-10">
              {t('publish.help_subtitle')}
            </p>

            <Leaf className="absolute -bottom-4 -right-4 w-20 h-20 text-[#556B2F] dark:text-[#9FB380] opacity-10 transform -rotate-12" />
          </Card>
        </div>
      </div>
    </OrganicBackground>
  );
}
