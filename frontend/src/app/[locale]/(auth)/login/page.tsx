"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService } from "@/services/auth.service";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useAuth } from "@/context/AuthContext";
import { Chrome, UserPlus } from "lucide-react";
import { handleUserRedirect } from "@/lib/authUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/locales/provider";
import { OrganicBackground } from "@/components/shared/OrganicBackground";

export default function LoginPage() {
    const t = useI18n();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showResetForm, setShowResetForm] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const router = useRouter();
    const { refreshUser } = useAuth();
    const { handleGoogleAuth, error: googleError, loading: googleLoading } = useGoogleAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        try {
            const userCredential = await AuthService.loginWithEmail(email, password);

            if (!userCredential.user.emailVerified) {
                setError(
                    "Your email is not verified. Please check your inbox for the verification link."
                );
                return;
            }

            const user = userCredential.user;
            // Refresh the user state to ensure the header updates immediately
            await refreshUser();
            // Then handle the redirect
            await handleUserRedirect(user, router);
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred");
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const emailToReset = resetEmail || email;

        if (!emailToReset) {
            setError(t('login.reset_email_error'));
            return;
        }

        try {
            await AuthService.sendPasswordResetEmail(emailToReset);
            setSuccessMessage(t('login.reset_email_sent'));
            setResetEmail("");
            // Optionally switch back to login form after a delay
            setTimeout(() => {
                setShowResetForm(false);
                setSuccessMessage(null);
            }, 3000);
        } catch (error) {
            setError(t('login.reset_email_error'));
        }
    };

    const toggleResetForm = () => {
        setShowResetForm(!showResetForm);
        setError(null);
        setSuccessMessage(null);
        setResetEmail(email);
    };

    return (
        <OrganicBackground className="justify-center">
            <Card className="w-full max-w-md shadow-xl border-gray-100 dark:border-gray-700 bg-card ">
                <CardHeader>
                    <CardTitle className="text-foreground font-display text-2xl">
                        {showResetForm ? t('login.reset_password_title') : t('login.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!showResetForm ? (
                        <>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-foreground ">{t('common.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-foreground ">{t('common.password')}</Label>
                                        <button
                                            type="button"
                                            onClick={toggleResetForm}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {t('login.forgot_password')}
                                        </button>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                {(error || googleError) && <p className="text-red-500 text-sm">{error || googleError}</p>}
                                {successMessage && <p className="text-[#556B2F] text-sm">{successMessage}</p>}
                                <Button type="submit" className="w-full bg-primary hover:bg-[#7a8578] text-white">
                                    {t('common.login')}
                                </Button>
                            </form>
                            <div className="mt-4 text-center text-sm text-muted-foreground ">
                                {t('common.or')}
                            </div>
                            <Button onClick={handleGoogleAuth} disabled={googleLoading} className="w-full mt-4 flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-card dark:text-card-foreground dark:border-gray-600 dark:hover:bg-[#4a463a]">
                                <Chrome size={18} />
                                {t('login.google_button')}
                            </Button>
                            <div className="mt-8 flex flex-col items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-sm text-muted-foreground font-medium">
                                    {t('login.signup_prompt')}
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full bg-[#879385] hover:bg-[#727d70] text-white px-8 py-6 shadow-md transform transition-transform hover:-translate-y-0.5 border-2 border-white/20 h-auto"
                                    style={{
                                        borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px'
                                    }}
                                >
                                    <Link href="/signup" className="flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        <span className="font-serif text-lg font-bold">{t('common.signup')}</span>
                                    </Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground mb-4 font-serif">{t('login.reset_password_description')}</p>
                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email" className="text-foreground ">{t('common.email')}</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                {successMessage && <p className="text-[#556B2F] text-sm">{successMessage}</p>}
                                <Button type="submit" className="w-full bg-primary hover:bg-[#7a8578] text-white">
                                    {t('login.send_reset_link')}
                                </Button>
                            </form>
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={toggleResetForm}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t('login.back_to_login')}
                                </button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </OrganicBackground>
    );
}
