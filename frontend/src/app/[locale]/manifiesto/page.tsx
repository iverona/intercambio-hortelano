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
            >
                {/* Decorative Icons */}
                <div className="absolute -top-6 -right-6 md:-right-10 opacity-90 transform rotate-12 pointer-events-none">
                    <Image
                        src="/hojasolivo.png"
                        alt="Hojas de olivo"
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
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p>
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p>
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                    </p>
                    <p>
                        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
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
