import { formatDistanceToNow } from "date-fns";
import { 
  Package, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft,
  Bell,
  LucideIcon
} from "lucide-react";

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
  senderId?: string
): NotificationDisplay => {
  switch (type) {
    case "NEW_OFFER":
      return {
        title: "New Offer Received",
        description: "Someone made an offer on your product",
        icon: Package,
        iconColor: "text-blue-500",
        route: `/product/${entityId}`,
      };
    
    case "OFFER_ACCEPTED":
      return {
        title: "Offer Accepted",
        description: "Your offer has been accepted",
        icon: CheckCircle,
        iconColor: "text-green-500",
        route: `/exchanges/${entityId}`,
      };
    
    case "OFFER_REJECTED":
      return {
        title: "Offer Declined",
        description: "Your offer was declined",
        icon: XCircle,
        iconColor: "text-red-500",
        route: `/product/${entityId}`,
      };
    
    case "MESSAGE_RECEIVED":
      return {
        title: "New Message",
        description: "You have a new message in your exchange",
        icon: MessageCircle,
        iconColor: "text-purple-500",
        route: `/exchanges/${entityId}`,
      };
    
    case "EXCHANGE_COMPLETED":
      return {
        title: "Exchange Completed",
        description: "Your exchange has been marked as complete",
        icon: ArrowRightLeft,
        iconColor: "text-green-600",
        route: `/exchanges/${entityId}`,
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
