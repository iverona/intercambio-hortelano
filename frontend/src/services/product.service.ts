import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import {
    collection,
    onSnapshot,
    QuerySnapshot,
    DocumentData,
    getDocs,
    doc,
    addDoc,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import { query, where } from "firebase/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const ProductService = {
    subscribeToProducts: (callback: (products: Product[]) => void) => {
        const q = query(collection(db, "products"), where("deleted", "==", false));
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const productsData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    imageUrls: data.imageUrls || [data.imageUrl],
                };
            }) as Product[];

            callback(productsData);
        });

        return unsubscribe;
    },

    getProductsByUserId: async (userId: string): Promise<Product[]> => {
        try {
            const q = query(
                collection(db, "products"),
                where("userId", "==", userId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    imageUrls: data.imageUrls || [data.imageUrl],
                } as Product;
            });
        } catch (error) {
            console.error("Error fetching products by user:", error);
            throw error;
        }
    },

    getProduct: (id: string, callback: (product: Product | null) => void) => {
        const unsubscribe = onSnapshot(doc(db, "products", id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                callback({
                    id: docSnap.id,
                    ...data,
                    imageUrls: data.imageUrls || [data.imageUrl],
                } as Product);
            } else {
                callback(null);
            }
        });
        return unsubscribe;
    },

    createProduct: async (data: Omit<Product, "id" | "createdAt">, images: File[]): Promise<string> => {
        try {
            const imageUrls = await Promise.all(
                images.map(async (image) => {
                    const storageRef = ref(storage, `products/${data.userId}/${Date.now()}_${image.name}`);
                    await uploadBytes(storageRef, image);
                    return await getDownloadURL(storageRef);
                })
            );

            const docRef = await addDoc(collection(db, "products"), {
                ...data,
                imageUrls,
                createdAt: serverTimestamp(),
            });

            return docRef.id;
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    },

    updateProduct: async (
        id: string,
        data: Partial<Product>,
        newImages: File[] = [],
        _imagesToDelete: string[] = []
    ): Promise<void> => {
        try {
            // 1. Upload new images
            const newImageUrls = await Promise.all(
                newImages.map(async (image) => {
                    if (!data.userId) throw new Error("User ID required for image upload");
                    const storageRef = ref(storage, `products/${data.userId}/${Date.now()}_${image.name}`);
                    await uploadBytes(storageRef, image);
                    return await getDownloadURL(storageRef);
                })
            );

            // 2. Get current product to merge images if needed, but the caller should usually pass the final list of kept images if they are reordering.
            // Simplified approach: append new images to existing ones (filtered by deletes)
            // Ideally, the 'data' should contain the final state of imageUrls if we were just updating metadata, but for files we need special handling.
            // Let's assume 'data.imageUrls' contains the URLs of the images we want to KEEP (excluding deleted ones).
            // So we just add newImageUrls to data.imageUrls.

            const currentImageUrls = data.imageUrls || [];
            const updatedImageUrls = [...currentImageUrls, ...newImageUrls];

            // 3. Update Firestore
            await updateDoc(doc(db, "products", id), {
                ...data,
                imageUrls: updatedImageUrls,
                updatedAt: serverTimestamp(),
            });

            // 4. (Optional) Delete removed images from Storage could go here
            // implementing basic storage cleanup is good practice but not strictly required for MVP if risky.
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    deleteProduct: async (id: string): Promise<void> => {
        try {
            // Soft delete
            await updateDoc(doc(db, "products", id), {
                deleted: true,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    }
};
