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
import { 
  ArrowRight, 
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
      });
      onClose();
    }
  };

  const handleChat = () => {
    onOfferSubmit({
      type: "chat",
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-slate-950 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Contactar al Vendedor</DialogTitle>
          <DialogDescription>Selecciona cómo deseas contactar.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            CONTACTAR A VENDEDOR
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Seller Profile */}
          {seller && (
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-green-100 dark:border-green-900">
                <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                <AvatarFallback>{seller.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white uppercase">
                    {seller.name}
                  </h3>
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatMemberSince(seller.joinedDate)}
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Selecciona cómo deseas contactar:
            </p>

            <div className="space-y-4">
              {/* Option 1: Exchange */}
              {product.isForExchange && (
                <div className="border rounded-xl p-4 bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      OPCIÓN 1: OFRECER INTERCAMBIO
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 pl-7">
                    Propón un trueque sostenible usando uno de tus productos activos.
                  </p>
                  
                  <div className="pl-7 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                        Tu producto para cambio
                      </label>
                      <Select 
                        value={selectedProductId} 
                        onValueChange={setSelectedProductId}
                        disabled={loading || userProducts.length === 0}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800">
                          <SelectValue placeholder={
                            loading ? "Cargando..." : 
                            userProducts.length === 0 ? "No tienes productos" : 
                            "Selecciona un producto..."
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {userProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      onClick={handleExchange}
                      disabled={!selectedProductId}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Proponer Intercambio
                    </Button>
                  </div>
                </div>
              )}

              {/* Option 2: Chat */}
              <div className="border rounded-xl p-4 bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    OPCIÓN 2: MENSAJE DIRECTO
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 pl-7">
                  Inicia una conversación para aclarar dudas sobre el estado o disponibilidad.
                </p>
                
                <div className="pl-7">
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                    onClick={handleChat}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Iniciar Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="flex gap-3 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-blue-700 dark:text-blue-300">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">Nota importante:</span> EcoAnuncios promueve el intercambio justo. La negociación de precios monetarios se maneja enteramente fuera de la plataforma.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
