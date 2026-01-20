"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthService } from "@/services/auth.service";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Chrome } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/locales/provider";
import { OrganicBackground } from "@/components/shared/OrganicBackground";

export default function SignupPage() {
  const t = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const router = useRouter();
  const { handleGoogleAuth, error: googleError, loading: googleLoading } = useGoogleAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('signup.passwords_no_match') || null);
      return;
    }
    try {
      const userCredential = await AuthService.signupWithEmail(email, password);
      const user = userCredential.user;

      await AuthService.createUserDoc(user.uid, {
        uid: user.uid,
        email: user.email || email,
        name: name,
        onboardingComplete: false,
        authMethod: "password",
      });

      await AuthService.sendEmailVerification(user);
      setIsSubmitted(true);
    } catch (error: any) {
      // Check if email is already in use
      if (error.code === "auth/email-already-in-use") {
        // Check what sign-in methods are available for this email
        try {
          const signInMethods = await AuthService.fetchSignInMethods(email);

          // Check if the email is registered with Google
          const hasGoogleProvider = signInMethods.some(method =>
            method === "google.com" || method.includes("google")
          );

          if (hasGoogleProvider) {
            setShowGoogleDialog(true);
            setError(null);
            return;
          }
        } catch (checkError) {
          console.error("Error checking sign-in methods:", checkError);
        }

        // If it's not Google, it must be password - show generic error
        setError(t('signup.email_already_exists') || null);
        return;
      }

      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleGoogleSignIn = async () => {
    setShowGoogleDialog(false);
    await handleGoogleAuth();
  };

  return (
    <OrganicBackground className="justify-center">
      <Dialog open={showGoogleDialog} onOpenChange={setShowGoogleDialog}>
        <DialogContent className="bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle>{t('signup.account_exists_title')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('signup.account_exists_description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto"
            >
              {t('signup.go_to_login')}
            </Button>
            <Button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex items-center gap-2 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Chrome size={18} />
              {t('signup.signin_with_google')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full max-w-md shadow-xl border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-foreground font-display text-2xl">{t('signup.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center">
              <p className="text-foreground">
                {t('signup.success_message')}
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">{t('signup.name_label')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('signup.name_placeholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50 border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">{t('signup.email_label')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">{t('signup.password_label')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">{t('signup.confirm_password_label')}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50 border-input"
                  />
                </div>
                {(error || googleError) && <p className="text-destructive text-sm">{error || googleError}</p>}
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {t('signup.signup_button')}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('signup.or')}
              </div>
              <Button onClick={handleGoogleAuth} disabled={googleLoading} className="w-full mt-4 flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Chrome size={18} />
                {t('signup.google_button')}
              </Button>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-primary hover:underline font-semibold">
                  {t('signup.login_prompt')}
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </OrganicBackground>
  );
}
