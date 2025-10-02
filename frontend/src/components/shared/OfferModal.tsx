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
import { 
  ArrowRight, 
  Package, 
  DollarSign, 
  MessageSquare, 
  ArrowLeft, 
  Check,
  Sparkles,
  Leaf,
  Send
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/locales/provider";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrls?: string[];
  isForExchange?: boolean;
  isForSale?: boolean;
}

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onOfferSubmit: (offer: {
    type: "exchange" | "chat";
    offeredProductId?: string;
    offeredProductName?: string;
    message?: string;
  }) => void;
}

type Step = "select-type" | "exchange-details" | "chat-details" | "confirmation";

export default function OfferModal({
  isOpen,
  onClose,
  product,
  onOfferSubmit,
}: OfferModalProps) {
  const { user } = useAuth();
  const t = useI18n();
  const [step, setStep] = useState<Step>("select-type");
  const [offerType, setOfferType] = useState<"exchange" | "chat" | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleTypeSelection = (type: "exchange" | "chat") => {
    setOfferType(type);
    if (type === "exchange") {
      setStep("exchange-details");
    } else {
      setStep("chat-details");
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === "exchange-details" || step === "chat-details") {
      setStep("select-type");
      setOfferType(null);
    } else if (step === "confirmation") {
      if (offerType === "exchange") {
        setStep("exchange-details");
      } else {
        setStep("chat-details");
      }
    }
  };

  const handleConfirm = () => {
    const offer: {
      type: "exchange" | "chat";
      offeredProductId?: string;
      offeredProductName?: string;
      message?: string;
    } = {
      type: offerType!,
      message,
    };

    if (offerType === "exchange" && selectedProduct) {
      offer.offeredProductId = selectedProduct.id;
      offer.offeredProductName = selectedProduct.name;
    }

    onOfferSubmit(offer);
    handleClose();
  };

  const handleClose = () => {
    setStep("select-type");
    setOfferType(null);
    setSelectedProduct(null);
    setMessage("");
    setError(null);
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case "select-type":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                {t('offer_modal.select_type.title')}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t('offer_modal.select_type.description', { productName: product.name })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-6">
              {product.isForExchange && (
                <Card
                  className="p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 group"
                  onClick={() => handleTypeSelection("exchange")}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                      <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {t('offer_modal.select_type.exchange_title')}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t('offer_modal.select_type.exchange_description')}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              )}
              
              <Card
                className="p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 group"
                onClick={() => handleTypeSelection("chat")}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {t('offer_modal.select_type.chat_title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('offer_modal.select_type.chat_description')}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </div>
          </>
        );

      case "chat-details":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                {t('offer_modal.chat_details.title')}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t('offer_modal.chat_details.description', { productName: product.name })}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="message" className="text-base font-semibold mb-2 block">
                  {t('offer_modal.chat_details.add_message_label')}
                </Label>
                <Textarea
                  id="message"
                  placeholder={t('offer_modal.chat_details.add_message_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('offer_modal.general.back_button')}
                </Button>
                <Button 
                  onClick={() => setStep("confirmation")} 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="lg"
                >
                  {t('offer_modal.chat_details.continue_button')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        );

      case "exchange-details":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                {t('offer_modal.exchange_details.title')}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t('offer_modal.exchange_details.description')}
              </DialogDescription>
            </DialogHeader>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('offer_modal.exchange_details.loading')}</p>
              </div>
            ) : userProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('offer_modal.exchange_details.no_products')}
                </p>
                <Button variant="outline" onClick={() => setStep("select-type")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('offer_modal.exchange_details.go_back')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {userProducts.map((userProduct) => (
                    <Card
                      key={userProduct.id}
                      className={`p-4 cursor-pointer transition-all duration-300 ${
                        selectedProduct?.id === userProduct.id
                          ? "ring-2 ring-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg"
                          : "hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setSelectedProduct(userProduct)}
                    >
                      <div className="flex items-center space-x-3">
                        {userProduct.imageUrls && userProduct.imageUrls.length > 0 ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={userProduct.imageUrls[0]}
                              alt={userProduct.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {userProduct.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {userProduct.description}
                          </p>
                        </div>
                        {selectedProduct?.id === userProduct.id && (
                          <div className="flex-shrink-0">
                            <div className="p-1 bg-green-500 rounded-full">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div>
                  <Label htmlFor="message" className="text-base font-semibold mb-2 block">
                    {t('offer_modal.exchange_details.add_message_label')}
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={t('offer_modal.exchange_details.add_message_placeholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={handleBack} className="flex-1" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('offer_modal.general.back_button')}
                  </Button>
                  <Button 
                    onClick={() => setStep("confirmation")} 
                    disabled={!selectedProduct}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                    size="lg"
                  >
                    {t('offer_modal.exchange_details.continue_button')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </>
        );

      case "confirmation":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                {t('offer_modal.confirmation.title')}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t('offer_modal.confirmation.description')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-6 space-y-4">
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {t('offer_modal.confirmation.you_want')}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 font-medium">{product.name}</p>
              </Card>
              
              <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  {offerType === "exchange" ? (
                    <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  )}
                  {t('offer_modal.confirmation.you_offer')}
                </h4>
                {offerType === "exchange" && selectedProduct && (
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('offer_modal.confirmation.offering_exchange', { productName: selectedProduct.name })}
                  </p>
                )}
                {offerType === "chat" && (
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('offer_modal.confirmation.offering_chat')}
                  </p>
                )}
              </Card>
              
              {message && (
                <Card className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    {t('offer_modal.confirmation.your_message')}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{message}"</p>
                </Card>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleBack} className="flex-1" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('offer_modal.general.back_button')}
                </Button>
                <Button 
                  onClick={handleConfirm} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2" />
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
      <DialogContent className="sm:max-w-lg">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
