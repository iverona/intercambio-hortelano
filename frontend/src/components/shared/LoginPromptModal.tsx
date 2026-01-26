"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useI18n } from "@/locales/provider";
import { LogIn, UserPlus, X } from "lucide-react";
import Image from "next/image";

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
    const t = useI18n();
    const organicRadius = '255px 15px 225px 15px / 15px 225px 15px 255px';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none gap-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>{t('login_prompt.title')}</DialogTitle>
                    <DialogDescription>{t('login_prompt.description')}</DialogDescription>
                </DialogHeader>

                <div className="relative p-1">
                    {/* Shadow/Background Element */}
                    <div
                        className="absolute inset-0 bg-[#A88C8F] opacity-20 transform -rotate-2"
                        style={{ borderRadius: organicRadius }}
                    ></div>

                    {/* Main Content Container */}
                    <div
                        className="relative bg-[#FFFBE6] dark:bg-[#2c2a24] p-8 md:p-10 shadow-2xl border border-[#e6e0ca] dark:border-[#3e3b34]"
                        style={{ borderRadius: organicRadius }}
                    >
                        <div className="text-center space-y-6">
                            {/* Decorative Icon */}
                            <div className="flex justify-center mb-2">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full blur-xl opacity-50"></div>
                                    <Image
                                        src="/hojasolivo.png"
                                        alt="Hojas de olivo"
                                        width={80}
                                        height={80}
                                        className="relative w-20 h-auto object-contain transform -rotate-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#3e3b34] dark:text-[#EFEAC6] leading-tight">
                                    {t('login_prompt.title')}
                                </h2>
                                <p className="text-[#6b675d] dark:text-[#a5a093] text-lg">
                                    {t('login_prompt.description')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 pt-4">
                                <Button
                                    asChild
                                    className="w-full text-white px-8 py-6 shadow-lg transform transition-transform hover:-translate-y-1 border-2 border-white/20 h-auto"
                                    style={{
                                        backgroundColor: '#A88C8F',
                                        borderRadius: organicRadius
                                    }}
                                >
                                    <Link href="/login" className="flex items-center justify-center">
                                        <LogIn className="w-5 h-5 mr-3" />
                                        <span className="font-serif text-xl font-bold">{t('common.login')}</span>
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full bg-[#879385] hover:bg-[#727d70] text-white px-8 py-6 shadow-lg transform transition-transform hover:-translate-y-1 border-2 border-white/20 h-auto"
                                    style={{
                                        borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px'
                                    }}
                                >
                                    <Link href="/signup" className="flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 mr-3" />
                                        <span className="font-serif text-xl font-bold">{t('common.signup')}</span>
                                    </Link>
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="mt-4 font-serif text-[#6b675d] dark:text-[#a5a093] hover:text-[#3e3b34] dark:hover:text-[#EFEAC6] underline transition-colors text-lg"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
