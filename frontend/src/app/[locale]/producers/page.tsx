"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/locales/provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProducerAvatar } from "@/components/shared/ProducerAvatar";
import { useProducers } from "@/hooks/useProducers";
import { Producer } from "@/types/user";
import {
 ArrowRight,
 Users,
 Sparkles,
 Store,
 Heart,
 MapPin,
 Package,
 TrendingUp
} from "lucide-react";
import { OrganicBackground } from "@/components/shared/OrganicBackground";

// Skeleton loader component
const ProducerSkeleton = () => (
 <div className="animate-pulse">
  <Card className="overflow-hidden border-0 shadow-lg bg-card ">
   <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 h-32"></div>
   <div className="p-6 space-y-3">
    <div className="flex items-center gap-4">
     <div className="w-16 h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full"></div>
     <div className="space-y-2 flex-1">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
     </div>
    </div>
    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full"></div>
    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-4/5"></div>
   </div>
  </Card>
 </div>
);

// Hero section component (content only)
const HeroSectionContent = ({ producerCount }: { producerCount: number }) => {
 const t = useI18n();
 return (
  <div className="text-center max-w-4xl mx-auto py-8">
   {/* Welcome badge */}
   <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full shadow-lg mb-6 border border-card ">
    <Sparkles className="w-4 h-4 text-secondary" />
    <span className="text-sm font-medium text-foreground ">{t('producers.hero.badge')}</span>
   </div>

   {/* Main heading */}
   <h1 className="text-5xl lg:text-7xl font-bold font-display text-foreground mb-6">
    {t('producers.title')}
   </h1>

   {/* Subtitle */}
   <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed font-serif">
    {t('producers.subtitle')}
   </p>

   {/* Stats */}
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
    <Card className="p-4 bg-card/60 backdrop-blur-sm border border-[#A6C6B9] dark:border-[#4A5D54] shadow-lg">
     <div className="flex items-center justify-center gap-3">
      <div className="p-2 bg-muted rounded-lg">
       <Users className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
       <p className="text-2xl font-bold text-foreground ">{producerCount}</p>
       <p className="text-sm text-muted-foreground ">{t('producers.stats.active')}</p>
      </div>
     </div>
    </Card>

    <Card className="p-4 bg-card/60 backdrop-blur-sm border border-primary dark:border-[#5a6359] shadow-lg">
     <div className="flex items-center justify-center gap-3">
      <div className="p-2 bg-primary rounded-lg">
       <Package className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
       <p className="text-2xl font-bold text-foreground ">2.5k+</p>
       <p className="text-sm text-muted-foreground ">{t('producers.stats.products')}</p>
      </div>
     </div>
    </Card>

    <Card className="p-4 bg-card/60 backdrop-blur-sm border border-secondary dark:border-[#998676] shadow-lg">
     <div className="flex items-center justify-center gap-3">
      <div className="p-2 bg-secondary dark:bg-secondary rounded-lg">
       <TrendingUp className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
       <p className="text-2xl font-bold text-foreground ">98%</p>
       <p className="text-sm text-muted-foreground ">{t('producers.stats.satisfaction')}</p>
      </div>
     </div>
    </Card>
   </div>
  </div>
 );
};

// Enhanced producer card with animations
const ProducerCard = ({ producer, index }: { producer: Producer; index: number }) => {
 const t = useI18n();
 const producerName = producer.name || t('producers.unnamed');
 const isNew = Math.random() > 0.7; // Mock new producer logic
 const hasLocation = producer.address || producer.distance !== undefined;

 return (
  <div
   className="group relative transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
   style={{ animationDelay: `${index * 50}ms` }}
  >
   {/* New badge */}
   {isNew && (
    <div className="absolute -top-2 -right-2 z-10">
     <Badge className="bg-secondary text-white border-0 shadow-lg animate-pulse">
      {t('producers.new_badge')}
     </Badge>
    </div>
   )}

   {/* Hover glow effect */}
   <div className="absolute inset-0 bg-muted rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>

   <Card className="relative overflow-hidden border border-card shadow-lg hover:shadow-2xl transition-all duration-300 bg-card ">
    {/* Header - Light Green */}
    <div className="h-24 bg-card/50 relative">
     {/* Favorite button - White Circle */}
     <button className="absolute top-3 right-3 p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
      <Heart className="w-4 h-4 text-gray-400 dark:text-gray-300 hover:text-secondary transition-colors" />
     </button>
    </div>

    <CardContent className="relative pt-0">
     <div className="flex gap-4 mb-4">
      {/* Avatar - Floating */}
      <div className="-mt-10 relative z-10 shrink-0">
       <ProducerAvatar
        avatarUrl={producer.avatarUrl}
        name={producerName}
        size="md"
        className="border-4 border-white dark:border-gray-800 shadow-md h-20 w-20"
       />
      </div>

      {/* Name & Location - Right Side */}
      <div className="pt-2 min-w-0 flex-1">
       <h3 className="text-lg font-bold text-foreground leading-tight pr-2 font-display">
        {producerName}
       </h3>
       {hasLocation && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
         <MapPin className="w-3 h-3 shrink-0" />
         <span className="truncate">
          {producer.address}
          {producer.distance !== undefined && ` • ${Math.round(producer.distance)} km`}
         </span>
        </div>
       )}
      </div>
     </div>

     {/* Bio */}
     <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[2.5rem] font-serif">
      {producer.bio || t('producers.no_bio')}
     </p>

     {/* Stats Badges */}
     <div className="flex flex-wrap gap-2 mb-6">
      <Badge variant="secondary" className="bg-muted/20 text-foreground dark:text-card-foreground border-0 font-normal hover:bg-muted/30 px-3">
       <Package className="w-3.5 h-3.5 mr-1.5" />
       {producer.productsCount || 0} {t('producers.products_label')}
      </Badge>
      <Badge variant="secondary" className="bg-primary/20 text-foreground dark:text-card-foreground border-0 font-normal hover:bg-primary/30 px-3">
       <Store className="w-3.5 h-3.5 mr-1.5" />
       {t('producers.verified')}
      </Badge>
     </div>

     {/* Button - Dark */}
     <Button asChild className="w-full bg-primary hover:bg-[#7a8578] text-white shadow-sm group/button">
      <Link href={`/producers/${producer.uid}`}>
       <span className="font-medium">{t('producers.view_shop')}</span>
       <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
      </Link>
     </Button>
    </CardContent>
   </Card>
  </div>
 );
};

export default function ProducersPage() {
 const t = useI18n();
 const { producers, loading } = useProducers();

 return (
  <OrganicBackground className="pb-20 md:pb-0">
   <div className="container mx-auto px-4">
    {/* Hero Section */}
    <HeroSectionContent producerCount={producers.length} />

    {/* Section Header */}
    <div className="mb-10 max-w-6xl mx-auto">
     <div className="flex items-center justify-between mb-6">
      <div>
       <h2 className="text-3xl font-bold font-display text-foreground ">
        {t('producers.section_title')}
       </h2>
       <p className="mt-2 text-muted-foreground font-serif">
        {loading ? (
         <span className="inline-block w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
        ) : (
         t('producers.showing')
        )}
       </p>
      </div>
     </div>

     {/* Decorative divider */}
     <div className="relative">
      <div className="absolute inset-0 flex items-center">
       <div className="w-full border-t border-[#A6C6B9]/30 dark:border-[#4A5D54]/30"></div>
      </div>
      <div className="relative flex justify-center">
       <span className="bg-background px-4">
        <Users className="w-5 h-5 text-primary" />
       </span>
      </div>
     </div>
    </div>

    {/* Producers Grid or Loading/Empty State */}
    <div className="max-w-6xl mx-auto">
     {loading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
       {[...Array(8)].map((_, i) => (
        <ProducerSkeleton key={i} />
       ))}
      </div>
     ) : producers.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
       {producers.map((producer, index) => (
        <ProducerCard key={producer.uid} producer={producer} index={index} />
       ))}
      </div>
     ) : (
      <EmptyState
       icon={Users}
       title={t('producers.empty')}
       description={t('producers.empty_description')}
       action={
        <Button asChild className="group bg-primary hover:bg-[#7a8578]">
         <Link href="/">
          {t('producers.browse_products')}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
         </Link>
        </Button>
       }
      />
     )}
    </div>
   </div>
  </OrganicBackground>
 );
}
