"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset, ActionCodeInfo } from "firebase/auth";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/locales/provider";
import { OrganicBackground } from "@/components/shared/OrganicBackground";

export default function AuthActionPage() {
  const t = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<string | null>(null);
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [actionState, setActionState] = useState<"loading" | "success" | "error" | "input">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [accountEmail, setAccountEmail] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const handleAction = async () => {
      // Get mode and oobCode from URL
      const modeParam = searchParams.get("mode");
      const oobCodeParam = searchParams.get("oobCode");

      setMode(modeParam);
      setActionCode(oobCodeParam);

      if (!oobCodeParam) {
        setActionState("error");
        setErrorMessage(t("auth_action.error.invalid_link"));
        return;
      }

      try {
        if (modeParam === "resetPassword") {
          // Verify the password reset code
          const email = await verifyPasswordResetCode(auth, oobCodeParam);
          setAccountEmail(email);
          setActionState("input"); // Show password input form
        } else if (modeParam === "verifyEmail") {
          // Handle email verification
          await applyActionCode(auth, oobCodeParam);
          setActionState("success");
          startRedirectCountdown("/login");
        } else if (modeParam === "recoverEmail") {
          // Handle email recovery
          // For now, we just show success and ask to contact support or reset password
          // In a real app, you might revert email change here
          await applyActionCode(auth, oobCodeParam);
          setActionState("success");
          startRedirectCountdown("/login");
        } else if (modeParam === "verifyAndChangeEmail") {
          // This is a custom mode if we implement email change verification
          await applyActionCode(auth, oobCodeParam);
          setActionState("success");
          startRedirectCountdown("/profile");
        }
        else {
          setActionState("error");
          setErrorMessage(t("auth_action.error.unknown_mode"));
        }
      } catch (error: any) {
        console.error("Auth action error:", error);
        setActionState("error");
        setErrorMessage(getErrorMessage(error.code));
      }
    };

    handleAction();
  }, [searchParams, router, t]);

  const startRedirectCountdown = (path: string) => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(path);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/expired-action-code":
        return t("auth_action.error.expired_link");
      case "auth/invalid-action-code":
        return t("auth_action.error.invalid_code");
      case "auth/user-disabled":
        return t("auth_action.error.user_disabled");
      case "auth/user-not-found":
        return t("auth_action.error.user_not_found");
      case "auth/weak-password":
        return t("auth_action.error.weak_password");
      default:
        return t("auth_action.error.generic");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCode) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage(t("auth_action.reset_password.password_mismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t("auth_action.reset_password.password_too_short"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setActionState("success");
      startRedirectCountdown("/login");
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error.code));
      setIsSubmitting(false);
    }
  };

  return (
    <OrganicBackground className="justify-center">
      <Card className="w-full max-w-md shadow-xl border-gray-100 dark:border-gray-700 bg-card ">
        <CardHeader>
          <CardTitle className="text-center text-foreground font-display text-2xl">
            {mode === "resetPassword" && t("auth_action.reset_password.title")}
            {mode === "verifyEmail" && t("auth_action.verify_email.title")}
            {mode === "recoverEmail" && t("auth_action.recover_email.title")}
            {!mode && t("auth_action.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Loading State */}
          {actionState === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground ">
                {t("auth_action.loading")}
              </p>
            </div>
          )}

          {/* Password Reset Form */}
          {actionState === "input" && mode === "resetPassword" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                {t("auth_action.reset_password.instruction", { email: accountEmail })}
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground ">
                    {t("auth_action.reset_password.new_password_label")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("auth_action.reset_password.new_password_placeholder")}
                      required
                      minLength={6}
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground ">
                    {t("auth_action.reset_password.confirm_password_label")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("auth_action.reset_password.confirm_password_placeholder")}
                      required
                      minLength={6}
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-sm text-red-500">{errorMessage}</p>
                )}

                <Button type="submit" className="w-full bg-primary hover:bg-[#7a8578] text-white" disabled={isSubmitting}>
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
              <CheckCircle className="h-16 w-16 text-[#556B2F] animate-in zoom-in duration-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground ">
                  {mode === "verifyEmail" && t("auth_action.success.email_verified")}
                  {mode === "resetPassword" && t("auth_action.success.password_reset")}
                  {mode === "recoverEmail" && t("auth_action.success.email_recovered")}
                  {mode === "verifyAndChangeEmail" && t("auth_action.success.email_changed")}
                </p>
                <p className="text-sm text-muted-foreground ">
                  {mode === "verifyEmail" && t("auth_action.success.email_verified_description")}
                  {mode === "resetPassword" && t("auth_action.success.password_reset_description")}
                  {mode === "recoverEmail" && t("auth_action.success.email_recovered_description")}
                  {mode === "verifyAndChangeEmail" && t("auth_action.success.email_changed_description")}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {t("auth_action.success.redirect", { seconds: countdown })}
                </p>
              </div>
              <div className="flex flex-col w-full space-y-2">
                <Button asChild className="w-full bg-primary hover:bg-[#7a8578] text-white">
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
                <p className="text-lg font-medium text-foreground ">
                  {t("auth_action.error.title")}
                </p>
                <p className="text-sm text-muted-foreground ">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col w-full space-y-2">
                <Button asChild className="w-full bg-primary hover:bg-[#7a8578] text-white">
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
    </OrganicBackground>
  );
}
