import { formatDistanceToNow } from "date-fns";
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

export const getNotificationDisplay = (
  type: string,
  entityId: string,
  metadata?: NotificationMetadata
): NotificationDisplay => {
  switch (type) {
    case "NEW_OFFER":
    case "NEW_PROPOSAL": // Handle old type for backward compatibility
      let offerDescription = "Someone made an offer on your product";
      let offerIcon = Package;
      
      if (metadata) {
        if (metadata.offerType === "exchange" && metadata.offeredProductName) {
          offerDescription = `Offered "${metadata.offeredProductName}" for your "${metadata.productName}"`;
          offerIcon = ArrowRightLeft;
        } else if (metadata.offerType === "purchase" && metadata.offerAmount) {
          offerDescription = `Offered €${metadata.offerAmount.toFixed(2)} for your "${metadata.productName}"`;
          offerIcon = DollarSign;
        } else if (metadata.offerType === "chat") {
          offerDescription = `Wants to chat about your "${metadata.productName}"`;
          offerIcon = MessageCircle;
        } else if (metadata.productName) {
          offerDescription = `New offer for your "${metadata.productName}"`;
        }
      }
      
      return {
        title: "New Offer Received",
        description: offerDescription,
        icon: offerIcon,
        iconColor: "text-blue-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "OFFER_ACCEPTED":
    case "PROPOSAL_ACCEPTED": // Handle old type for backward compatibility
      return {
        title: "Offer Accepted",
        description: metadata?.productName 
          ? `Your offer for "${metadata.productName}" was accepted`
          : "Your offer has been accepted",
        icon: CheckCircle,
        iconColor: "text-green-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "OFFER_REJECTED":
    case "PROPOSAL_REJECTED": // Handle old type for backward compatibility
      return {
        title: "Offer Declined",
        description: metadata?.productName
          ? `Your offer for "${metadata.productName}" was declined`
          : "Your offer was declined",
        icon: XCircle,
        iconColor: "text-red-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "MESSAGE_RECEIVED":
    case "NEW_MESSAGE": // Handle old type for backward compatibility
      return {
        title: "New Message",
        description: metadata?.senderName
          ? `Message from ${metadata.senderName}`
          : "You have a new message in your exchange",
        icon: MessageCircle,
        iconColor: "text-purple-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    case "EXCHANGE_COMPLETED":
      return {
        title: "Exchange Completed",
        description: metadata?.productName
          ? `Exchange completed for "${metadata.productName}"`
          : "Your exchange has been marked as complete",
        icon: ArrowRightLeft,
        iconColor: "text-green-600",
        route: `/exchanges/details/${entityId}`,
      };

    case "REVIEW_RECEIVED":
      return {
        title: "New Review Received",
        description: metadata?.senderName
          ? `${metadata.senderName} left you a review`
          : "You have received a new review for a recent exchange",
        icon: Star,
        iconColor: "text-yellow-500",
        route: `/exchanges/details/${entityId}`,
      };
    
    default:
      return {
        title: "New Notification",
        description: "You have a new notification",
        icon: Bell,
        iconColor: "text-gray-500",
        route: "/",
      };
  }
};

export const formatNotificationTime = (date: Date): string => {
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Recently";
  }
};
