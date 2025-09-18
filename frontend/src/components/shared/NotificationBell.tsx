"use client";

import { BellIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import { Badge } from "@/components/ui/badge";
import { getNotificationDisplay, formatNotificationTime } from "@/lib/notificationUtils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Auto-mark all as read when popover opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      // Small delay to let user see the unread state briefly
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, unreadCount, markAllAsRead]);

  const handleNotificationClick = async (notification: {
    id: string;
    type: string;
    entityId: string;
    senderId: string;
    isRead: boolean;
  }) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Get the route for this notification type
    const display = getNotificationDisplay(
      notification.type,
      notification.entityId,
      notification.senderId
    );

    // Close popover
    setOpen(false);

    // Navigate to the relevant page
    router.push(display.route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <div>
            <h4 className="font-semibold text-sm">Notifications</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`
                : "All caught up!"}
            </p>
          </div>
        </div>
        <Separator />
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const display = getNotificationDisplay(
                  notification.type,
                  notification.entityId,
                  notification.senderId
                );
                const Icon = display.icon;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full px-4 py-3 flex items-start gap-3 hover:bg-accent transition-colors text-left",
                      !notification.isRead && "bg-blue-50/50 hover:bg-blue-50"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 p-2 rounded-full bg-background",
                        display.iconColor
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium leading-none">
                            {display.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {display.description}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {notifications.length > 5 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications");
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
