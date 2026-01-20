"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";

export default function ComoParticipar() {
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
                rotate={-1}
            >
                {/* Decorative Icons */}
                <div className="absolute -top-6 -left-6 md:-left-10 opacity-90 transform -rotate-12 pointer-events-none">
                    <Image
                        src="/participar.png"
                        alt="Participar"
                        width={100}
                        height={100}
                        className="w-24 h-auto object-contain"
                    />
                </div>

                {/* Title */}
                <h1 className="font-display font-bold text-5xl md:text-7xl text-[#594a42] dark:text-[#d6c7b0] tracking-wide mb-8 text-center">
                    Cómo participar
                </h1>

                {/* Content */}
                <div className="font-serif text-[#3e3b34] dark:text-[#e0dcc7] text-lg leading-relaxed space-y-6">
                    <p>
                        Si te importa el medioambiente, comer sano y vivir de forma más consciente, este es tu lugar. Aquí compartimos lo que cultivamos con respeto por la tierra y lo intercambiamos desde la colaboración y la confianza. Juntos creamos una comunidad más sostenible, solidaria y natural.
                    </p>

                    <p className="font-bold">
                        Si estás de acuerdo con nuestra visión,{" "}
                        <Link href="/signup" className="text-[#A88C8F] hover:underline decoration-2">
                            crea tu usuario
                        </Link>.
                    </p>

                    <p>
                        Si eres hortelano, sube tus productos o servicios en la sección{" "}
                        <Link href="/publish" className="text-[#A88C8F] hover:underline decoration-2 font-bold">
                            Publicar
                        </Link>.
                    </p>

                    <p>
                        Si eres consumidor, contacta al hortelano que ha publicado el producto o servicio que te interesa para establecer entre ambos las condiciones del intercambio.
                    </p>

                    <p className="italic text-sm opacity-80 border-l-2 border-[#879385] pl-4">
                        Esta web no cobra comisiones ni se hace responsable por ningún aspecto de la transacción entre hortelanos y consumidores.
                    </p>

                    <p>
                        Aquí tienes nuestras normas de convivencia en nuestro espacio:
                    </p>
                </div>

                {/* Links for quick access */}
                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/signup"
                        className="bg-[#A88C8F] text-white px-6 py-3 rounded-full text-center font-serif hover:bg-[#8e7578] transition-colors shadow-sm"
                    >
                        Registrarse
                    </Link>
                    <Link
                        href="/publish"
                        className="bg-[#879385] text-white px-6 py-3 rounded-full text-center font-serif hover:bg-[#6f7a6d] transition-colors shadow-sm"
                    >
                        Publicar producto
                    </Link>
                </div>

                {/* Signature/End Decoration */}
                <div className="mt-12 flex justify-center opacity-60">
                    <div className="w-16 h-1 bg-[#A88C8F] rounded-full"></div>
                </div>

            </OrganicCard>
        </OrganicBackground>
    );
}
