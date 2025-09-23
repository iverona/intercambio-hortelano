"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { applyActionCode } from "firebase/auth";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/locales/provider";

export default function VerifyEmailPage() {
  const t = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationState, setVerificationState] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get("oobCode");
      
      if (!oobCode) {
        setVerificationState("error");
        setErrorMessage(t("verify_email.error.invalid_link"));
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        setVerificationState("success");
        
        // Start countdown for auto-redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push("/login");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (error: any) {
        setVerificationState("error");
        
        // Handle different error cases
        if (error.code === "auth/invalid-action-code") {
          setErrorMessage(t("verify_email.error.invalid_code"));
        } else if (error.code === "auth/expired-action-code") {
          setErrorMessage(t("verify_email.error.expired_link"));
        } else {
          setErrorMessage(t("verify_email.error.generic"));
        }
      }
    };

    verifyEmail();
  }, [searchParams, router, t]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {verificationState === "loading" && t("verify_email.title.loading")}
            {verificationState === "success" && t("verify_email.title.success")}
            {verificationState === "error" && t("verify_email.title.error")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationState === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                {t("verify_email.loading_message")}
              </p>
            </div>
          )}

          {verificationState === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500 animate-in zoom-in duration-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  {t("verify_email.success.title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("verify_email.success.subtitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("verify_email.success.redirect", { seconds: countdown })}
                </p>
              </div>
              <div className="flex flex-col w-full space-y-2">
                <Button asChild className="w-full">
                  <Link href="/login">{t("verify_email.success.login_button")}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">{t("verify_email.success.home_button")}</Link>
                </Button>
              </div>
            </div>
          )}

          {verificationState === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  {t("verify_email.error.title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col w-full space-y-2">
                <Button asChild className="w-full">
                  <Link href="/login">{t("verify_email.error.login_button")}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">{t("verify_email.error.signup_button")}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
