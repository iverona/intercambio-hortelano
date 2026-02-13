"use client";

import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserData } from "@/types/user";
import { UserService } from "@/services/user.service";
import { usePathname, useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUser: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      // Reload the user to get the latest data
      await auth.currentUser.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser && refreshedUser.emailVerified) {
        // Force state update by creating a new object reference
        setUser(Object.assign(Object.create(Object.getPrototypeOf(refreshedUser)), refreshedUser));
        // Also refresh user data from Firestore
        try {
          const profile = await UserService.getUserProfile(refreshedUser.uid, true);
          setUserData(profile);
        } catch (error) {
          console.error("Error refreshing user profile:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setUser(user);
        try {
          const profile = await UserService.getUserProfile(user.uid);
          setUserData(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Enforce onboarding
  useEffect(() => {
    if (loading) return;

    if (user && userData) {
      // Check if onboarding is complete
      if (userData.onboardingComplete === false) {
        // Allow access to onboarding, login, signup, and logout pages
        const isExcluded =
          pathname.startsWith("/onboarding") ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/signup") ||
          pathname.includes("logout");

        if (!isExcluded) {
          console.log("Redirecting to onboarding due to incomplete profile");
          router.push("/onboarding");
        }
      }
    }
  }, [user, userData, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
