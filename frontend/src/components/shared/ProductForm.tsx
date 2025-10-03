"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/locales/provider";
import { categories } from "@/lib/categories";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import imageCompression from "browser-image-compression";
import { Loader2, Upload, X, Package, MessageSquare, Tag, Camera, Leaf, ArrowRightLeft, DollarSign } from "lucide-react";
import Image from "next/image";

export interface ProductData {
  name: string;
  description: string;
  category: string;
  isForExchange: boolean;
  isForSale: boolean;
  images: File[];
  imageUrls?: string[];
}

export interface ProductSubmitData {
  name: string;
  description: string;
  category: string;
  isForExchange: boolean;
  isForSale: boolean;
  newImages: File[];
  retainedImageUrls: string[];
}

interface ProductFormProps {
  onSubmit: (data: ProductSubmitData) => void;
  initialData?: ProductData;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

export default function ProductForm({
  onSubmit,
  initialData,
  isEdit = false,
  isSubmitting = false,
}: ProductFormProps) {
  const t = useI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isForExchange, setIsForExchange] = useState(false);
  const [isForSale, setIsForSale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSources, setImageSources] = useState<({ type: 'url', value: string } | { type: 'file', value: File, preview: string })[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "");
      setIsForExchange(initialData.isForExchange || false);
      setIsForSale(initialData.isForSale || false);
      if (initialData.imageUrls) {
        setImageSources(initialData.imageUrls.map(url => ({ type: 'url', value: url })));
      }
    }
  }, [initialData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageSources.length + files.length > 4) {
      setError(t("product.form.error.max_images"));
      return;
    }

    setIsCompressing(true);
    const newSources: { type: 'file', value: File, preview: string }[] = [];
    for (const file of files) {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        newSources.push({ type: 'file', value: compressedFile, preview: URL.createObjectURL(compressedFile) });
      } catch (error) {
        console.error("Error compressing image:", error);
        setError(t("product.form.error.image_compression"));
      }
    }
    setImageSources([...imageSources, ...newSources]);
    setIsCompressing(false);
  };

  const handleRemoveImage = (index: number) => {
    const newImageSources = [...imageSources];
    newImageSources.splice(index, 1);
    setImageSources(newImageSources);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      setError(t('product.form.error.no_category'));
      return;
    }

    if (!isForExchange && !isForSale) {
      setError(t('product.form.error.no_transaction_type'));
      return;
    }

    const newImages = imageSources
      .filter((s) => s.type === "file")
      .map((s) => (s as { type: "file"; value: File }).value);
    const retainedImageUrls = imageSources
      .filter((s) => s.type === "url")
      .map((s) => (s as { type: "url"; value: string }).value);

    onSubmit({
      name,
      description,
      category,
      isForExchange,
      isForSale,
      newImages,
      retainedImageUrls,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
      {/* Product Name Section */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md flex-shrink-0">
            <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <Label htmlFor="name" className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('product.form.name_label')}
            </Label>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
              {t('product.form.name_placeholder')}
            </p>
          </div>
        </div>
        <Input
          id="name"
          placeholder={t('product.form.name_placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEdit || isSubmitting}
          className="text-base"
        />
      </div>

      {/* Decorative divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-800 px-4">
            <Leaf className="w-5 h-5 text-green-500" />
          </span>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md flex-shrink-0">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <Label htmlFor="description" className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('product.form.description_label')}
            </Label>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
              {t('product.form.description_placeholder')}
            </p>
          </div>
        </div>
        <Textarea
          id="description"
          placeholder={t('product.form.description_placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={5}
          className="resize-none"
        />
      </div>

      {/* Decorative divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-800 px-4">
            <Leaf className="w-5 h-5 text-green-500" />
          </span>
        </div>
      </div>

      {/* Category Section */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-md flex-shrink-0">
            <Tag className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <Label htmlFor="category" className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('product.form.category_label')}
            </Label>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
              {t('product.form.category_placeholder')}
            </p>
          </div>
        </div>
        <Select onValueChange={setCategory} value={category} disabled={isSubmitting}>
          <SelectTrigger>
            <SelectValue placeholder={t('product.form.category_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {(t as any)(category.translationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Decorative divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-800 px-4">
            <Leaf className="w-5 h-5 text-green-500" />
          </span>
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md flex-shrink-0">
            <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <Label htmlFor="picture" className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("product.form.picture_label")}
            </Label>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
              {t("product.form.upload_restrictions")}
            </p>
          </div>
        </div>
        
        {imageSources.length > 0 && (
          <Carousel className="w-full max-w-md mx-auto">
            <CarouselContent>
              {imageSources.map((source, index) => (
                <CarouselItem key={index}>
                  <div className="relative">
                    <Image
                      src={source.type === 'url' ? source.value : source.preview}
                      alt={`Preview ${index + 1}`}
                      width={400}
                      height={400}
                      className="object-cover rounded-xl shadow-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
        
        {imageSources.length < 4 && (
          <div
            className="flex items-center justify-center w-full"
            onClick={() => !isSubmitting && !isCompressing && fileInputRef.current?.click()}
          >
            <div className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all duration-300 ${
              isSubmitting || isCompressing 
                ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' 
                : 'cursor-pointer hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 hover:border-green-300 dark:hover:border-green-700 border-gray-300 dark:border-gray-700'
            }`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isCompressing ? (
                  <Loader2 className="w-10 h-10 mb-4 text-green-500 animate-spin" />
                ) : (
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full mb-4">
                    <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                )}
                <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">
                    {t("product.form.upload_cta")}
                  </span>{" "}
                  {t("product.form.upload_drag_drop")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, WEBP (max 1MB)
                </p>
              </div>
              <Input
                id="picture"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
            </div>
          </div>
        )}
      </div>

      {/* Decorative divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-800 px-4">
            <Leaf className="w-5 h-5 text-green-500" />
          </span>
        </div>
      </div>

      {/* Transaction Type Section */}
      <div className="space-y-3 md:space-y-4">
        <div>
          <Label className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('product.form.transaction_type_label')}
          </Label>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('product.form.error.no_transaction_type')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Exchange Card */}
          <Card
            className={`p-3 md:p-5 cursor-pointer transition-all duration-300 border-2 ${
              isForExchange
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-500 dark:border-green-600 shadow-lg'
                : 'hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-950/10'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isSubmitting && setIsForExchange(!isForExchange)}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`p-1.5 md:p-2 rounded-lg transition-all flex-shrink-0 ${
                isForExchange 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-md' 
                  : 'bg-green-100 dark:bg-green-900'
              }`}>
                <ArrowRightLeft className={`w-4 h-4 md:w-5 md:h-5 ${isForExchange ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm md:text-base font-semibold ${isForExchange ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {t('product.form.for_exchange_label')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  Trade with other gardeners
                </p>
              </div>
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isForExchange 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {isForExchange && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>}
              </div>
            </div>
          </Card>

          {/* Sale Card */}
          <Card
            className={`p-3 md:p-5 cursor-pointer transition-all duration-300 border-2 ${
              isForSale
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-500 dark:border-blue-600 shadow-lg'
                : 'hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isSubmitting && setIsForSale(!isForSale)}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`p-1.5 md:p-2 rounded-lg transition-all flex-shrink-0 ${
                isForSale 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md' 
                  : 'bg-blue-100 dark:bg-blue-900'
              }`}>
                <DollarSign className={`w-4 h-4 md:w-5 md:h-5 ${isForSale ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm md:text-base font-semibold ${isForSale ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {t('product.form.for_sale_label')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  Sell for money
                </p>
              </div>
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isForSale 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {isForSale && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
        </Card>
      )}

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit} 
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all" 
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {isEdit ? t('product.form.save_button') : t('product.form.publish_button')}
      </Button>
    </form>
  );
}
