"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService } from "@/services/auth.service";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useAuth } from "@/context/AuthContext";
import { Chrome, UserPlus, LogIn, KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
    const [showPassword, setShowPassword] = useState(false);
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
                setError(t('login.error.email_not_verified'));
                return;
            }

            const user = userCredential.user;
            // Refresh the user state to ensure the header updates immediately
            await refreshUser();
            // Then handle the redirect
            await handleUserRedirect(user, router);
        } catch (error: any) {
            const errorCode = error?.code;

            switch (errorCode) {
                case 'auth/invalid-email':
                    setError(t('login.error.invalid_email'));
                    break;
                case 'auth/user-disabled':
                    setError(t('login.error.user_disabled'));
                    break;
                case 'auth/user-not-found':
                    setError(t('login.error.user_not_found'));
                    break;
                case 'auth/wrong-password':
                    setError(t('login.error.wrong_password'));
                    break;
                case 'auth/invalid-credential':
                    setError(t('login.error.invalid_credential'));
                    break;
                case 'auth/too-many-requests':
                    setError(t('login.error.too_many_requests'));
                    break;
                case 'auth/missing-password':
                    setError(t('login.error.missing_password'));
                    break;
                default:
                    setError(error instanceof Error ? error.message : t('login.error.generic'));
            }
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
                                        autoComplete="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-foreground ">{t('common.password')}</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={toggleResetForm}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {t('login.forgot_password')}
                                        </button>
                                    </div>
                                </div>
                                {(error || googleError) && <p className="text-red-500 text-sm">{error || googleError}</p>}
                                {successMessage && <p className="text-[#556B2F] text-sm">{successMessage}</p>}
                                <Button
                                    type="submit"
                                    className="w-full text-white px-8 py-6 shadow-md transform transition-transform hover:-translate-y-0.5 border-2 border-white/20 h-auto"
                                    style={{
                                        backgroundColor: '#A88C8F',
                                        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px'
                                    }}
                                >
                                    <LogIn className="w-5 h-5 mr-2" />
                                    <span className="font-serif text-lg font-bold">{t('common.login')}</span>
                                </Button>
                            </form>
                            <div className="mt-4 text-center text-sm text-muted-foreground ">
                                {t('common.or')}
                            </div>
                            <Button
                                onClick={() => handleGoogleAuth()}
                                disabled={googleLoading}
                                variant="outline"
                                className="w-full mt-4 flex items-center justify-center gap-2 px-8 py-6 shadow-sm border-2 border-gray-100 dark:border-gray-700 h-auto"
                                style={{
                                    borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px'
                                }}
                            >
                                <Chrome size={18} className="mr-1" />
                                <span className="font-serif text-lg">{t('login.google_button')}</span>
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
                                        autoComplete="email"
                                        placeholder="m@example.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                {successMessage && <p className="text-[#556B2F] text-sm">{successMessage}</p>}
                                <Button
                                    type="submit"
                                    className="w-full text-white px-8 py-6 shadow-md transform transition-transform hover:-translate-y-0.5 border-2 border-white/20 h-auto"
                                    style={{
                                        backgroundColor: '#A88C8F',
                                        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px'
                                    }}
                                >
                                    <KeyRound className="w-5 h-5 mr-2" />
                                    <span className="font-serif text-lg font-bold">{t('login.send_reset_link')}</span>
                                </Button>
                            </form>
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={toggleResetForm}
                                    className="text-sm text-primary hover:underline flex items-center justify-center w-full gap-1 pt-2"
                                >
                                    <ArrowLeft size={16} />
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
