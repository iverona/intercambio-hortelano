"use client";

import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      // Reload the user to get the latest data
      await auth.currentUser.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser && refreshedUser.emailVerified) {
        // Force state update by creating a new object reference
        setUser(Object.assign(Object.create(Object.getPrototypeOf(refreshedUser)), refreshedUser));
      } else {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
