"use client";

import { useI18n } from "@/locales/provider";
import Link from "next/link";

import Image from "next/image";

export default function Home() {
  const t = useI18n();

  return (
    <div className="relative overflow-hidden bg-[#FFFBE6] dark:bg-[#2C2A25] flex flex-col items-center py-8 px-4 transition-colors duration-300">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#A6C6B9] dark:bg-[#4A5D54] rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#A88C8F] dark:bg-[#998676] rounded-full filter blur-3xl opacity-20 translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      {/* Main Content */}
      <div className="max-w-4xl w-full flex flex-col items-center z-10 relative">

        {/* Organic Card Header */}
        <div className="relative w-full max-w-2xl mx-auto mb-10 group">
          {/* Shadow/Border Element */}
          <div className="absolute inset-0 bg-[#879385] dark:bg-[#5a6359] transform -rotate-2 rounded-sm shadow-lg" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}></div>

          {/* Main Card Content */}
          <div
            className="relative bg-[#FDFBF7] dark:bg-[#2e2c28] p-10 md:p-16 transform rotate-1 shadow-xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
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
          </div>

          {/* Subtitle Banner */}
          <div
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 md:w-full bg-[#FFFBE6] dark:bg-[#e0dcc7] py-3 px-6 shadow-md text-center rotate-[-1deg]"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <h2 className="font-serif text-[#3e3b34] text-lg md:text-xl italic">
              Tu espacio para compartir cuidando la Tierra
            </h2>
          </div>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4 mb-8">
          {/* Manifiesto */}
          <div className="bg-[#EFEAC6] dark:bg-[#4a463a] p-6 h-64 flex flex-col items-center justify-center text-center relative shadow-lg transform rotate-[-2deg] hover:rotate-0 hover:scale-105 transition-all duration-200">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-white/40 dark:bg-white/10 rotate-1 backdrop-blur-sm shadow-sm"></div>
            <h3 className="font-serif text-2xl font-bold text-[#3E3B34] dark:text-[#EFEAC6] mb-2">Nuestro <br /> Manifiesto</h3>
            <div className="mt-4">
              <Image
                src="/hojas.png"
                alt="Manifiesto"
                width={100}
                height={100}
                className="w-24 h-24 object-contain transform -rotate-12 opacity-90"
              />
            </div>
          </div>

          {/* Participar */}
          <div className="bg-[#A88C8F] dark:bg-[#6b585a] p-6 h-64 flex flex-col items-center justify-center text-center relative shadow-lg text-white transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-200">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-white/40 dark:bg-white/10 -rotate-1 backdrop-blur-sm shadow-sm"></div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Cómo <br /> participar</h3>
            <div className="mt-4">
              <Image
                src="/participar.png"
                alt="Participar"
                width={100}
                height={100}
                className="w-24 h-24 object-contain opacity-90"
              />
            </div>
          </div>

          {/* Comunidad */}
          <div className="bg-[#879385] dark:bg-[#525b51] p-6 h-64 flex flex-col items-center justify-center text-center relative shadow-lg text-white transform rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-200">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-white/40 dark:bg-white/10 rotate-2 backdrop-blur-sm shadow-sm"></div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Nuestra <br /> Comunidad</h3>
            <div className="mt-4 flex gap-1 justify-center">
              <Image
                src="/gente.png"
                alt="Comunidad"
                width={100}
                height={100}
                className="w-24 h-24 object-contain opacity-90"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

