"use client";

import { useI18n, useCurrentLocale } from "@/locales/provider";
import Link from "next/link";
import Image from "next/image";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { OrganicNote } from "@/components/shared/OrganicNote";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginPromptModal from "@/components/shared/LoginPromptModal";

export default function Home() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = React.useState(false);
  const router = useRouter();

  const handlePublishClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      router.push(`/${locale}/publish`);
    }
  };

  return (
    <OrganicBackground>
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      {/* Organic Card Header */}
      <OrganicCard
        className="w-full max-w-2xl mx-auto mb-10 mt-10 md:mt-16"
        rotate={1}
        showOverflow={true}
        overlay={
          <div
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 md:w-full bg-[#FFFBE6] dark:bg-[#e0dcc7] py-3 px-6 shadow-md text-center rotate-[-1deg] transition-transform duration-300"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <h2 className="font-serif text-[#3e3b34] text-lg md:text-xl italic">
              Tu espacio para compartir cuidando la Tierra
            </h2>
          </div>
        }
      >
        {/* Decorative Icons */}
        <div className="absolute -top-10 -left-4 md:-left-12 opacity-90 transform -rotate-12 pointer-events-none">
          <Image
            src="/hojasolivo.png"
            alt="Hojas de olivo"
            width={100}
            height={100}
            className="w-24 h-auto object-contain"
          />
        </div>

        {/* Badge */}
        <Image
          src="/SelloSostenibilidad.png"
          alt="Sello de Sostenibilidad"
          width={150}
          height={150}
          className="absolute -top-14 -right-1 md:-right-14 w-28 md:w-36 h-auto drop-shadow-xl transform rotate-12"
        />

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/LogoEcoAnuncios.png"
            alt="EcoAnuncios Logo"
            width={400}
            height={160}
            className="w-3/4 max-w-sm h-auto object-contain"
            priority
          />
        </div>
      </OrganicCard>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row flex-wrap gap-6 mt-8 mb-12 items-center justify-center w-full px-4">
        <Link href={`/${locale}/publish`} onClick={handlePublishClick} className="relative group cursor-pointer w-64">
          <div className="absolute inset-0 bg-[#A88C8F] rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div
            className="relative bg-[#A88C8F] dark:bg-[#7a6466] text-white px-8 py-4 shadow-lg transform transition-transform group-hover:-translate-y-1 border-2 border-white/20 w-full"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <span className="font-serif text-xl block text-center">Publica tu</span>
            <span className="font-serif text-2xl block font-bold text-center">anuncio</span>
          </div>
        </Link>

        {/* Existing Products Button */}
        <Link href={`/${locale}/products`} className="relative group w-64">
          <div className="absolute inset-0 bg-[#998676] rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div
            className="relative bg-[#998676] dark:bg-[#6e6054] text-white px-8 py-4 shadow-lg transform transition-transform group-hover:-translate-y-1 border-2 border-white/20 w-full"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <span className="font-serif text-xl block text-center">Todos los</span>
            <span className="font-serif text-2xl block font-bold text-center">anuncios</span>
          </div>
        </Link>

        {/* New Producers Button */}
        <Link href={`/${locale}/producers`} className="relative group w-64">
          <div className="absolute inset-0 bg-[#879385] rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div
            className="relative bg-[#879385] dark:bg-[#525b51] text-white px-8 py-4 shadow-lg transform transition-transform group-hover:-translate-y-1 border-2 border-white/20 w-full"
            style={{ borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px' }}
          >
            <span className="font-serif text-xl block text-center">Conoce a los</span>
            <span className="font-serif text-2xl block font-bold text-center">productores</span>
          </div>
        </Link>

        {/* Contact Button */}
        <Link href={`/${locale}/contact`} className="relative group w-64">
          <div className="absolute inset-0 bg-[#A88C8F] rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div
            className="relative bg-[#A88C8F] dark:bg-[#7a6466] text-white px-8 py-4 shadow-lg transform transition-transform group-hover:-translate-y-1 border-2 border-white/20 w-full"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <span className="font-serif text-xl block text-center">Tengo</span>
            <span className="font-serif text-2xl block font-bold text-center">sugerencias</span>
          </div>
        </Link>
      </div>

      {/* Info Cards (Sticky Notes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4 mb-8">

        {/* Manifiesto */}
        <OrganicNote
          title={<>Nuestro <br /> Manifiesto</>}
          iconSrc="/hojas.png"
          colorClass="bg-[#EFEAC6] dark:bg-[#4a463a]"
          textColorClass="text-[#3E3B34] dark:text-[#EFEAC6]"
          rotate={-2}
          href={`/${locale}/manifiesto`}
        />

        {/* Participar */}
        <OrganicNote
          title={<>Cómo <br /> participar</>}
          iconSrc="/participar.png"
          colorClass="bg-[#A88C8F] dark:bg-[#6b585a]"
          rotate={1}
          href={`/${locale}/como-participar`}
        />

        {/* Comunidad */}
        <OrganicNote
          title={<>Nuestra <br /> Comunidad</>}
          iconSrc="/gente.png"
          colorClass="bg-[#879385] dark:bg-[#525b51]"
          rotate={2}
          href={`/${locale}/nuestra-comunidad`}
        />
      </div>

    </OrganicBackground>
  );
}
