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

function ChatListItem({ chat, partner }: { chat: Chat; partner?: ChatPartner }) {
  const router = useRouter();

  if (!partner) {
    return (
      <div className="p-4 border rounded-lg flex items-center space-x-4 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/exchanges/${chat.id}`)}
      className="p-4 border rounded-lg flex items-center space-x-4 cursor-pointer hover:bg-gray-50 bg-white"
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
  const [partners, setPartners] = useState<Record<string, ChatPartner>>({});

  useEffect(() => {
    if (!user) return;

    const unsubscribe = ChatService.subscribeToUserChats(user.uid, (chatsData) => {
      setChats(chatsData);

      // Collect unique partner IDs
      const partnerIds = Array.from(new Set(
        chatsData
          .map(chat => chat.participants.find(p => p !== user.uid))
          .filter((id): id is string => !!id)
      ));

      // Fetch partner profiles in batch
      if (partnerIds.length > 0) {
        UserService.getUsersProfiles(partnerIds).then((profiles) => {
          const newPartners: Record<string, ChatPartner> = {};
          profiles.forEach(p => {
            if (p.uid) {
              newPartners[p.uid] = {
                id: p.uid,
                displayName: p.name || "Unknown User",
                avatarUrl: p.avatarUrl || "",
              };
            }
          });
          setPartners(prev => ({ ...prev, ...newPartners }));
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-4">
      {chats.length > 0 ? (
        chats.map((chat) => {
          const partnerId = chat.participants.find(p => p !== user?.uid);
          return (
            <ChatListItem
              key={chat.id}
              chat={chat}
              partner={partnerId ? partners[partnerId] : undefined}
            />
          );
        })
      ) : (
        <p className="text-gray-500">You have no active messages.</p>
      )}
    </div>
  );
}
