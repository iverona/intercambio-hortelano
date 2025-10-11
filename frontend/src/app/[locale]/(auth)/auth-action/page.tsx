"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  checkActionCode,
} from "firebase/auth";
import { CheckCircle, XCircle, Loader2, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/locales/provider";

type ActionMode = "verifyEmail" | "resetPassword" | "recoverEmail" | "verifyAndChangeEmail";

export default function AuthActionPage() {
  const t = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mode, setMode] = useState<ActionMode | null>(null);
  const [actionState, setActionState] = useState<"loading" | "success" | "error" | "form">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (actionState === "success" && countdown === 0) {
      router.push("/login");
    }
  }, [countdown, actionState, router]);

  useEffect(() => {
    const handleAction = async () => {
      const oobCode = searchParams.get("oobCode");
      const actionMode = searchParams.get("mode") as ActionMode;

      // Validate mode parameter
      const validModes: ActionMode[] = ["verifyEmail", "resetPassword", "recoverEmail", "verifyAndChangeEmail"];
      if (!actionMode || !validModes.includes(actionMode)) {
        setActionState("error");
        setErrorMessage(t("auth_action.error.invalid_link"));
        return;
      }

      if (!oobCode) {
        setActionState("error");
        setErrorMessage(t("auth_action.error.invalid_link"));
        return;
      }

      setMode(actionMode);

      try {
        // Verify the action code is valid
        const info = await checkActionCode(auth, oobCode);
        
        if (actionMode === "verifyEmail") {
          // Apply email verification immediately
          await applyActionCode(auth, oobCode);
          setActionState("success");
          startCountdown();
        } else if (actionMode === "resetPassword") {
          // Verify the code and get the email
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
          setActionState("form");
        } else if (actionMode === "recoverEmail") {
          // Apply email recovery
          await applyActionCode(auth, oobCode);
          setEmail(info.data.email || "");
          setActionState("success");
          startCountdown();
        } else if (actionMode === "verifyAndChangeEmail") {
          // Apply email change
          await applyActionCode(auth, oobCode);
          setEmail(info.data.email || "");
          setActionState("success");
          startCountdown();
        }
      } catch (error: any) {
        setActionState("error");
        handleError(error);
      }
    };

    handleAction();
  }, [searchParams, t]);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleError = (error: any) => {
    console.error("Auth action error:", error);
    
    if (error.code === "auth/invalid-action-code") {
      setErrorMessage(t("auth_action.error.invalid_code"));
    } else if (error.code === "auth/expired-action-code") {
      setErrorMessage(t("auth_action.error.expired_link"));
    } else if (error.code === "auth/user-disabled") {
      setErrorMessage(t("auth_action.error.user_disabled"));
    } else if (error.code === "auth/user-not-found") {
      setErrorMessage(t("auth_action.error.user_not_found"));
    } else {
      setErrorMessage(t("auth_action.error.generic"));
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword.length < 6) {
      setErrorMessage(t("auth_action.error.password_too_short"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t("auth_action.error.passwords_no_match"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const oobCode = searchParams.get("oobCode");
      if (!oobCode) {
        throw new Error("Missing action code");
      }

      // Sanitize password input
      const sanitizedPassword = newPassword.trim();

      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, sanitizedPassword);

      // Clear sensitive data
      setNewPassword("");
      setConfirmPassword("");

      setActionState("success");
      startCountdown();
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (actionState === "loading") return t("auth_action.title.loading");
    if (actionState === "error") return t("auth_action.title.error");
    
    if (mode === "verifyEmail") {
      return actionState === "success" 
        ? t("auth_action.title.email_verified")
        : t("auth_action.title.verifying_email");
    }
    if (mode === "resetPassword") {
      return actionState === "success"
        ? t("auth_action.title.password_reset_success")
        : t("auth_action.title.reset_password");
    }
    if (mode === "recoverEmail") {
      return actionState === "success"
        ? t("auth_action.title.email_recovered")
        : t("auth_action.title.recovering_email");
    }
    if (mode === "verifyAndChangeEmail") {
      return actionState === "success"
        ? t("auth_action.title.email_changed")
        : t("auth_action.title.changing_email");
    }
    
    return t("auth_action.title.loading");
  };

  const getIcon = () => {
    if (mode === "resetPassword") return <KeyRound className="h-16 w-16" />;
    return <Mail className="h-16 w-16" />;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading State */}
          {actionState === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                {t("auth_action.loading_message")}
              </p>
            </div>
          )}

          {/* Password Reset Form */}
          {actionState === "form" && mode === "resetPassword" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-2 mb-4">
                <KeyRound className="h-12 w-12 text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  {t("auth_action.reset_password.description", { email })}
                </p>
              </div>
              
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    {t("auth_action.reset_password.new_password_label")}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("auth_action.reset_password.new_password_placeholder")}
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {t("auth_action.reset_password.confirm_password_label")}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth_action.reset_password.confirm_password_placeholder")}
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                </div>

                {errorMessage && (
                  <p className="text-sm text-red-500">{errorMessage}</p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth_action.reset_password.submitting")}
                    </>
                  ) : (
                    t("auth_action.reset_password.submit_button")
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Success State */}
          {actionState === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 animate-in zoom-in duration-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  {mode === "verifyEmail" && t("auth_action.success.email_verified")}
                  {mode === "resetPassword" && t("auth_action.success.password_reset")}
                  {mode === "recoverEmail" && t("auth_action.success.email_recovered")}
                  {mode === "verifyAndChangeEmail" && t("auth_action.success.email_changed")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === "verifyEmail" && t("auth_action.success.email_verified_description")}
                  {mode === "resetPassword" && t("auth_action.success.password_reset_description")}
                  {mode === "recoverEmail" && t("auth_action.success.email_recovered_description")}
                  {mode === "verifyAndChangeEmail" && t("auth_action.success.email_changed_description")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("auth_action.success.redirect", { seconds: countdown })}
                </p>
              </div>
              <div className="flex flex-col w-full space-y-2">
                <Button asChild className="w-full">
                  <Link href="/login">{t("auth_action.success.login_button")}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">{t("auth_action.success.home_button")}</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {actionState === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  {t("auth_action.error.title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col w-full space-y-2">
                <Button asChild className="w-full">
                  <Link href="/login">{t("auth_action.error.login_button")}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">{t("auth_action.error.signup_button")}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
