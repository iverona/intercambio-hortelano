"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TomatoRating } from "@/components/shared/TomatoRating";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, Star } from "lucide-react";

interface Exchange {
  id: string;
  productName: string;
  status: string;
  requesterId: string;
  ownerId: string;
  reviews?: Record<string, {
    reviewerId: string;
    rating: number;
    comment?: string;
    createdAt: unknown;
  }>;
}

interface UserReputation {
  averageRating: number;
  totalReviews: number;
  points: number;
  level: number;
}

export default function TestReviewSystemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [completedExchanges, setCompletedExchanges] = useState<Exchange[]>([]);
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to completed exchanges
    const exchangesQuery = query(
      collection(db, "exchanges"),
      where("status", "==", "completed")
    );

    const unsubscribeExchanges = onSnapshot(exchangesQuery, (snapshot) => {
      const exchanges = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Exchange))
        .filter(
          (exchange) =>
            exchange.requesterId === user.uid || exchange.ownerId === user.uid
        );
      setCompletedExchanges(exchanges);
    });

    // Listen to user reputation
    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserReputation({
          averageRating: data.reputation?.averageRating || 0,
          totalReviews: data.reputation?.totalReviews || 0,
          points: data.points || 0,
          level: data.level || 0,
        });
      }
      setLoading(false);
    });

    return () => {
      unsubscribeExchanges();
      unsubscribeUser();
    };
  }, [user, router]);

  const getLevelName = (level: number): string => {
    const levels = ["Seed", "Sprout", "Gardener", "Harvester", "Master Grower"];
    return levels[Math.min(level, levels.length - 1)] || "Seed";
  };

  const hasUserReviewed = (exchange: Exchange): boolean => {
    if (!user) return false;
    const partnerId = exchange.requesterId === user.uid ? exchange.ownerId : exchange.requesterId;
    return exchange.reviews?.[partnerId]?.reviewerId === user.uid;
  };

  const hasPartnerReviewed = (exchange: Exchange): boolean => {
    if (!user) return false;
    return exchange.reviews?.[user.uid] !== undefined;
  };

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Review System Test</h2>
              <p className="text-gray-600">Please log in to access the review system test dashboard.</p>
              <Button onClick={() => router.push("/login")} className="mt-4">
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Review System Test</h1>
            <p className="text-gray-600">Monitor your reputation and review status</p>
          </div>
        </div>

        {/* Current Reputation */}
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <h2 className="text-lg font-semibold mb-4">Your Current Reputation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rating</p>
              {userReputation?.totalReviews ? (
                <TomatoRating
                  rating={userReputation.averageRating}
                  size="sm"
                  showNumber={true}
                />
              ) : (
                <p className="text-sm">No reviews yet</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
              <p className="text-2xl font-bold">{userReputation?.totalReviews || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Points</p>
              <p className="text-2xl font-bold">{userReputation?.points || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Level</p>
              <p className="text-2xl font-bold">{getLevelName(userReputation?.level || 0)}</p>
            </div>
          </div>
        </Card>

        {/* Completed Exchanges */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Completed Exchanges ({completedExchanges.length})
          </h2>
          {completedExchanges.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No completed exchanges yet. Complete an exchange to start building your reputation!
            </p>
          ) : (
            <div className="space-y-3">
              {completedExchanges.map((exchange) => {
                const userReviewed = hasUserReviewed(exchange);
                const partnerReviewed = hasPartnerReviewed(exchange);

                return (
                  <div
                    key={exchange.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <div>
                      <p className="font-medium">{exchange.productName}</p>
                      <div className="flex gap-2 mt-1">
                        {userReviewed ? (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            You reviewed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Review pending
                          </Badge>
                        )}
                        {partnerReviewed ? (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Partner reviewed you
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Awaiting partner review
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/exchanges/details/${exchange.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20">
          <h3 className="font-semibold mb-2">How the Review System Works:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>Complete an exchange by marking it as "completed"</li>
            <li>Go to the exchange details page to leave a review</li>
            <li>Rate your experience with 1-5 tomatoes 🍅</li>
            <li>Add an optional comment (max 280 characters)</li>
            <li>Your partner's reputation updates automatically</li>
            <li>Earn points: 5🍅 = 25pts, 4🍅 = 20pts, base = 15pts</li>
            <li>Level up as you accumulate points!</li>
          </ol>
        </Card>
      </div>
    </main>
  );
}
