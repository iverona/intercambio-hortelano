"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProductCard from "@/components/shared/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface Exchange {
  id: string;
  productName: string;
  status: string;
  buyerId: string;
  sellerId: string;
}

interface UserData {
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserData;
          setUserData(data);
          setNewName(data.name);
          setNewBio(data.bio || "");
        }
      });

      const productsQuery = query(
        collection(db, "products"),
        where("userId", "==", user.uid)
      );
      const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      });

      const exchangesQuery = query(
        collection(db, "exchanges"),
        where("buyerId", "==", user.uid)
      );
      const unsubscribeExchanges = onSnapshot(exchangesQuery, (snapshot) => {
        const exchangesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Exchange[];
        setExchanges(exchangesData);
      });

      return () => {
        unsubscribeProducts();
        unsubscribeExchanges();
      };
    }
  }, [user, loading, router]);

  const handleExchange = async (exchangeId: string, status: string) => {
    const exchangeRef = doc(db, "exchanges", exchangeId);
    await updateDoc(exchangeRef, { status });
  };

  const handleSave = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name: newName, bio: newBio });
      setUserData((prev) =>
        prev ? { ...prev, name: newName, bio: newBio } : null
      );
      setIsEditing(false);
    }
  };

  const handlePasswordChange = () => {
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.email) {
      sendPasswordResetEmail(auth, auth.currentUser.email)
        .then(() => {
          alert("Password reset email sent!");
        })
        .catch((error) => {
          alert(error.message);
        });
    } else {
      alert(
        "Could not send password reset email. User not found or email is missing."
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/product/${id}/edit`);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  // Don't render content if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {userData && (
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={userData.avatarUrl} alt={userData.name} />
            <AvatarFallback>
              {userData.name
                ? userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : ""}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            {isEditing ? (
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-2xl font-bold text-center"
              />
            ) : (
              <h1 className="text-2xl font-bold">{userData.name}</h1>
            )}
            <p className="text-gray-600">{userData.email}</p>
            {isEditing ? (
              <Textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Tell us a bit about yourself"
                className="mt-2 text-center"
              />
            ) : (
              <p className="text-gray-700 mt-2">{userData.bio}</p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                <Button variant="outline" onClick={handlePasswordChange}>
                  Change Password
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">My Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => handleEdit(product.id)}
              onDelete={() => handleDelete(product.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">My Exchanges</h2>
        <div className="space-y-4">
          {exchanges.map((exchange) => (
            <div
              key={exchange.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{exchange.productName}</p>
                <p className="text-sm text-gray-500">{exchange.status}</p>
              </div>
              {user?.uid === exchange.sellerId &&
                exchange.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExchange(exchange.id, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleExchange(exchange.id, "rejected")}
                      variant="destructive"
                    >
                      Reject
                    </Button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
