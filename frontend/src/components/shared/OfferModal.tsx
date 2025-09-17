"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, DollarSign, MessageSquare, ArrowLeft, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isForExchange?: boolean;
  price?: number;
}

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onOfferSubmit: (offer: {
    type: "exchange" | "purchase" | "chat";
    offeredProductId?: string;
    offeredProductName?: string;
    amount?: number;
    message?: string;
  }) => void;
}

type Step = "select-type" | "exchange-details" | "purchase-details" | "confirmation";

export default function OfferModal({
  isOpen,
  onClose,
  product,
  onOfferSubmit,
}: OfferModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("select-type");
  const [offerType, setOfferType] = useState<"exchange" | "purchase" | "chat" | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [offerAmount, setOfferAmount] = useState<string>(product.price?.toString() || "");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProducts();
    }
  }, [isOpen, user]);

  const fetchUserProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setUserProducts(products);
    } catch (error) {
      console.error("Error fetching user products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = (type: "exchange" | "purchase" | "chat") => {
    setOfferType(type);
    if (type === "exchange") {
      setStep("exchange-details");
    } else if (type === "purchase") {
      setStep("purchase-details");
    } else {
      // For chat, go directly to confirmation
      setStep("confirmation");
    }
  };

  const handleBack = () => {
    if (step === "exchange-details" || step === "purchase-details") {
      setStep("select-type");
      setOfferType(null);
    } else if (step === "confirmation") {
      if (offerType === "exchange") {
        setStep("exchange-details");
      } else if (offerType === "purchase") {
        setStep("purchase-details");
      } else {
        setStep("select-type");
      }
    }
  };

  const handleConfirm = () => {
    const offer: {
      type: "exchange" | "purchase" | "chat";
      offeredProductId?: string;
      offeredProductName?: string;
      amount?: number;
      message?: string;
    } = {
      type: offerType!,
      message,
    };

    if (offerType === "exchange" && selectedProduct) {
      offer.offeredProductId = selectedProduct.id;
      offer.offeredProductName = selectedProduct.name;
    } else if (offerType === "purchase") {
      offer.amount = parseFloat(offerAmount);
    }

    onOfferSubmit(offer);
    handleClose();
  };

  const handleClose = () => {
    setStep("select-type");
    setOfferType(null);
    setSelectedProduct(null);
    setOfferAmount(product.price?.toString() || "");
    setMessage("");
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case "select-type":
        return (
          <>
            <DialogHeader>
              <DialogTitle>How would you like to proceed?</DialogTitle>
              <DialogDescription>
                Choose how you'd like to acquire "{product.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {product.isForExchange && (
                <Card
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleTypeSelection("exchange")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Propose an Exchange</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Trade one of your items
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              )}
              
              {product.price && (
                <Card
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleTypeSelection("purchase")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Offer Payment</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pay €{product.price.toFixed(2)}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              )}
              
              <Card
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleTypeSelection("chat")}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Just Chat</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Discuss other arrangements
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            </div>
          </>
        );

      case "exchange-details":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Select item to offer in exchange</DialogTitle>
              <DialogDescription>
                Choose from your available products
              </DialogDescription>
            </DialogHeader>
            
            {loading ? (
              <div className="text-center py-8">Loading your products...</div>
            ) : userProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have any products listed yet.
                </p>
                <Button variant="outline" onClick={() => setStep("select-type")}>
                  Go Back
                </Button>
              </div>
            ) : (
              <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                {userProducts.map((userProduct) => (
                  <Card
                    key={userProduct.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedProduct?.id === userProduct.id
                        ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedProduct(userProduct)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{userProduct.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {userProduct.description}
                        </p>
                      </div>
                      {selectedProduct?.id === userProduct.id && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="message">Add a message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Explain why this would be a good exchange..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep("confirmation")} 
                  disabled={!selectedProduct}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        );

      case "purchase-details":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Make an Offer</DialogTitle>
              <DialogDescription>
                Specify the amount you'd like to pay
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="amount">Offer Amount (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="0.00"
                />
                {product.price && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Listed price: €{product.price.toFixed(2)}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="purchase-message">Add a message (optional)</Label>
                <Textarea
                  id="purchase-message"
                  placeholder="Add any notes about your offer..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep("confirmation")} 
                  disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        );

      case "confirmation":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Your Offer</DialogTitle>
              <DialogDescription>
                Review your offer before sending
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">You want:</h4>
                <p className="text-gray-700 dark:text-gray-300">{product.name}</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-semibold mb-2">You're offering:</h4>
                {offerType === "exchange" && selectedProduct && (
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.name}</p>
                )}
                {offerType === "purchase" && (
                  <p className="text-gray-700 dark:text-gray-300">€{parseFloat(offerAmount).toFixed(2)}</p>
                )}
                {offerType === "chat" && (
                  <p className="text-gray-700 dark:text-gray-300">To discuss arrangements</p>
                )}
              </Card>
              
              {message && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Your message:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{message}</p>
                </Card>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleConfirm} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Send Offer
                </Button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
