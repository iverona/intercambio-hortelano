import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ExchangeService } from '@/services/exchange.service';
import { Exchange, Message, ExchangeStatus } from '@/types/exchange';
import { toast } from 'sonner';

export function useExchanges() {
    const { user } = useAuth();
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setExchanges([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = ExchangeService.getUserExchanges(user.uid, (data) => {
            setExchanges(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { exchanges, loading };
}

export function useExchangeDetails(exchangeId: string) {
    const { user } = useAuth();
    const [exchange, setExchange] = useState<Exchange | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);

    // Fetch exchange details
    useEffect(() => {
        if (!exchangeId || !user) return;
        setLoading(true);

        const unsubscribe = ExchangeService.getExchangeDetails(
            exchangeId,
            (data) => {
                setExchange(data);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                toast.error("Failed to load exchange details");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [exchangeId, user]);

    // Fetch messages if chat exists
    useEffect(() => {
        if (!exchange?.chatId) return;

        const unsubscribe = ExchangeService.subscribeToMessages(exchange.chatId, (msgs) => {
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [exchange?.chatId]);

    const sendMessage = useCallback(async (text: string) => {
        if (!exchange?.chatId || !user) return;
        try {
            await ExchangeService.sendMessage(exchange.chatId, text, user.uid);
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message");
            throw error;
        }
    }, [exchange?.chatId, user]);

    const updateStatus = useCallback(async (status: ExchangeStatus) => {
        if (!exchange) return;
        try {
            await ExchangeService.updateStatus(exchange.id, status);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
            throw error;
        }
    }, [exchange]);

    return { exchange, loading, messages, sendMessage, updateStatus };
}
