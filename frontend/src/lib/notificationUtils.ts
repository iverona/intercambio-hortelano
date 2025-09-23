import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Package, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft,
  Bell,
  LucideIcon,
  DollarSign,
  Star,
} from "lucide-react";

export interface NotificationMetadata {
  productName?: string;
  productId?: string;
  offeredProductName?: string;
  offeredProductId?: string;
  offerAmount?: number;
  offerType?: "exchange" | "purchase" | "chat";
  senderName?: string;
  message?: string;
  chatId?: string;
  exchangeId?: string;
}

export interface NotificationDisplay {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  route: string;
}

// Type for translation function parameters
type TranslationParams = Record<string, string | number> | undefined;

// This function will be called with the translation function
export const getNotificationDisplay = (
  type: string,
  entityId: string,
  metadata: NotificationMetadata | undefined,
  t: (key: string, params?: TranslationParams) => string
): NotificationDisplay => {
  switch (type) {
    case "NEW_OFFER":
    case "NEW_PROPOSAL": // Handle old type for backward compatibility
      let offerDescription = t("notifications.new_offer.default");
      let offerIcon = Package;
      
      if (metadata) {
        if (metadata.offerType === "exchange" && metadata.offeredProductName) {
          offerDescription = t("notifications.new_offer.exchange", {
            offeredProduct: metadata.offeredProductName,
            productName: metadata.productName || ""
          });
          offerIcon = ArrowRightLeft;
        } else if (metadata.offerType === "purchase" && metadata.offerAmount) {
          offerDescription = t("notifications.new_offer.purchase", {
            amount: metadata.offerAmount.toFixed(2),
            productName: metadata.productName || ""
          });
          offerIcon = DollarSign;
        } else if (metadata.offerType === "chat" && metadata.productName) {
          offerDescription = t("notifications.new_offer.chat", {
            productName: metadata.productName
          });
          offerIcon = MessageCircle;
        } else if (metadata.productName) {
          offerDescription = t("notifications.new_offer.simple", {
            productName: metadata.productName
          });
        }
      }
      
      return {
        title: t("notifications.new_offer.title"),
        description: offerDescription,
        icon: offerIcon,
        iconColor: "text-blue-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "OFFER_ACCEPTED":
    case "PROPOSAL_ACCEPTED": // Handle old type for backward compatibility
      return {
        title: t("notifications.offer_accepted.title"),
        description: metadata?.productName 
          ? t("notifications.offer_accepted.with_product", { productName: metadata.productName })
          : t("notifications.offer_accepted.default"),
        icon: CheckCircle,
        iconColor: "text-green-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "OFFER_REJECTED":
    case "PROPOSAL_REJECTED": // Handle old type for backward compatibility
      return {
        title: t("notifications.offer_declined.title"),
        description: metadata?.productName
          ? t("notifications.offer_declined.with_product", { productName: metadata.productName })
          : t("notifications.offer_declined.default"),
        icon: XCircle,
        iconColor: "text-red-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "MESSAGE_RECEIVED":
    case "NEW_MESSAGE": // Handle old type for backward compatibility
      return {
        title: t("notifications.message_received.title"),
        description: metadata?.senderName
          ? t("notifications.message_received.with_sender", { senderName: metadata.senderName })
          : t("notifications.message_received.default"),
        icon: MessageCircle,
        iconColor: "text-purple-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "EXCHANGE_COMPLETED":
      return {
        title: t("notifications.exchange_completed.title"),
        description: metadata?.productName
          ? t("notifications.exchange_completed.with_product", { productName: metadata.productName })
          : t("notifications.exchange_completed.default"),
        icon: ArrowRightLeft,
        iconColor: "text-green-600",
        route: `/exchanges/details/${entityId}`,
      };

    case "REVIEW_RECEIVED":
      return {
        title: t("notifications.review_received.title"),
        description: metadata?.senderName
          ? t("notifications.review_received.with_sender", { senderName: metadata.senderName })
          : t("notifications.review_received.default"),
        icon: Star,
        iconColor: "text-yellow-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    default:
      return {
        title: t("notifications.default.title"),
        description: t("notifications.default.description"),
        icon: Bell,
        iconColor: "text-gray-500",
        route: "/",
      };
  }
};

export const formatNotificationTime = (date: Date, locale?: string): string => {
  try {
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: locale === 'es' ? es : undefined 
    });
  } catch {
    return "Recently";
  }
};
