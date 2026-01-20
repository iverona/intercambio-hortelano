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

    loginWithGoogle: async (): Promise<User | null> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const email = user.email;

            if (!email) {
                throw new Error("No email associated with Google account");
            }

            // Check if this email is already registered with password
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingUserDoc = querySnapshot.docs[0];
                const existingUserData = existingUserDoc.data();

                if (existingUserData.authMethod === "password") {
                    await signOut(auth);
                    throw new Error("This email is registered with email/password. Please sign in using your password.");
                }
            }

            // Check/Create user doc
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    onboardingComplete: false,
                    authMethod: "google",
                });
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
