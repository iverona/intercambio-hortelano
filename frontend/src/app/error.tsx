"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Unhandled root error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center font-sans">
            <div className="relative mb-8">
                <span className="text-[120px] md:text-[160px] font-bold leading-none" style={{ color: "rgba(135,147,133,0.1)" }}>
                    !
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl">
                    🍂
                </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#2C2A25" }}>
                Algo salió mal
            </h1>
            <p className="max-w-md mb-8" style={{ color: "#4A5D54" }}>
                Ha ocurrido un error inesperado. Puedes intentar recargar la página o
                volver al inicio.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={reset}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                    style={{ backgroundColor: "#879385", color: "#FFFFFF" }}
                >
                    <span>↻</span>
                    Reintentar
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border font-semibold transition-all duration-200"
                    style={{ borderColor: "rgba(135,147,133,0.2)", color: "#2C2A25" }}
                >
                    <span>←</span>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
