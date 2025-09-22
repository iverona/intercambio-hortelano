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
import { useI18n } from "@/locales/provider";

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
  const t = useI18n();
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
              <DialogTitle>{t('offer_modal.select_type.title')}</DialogTitle>
              <DialogDescription>
                {t('offer_modal.select_type.description', { productName: product.name })}
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
                      <h3 className="font-semibold">{t('offer_modal.select_type.exchange_title')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('offer_modal.select_type.exchange_description')}
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
                      <h3 className="font-semibold">{t('offer_modal.select_type.purchase_title')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('offer_modal.select_type.purchase_description', { price: product.price.toFixed(2) })}
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
                    <h3 className="font-semibold">{t('offer_modal.select_type.chat_title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('offer_modal.select_type.chat_description')}
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
              <DialogTitle>{t('offer_modal.exchange_details.title')}</DialogTitle>
              <DialogDescription>
                {t('offer_modal.exchange_details.description')}
              </DialogDescription>
            </DialogHeader>
            
            {loading ? (
              <div className="text-center py-8">{t('offer_modal.exchange_details.loading')}</div>
            ) : userProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('offer_modal.exchange_details.no_products')}
                </p>
                <Button variant="outline" onClick={() => setStep("select-type")}>
                  {t('offer_modal.exchange_details.go_back')}
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
                <Label htmlFor="message">{t('offer_modal.exchange_details.add_message_label')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('offer_modal.exchange_details.add_message_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('offer_modal.general.back_button')}
                </Button>
                <Button 
                  onClick={() => setStep("confirmation")} 
                  disabled={!selectedProduct}
                  className="flex-1"
                >
                  {t('offer_modal.exchange_details.continue_button')}
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
              <DialogTitle>{t('offer_modal.purchase_details.title')}</DialogTitle>
              <DialogDescription>
                {t('offer_modal.purchase_details.description')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="amount">{t('offer_modal.purchase_details.amount_label')}</Label>
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
                    {t('offer_modal.purchase_details.listed_price', { price: product.price.toFixed(2) })}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="purchase-message">{t('offer_modal.purchase_details.add_message_label')}</Label>
                <Textarea
                  id="purchase-message"
                  placeholder={t('offer_modal.purchase_details.add_message_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('offer_modal.general.back_button')}
                </Button>
                <Button 
                  onClick={() => setStep("confirmation")} 
                  disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                  className="flex-1"
                >
                  {t('offer_modal.purchase_details.continue_button')}
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
              <DialogTitle>{t('offer_modal.confirmation.title')}</DialogTitle>
              <DialogDescription>
                {t('offer_modal.confirmation.description')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">{t('offer_modal.confirmation.you_want')}</h4>
                <p className="text-gray-700 dark:text-gray-300">{product.name}</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-semibold mb-2">{t('offer_modal.confirmation.you_offer')}</h4>
                {offerType === "exchange" && selectedProduct && (
                  <p className="text-gray-700 dark:text-gray-300">{t('offer_modal.confirmation.offering_exchange', { productName: selectedProduct.name })}</p>
                )}
                {offerType === "purchase" && (
                  <p className="text-gray-700 dark:text-gray-300">{t('offer_modal.confirmation.offering_purchase', { amount: parseFloat(offerAmount).toFixed(2) })}</p>
                )}
                {offerType === "chat" && (
                  <p className="text-gray-700 dark:text-gray-300">{t('offer_modal.confirmation.offering_chat')}</p>
                )}
              </Card>
              
              {message && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">{t('offer_modal.confirmation.your_message')}</h4>
                  <p className="text-gray-700 dark:text-gray-300">{message}</p>
                </Card>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('offer_modal.general.back_button')}
                </Button>
                <Button onClick={handleConfirm} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  {t('offer_modal.confirmation.send_button')}
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
