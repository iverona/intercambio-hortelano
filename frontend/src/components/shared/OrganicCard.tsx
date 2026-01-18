import React from "react";

interface OrganicCardProps {
    children: React.ReactNode;
    className?: string;
    shadowColor?: string;
    rotate?: number;
    overlay?: React.ReactNode;
}

export function OrganicCard({
    children,
    className = "",
    shadowColor = "bg-[#879385] dark:bg-[#5a6359]",
    rotate = 1,
    overlay
}: OrganicCardProps) {
    const organicRadius = '255px 15px 225px 15px / 15px 225px 15px 255px';

    return (
        <div className={`relative group ${className}`}>
            {/* Shadow/Border Element */}
            <div
                className={`absolute inset-0 ${shadowColor} rounded-sm shadow-lg transition-transform duration-300`}
                style={{
                    borderRadius: organicRadius,
                    transform: `rotate(-${rotate * 2}deg)`
                }}
            ></div>

            {/* Main Card Content */}
            <div
                className="relative bg-[#FDFBF7] dark:bg-[#2e2c28] p-10 md:p-16 shadow-xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 transition-transform duration-300"
                style={{
                    borderRadius: organicRadius,
                    transform: `rotate(${rotate}deg)`
                }}
            >
                {children}
            </div>

            {overlay}
        </div>
    );
}
