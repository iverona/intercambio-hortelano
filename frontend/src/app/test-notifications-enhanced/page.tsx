"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useNotifications } from "@/context/NotificationContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TestNotificationsEnhanced() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [loading, setLoading] = useState(false);

  const notificationTypes = [
    {
      type: "NEW_OFFER",
      title: "New Offer",
      description: "Simulates receiving a new offer on a product",
      color: "blue",
    },
    {
      type: "OFFER_ACCEPTED",
      title: "Offer Accepted",
      description: "Simulates an offer being accepted",
      color: "green",
    },
    {
      type: "OFFER_REJECTED",
      title: "Offer Rejected",
      description: "Simulates an offer being rejected",
      color: "red",
    },
    {
      type: "MESSAGE_RECEIVED",
      title: "New Message",
      description: "Simulates receiving a message in an exchange",
      color: "purple",
    },
    {
      type: "EXCHANGE_COMPLETED",
      title: "Exchange Completed",
      description: "Simulates completing an exchange",
      color: "green",
    },
  ];

  const createTestNotification = async (type: string) => {
    if (!user) {
      toast.error("You must be logged in to test notifications");
      return;
    }

    setLoading(true);
    try {
      // Create a test notification
      await addDoc(collection(db, "notifications"), {
        recipientId: user.uid,
        senderId: "test-sender-id",
        type: type,
        entityId: "test-entity-id",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      toast.success(`Test ${type} notification created!`);
    } catch (error) {
      console.error("Error creating test notification:", error);
      toast.error("Failed to create test notification");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      toast.success("Notification marked as read");
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to test the notification system
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Notification Testing</CardTitle>
          <CardDescription>
            Test the notification system with auto-read functionality and actionable notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notification Stats</p>
              <p className="text-xs text-muted-foreground">
                Total: {notifications.length} | Unread: {unreadCount}
              </p>
            </div>
            <Button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              variant="outline"
              size="sm"
            >
              Mark All as Read
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <p className="text-sm font-medium">Create Test Notifications</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notificationTypes.map((notif) => (
                <div
                  key={notif.type}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {notif.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => createTestNotification(notif.type)}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    Create
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Notifications</CardTitle>
          <CardDescription>
            View and manage your notifications directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications yet. Create some test notifications above!
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {notification.type.replace(/_/g, " ")}
                        </p>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <Button
                      onClick={() => handleMarkAsRead(notification.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Auto-Read Feature:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Notifications are automatically marked as read when you open the notification bell</li>
              <li>There&apos;s a 500ms delay to let you see the unread state briefly</li>
              <li>The unread count badge updates immediately</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Actionable Notifications:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Click any notification to navigate to relevant content</li>
              <li>NEW_OFFER → Product page</li>
              <li>OFFER_ACCEPTED/REJECTED → Exchange chat</li>
              <li>MESSAGE_RECEIVED → Exchange chat</li>
              <li>EXCHANGE_COMPLETED → Exchange details</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Visual Indicators:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Unread notifications have a blue background tint</li>
              <li>Each notification type has a unique icon and color</li>
              <li>Timestamps show relative time (e.g., &quot;2 hours ago&quot;)</li>
              <li>Hover states indicate clickable areas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
