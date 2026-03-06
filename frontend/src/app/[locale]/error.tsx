"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Unhandled error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="relative mb-8">
                <span className="text-[120px] md:text-[160px] font-bold leading-none text-destructive/10">
                    !
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl">
                    🍂
                </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Algo salió mal
            </h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Ha ocurrido un error inesperado. Puedes intentar recargar la página o
                volver al inicio.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={reset}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                >
                    <span>↻</span>
                    Reintentar
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-semibold transition-all duration-200 hover:bg-card"
                >
                    <span>←</span>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
