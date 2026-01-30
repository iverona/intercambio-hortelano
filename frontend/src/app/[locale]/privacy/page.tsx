"use client";

import Image from "next/image";
import Link from "next/link";
import { OrganicBackground } from "@/components/shared/OrganicBackground";
import { OrganicCard } from "@/components/shared/OrganicCard";
import { useCurrentLocale, useI18n } from "@/locales/provider";
import privacyEs from "@/locales/content/privacy-es.json";
import privacyEn from "@/locales/content/privacy-en.json";

interface PrivacySection {
    id: string;
    title: string;
    content: string[];
    items?: { label: string; text: string }[];
    list?: string[];
    extra?: string;
}

interface PrivacyData {
    title: string;
    sections: PrivacySection[];
    lastUpdated?: string;
}

export default function PrivacyPage() {
    const t = useI18n();
    const locale = useCurrentLocale();

    // Select content based on locale
    const privacyData = (locale === 'es' ? privacyEs : privacyEn) as unknown as PrivacyData;

    return (
        <OrganicBackground className="py-12">

            {/* Back Link */}
            <div className="w-full max-w-2xl mb-6">
                <Link href={`/${locale}`} className="inline-flex items-center text-[#594a42] dark:text-[#d6c7b0] hover:underline font-serif">
                    ← {t('product.back_to_home') || 'Volver al inicio'}
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
                        src="/hojasolivo.png"
                        alt="Hojas de olivo"
                        width={100}
                        height={100}
                        className="w-24 h-auto object-contain"
                    />
                </div>

                {/* Title */}
                <h1 className="font-display font-bold text-4xl md:text-6xl text-[#594a42] dark:text-[#d6c7b0] tracking-wide mb-12 text-center uppercase">
                    {privacyData.title}
                </h1>

                {/* Content */}
                <div className="font-serif text-[#3e3b34] dark:text-[#e0dcc7] text-lg leading-relaxed space-y-12">
                    {privacyData.sections.map((section) => (
                        <section key={section.id} className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-display font-bold text-[#594a42] dark:text-[#d6c7b0] border-b border-[#879385]/20 pb-2">
                                {section.title}
                            </h2>
                            <div className="space-y-4">
                                {section.content.map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>

                            {section.items && (
                                <div className="space-y-4 mt-6">
                                    {section.items.map((item, idx) => (
                                        <div key={idx} className="pl-5 border-l-4 border-[#879385]/40 bg-[#879385]/5 p-4 rounded-r-lg">
                                            <p>
                                                <strong className="text-[#594a42] dark:text-[#d6c7b0]">{item.label}:</strong> {item.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {section.list && (
                                <ul className="space-y-3 pl-6 mt-4">
                                    {section.list.map((item, idx) => (
                                        <li key={idx} className="relative pl-6">
                                            <span className="absolute left-0 top-3 w-2 h-2 rounded-full bg-[#879385] opacity-60"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {section.extra && (
                                <p className="mt-6 text-[17px] italic opacity-90 border-t border-[#879385]/10 pt-4">
                                    {section.extra}
                                </p>
                            )}
                        </section>
                    ))}

                    {privacyData.lastUpdated && (
                        <div className="pt-10 mt-10 border-t-2 border-dashed border-[#879385]/20 text-center text-sm italic opacity-70">
                            {privacyData.lastUpdated}
                        </div>
                    )}
                </div>

                {/* Signature/End Decoration */}
                <div className="mt-16 flex justify-center opacity-40">
                    <div className="w-24 h-1 bg-[#879385] rounded-full"></div>
                </div>

            </OrganicCard>
        </OrganicBackground>
    );
}
