"use client";

import { useState, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import { useI18n } from "@/locales/provider";
import { useFilters } from "@/context/FilterContext";
import { categories } from "@/lib/categories";
import Filter from "./Filter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchAndFilter() {
    const t = useI18n();
    const { filters, setFilters } = useFilters();
    const [searchValue, setSearchValue] = useState(filters.searchTerm);

    // Sync local search value when global state changes
    useEffect(() => {
        setSearchValue(filters.searchTerm);
    }, [filters.searchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        setFilters({ ...filters, searchTerm: value });
    };

    const clearSearch = () => {
        setSearchValue("");
        setFilters({ ...filters, searchTerm: "" });
    };

    const toggleCategory = (categoryId: string) => {
        const isSelected = filters.categories.includes(categoryId);
        const newCategories = isSelected
            ? filters.categories.filter((id) => id !== categoryId)
            : [...filters.categories, categoryId];

        setFilters({ ...filters, categories: newCategories });
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Organic Search Input */}
                <div className="relative flex-1 w-full group">
                    <div className="absolute inset-0 bg-green-200/20 dark:bg-green-900/10 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] blur-xl group-focus-within:bg-green-300/30 transition-colors duration-500"></div>
                    <div
                        className="relative flex items-center bg-[#FFFBE6] dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 group-focus-within:border-green-400 group-focus-within:shadow-md px-4 h-14"
                        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-300 mr-3" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={handleSearchChange}
                            placeholder={t('home.products.search_placeholder') || "Busca productos..."}
                            className="bg-transparent border-none outline-none flex-1 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 font-serif italic text-lg"
                        />
                        {searchValue && (
                            <button
                                onClick={clearSearch}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                aria-label="Limpiar búsqueda"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Trigger Button */}
                <Filter />
            </div>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => {
                    const isSelected = filters.categories.includes(category.id);
                    return (
                        <button
                            key={category.id}
                            onClick={() => toggleCategory(category.id)}
                            className={cn(
                                "group relative flex items-center gap-2 px-6 py-3 transition-all duration-300 transform hover:-translate-y-1 active:scale-95",
                                "border-2 font-hand font-bold text-lg",
                                isSelected
                                    ? "bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/30"
                                    : "bg-white/60 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-300 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                            )}
                            style={{ borderRadius: isSelected ? '15px 225px 15px 255px / 255px 15px 225px 15px' : '225px 15px 255px 15px / 15px 225px 15px 255px' }}
                        >
                            <span className="text-xl group-hover:scale-125 transition-transform duration-300">{category.icon}</span>
                            <span>{(t as any)(category.translationKey)}</span>
                            {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md animate-scale-in">
                                    <Check className="w-3 h-3 text-green-600" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
