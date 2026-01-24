"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface FilterContextType {
  filters: {
    categories: string[];
    distance: number;
    searchTerm: string;
    sortBy: string;
    showOwnProducts: boolean;
    transactionTypes: string[];
  };
  setFilters: (filters: {
    categories: string[];
    distance: number;
    searchTerm: string;
    sortBy: string;
    showOwnProducts: boolean;
    transactionTypes: string[];
  }) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEY = "filter_show_own_products";

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  // Load initial state from localStorage
  const [filters, setFilters] = useState({
    categories: [] as string[],
    distance: 100,
    searchTerm: "",
    sortBy: "distance",
    showOwnProducts: false,
    transactionTypes: [] as string[],
  });

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setFilters(prev => ({ ...prev, showOwnProducts: saved === "true" }));
    }
  }, []);

  // Wrapper to persist showOwnProducts to localStorage
  const setFiltersWithPersistence = (newFilters: typeof filters) => {
    setFilters(newFilters);
    localStorage.setItem(STORAGE_KEY, String(newFilters.showOwnProducts));
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters: setFiltersWithPersistence }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
};
