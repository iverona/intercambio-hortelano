"use client";

import { Flower2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-end relative z-10 bg-[#FFFBE6] dark:bg-[#2C2A25] border-t border-[#879385]/20">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-sans mb-4 md:mb-0">
        © 2025 EcoAnuncios. Portal de Intercambio Hortelano.
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Agroforja Badge */}
        <div className="bg-white dark:bg-gray-200 px-4 py-2 shadow-sm rounded-sm flex items-center gap-2">
          <Flower2 className="text-black w-4 h-4" />
          <span className="font-serif text-black text-sm font-bold tracking-widest">agroforja</span>
        </div>

        {/* Animated Circle Element */}
        <div className="relative w-24 h-24 bg-white dark:bg-gray-200 rounded-full shadow-lg flex items-center justify-center overflow-hidden border-2 border-gray-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-400 rounded-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-green-500 rounded-full transform scale-110 opacity-70" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}></div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
