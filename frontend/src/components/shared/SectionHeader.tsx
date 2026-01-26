import React from 'react';
import { OrganicCard } from './OrganicCard';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    banner?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    containerClassName?: string;
    maxW?: string;
    rotate?: number;
    bannerRotate?: number;
    centered?: boolean;
    bannerPosition?: 'default' | 'large';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    banner,
    children,
    className,
    containerClassName,
    maxW = 'max-w-3xl',
    rotate = -1,
    bannerRotate = 1,
    centered = true,
    bannerPosition = 'default',
}) => {
    const isLargeBanner = bannerPosition === 'large';

    return (
        <div className={cn("flex mb-16", centered ? "justify-center" : "justify-start", containerClassName)}>
            <OrganicCard
                className={cn("w-full transition-all duration-500", maxW, className)}
                rotate={rotate}
                overlay={
                    banner && (
                        <div
                            className={cn(
                                "absolute bg-[#FFFBE6] dark:bg-[#e0dcc7] shadow-md text-center transition-all duration-300 z-20",
                                isLargeBanner ? "-bottom-10 w-10/12 md:w-2/3 py-4 px-8" : "-bottom-6 w-[90%] md:w-full py-3 px-6 whitespace-nowrap"
                            )}
                            style={{
                                borderRadius: bannerRotate > 0 ? '255px 15px 225px 15px / 15px 225px 15px 255px' : '15px 225px 15px 255px / 255px 15px 225px 15px',
                                transform: `translateX(-50%) rotate(${bannerRotate}deg)`,
                                left: '50%'
                            }}
                        >
                            <div className={cn(
                                "font-serif text-[#3e3b34] italic leading-relaxed",
                                isLargeBanner ? "text-base md:text-lg" : "text-lg md:text-xl"
                            )}>
                                {banner}
                            </div>
                        </div>
                    )
                }
            >
                <div className={cn(centered ? "text-center" : "text-left", "w-full")}>
                    {title && (
                        <h1 className="text-4xl md:text-5xl font-hand font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <div className="text-gray-500 font-serif italic mb-2">
                            {subtitle}
                        </div>
                    )}
                    {children}
                </div>
            </OrganicCard>
        </div>
    );
};
