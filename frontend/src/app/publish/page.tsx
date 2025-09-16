"use client";

import ProductForm from "@/components/shared/ProductForm";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublishPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handlePublish = async (data: any) => {
    if (!user) {
      setError("You must be logged in to publish a product.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      await addDoc(collection(db, "products"), {
        ...data,
        userId: user.uid,
        location: userData?.location || null,
      });
      router.push("/");
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ProductForm onSubmit={handlePublish} />
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </main>
  );
}
