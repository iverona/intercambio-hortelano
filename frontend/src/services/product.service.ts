import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import {
    collection,
    onSnapshot,
    QuerySnapshot,
    DocumentData,
    query,
    where,
    getDocs,
    doc,
    addDoc,
    serverTimestamp,
    updateDoc,
    limit,
    writeBatch,
    deleteDoc,
    getDoc
} from "firebase/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const ProductService = {
    subscribeToProducts: (
        callback: (products: Product[]) => void,
        options: { categories?: string[]; limitCount?: number } = {}
    ) => {
        let q = query(
            collection(db, "products"),
            // We don't filter by 'deleted' at Firestore level because existing docs might lack the field.
            // Firestore excludes documents missing the filtered field.
        );

        if (options.categories && options.categories.length > 0) {
            if (options.categories.length === 1) {
                q = query(q, where("category", "==", options.categories[0]));
            } else if (options.categories.length <= 10) {
                q = query(q, where("category", "in", options.categories));
            }
        }

        if (options.limitCount) {
            q = query(q, limit(options.limitCount));
        }

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const productsData = snapshot.docs
                .map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        imageUrls: data.imageUrls || [data.imageUrl],
                    } as Product;
                })
                .filter(product => !product.deleted);

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
                deleted: false,
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
            let userId = data.userId;
            let currentImageUrls = data.imageUrls;

            // If new images are provided but userId or currentImageUrl list is missing from the update data,
            // we need to fetch the existing product to know where to upload and what to append to.
            if (newImages.length > 0 && (!userId || !currentImageUrls)) {
                const productSnap = await getDoc(doc(db, "products", id));
                if (productSnap.exists()) {
                    const existingData = productSnap.data();
                    if (!userId) userId = existingData.userId;
                    if (!currentImageUrls) currentImageUrls = existingData.imageUrls || (existingData.imageUrl ? [existingData.imageUrl] : []);
                }
            }

            // 1. Upload new images
            const newImageUrls = await Promise.all(
                newImages.map(async (image) => {
                    if (!userId) throw new Error("User ID required for image upload");
                    const storageRef = ref(storage, `products/${userId}/${Date.now()}_${image.name}`);
                    await uploadBytes(storageRef, image);
                    return await getDownloadURL(storageRef);
                })
            );

            // 2. Prepare update data
            const updateData: any = {
                ...data,
                updatedAt: serverTimestamp(),
            };

            // Only update imageUrls if we have new images to add OR if the caller explicitly provided a new list (e.g. for reordering or deleting)
            if (newImages.length > 0 || data.imageUrls !== undefined) {
                updateData.imageUrls = [...(currentImageUrls || []), ...newImageUrls];
            }

            // 3. Update Firestore
            await updateDoc(doc(db, "products", id), updateData);

            // 4. (Optional) Delete removed images from Storage could go here
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    deleteProduct: async (id: string): Promise<void> => {
        try {
            // 1. Fetch product to get data for archive and userId
            const productRef = doc(db, "products", id);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                throw new Error("Product not found");
            }

            const productData = productSnap.data() as Product;
            const userId = productData.userId;

            if (!userId) {
                // If legacy product somehow has no userId, just hard delete it to clean up
                await deleteDoc(productRef);
                return;
            }

            // Gather operations
            let batch = writeBatch(db);
            let operationCount = 0;
            const BATCH_LIMIT = 450;
            const commitBatch = async () => {
                if (operationCount > 0) {
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                }
            };

            // 2. Archive Product
            // We store it in archived_users/{userId}/products/{productId}
            const archiveRef = doc(db, "archived_users", userId, "products", id);

            // Remove imageUrls since we are deleting the files
            const { imageUrls: _imageUrls, ...productDataToArchive } = productData;

            batch.set(archiveRef, {
                ...productDataToArchive,
                imageUrls: [], // Empty array
                archivedAt: serverTimestamp(),
                deletionReason: "user_delete_single"
            });
            operationCount++;
            await commitBatch();

            // 3. Delete Images (Best effort)
            if (productData.imageUrls && Array.isArray(productData.imageUrls)) {
                await Promise.all(
                    productData.imageUrls.map(async (url) => {
                        if (url.includes("firebasestorage")) {
                            try {
                                const imgRef = ref(storage, url);
                                await deleteObject(imgRef);
                            } catch (err) {
                                console.warn(`Failed to delete image ${url}:`, err);
                            }
                        }
                    })
                );
            }

            // 4. Reject Pending/Accepted Exchanges involving this product
            const exchangesQuery = query(
                collection(db, "exchanges"),
                where("productId", "==", id),
                where("status", "in", ["pending", "accepted"])
            );

            const exchangesSnap = await getDocs(exchangesQuery);

            for (const exchangeDoc of exchangesSnap.docs) {
                if (operationCount >= BATCH_LIMIT) await commitBatch();

                const exchangeData = exchangeDoc.data();

                // Reject exchange
                batch.update(exchangeDoc.ref, {
                    status: "rejected",
                    rejectionReason: "item_deleted",
                    updatedAt: serverTimestamp()
                });
                operationCount++;

                // Notify the other user (requester)
                const partnerId = exchangeData.requesterId === userId
                    ? exchangeData.ownerId  // Should technically resolve to requester usually, but safeguard
                    : exchangeData.requesterId;

                if (operationCount >= BATCH_LIMIT) await commitBatch();
                const notifRef = doc(collection(db, "notifications"));
                batch.set(notifRef, {
                    userId: partnerId,
                    type: "offer_declined",
                    exchangeId: exchangeDoc.id,
                    productId: id,
                    productName: productData.name || "Deleted Product",
                    message: "The product for this exchange was deleted",
                    read: false,
                    createdAt: serverTimestamp()
                });
                operationCount++;
            }

            // 5. Hard Delete Product
            if (operationCount >= BATCH_LIMIT) await commitBatch();
            batch.delete(productRef);

            // Commit final changes
            await batch.commit();

        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    }
};
