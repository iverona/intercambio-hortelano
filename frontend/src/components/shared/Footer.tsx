"use client";

import Link from "next/link";
import { useCurrentLocale, useI18n } from "@/locales/provider";
import Image from "next/image";

export default function Footer() {
  const t = useI18n();
  const locale = useCurrentLocale();

  return (
    <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-end bg-[#FFFBE6] dark:bg-[#2C2A25]">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-sans mb-4 md:mb-0">
        © 2026 EcoAnuncios.
        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
        <Link
          href={`/${locale}/privacy`}
          className="hover:text-[#879385] transition-colors underline underline-offset-2"
        >
          {t('footer.privacy')}
        </Link>
        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
        <Link
          href={`/${locale}/cookies`}
          className="hover:text-[#879385] transition-colors underline underline-offset-2"
        >
          {t('footer.cookies')}
        </Link>
        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
        <Link
          href={`/${locale}/legal`}
          className="hover:text-[#879385] transition-colors underline underline-offset-2"
        >
          {t('footer.legal')}
        </Link>
      </div>

      <div className="flex flex-row items-center gap-4">
        {/* Agroforja Logo */}
        <a
          href="https://agroforja.es/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/80 dark:bg-white/90 p-2 rounded-lg shadow-sm backdrop-blur-sm hover:scale-105 transition-transform duration-300 relative h-12 w-32"
        >
          <Image
            src="/LogoAgroforja.png"
            alt="Agroforja"
            fill
            sizes="128px"
            className="object-contain p-2"
          />
        </a>

        {/* Amigos de la Tierra Logo */}
        <div className="bg-white/80 dark:bg-white/90 p-2 rounded-lg shadow-sm backdrop-blur-sm hover:scale-105 transition-transform duration-300 relative h-24 w-32">
          <Image
            src="/LogoAmigosTierra.png"
            alt="Amigos de la Tierra"
            fill
            sizes="128px"
            className="object-contain p-2"
          />
        </div>
      </div>
    </footer>
  );
}
