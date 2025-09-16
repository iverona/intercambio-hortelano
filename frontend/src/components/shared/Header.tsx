"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          Portal de Intercambio Hortelano
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            Home
          </Link>
          {user && (
            <Link href="/profile" className="text-gray-600 hover:text-gray-800">
              My Profile
            </Link>
          )}
          <Button asChild>
            <Link href="/publish">Publish Product</Link>
          </Button>
          {!loading &&
            (user ? (
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
