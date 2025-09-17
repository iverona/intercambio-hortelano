"use client";

import { BellIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import { Badge } from "@/components/ui/badge";

const NotificationBell = () => {
  const { notifications, unreadCount } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center p-1 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {unreadCount} unread messages.
            </p>
          </div>
          <div className="grid gap-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
              >
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.type.replace(/_/g, " ").toLowerCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is a placeholder for the notification content.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
