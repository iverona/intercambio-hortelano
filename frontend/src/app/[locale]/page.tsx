"use client";

import { useI18n } from "@/locales/provider";
import Link from "next/link";
import Image from "next/image";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { OrganicNote } from "@/components/shared/OrganicNote";

export default function Home() {
  const t = useI18n();

  return (
    <OrganicBackground>

      {/* Organic Card Header */}
      <OrganicCard
        className="w-full max-w-2xl mx-auto mb-10"
        rotate={1}
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
        <div className="absolute -top-6 -left-8 md:-left-12 opacity-90 transform -rotate-12 pointer-events-none">
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
          className="absolute -top-10 -right-8 md:-right-14 w-28 md:w-36 h-auto drop-shadow-xl transform rotate-12"
        />

        {/* Title */}
        <h1 className="font-display font-bold text-6xl md:text-8xl text-[#594a42] dark:text-[#d6c7b0] tracking-wide mb-2 text-center">
          EcoAnuncios
        </h1>
      </OrganicCard>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-6 mt-8 mb-10 items-center justify-center w-full">
        <Link href="/publish" className="relative group">
          <div className="absolute inset-0 bg-[#A88C8F] rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div
            className="relative bg-[#A88C8F] dark:bg-[#7a6466] text-white px-8 py-4 shadow-lg transform transition-transform group-hover:-translate-y-1 border-2 border-white/20"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <span className="font-serif text-xl block text-center">Publica tu</span>
            <span className="font-serif text-2xl block font-bold text-center">anuncio</span>
          </div>
        </Link>

        <Link href="/products" className="relative group">
          <div className="absolute inset-0 bg-[#998676] rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div
            className="relative bg-[#998676] dark:bg-[#6e6054] text-white px-8 py-4 shadow-lg transform transition-transform group-hover:-translate-y-1 border-2 border-white/20"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <span className="font-serif text-xl block text-center">Todos los</span>
            <span className="font-serif text-2xl block font-bold text-center">anuncios</span>
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
          href="/manifiesto"
        />

        {/* Participar */}
        <OrganicNote
          title={<>Cómo <br /> participar</>}
          iconSrc="/participar.png"
          colorClass="bg-[#A88C8F] dark:bg-[#6b585a]"
          rotate={1}
        />

        {/* Comunidad */}
        <OrganicNote
          title={<>Nuestra <br /> Comunidad</>}
          iconSrc="/gente.png"
          colorClass="bg-[#879385] dark:bg-[#525b51]"
          rotate={2}
        />
      </div>

    </OrganicBackground>
  );
}
