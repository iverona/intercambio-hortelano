"use client";



export default function Footer() {
  return (
    <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-end relative z-10 bg-[#FFFBE6] dark:bg-[#2C2A25]">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-sans mb-4 md:mb-0">
        © 2025 EcoAnuncios. Portal de Intercambio Hortelano.
      </div>

      <div className="flex flex-row items-center gap-4">
        {/* Agroforja Logo */}
        <div className="bg-white/80 dark:bg-white/90 p-2 rounded-lg shadow-sm backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <img
            src="/LogoAgroforja.png"
            alt="Agroforja"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Amigos de la Tierra Logo */}
        <div className="bg-white/80 dark:bg-white/90 p-2 rounded-lg shadow-sm backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <img
            src="/LogoAmigosTierra.png"
            alt="Amigos de la Tierra"
            className="h-24 w-auto object-contain"
          />
        </div>
      </div>
    </footer>
  );
}
