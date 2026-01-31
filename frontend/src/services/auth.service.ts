import { auth, db, googleProvider } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendEmailVerification as firebaseSendEmailVerification,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    applyActionCode,
    fetchSignInMethodsForEmail,
    updateProfile,
    User,
    UserCredential
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { UserData } from "@/types/user";

export const AuthService = {
    loginWithEmail: async (email: string, password: string): Promise<UserCredential> => {
        return await signInWithEmailAndPassword(auth, email, password);
    },

    signupWithEmail: async (email: string, password: string): Promise<UserCredential> => {
        return await createUserWithEmailAndPassword(auth, email, password);
    },

    sendPasswordResetEmail: async (email: string): Promise<void> => {
        await firebaseSendPasswordResetEmail(auth, email);
    },

    verifyEmail: async (oobCode: string): Promise<void> => {
        await applyActionCode(auth, oobCode);
    },

    fetchSignInMethods: async (email: string): Promise<string[]> => {
        return await fetchSignInMethodsForEmail(auth, email);
    },

    createUserDoc: async (uid: string, data: Partial<UserData>): Promise<void> => {
        await setDoc(doc(db, "users", uid), data, { merge: true });
    },

    updateUserProfileAuth: async (user: User, data: { displayName?: string; photoURL?: string }): Promise<void> => {
        await updateProfile(user, data);
    },

    loginWithGoogle: async (consent?: UserData['consent']): Promise<User | null> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const email = user.email;

            if (!email) {
                throw new Error("No email associated with Google account");
            }

            /* 
            // Email check removed as we don't store email in Firestore anymore.
            // Firebase Auth "One account per email" setting should handle this collision.
            */

            // Check/Create user doc
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    // email: user.email, // Removed
                    name: user.displayName,
                    onboardingComplete: false,
                    authMethod: "google",
                    ...(consent ? { consent } : {}),
                });
            } else if (consent) {
                // If user exists but we have new consent info, update it
                await setDoc(userDocRef, { consent }, { merge: true });
            }

            return user;
        } catch (error) {
            console.error("AuthService Google Login Error:", error);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        await signOut(auth);
    },

    sendEmailVerification: async (user: User): Promise<void> => {
        await firebaseSendEmailVerification(user);
    },

    getUserData: async (uid: string): Promise<UserData | null> => {
        const userRef = doc(db, "users", uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return snapshot.data() as UserData;
        }
        return null;
    }
};
