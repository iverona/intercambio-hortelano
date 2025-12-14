import { db, storage } from "@/lib/firebase";
import { UserData, Producer } from "@/types/user";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

export const UserService = {
    getUserProfile: async (uid: string): Promise<UserData | null> => {
        const userRef = doc(db, "users", uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return snapshot.data() as UserData;
        }
        return null;
    },

    updateUserProfile: async (uid: string, data: Partial<UserData>): Promise<void> => {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data);
    },

    uploadAvatar: async (uid: string, file: File, oldAvatarUrl?: string): Promise<string> => {
        // 1. Upload new avatar
        const storageRef = ref(storage, `avatars/${uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const newAvatarUrl = await getDownloadURL(storageRef);

        // 2. Delete old avatar if exists
        if (oldAvatarUrl && oldAvatarUrl.includes("firebasestorage")) {
            try {
                const oldAvatarRef = ref(storage, oldAvatarUrl);
                await deleteObject(oldAvatarRef);
            } catch (error) {
                console.warn("Could not delete old avatar", error);
            }
        }

        return newAvatarUrl;
    },

    deleteAvatar: async (uid: string, avatarUrl: string): Promise<void> => {
        if (avatarUrl && avatarUrl.includes("firebasestorage")) {
            const avatarRef = ref(storage, avatarUrl);
            await deleteObject(avatarRef);
        }
    },

    // Producer logic
    getProducers: async (): Promise<Producer[]> => {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const producerIds = new Set<string>();
        const producerProductCounts = new Map<string, number>();

        productsSnapshot.forEach((doc) => {
            const userId = doc.data().userId;
            if (userId) {
                producerIds.add(userId);
                producerProductCounts.set(userId, (producerProductCounts.get(userId) || 0) + 1);
            }
        });

        if (producerIds.size === 0) return [];

        const usersQuery = query(
            collection(db, "users"),
            where("uid", "in", Array.from(producerIds))
        );
        const usersSnapshot = await getDocs(usersQuery);

        return usersSnapshot.docs
            .map((doc) => {
                const data = doc.data() as UserData;
                return {
                    ...data,
                    productsCount: producerProductCounts.get(data.uid || "") || 0,
                } as Producer;
            })
            .filter(producer => !producer.deleted);
    }
};
