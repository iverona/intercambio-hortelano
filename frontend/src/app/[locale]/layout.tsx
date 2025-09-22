import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { FilterProvider } from "@/context/FilterContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "@/components/ui/sonner";
import { I18nProviderClient } from "@/locales/provider";
import { getCurrentLocale } from "@/locales/server";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Portal de Intercambio Hortelano",
  description: "Intercambia productos de tu huerta",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getCurrentLocale();
  return (
    <I18nProviderClient locale={locale}>
      <AuthProvider>
        <FilterProvider>
          <NotificationProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </NotificationProvider>
        </FilterProvider>
      </AuthProvider>
    </I18nProviderClient>
  );
}
