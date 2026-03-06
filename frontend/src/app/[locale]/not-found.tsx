import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="relative mb-8">
                <span className="text-[120px] md:text-[160px] font-bold leading-none text-primary/10">
                    404
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl">
                    🌱
                </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Página no encontrada
            </h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Parece que esta página se ha marchitado. Quizás la dirección no es
                correcta o el contenido ya no está disponible.
            </p>

            <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg"
            >
                <span>←</span>
                Volver al inicio
            </Link>
        </div>
    );
}
