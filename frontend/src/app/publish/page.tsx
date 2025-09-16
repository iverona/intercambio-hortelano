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
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PublishPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to publish a product.");
      return;
    }
    try {
      await addDoc(collection(db, "products"), {
        name,
        description,
        category,
        userId: user.uid,
      });
      router.push("/");
    } catch (error: any) {
      setError(error.message);
    }
  };

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
