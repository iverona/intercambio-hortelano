"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ChatService } from "@/services/chat.service";
import { UserService } from "@/services/user.service";
import { Chat } from "@/types/chat";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatPartner {
  id: string;
  displayName: string;
  avatarUrl: string;
}

function ChatListItem({ chat }: { chat: Chat }) {
  const { user } = useAuth();
  const router = useRouter();
  const [partner, setPartner] = useState<ChatPartner | null>(null);

  useEffect(() => {
    const partnerId = chat.participants.find((p) => p !== user?.uid);
    if (partnerId) {
      UserService.getUserProfile(partnerId).then((userData) => {
        if (userData) {
          setPartner({
            id: partnerId,
            displayName: userData.name || "Unknown User",
            avatarUrl: userData.avatarUrl || "",
          });
        }
      });
    }
  }, [chat, user]);

  if (!partner) {
    return null; // Or a loading skeleton
  }

  return (
    <div
      onClick={() => router.push(`/exchanges/${chat.id}`)}
      className="p-4 border rounded-lg flex items-center space-x-4 cursor-pointer hover:bg-gray-50"
    >
      <Avatar>
        <AvatarImage src={partner.avatarUrl} alt={partner.displayName} />
        <AvatarFallback>
          {partner.displayName
            ? partner.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
            : ""}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold">{partner.displayName}</p>
        <p className="text-sm text-gray-600 truncate">
          {chat.listingTitle}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {chat.lastMessage?.text || "No messages yet"}
        </p>
      </div>
      {chat.lastMessage?.createdAt && (
        <p className="text-xs text-gray-400">
          {chat.lastMessage.createdAt.toDate().toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = ChatService.subscribeToUserChats(user.uid, (chatsData) => {
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-4">
      {chats.length > 0 ? (
        chats.map((chat) => <ChatListItem key={chat.id} chat={chat} />)
      ) : (
        <p className="text-gray-500">You have no active messages.</p>
      )}
    </div>
  );
}
