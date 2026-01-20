"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";

export default function NuestraComunidad() {
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
                <div className="absolute -top-6 -right-6 md:-right-10 opacity-90 transform rotate-45 pointer-events-none">
                    <Image
                        src="/gente.png"
                        alt="Comunidad"
                        width={100}
                        height={100}
                        className="w-24 h-auto object-contain"
                    />
                </div>

                {/* Title */}
                <h1 className="font-display font-bold text-5xl md:text-7xl text-[#594a42] dark:text-[#d6c7b0] tracking-wide mb-10 text-center">
                    Nuestra Comunidad
                </h1>

                {/* Content */}
                <div className="font-serif text-[#3e3b34] dark:text-[#e0dcc7] text-lg leading-relaxed space-y-8">

                    <section>
                        <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">Todo natural, como la tierra lo da</h2>
                        <p>Comparte solo productos cultivados sin químicos ni pesticidas.</p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">Transacciones claras y sencillas</h2>
                        <p>Explica bien qué ofreces y qué necesitas a cambio.</p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">De tu huerta a la de otra persona</h2>
                        <p>Solo se comparte productos/servicios que vengan de tu propio cultivo. Nada de compras en tiendas para revender.</p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">Trátanos con respeto y sinceridad</h2>
                        <p>Cumple con lo que prometes, responde con amabilidad y comunica si surge algún cambio.</p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">Cuidemos el planeta en cada paso</h2>
                        <p>Usa envases reutilizables o compostables y evita el plástico innecesario. También puedes publicar artículos de segunda mano relacionados con la huerta que contribuyan a reducir nuestra huella de carbono.</p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">Esto es una comunidad</h2>
                        <p>La idea es compartir, intercambiar, regalar, y vender a precio justo. Consulta el valor del mercado si has de proponer un precio.</p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">Compartir saberes también es intercambiar</h2>
                        <p>Anímate a dejar consejos, recetas o trucos de cultivo. Juntos aprendemos y hacemos crecer este espacio.</p>
                    </section>

                </div>

                {/* End Decoration */}
                <div className="mt-12 flex justify-center opacity-60">
                    <div className="w-16 h-1 bg-[#879385] rounded-full"></div>
                </div>

            </OrganicCard>
        </OrganicBackground>
    );
}
