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
import { useState, useEffect } from "react";
import { useI18n } from "@/locales/provider";

export interface ProductData {
  name: string;
  description: string;
  category: string;
  isForExchange: boolean;
  price: number | null;
}

interface ProductFormProps {
  onSubmit: (data: ProductData) => void;
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

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "");
      setIsForExchange(initialData.isForExchange || false);
      setIsForSale(!!initialData.price);
      setPrice(initialData.price ? initialData.price.toString() : "");
    }
  }, [initialData]);

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

    onSubmit({
      name,
      description,
      category,
      isForExchange,
      price: isForSale ? parseFloat(price) : null,
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
                <SelectItem value="vegetables">{t('product.form.category.vegetables')}</SelectItem>
                <SelectItem value="fruits">{t('product.form.category.fruits')}</SelectItem>
                <SelectItem value="handmade">{t('product.form.category.handmade')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="picture">{t('product.form.picture_label')}</Label>
            <Input id="picture" type="file" />
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
