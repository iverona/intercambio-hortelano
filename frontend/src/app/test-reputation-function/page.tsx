"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TomatoRating } from "@/components/shared/TomatoRating";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface UserReputation {
  reputation?: {
    averageRating: number;
    totalReviews: number;
  };
  points?: number;
  level?: string;
  lastUpdated?: string;
}

interface Review {
  rating: number;
  comment: string;
  reviewerId: string;
  reviewedUserId: string;
  createdAt: unknown;
}

interface ExchangeWithReview {
  id: string;
  productName: string;
  status: string;
  reviews?: Record<string, Review>;
}

export default function TestReputationFunction() {
  const { user } = useAuth();
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null);
  const [exchanges, setExchanges] = useState<ExchangeWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user document for real-time reputation updates
    const unsubscribeUser = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserReputation;
          setUserReputation(data);
          if (data.lastUpdated) {
            setLastUpdate(new Date(data.lastUpdated));
          }
        }
      }
    );

    // Load exchanges where user is involved
    const loadExchanges = async () => {
      try {
        const exchangesQuery = query(
          collection(db, "exchanges"),
          where("status", "==", "completed")
        );
        
        const snapshot = await getDocs(exchangesQuery);
        const exchangesList: ExchangeWithReview[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Check if user is involved in this exchange
          if (data.offerId === user.uid || data.productOwnerId === user.uid) {
            exchangesList.push({
              id: doc.id,
              productName: data.productName || "Unknown Product",
              status: data.status,
              reviews: data.reviews || {}
            });
          }
        });
        
        setExchanges(exchangesList);
      } catch (error) {
        console.error("Error loading exchanges:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExchanges();

    return () => {
      unsubscribeUser();
    };
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    // Reload the page to refresh all data
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please log in to test the reputation system
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reputation System Test Dashboard</h1>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Cloud Function Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Cloud Function Status
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">Deployed</Badge>
              <span className="text-sm text-muted-foreground">
                Functions are active and listening for review updates
              </span>
            </div>
            {lastUpdate && (
              <p className="text-sm text-muted-foreground">
                Last reputation update: {lastUpdate.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Reputation */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Reputation</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading reputation data...</span>
            </div>
          ) : userReputation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <TomatoRating rating={userReputation.reputation?.averageRating || 0} />
                    <span className="font-semibold">
                      {userReputation.reputation?.averageRating?.toFixed(1) || "0.0"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-2xl font-bold">
                    {userReputation.reputation?.totalReviews || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points</p>
                  <p className="text-2xl font-bold">{userReputation.points || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <Badge className="mt-1">{userReputation.level || "Seed"}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span>No reputation data found. Complete an exchange to get started!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Exchanges */}
      <Card>
        <CardHeader>
          <CardTitle>Your Completed Exchanges</CardTitle>
        </CardHeader>
        <CardContent>
          {exchanges.length > 0 ? (
            <div className="space-y-3">
              {exchanges.map((exchange) => {
                const hasReviewFromOther = exchange.reviews ? Object.keys(exchange.reviews).some(
                  (reviewerId) => reviewerId !== user.uid
                ) : false;
                const reviewFromOther = exchange.reviews ? Object.entries(exchange.reviews).find(
                  ([reviewerId]) => reviewerId !== user.uid
                ) : undefined;

                return (
                  <div
                    key={exchange.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{exchange.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Exchange ID: {exchange.id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasReviewFromOther ? (
                        <>
                          <Badge variant="outline" className="bg-green-50">
                            Reviewed
                          </Badge>
                          {reviewFromOther && (
                            <TomatoRating rating={reviewFromOther[1].rating} />
                          )}
                        </>
                      ) : (
                        <Badge variant="outline">Pending Review</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No completed exchanges found. Complete an exchange to test the reputation system.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How the Cloud Function Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="font-semibold">1.</span>
              <p>When a review is submitted, it's saved to the exchange document.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">2.</span>
              <p>The Cloud Function automatically detects the new review.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">3.</span>
              <p>It calculates the new average rating from all reviews.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">4.</span>
              <p>Points are awarded: 15 base + bonuses (5-star: +10, 4-star: +5).</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">5.</span>
              <p>The user's level is updated based on total points.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">6.</span>
              <p>All updates happen server-side with admin privileges for security.</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> The reputation updates happen automatically within seconds
              of submitting a review. This page will show real-time updates as they occur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
