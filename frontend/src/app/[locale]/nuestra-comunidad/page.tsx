"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { useCurrentLocale, useI18n } from "@/locales/provider";
import communityEs from "@/locales/content/community-es.json";
import communityEn from "@/locales/content/community-en.json";

interface CommunitySection {
    title: string;
    content: string;
}

interface CommunityData {
    title: string;
    sections: CommunitySection[];
}

export default function NuestraComunidad() {
    const t = useI18n();
    const locale = useCurrentLocale();
    const communityData = (locale === 'es' ? communityEs : communityEn) as CommunityData;

    return (
        <OrganicBackground className="py-12">

            {/* Back Link */}
            <div className="w-full max-w-2xl mb-6">
                <Link href={`/${locale}`} className="inline-flex items-center text-[#594a42] dark:text-[#d6c7b0] hover:underline font-serif">
                    ← {t('product.back_to_home')}
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
                    {communityData.title}
                </h1>

                {/* Content */}
                <div className="font-serif text-[#3e3b34] dark:text-[#e0dcc7] text-lg leading-relaxed space-y-8">
                    {communityData.sections.map((section, idx) => (
                        <section key={idx}>
                            <h2 className="font-bold text-xl text-[#594a42] dark:text-[#d6c7b0] mb-2 font-display">{section.title}</h2>
                            <p>{section.content}</p>
                        </section>
                    ))}
                </div>

                {/* End Decoration */}
                <div className="mt-12 flex justify-center opacity-60">
                    <div className="w-16 h-1 bg-[#879385] rounded-full"></div>
                </div>

            </OrganicCard>
        </OrganicBackground>
    );
}
