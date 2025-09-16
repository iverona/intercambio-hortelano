"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FilterContextType {
  filters: {
    categories: string[];
    distance: number;
    searchTerm: string;
  };
  setFilters: (filters: {
    categories: string[];
    distance: number;
    searchTerm: string;
  }) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState({
    categories: [] as string[],
    distance: 100,
    searchTerm: "",
  });

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
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
