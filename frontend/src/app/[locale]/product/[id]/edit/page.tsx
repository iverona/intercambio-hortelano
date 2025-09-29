"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProductForm, { ProductData, ProductSubmitData } from "@/components/shared/ProductForm";
import { useI18n } from "@/locales/provider";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function EditProductPage() {
  const t = useI18n();
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

  const handleSubmit = async (data: ProductSubmitData) => {
    if (id && product) {
      const docRef = doc(db, "products", id as string);

      const originalUrls = product.imageUrls || [];
      const retainedUrls = data.retainedImageUrls;
      const urlsToDelete = originalUrls.filter(url => !retainedUrls.includes(url));

      await Promise.all(urlsToDelete.map(url => {
        const imageRef = ref(storage, url);
        return deleteObject(imageRef);
      }));

      const newImageUrls = await Promise.all(
        data.newImages.map(async (image) => {
          const storageRef = ref(storage, `products/${user?.uid}/${Date.now()}_${image.name}`);
          await uploadBytes(storageRef, image);
          return await getDownloadURL(storageRef);
        })
      );

      const finalImageUrls = [...retainedUrls, ...newImageUrls];

      await updateDoc(docRef, {
        name: data.name,
        description: data.description,
        category: data.category,
        isForExchange: data.isForExchange,
        isForSale: data.isForSale,
        imageUrls: finalImageUrls,
      });
      router.push("/my-garden");
    }
  };

  if (loading || !product) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">{t('product.edit.loading')}</p>
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
