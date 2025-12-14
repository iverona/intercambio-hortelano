import type { Metadata } from "next";
import "../globals.css";
// Load Google Fonts
import { Inter } from 'next/font/google';

// Note: In Next.js 13+ with App Router, we should ideally use next/font, but for speed with multiple weights/styles from Stitch, 
// and to match the HTML exactly, we can inject the link in the layout or use the font optimization. 
// However, adding the link tag to the head is a quick way to ensure all styles are available as per the design.

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import BottomNavigation from "@/components/shared/BottomNavigation";
import { AuthProvider } from "@/context/AuthContext";
import { FilterProvider } from "@/context/FilterContext";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationToaster from "@/components/shared/NotificationToaster";
import { Toaster } from "@/components/ui/sonner";
import { I18nProviderClient } from "@/locales/provider";
import { getCurrentLocale } from "@/locales/server";
import { ReactNode } from "react";
import GoogleMapsProvider from "@/components/shared/GoogleMapsProvider";

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
      <GoogleMapsProvider>
        <AuthProvider>
          <FilterProvider>
            <NotificationProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow pb-20 md:pb-0">{children}</main>
                <Footer />
                <BottomNavigation />
              </div>
              <NotificationToaster />
              <Toaster />
            </NotificationProvider>
          </FilterProvider>
        </AuthProvider>
      </GoogleMapsProvider>
    </I18nProviderClient>
  );
}
