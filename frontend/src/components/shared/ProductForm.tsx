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

interface ProductFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isEdit?: boolean;
}

export default function ProductForm({
  onSubmit,
  initialData,
  isEdit = false,
}: ProductFormProps) {
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
      setError("Please select a category.");
      return;
    }

    if (!isForExchange && !isForSale) {
      setError("Please select at least one transaction type.");
      return;
    }

    if (isForSale && !price) {
      setError("Please enter a price for the product.");
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
        <CardTitle>{isEdit ? "Edit Product" : "Publish a New Product"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update the form below to edit your product."
            : "Fill out the form below to list your product on the portal."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="e.g., Fresh Tomatoes"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., Ripe and juicy tomatoes from my garden."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="fruits">Fruits</SelectItem>
                <SelectItem value="handmade">Handmade Goods</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="picture">Product Picture</Label>
            <Input id="picture" type="file" />
          </div>
          <div className="grid gap-2">
            <Label>Transaction Type</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exchange"
                checked={isForExchange}
                onCheckedChange={(checked) => setIsForExchange(!!checked)}
              />
              <Label htmlFor="exchange">For Exchange</Label>
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
              <Label htmlFor="sale">For Sale</Label>
            </div>
          </div>
          {isForSale && (
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 5.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full">
          {isEdit ? "Save Changes" : "Publish Product"}
        </Button>
      </CardFooter>
    </Card>
  );
}
