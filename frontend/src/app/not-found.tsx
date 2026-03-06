import Link from "next/link";

export default function RootNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center font-sans">
            <div className="relative mb-8">
                <span className="text-[120px] md:text-[160px] font-bold leading-none" style={{ color: "rgba(135,147,133,0.1)" }}>
                    404
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl">
                    🌱
                </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#2C2A25" }}>
                Página no encontrada
            </h1>
            <p className="max-w-md mb-8" style={{ color: "#4A5D54" }}>
                Parece que esta página se ha marchitado. Quizás la dirección no es
                correcta o el contenido ya no está disponible.
            </p>

            <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                style={{ backgroundColor: "#879385", color: "#FFFFFF" }}
            >
                <span>←</span>
                Volver al inicio
            </Link>
        </div>
    );
}
