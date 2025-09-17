"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

export default function ChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const chatId = params.chatId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatPartner, setChatPartner] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [listingTitle, setListingTitle] = useState("");

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });

    // Fetch chat details to get partner and listing info
    const chatRef = doc(db, "chats", chatId);
    getDoc(chatRef).then(async (chatSnap) => {
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        setListingTitle(chatData.listingTitle);
        const partnerId = chatData.participants.find((p: string) => p !== user?.uid);
        if (partnerId) {
          const userRef = doc(db, "users", partnerId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setChatPartner({
              id: userSnap.id,
              displayName: userSnap.data().displayName,
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatRef = doc(db, "chats", chatId);

    // Add the new message to the messages subcollection
    await addDoc(messagesRef, {
      text: newMessage,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    });

    // Update the lastMessage field on the parent chat document
    await updateDoc(chatRef, {
      lastMessage: {
        text: newMessage,
        createdAt: serverTimestamp(),
      },
    });

    setNewMessage("");
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto border rounded-lg">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">
            Chat with {chatPartner?.displayName || "..."}
          </h1>
          <p className="text-sm text-gray-500">
            Regarding: {listingTitle || "..."}
          </p>
        </div>
        <div className="p-4 h-96 overflow-y-auto flex flex-col space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === user?.uid ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-xs ${
                  msg.senderId === user?.uid
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </div>
    </main>
  );
}
