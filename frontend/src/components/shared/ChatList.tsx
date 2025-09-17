"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Chat {
  id: string;
  listingTitle: string;
  participants: string[];
  lastMessage?: {
    text: string;
    createdAt: Timestamp;
  };
}

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
      const userRef = doc(db, "users", partnerId);
      getDoc(userRef).then((userSnap) => {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setPartner({
            id: userSnap.id,
            displayName: userData.displayName,
            avatarUrl: userData.avatarUrl,
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

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];
      // Sort by last message timestamp
      chatsData.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt?.toMillis() || 0;
        const timeB = b.lastMessage?.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
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
