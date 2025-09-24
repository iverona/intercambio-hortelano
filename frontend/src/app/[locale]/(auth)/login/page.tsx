"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
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
  const router = useRouter();
  const { handleGoogleAuth, error: googleError, loading: googleLoading } = useGoogleAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await handleUserRedirect(user, router);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="password">{t('login.password_label')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {(error || googleError) && <p className="text-red-500 text-sm">{error || googleError}</p>}
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
        </CardContent>
      </Card>
    </div>
  );
}
