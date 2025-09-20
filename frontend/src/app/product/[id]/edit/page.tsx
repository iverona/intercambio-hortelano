"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProductForm from "@/components/shared/ProductForm";

interface ProductData {
  name: string;
  description: string;
  category: string;
  isForExchange: boolean;
  price: number | null;
}

export default function EditProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<ProductData | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    if (id) {
      const docRef = doc(db, "products", id as string);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          setProduct(docSnap.data() as ProductData);
        } else {
          console.log("No such document!");
        }
      });
    }
  }, [id, user, loading, router]);

  const handleSubmit = async (data: ProductData) => {
    if (id) {
      const docRef = doc(db, "products", id as string);
      await updateDoc(docRef, data);
      router.push("/profile");
    }
  };

  if (loading || !product) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ProductForm onSubmit={handleSubmit} initialData={product} isEdit={true} />
    </main>
  );
}
