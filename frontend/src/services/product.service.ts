import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { collection, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";

export const ProductService = {
    subscribeToProducts: (callback: (products: Product[]) => void) => {
        const unsubscribe = onSnapshot(collection(db, "products"), (snapshot: QuerySnapshot<DocumentData>) => {
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
    }
};
