import React from "react";

interface OrganicBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

export function OrganicBackground({ children, className = "" }: OrganicBackgroundProps) {
    return (
        <div className={`relative flex-1 w-full overflow-hidden bg-[#FFFBE6] dark:bg-[#2C2A25] flex flex-col items-center py-8 px-4 transition-colors duration-300 ${className}`}>
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#A6C6B9] dark:bg-[#4A5D54] rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#A88C8F] dark:bg-[#998676] rounded-full filter blur-3xl opacity-20 translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

            {/* Main Content Wrapper */}
            <div className="w-full flex flex-col items-center z-10 relative">
                {children}
            </div>
        </div>
    );
}
