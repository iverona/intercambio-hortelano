"use client";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { createNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TestNotifications() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [creating, setCreating] = useState(false);

  const handleCreateTestNotification = async () => {
    if (!user) {
      alert("You must be logged in to test notifications");
      return;
    }

    setCreating(true);
    try {
      await createNotification({
        recipientId: user.uid,
        senderId: user.uid,
        type: "NEW_MESSAGE",
        entityId: "test-entity-123",
      });
      console.log("Test notification created successfully");
    } catch (error) {
      console.error("Error creating test notification:", error);
      alert("Error creating notification. Check console for details.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test Notifications</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Current User</h2>
        <p>Logged in: {user ? "Yes" : "No"}</p>
        <p>User ID: {user?.uid || "N/A"}</p>
        <p>Email: {user?.email || "N/A"}</p>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Notification Stats</h2>
        <p>Total notifications: {notifications.length}</p>
        <p>Unread count: {unreadCount}</p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={handleCreateTestNotification}
          disabled={!user || creating}
        >
          {creating ? "Creating..." : "Create Test Notification"}
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Notifications List</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-3 border rounded">
                <p className="font-medium">Type: {notification.type}</p>
                <p className="text-sm text-gray-600">
                  Read: {notification.isRead ? "Yes" : "No"}
                </p>
                <p className="text-sm text-gray-600">
                  Created: {notification.createdAt.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
