import React from "react";
import Image from "next/image";
import Link from "next/link";

interface OrganicNoteProps {
    title: React.ReactNode;
    iconSrc: string;
    colorClass: string;
    textColorClass?: string;
    rotate?: number;
    href?: string;
    className?: string;
}

export function OrganicNote({
    title,
    iconSrc,
    colorClass,
    textColorClass = "text-white",
    rotate = 0,
    href,
    className = ""
}: OrganicNoteProps) {

    const content = (
        <>
            <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-white/40 dark:bg-white/10 rotate-${rotate > 0 ? rotate : 1} backdrop-blur-sm shadow-sm`}></div>
            <h3 className={`font-serif text-2xl font-bold ${textColorClass} mb-2`}>{title}</h3>
            <div className="mt-4 flex gap-1 justify-center">
                <Image
                    src={iconSrc}
                    alt="Icon"
                    width={100}
                    height={100}
                    className={`w-24 h-24 object-contain opacity-90 ${rotate !== 0 ? `transform ${rotate > 0 ? '-rotate-12' : 'rotate-12'}` : ''}`}
                />
            </div>
        </>
    );

    const containerClasses = `${colorClass} w-full max-w-xs mx-auto p-6 h-64 flex flex-col items-center justify-center text-center relative shadow-lg transform transition-all duration-200 hover:rotate-0 hover:scale-105 ${className}`;
    const style = { transform: `rotate(${rotate}deg)` };

    if (href) {
        return (
            <Link href={href} className={containerClasses} style={style}>
                {content}
            </Link>
        );
    }

    return (
        <div className={containerClasses} style={style}>
            {content}
        </div>
    );
}
