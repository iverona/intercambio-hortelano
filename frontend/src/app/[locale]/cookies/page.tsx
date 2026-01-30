"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { useCurrentLocale, useI18n } from "@/locales/provider";

export default function CookiesPage() {
    const t = useI18n();
    const locale = useCurrentLocale();

    return (
        <OrganicBackground className="py-12">
            <div className="w-full max-w-2xl mb-6">
                <Link href={`/${locale}`} className="inline-flex items-center text-[#594a42] dark:text-[#d6c7b0] hover:underline font-serif">
                    ← {t('product.back_to_home') || 'Volver al inicio'}
                </Link>
            </div>

            <OrganicCard
                className="w-full max-w-3xl mx-auto mb-10"
                rotate={-1}
                showOverflow={true}
            >
                {/* Decorative Icons */}
                <div className="absolute -top-6 -left-6 md:-left-10 opacity-90 transform -rotate-12 pointer-events-none">
                    <Image
                        src="/hojasolivo.png"
                        alt="Hojas de olivo"
                        width={100}
                        height={100}
                        className="w-24 h-auto object-contain"
                    />
                </div>

                {/* Title */}
                <h1 className="font-display font-bold text-4xl md:text-6xl text-[#594a42] dark:text-[#d6c7b0] tracking-wide mb-12 text-center uppercase">
                    {t('cookies.policy.title')}
                </h1>

                {/* Content */}
                <div className="font-serif text-[#3e3b34] dark:text-[#e0dcc7] text-lg leading-relaxed space-y-12">
                    <p>
                        {t('cookies.policy.intro')}
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-[#594a42] dark:text-[#d6c7b0] border-b border-[#879385]/20 pb-2">
                            {t('cookies.policy.what_are_cookies')}
                        </h2>
                        <p>{t('cookies.policy.what_are_cookies_desc')}</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-[#594a42] dark:text-[#d6c7b0] border-b border-[#879385]/20 pb-2">
                            {t('cookies.policy.types')}
                        </h2>
                        <ul className="list-disc pl-6 space-y-4">
                            <li>
                                <strong className="text-[#594a42] dark:text-[#d6c7b0]">{t('cookies.policy.essential_title')}:</strong> {t('cookies.policy.essential_desc')}
                            </li>
                            <li>
                                <strong className="text-[#594a42] dark:text-[#d6c7b0]">{t('cookies.policy.analytics_title')}:</strong> {t('cookies.policy.analytics_desc')}
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-[#594a42] dark:text-[#d6c7b0] border-b border-[#879385]/20 pb-2">
                            {t('cookies.policy.how_to_manage')}
                        </h2>
                        <p>{t('cookies.policy.how_to_manage_desc')}</p>
                    </section>
                </div>

                {/* Signature/End Decoration */}
                <div className="mt-16 flex justify-center opacity-40">
                    <div className="w-24 h-1 bg-[#879385] rounded-full"></div>
                </div>
            </OrganicCard>
        </OrganicBackground>
    );
}
