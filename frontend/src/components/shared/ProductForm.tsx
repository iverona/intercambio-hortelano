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
import { Upload, X } from "lucide-react";
import Image from "next/image";

export interface ProductData {
  name: string;
  description: string;
  category: string;
  isForExchange: boolean;
  price: number | null;
  images: File[];
  imageUrls?: string[];
}

export interface ProductSubmitData {
  name: string;
  description: string;
  category: string;
  isForExchange: boolean;
  price: number | null;
  newImages: File[];
  retainedImageUrls: string[];
}

interface ProductFormProps {
  onSubmit: (data: ProductSubmitData) => void;
  initialData?: ProductData;
  isEdit?: boolean;
}

export default function ProductForm({
  onSubmit,
  initialData,
  isEdit = false,
}: ProductFormProps) {
  const t = useI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isForExchange, setIsForExchange] = useState(false);
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imageSources, setImageSources] = useState<({ type: 'url', value: string } | { type: 'file', value: File, preview: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "");
      setIsForExchange(initialData.isForExchange || false);
      setIsForSale(!!initialData.price);
      setPrice(initialData.price ? initialData.price.toString() : "");
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

    if (isForSale && !price) {
      setError(t('product.form.error.no_price'));
      return;
    }

    if (isForSale && parseFloat(price) < 0) {
      setError(t('product.form.error.negative_price'));
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
      price: isForSale ? parseFloat(price) : null,
      newImages,
      retainedImageUrls,
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? t('product.edit.title') : t('product.publish.title')}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update the form below to edit your product."
            : "Fill out the form below to list your product on the portal."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('product.form.name_label')}</Label>
            <Input
              id="name"
              placeholder={t('product.form.name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t('product.form.description_label')}</Label>
            <Textarea
              id="description"
              placeholder={t('product.form.description_placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">{t('product.form.category_label')}</Label>
            <Select onValueChange={setCategory} value={category}>
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
          <div className="grid gap-2">
            <Label htmlFor="picture">{t("product.form.picture_label")}</Label>
            {imageSources.length > 0 && (
              <Carousel className="w-full max-w-xs mx-auto">
                <CarouselContent>
                  {imageSources.map((source, index) => (
                    <CarouselItem key={index}>
                      <div className="relative">
                        <Image
                          src={source.type === 'url' ? source.value : source.preview}
                          alt={`Preview ${index + 1}`}
                          width={300}
                          height={300}
                          className="object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveImage(index)}
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
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">
                        {t("product.form.upload_cta")}
                      </span>{" "}
                      {t("product.form.upload_drag_drop")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("product.form.upload_restrictions")}
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
          <div className="grid gap-2">
            <Label>{t('product.form.transaction_type_label')}</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exchange"
                checked={isForExchange}
                onCheckedChange={(checked) => setIsForExchange(!!checked)}
              />
              <Label htmlFor="exchange">{t('product.form.for_exchange_label')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sale"
                checked={isForSale}
                onCheckedChange={(checked) => {
                  setIsForSale(!!checked);
                  if (!checked) {
                    setPrice("");
                  }
                }}
              />
              <Label htmlFor="sale">{t('product.form.for_sale_label')}</Label>
            </div>
          </div>
          {isForSale && (
            <div className="grid gap-2">
              <Label htmlFor="price">{t('product.form.price_label')}</Label>
              <Input
                id="price"
                type="number"
                min="0"
                placeholder={t('product.form.price_placeholder')}
                value={price}
                onChange={(e) => {
                  const newPrice = e.target.value;
                  setPrice(newPrice);
                  if (parseFloat(newPrice) < 0) {
                    setError(t("product.form.error.negative_price"));
                  } else {
                    setError(null);
                  }
                }}
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full">
          {isEdit ? t('product.form.save_button') : t('product.form.publish_button')}
        </Button>
      </CardFooter>
    </Card>
  );
}
