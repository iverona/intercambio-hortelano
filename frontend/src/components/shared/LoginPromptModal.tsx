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
import { LogIn, UserPlus } from "lucide-react";

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
    const t = useI18n();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-slate-950 gap-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>{t('login_prompt.title')}</DialogTitle>
                    <DialogDescription>{t('login_prompt.description')}</DialogDescription>
                </DialogHeader>

                <div className="p-6 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <LogIn className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {t('login_prompt.title')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t('login_prompt.description')}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                            <Link href="/login">
                                <LogIn className="w-4 h-4 mr-2" />
                                {t('login_prompt.login_button')}
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="w-full border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300" size="lg">
                            <Link href="/signup">
                                <UserPlus className="w-4 h-4 mr-2" />
                                {t('login_prompt.signup_button')}
                            </Link>
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="mt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            {t('login_prompt.cancel_button')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
