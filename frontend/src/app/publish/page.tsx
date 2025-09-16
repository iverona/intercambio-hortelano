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
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function PublishPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isForExchange, setIsForExchange] = useState(false);
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to publish a product.");
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

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      await addDoc(collection(db, "products"), {
        name,
        description,
        category,
        userId: user.uid,
        location: userData?.location || null,
        isForExchange,
        price: isForSale ? parseFloat(price) : null,
      });
      router.push("/");
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading...</p>
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Publish a New Product</CardTitle>
          <CardDescription>
            Fill out the form below to list your product on the portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="grid gap-6">
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
              <Select onValueChange={setCategory}>
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
                  onCheckedChange={(checked) => setIsForSale(!!checked)}
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
          <Button onClick={handlePublish} className="w-full">
            Publish Product
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
