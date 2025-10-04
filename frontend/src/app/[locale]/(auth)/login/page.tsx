"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useAuth } from "@/context/AuthContext";
import { Chrome } from "lucide-react";
import { handleUserRedirect } from "@/lib/authUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/locales/provider";

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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
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
      await sendPasswordResetEmail(auth, emailToReset);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{showResetForm ? t('login.reset_password_title') : t('login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showResetForm ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('login.email_label')}</Label>
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
                    <Label htmlFor="password">{t('login.password_label')}</Label>
                    <button
                      type="button"
                      onClick={toggleResetForm}
                      className="text-sm text-blue-600 hover:underline"
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
                {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
                <Button type="submit" className="w-full">
                  {t('login.login_button')}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                {t('login.or')}
              </div>
              <Button onClick={handleGoogleAuth} disabled={googleLoading} className="w-full mt-4 flex items-center gap-2">
                <Chrome size={18} />
                {t('login.google_button')}
              </Button>
              <div className="mt-4 text-center">
                <Link href="/signup" className="text-sm text-blue-600 hover:underline">
                  {t('login.signup_prompt')}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">{t('login.reset_password_description')}</p>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t('login.email_label')}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="m@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
                <Button type="submit" className="w-full">
                  {t('login.send_reset_link')}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={toggleResetForm}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('login.back_to_login')}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
