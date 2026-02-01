"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { useCurrentLocale, useI18n } from "@/locales/provider";
import participationEs from "@/locales/content/how-to-participate-es.json";
import participationEn from "@/locales/content/how-to-participate-en.json";

interface ParticipationData {
    title: string;
    intro: string;
    signup_text: string;
    signup_link: string;
    gardener_text: string;
    gardener_link: string;
    gardener_suffix?: string;
    consumer_text: string;
    disclaimer: string;
    rules_prefix: string;
    rules_link: string;
    rules_suffix?: string;
    register_btn: string;
    publish_btn: string;
}

export default function ComoParticipar() {
    const t = useI18n();
    const locale = useCurrentLocale();
    const data = (locale === 'es' ? participationEs : participationEn) as ParticipationData;

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
                rotate={-1}
                showOverflow={true}
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
                    {data.title}
                </h1>

                {/* Content */}
                <div className="font-serif text-[#3e3b34] dark:text-[#e0dcc7] text-lg leading-relaxed space-y-6">
                    <p>{data.intro}</p>

                    <p className="font-bold">
                        {data.signup_text}
                        <Link href={`/${locale}/signup`} className="text-[#A88C8F] hover:underline decoration-2">
                            {data.signup_link}
                        </Link>.
                    </p>

                    <p>
                        {data.gardener_text}
                        <Link href={`/${locale}/publish`} className="text-[#A88C8F] hover:underline decoration-2 font-bold">
                            {data.gardener_link}
                        </Link>{data.gardener_suffix}
                    </p>

                    <p>{data.consumer_text}</p>

                    <p className="italic text-sm opacity-80 border-l-2 border-[#879385] pl-4">
                        {data.disclaimer}
                    </p>

                    <p>
                        {data.rules_prefix}
                        <Link href={`/${locale}/nuestra-comunidad`} className="text-[#879385] hover:underline decoration-2 font-bold">
                            {data.rules_link}
                        </Link>{data.rules_suffix}
                    </p>
                </div>

                {/* Links for quick access */}
                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={`/${locale}/signup`}
                        className="bg-[#A88C8F] text-white px-6 py-3 rounded-full text-center font-serif hover:bg-[#8e7578] transition-colors shadow-sm"
                    >
                        {data.register_btn}
                    </Link>
                    <Link
                        href={`/${locale}/publish`}
                        className="bg-[#879385] text-white px-6 py-3 rounded-full text-center font-serif hover:bg-[#6f7a6d] transition-colors shadow-sm"
                    >
                        {data.publish_btn}
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
