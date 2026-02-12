"use client";

import { useI18n } from "@/locales/provider";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { Mail, MessageSquare, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";

import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export default function ContactPage() {
    const t = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { userData } = useUser();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => {
                const autoName = userData?.name || user.displayName || "";
                const autoEmail = user.email || "";

                let newName = prev.name;
                // If name is empty, fill it. 
                // If name matches displayName but we have a (potentially newer) profile name, update it.
                if (!newName || (userData?.name && newName === user.displayName)) {
                    newName = autoName;
                }

                let newEmail = prev.email;
                if (!newEmail) {
                    newEmail = autoEmail;
                }

                if (newName !== prev.name || newEmail !== prev.email) {
                    return {
                        ...prev,
                        name: newName,
                        email: newEmail
                    };
                }
                return prev;
            });
        }
    }, [user, userData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitContactForm = httpsCallable(functions, 'submitContactForm');
            await submitContactForm(formData);

            toast.success(t("contact.form.success"));
            setFormData({ name: "", email: "", subject: "", message: "" });
            // Optionally redirect after a delay
            setTimeout(() => router.push("/"), 2000);
        } catch (error) {
            console.error("Error submitting contact form:", error);
            toast.error(t("contact.form.error"));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <OrganicBackground className="pb-20 md:pb-0">
            <div className="w-full max-w-4xl px-4 py-8 mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary rounded-xl shadow-lg transform rotate-2">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold font-display text-foreground">
                            {t("contact.title")}
                        </h1>
                        <p className="text-muted-foreground mt-1 font-serif">
                            {t("contact.subtitle")}
                        </p>
                    </div>
                </div>

                <OrganicCard className="p-8" rotate={-0.5}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("contact.form.name")}</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Tu nombre"
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t("contact.form.email")}</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="tu@email.com"
                                    className="bg-background/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">{t("contact.form.subject")}</Label>
                            <Input
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                placeholder="¿En qué podemos ayudarte?"
                                className="bg-background/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">{t("contact.form.message")}</Label>
                            <Textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                placeholder="Escribe tu mensaje aquí..."
                                rows={6}
                                className="bg-background/50 resize-none"
                            />
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-primary hover:bg-[#7a8578] text-white px-8 py-6 h-auto text-lg rounded-xl shadow-lg transform transition-transform hover:-translate-y-1 active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5 mr-2" />
                                )}
                                {t("contact.form.submit")}
                            </Button>
                        </div>
                    </form>
                </OrganicCard>

                {/* Alternative contact info note */}
                <div className="mt-12 flex justify-center">
                    <div
                        className="bg-[#FFFBE6] dark:bg-[#e0dcc7] p-6 shadow-md max-w-md text-center rotate-[1deg]"
                        style={{ borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px' }}
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Mail className="w-5 h-5 text-primary" />
                            <h3 className="font-serif font-bold text-[#3e3b34]">¿Prefieres el email directo?</h3>
                        </div>
                        <p className="font-serif italic text-muted-foreground">
                            Puedes escribirnos a hola@ecoanuncios.com
                        </p>
                    </div>
                </div>
            </div>
        </OrganicBackground>
    );
}
