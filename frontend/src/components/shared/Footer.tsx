"use client";

import Link from "next/link";
import { useCurrentLocale, useI18n } from "@/locales/provider";

export default function Footer() {
  const t = useI18n();
  const locale = useCurrentLocale();

  return (
    <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-end relative z-10 bg-[#FFFBE6] dark:bg-[#2C2A25]">
      <div className="flex flex-col gap-2 mb-4 md:mb-0">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-sans">
          © 2025 EcoAnuncios. Portal de Intercambio Hortelano.
        </div>
        <Link
          href={`/${locale}/privacy`}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#879385] transition-colors font-sans underline underline-offset-2"
        >
          {t('footer.privacy')}
        </Link>
      </div>

      <div className="flex flex-row items-center gap-4">
        {/* Agroforja Logo */}
        <div className="bg-white/80 dark:bg-white/90 p-2 rounded-lg shadow-sm backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <img
            src="/LogoAgroforja.png"
            alt="Agroforja"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Amigos de la Tierra Logo */}
        <div className="bg-white/80 dark:bg-white/90 p-2 rounded-lg shadow-sm backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <img
            src="/LogoAmigosTierra.png"
            alt="Amigos de la Tierra"
            className="h-24 w-auto object-contain"
          />
        </div>
      </div>
    </footer>
  );
}
