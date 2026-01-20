"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";

export default function Manifest() {
    return (
        <OrganicBackground className="py-12">

            {/* Back Link */}
            <div className="w-full max-w-2xl mb-6">
                <Link href="/" className="inline-flex items-center text-[#594a42] dark:text-[#d6c7b0] hover:underline font-serif">
                    ← Volver al inicio
                </Link>
            </div>

            {/* Organic Card Container */}
            <OrganicCard
                className="w-full max-w-3xl mx-auto mb-10"
                rotate={1}
                showOverflow={true}
            >
                {/* Decorative Icons */}
                <div className="absolute -top-6 -right-6 md:-right-10 opacity-90 transform rotate-12 pointer-events-none">
                    <Image
                        src="/hojas.png"
                        alt="Hojas decorativas"
                        width={100}
                        height={100}
                        className="w-24 h-auto object-contain"
                    />
                </div>

                {/* Title */}
                <h1 className="font-display font-bold text-5xl md:text-7xl text-[#594a42] dark:text-[#d6c7b0] tracking-wide mb-8 text-center">
                    Nuestro Manifiesto
                </h1>

                {/* Content */}
                <div className="font-serif text-[#3e3b34] dark:text-[#e0dcc7] text-lg leading-relaxed space-y-6">
                    <p>
                        Creemos en un futuro donde la sostenibilidad guía cada decisión.
                    </p>
                    <p>
                        Actuamos con profundo respeto por el planeta, las personas y todas las formas de vida.
                    </p>
                    <p>
                        La ética es el corazón de nuestro compromiso, impulsando prácticas responsables y transparentes.
                    </p>
                    <p>
                        Fomentamos la colaboración como herramienta para generar impacto colectivo y duradero.
                    </p>
                    <p>
                        Cada anuncio promueve un consumo consciente y una vida más saludable.
                    </p>
                    <p>
                        Juntos, construimos un mundo en equilibrio con la naturaleza y con nosotros mismos.
                    </p>
                </div>

                {/* Signature/End Decoration */}
                <div className="mt-12 flex justify-center opacity-60">
                    <div className="w-16 h-1 bg-[#879385] rounded-full"></div>
                </div>

            </OrganicCard>
        </OrganicBackground>
    );
}
