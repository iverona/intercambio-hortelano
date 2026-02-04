"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Leaf,
  MessageSquare,
  Send,
  Info,
  BadgeCheck,
  ArrowRightLeft,
  X
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/locales/provider";
import { UserService } from "@/services/user.service";
import { UserData } from "@/types/user";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrls?: string[];
  isForExchange?: boolean;
  isForSale?: boolean;
  userId?: string;
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

export default function OfferModal({
  isOpen,
  onClose,
  product,
  onOfferSubmit,
}: OfferModalProps) {
  const { user } = useAuth();
  const t = useI18n();
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [seller, setSeller] = useState<UserData | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen && user) {
      fetchData();
    }
  }, [isOpen, user, product.userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch User Products
      if (user) {
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
      }

      // Fetch Seller Profile
      if (product.userId) {
        const sellerData = await UserService.getUserProfile(product.userId);
        setSeller(sellerData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = () => {
    const selectedProduct = userProducts.find(p => p.id === selectedProductId);
    if (selectedProduct) {
      onOfferSubmit({
        type: "exchange",
        offeredProductId: selectedProduct.id,
        offeredProductName: selectedProduct.name,
        message: message.trim() || undefined
      });
      onClose();
    }
  };

  const handleChat = () => {
    onOfferSubmit({
      type: "chat",
      message: message.trim() || undefined
    });
    onClose();
  };

  const formatMemberSince = (date?: { seconds: number; nanoseconds: number }) => {
    if (!date) return "";
    const year = new Date(date.seconds * 1000).getFullYear();
    return `Miembro desde ${year}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[#FFFBE6] dark:bg-[#2C2A25] gap-0 border-none shadow-2xl rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{(t as any)('product.contact.title')}</DialogTitle>
          <DialogDescription>{(t as any)('product.contact.description')}</DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6 flex items-center justify-between bg-[#EFEAC6] dark:bg-[#3E3B34] border-b border-[#879385]/10">
          <h2 className="text-xl font-bold text-[#2C2A25] dark:text-[#FFFBE6] tracking-tight">
            {(t as any)('product.contact.header')}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-black/5 dark:hover:bg-white/5 h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Seller Profile */}
          {seller && (
            <div className="flex items-center gap-5 p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-[#879385]/10">
              <Avatar className="h-16 w-16 border-2 border-[#879385]/20 shadow-sm">
                <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                <AvatarFallback className="bg-[#879385] text-white">
                  {seller.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-[#2C2A25] dark:text-[#FFFBE6]">
                    {seller.name}
                  </h3>
                  <BadgeCheck className="w-5 h-5 text-[#879385]" />
                </div>
                <p className="text-sm text-[#879385] dark:text-[#A6C6B9] font-medium">
                  {formatMemberSince(seller.joinedDate)}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Message Input */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#3E3B34] dark:text-gray-300 ml-1">
                {(t as any)('product.contact.message_label')}
              </label>
              <Textarea
                placeholder={`Hola @${seller?.name || 'productor'}, me interesa tu ${product.name}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none min-h-[120px] bg-white/50 dark:bg-black/20 border-[#879385]/20 focus:border-[#879385] focus:ring-[#879385]/20 rounded-2xl transition-all"
              />
            </div>

            <div className="space-y-4">
              {/* Option 1: Exchange */}
              {product.isForExchange && (
                <div
                  className="relative p-6 bg-white dark:bg-[#3E3B34] border-2 border-[#879385] shadow-[4px_4px_0px_0px_rgba(135,147,133,0.1)] hover:shadow-lg transition-all duration-300"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#879385]/10 rounded-full">
                      <Leaf className="w-5 h-5 text-[#879385]" />
                    </div>
                    <span className="font-bold text-[#2C2A25] dark:text-white text-lg">
                      {(t as any)('product.contact.option_exchange')}
                    </span>
                  </div>
                  <p className="text-sm text-[#3E3B34]/70 dark:text-[#A6C6B9] mb-5 leading-relaxed">
                    {(t as any)('product.contact.exchange_desc')}
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#879385] uppercase tracking-wider ml-1">
                        {(t as any)('product.contact.your_product')}
                      </label>
                      <Select
                        value={selectedProductId}
                        onValueChange={setSelectedProductId}
                        disabled={loading || userProducts.length === 0}
                      >
                        <SelectTrigger className="w-full bg-[#FFFBE6]/50 dark:bg-black/20 border-[#879385]/20 rounded-xl">
                          <SelectValue placeholder={
                            loading ? "Cargando..." :
                              userProducts.length === 0 ? "No tienes productos" :
                                "Selecciona un producto..."
                          } />
                        </SelectTrigger>
                        <SelectContent className="bg-[#FFFBE6] dark:bg-[#2C2A25] border-[#879385]/20">
                          {userProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="focus:bg-[#879385]/10">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full bg-[#879385] hover:bg-[#6e796c] text-white shadow-md hover:shadow-lg transition-all h-12 rounded-xl font-bold"
                      onClick={handleExchange}
                      disabled={!selectedProductId}
                    >
                      <ArrowRightLeft className="w-5 h-5 mr-2" />
                      {(t as any)('product.contact.button_exchange')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Option 2: Chat */}
              <div
                className="relative p-6 bg-white dark:bg-[#3E3B34] border-2 border-[#A88C8F] shadow-[4px_4px_0px_0px_rgba(168,140,143,0.1)] hover:shadow-lg transition-all duration-300"
                style={{ borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#A88C8F]/10 rounded-full">
                    <MessageSquare className="w-5 h-5 text-[#A88C8F]" />
                  </div>
                  <span className="font-bold text-[#2C2A25] dark:text-white text-lg">
                    {(t as any)('product.contact.option_chat')}
                  </span>
                </div>
                <p className="text-sm text-[#3E3B34]/70 dark:text-[#A6C6B9] mb-5 leading-relaxed">
                  {(t as any)('product.contact.chat_desc')}
                </p>

                <Button
                  className="w-full bg-[#A88C8F] hover:bg-[#8e7679] text-white shadow-md hover:shadow-lg transition-all h-12 rounded-xl font-bold"
                  onClick={handleChat}
                >
                  <Send className="w-5 h-5 mr-2" />
                  {(t as any)('product.contact.button_chat')}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="flex gap-4 bg-[#EFEAC6] dark:bg-[#3E3B34] p-5 rounded-2xl border border-[#879385]/10 shadow-sm">
            <div className="p-2 bg-[#879385]/20 rounded-full h-fit">
              <Info className="w-5 h-5 text-[#879385]" />
            </div>
            <div className="text-xs leading-relaxed text-[#3E3B34] dark:text-[#A6C6B9]">
              <span className="font-bold block mb-1">Nota importante:</span>
              EcoAnuncios promueve el intercambio justo y sostenible. La negociación se maneja libremente entre productores.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


