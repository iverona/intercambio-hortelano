"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Filter as FilterIcon, X, Check, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/locales/provider";
import { useFilters } from "@/context/FilterContext";
import { categories } from "@/lib/categories";

const Filter = () => {
  const t = useI18n();
  const { filters, setFilters } = useFilters();
  const [isOpen, setIsOpen] = useState(false);

  // Local state for the sheet, synchronized with global state on open
  const [localCategories, setLocalCategories] = useState<string[]>(filters.categories);
  const [localDistance, setLocalDistance] = useState(filters.distance);
  const [localSortBy, setLocalSortBy] = useState(filters.sortBy);
  const [localShowOwnProducts, setLocalShowOwnProducts] = useState(filters.showOwnProducts);

  // Sync local state when the sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalCategories(filters.categories);
      setLocalDistance(filters.distance);
      setLocalSortBy(filters.sortBy);
      setLocalShowOwnProducts(filters.showOwnProducts);
    }
  }, [isOpen, filters]);

  // Calculate active filters count
  const activeFiltersCount = filters.categories.length + (filters.distance < 100 ? 1 : 0) + (filters.sortBy !== 'distance' ? 1 : 0);

  const handleCategoryChange = (categoryId: string) => {
    setLocalCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      categories: localCategories,
      distance: localDistance,
      sortBy: localSortBy,
      showOwnProducts: localShowOwnProducts,
    });
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      ...filters,
      categories: [],
      distance: 100,
      sortBy: "distance",
      showOwnProducts: false,
    };
    setFilters(defaultFilters);
    setLocalCategories([]);
    setLocalDistance(100);
    setLocalSortBy("distance");
    setLocalShowOwnProducts(false);
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.distance < 100 || filters.sortBy !== 'distance';

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? (t as any)(category.translationKey) : categoryId;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative group flex items-center gap-2 hover:border-green-500 transition-all duration-300 border-2 rounded-2xl h-12"
        >
          <FilterIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span className="font-semibold">{t('header.filter')}</span>
          {activeFiltersCount > 0 && (
            <Badge
              variant="default"
              className="ml-1 h-5 px-1.5 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-scale-in"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-[#FFFBE6] dark:bg-[#1a1c18] backdrop-blur-xl border-l border-gray-200/20 rounded-l-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-transparent dark:from-green-950/20 dark:via-emerald-950/10 pointer-events-none" />
        <SheetHeader className="space-y-2 pb-6 text-center px-6">
          <SheetTitle className="text-3xl font-hand font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            {t('filter.title')}
          </SheetTitle>
          <SheetDescription className="text-sm font-serif italic">
            {t('filter.subtitle')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 pb-20 px-6">
          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="mx-auto max-w-sm">
              <div className="p-4 bg-white/50 dark:bg-green-950/20 rounded-2xl animate-slide-up border-2 border-green-100 dark:border-green-900/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Filtros activos</span>
                  <button onClick={handleResetFilters} className="text-xs text-green-600 hover:text-green-700 font-semibold underline decoration-2 underline-offset-4">
                    Limpiar todo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.categories.map(cat => (
                    <Badge key={cat} className="pl-3 pr-2 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-green-100">
                      <span>{getCategoryName(cat)}</span>
                      <button
                        onClick={() => {
                          const newCats = filters.categories.filter(c => c !== cat);
                          setFilters({ ...filters, categories: newCats });
                          setLocalCategories(newCats);
                        }}
                        className="ml-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))}
                  {filters.distance < 100 && (
                    <Badge key="distance-badge" className="pl-3 pr-2 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-green-100">
                      <span>{`< ${filters.distance} km`}</span>
                      <button
                        onClick={() => {
                          setFilters({ ...filters, distance: 100 });
                          setLocalDistance(100);
                        }}
                        className="ml-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  )}
                  {filters.sortBy !== 'distance' && (
                    <Badge key="sort-badge" className="pl-3 pr-2 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-green-100">
                      <span>{(t as any)(`filter.sort_options.${filters.sortBy}`)}</span>
                      <button
                        onClick={() => {
                          setFilters({ ...filters, sortBy: 'distance' });
                          setLocalSortBy('distance');
                        }}
                        className="ml-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Categories Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('filter.categories')}</h3>
            <div className="grid grid-cols-2 gap-3 mx-auto max-w-sm">
              {categories.map((category) => (
                <label key={category.id} className="relative group cursor-pointer transform transition-transform hover:-translate-y-1">
                  <input
                    type="checkbox"
                    className="absolute opacity-0 w-0 h-0"
                    checked={localCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <div className={`
                    relative overflow-hidden rounded-3xl border-2 transition-all duration-300 h-32
                    ${localCategories.includes(category.id)
                      ? 'border-green-500 bg-white dark:bg-green-950/30 shadow-lg shadow-green-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 bg-white/60 dark:bg-gray-800/50 shadow-sm hover:shadow-md'
                    }
                  `}>
                    {localCategories.includes(category.id) && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in shadow-inner">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="p-5 flex flex-col items-center justify-center space-y-2 text-center h-full">
                      <span className="text-3xl transform transition-transform group-hover:scale-110 group-hover:rotate-6">
                        {category.icon}
                      </span>
                      <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                        {(t as any)(category.translationKey)}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('filter.sort_by')}</h3>
            <RadioGroup value={localSortBy} onValueChange={setLocalSortBy} className="grid grid-cols-1 gap-2 mx-auto max-w-sm">
              {[
                { value: 'distance', label: t('filter.sort_options.distance') },
                { value: 'date_newest', label: t('filter.sort_options.date_newest') },
                { value: 'date_oldest', label: t('filter.sort_options.date_oldest') },
              ].map(option => (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <Label
                    htmlFor={option.value}
                    className={`
                      flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 border-2
                      ${localSortBy === option.value
                        ? 'bg-white border-green-500 shadow-md'
                        : 'bg-white/60 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 shadow-sm hover:shadow-lg'
                      }
                    `}
                  >
                    <span className={`font-semibold text-sm ${localSortBy === option.value ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {option.label}
                    </span>
                    {localSortBy === option.value && (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-inner" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Distance Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('filter.distance')}</h3>
              <span className="text-sm font-bold text-green-600 dark:text-green-500 bg-white border-2 border-green-100 dark:bg-green-900/30 px-4 py-1 rounded-full shadow-sm">
                {localDistance === 100 ? t('filter.any_distance') : `${localDistance} km`}
              </span>
            </div>

            <div className="mx-auto max-w-sm flex gap-1 p-1 bg-white border-2 border-gray-100 dark:bg-gray-800 rounded-full shadow-inner">
              {[5, 10, 25, 100].map((preset) => (
                <Button
                  key={preset}
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalDistance(preset)}
                  className={`
                    relative flex-1 py-5 rounded-full font-bold transition-all duration-300 text-xs
                    ${localDistance === preset
                      ? 'bg-green-500 shadow-md text-white scale-105'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500'
                    }
                  `}
                >
                  <span className="relative z-10">
                    {preset === 100 ? t('filter.any') : `${preset}km`}
                  </span>
                </Button>
              ))}
            </div>

            <div className="mx-auto max-w-sm px-3 pt-4">
              <Slider
                value={[localDistance]}
                onValueChange={(value) => setLocalDistance(value[0])}
                max={100}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-2 uppercase tracking-wider">
                <span>0 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>

          {/* Own Products Toggle Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('filter.own_products')}</h3>
            <div className="mx-auto max-w-sm">
              <label className="relative group cursor-pointer">
                <input
                  type="checkbox"
                  className="absolute opacity-0 w-0 h-0"
                  checked={localShowOwnProducts}
                  onChange={(e) => setLocalShowOwnProducts(e.target.checked)}
                />
                <div className={`
                  relative overflow-hidden rounded-2xl border-2 transition-all duration-300 p-5
                  ${localShowOwnProducts
                    ? 'border-green-500 bg-white dark:bg-green-950/30 shadow-lg shadow-green-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 bg-white/60 dark:bg-gray-800/50 shadow-sm hover:shadow-md'
                  }
                `}>
                  {localShowOwnProducts && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in shadow-inner">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${localShowOwnProducts
                        ? 'bg-green-100 dark:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-700/50'
                      }
                    `}>
                      <svg
                        className={`w-6 h-6 transition-colors duration-300 ${localShowOwnProducts ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${localShowOwnProducts ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {t('filter.show_own_products')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('filter.show_own_products_description')}
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 sticky bottom-0 bg-[#FFFBE6]/80 dark:bg-[#1a1c18]/80 backdrop-blur-md pb-6 -mx-6 px-6">
            <Button
              variant="outline"
              className="flex-1 h-14 font-bold border-2 rounded-2xl bg-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters && localCategories.length === 0 && localDistance === 100 && localSortBy === "distance"}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('filter.reset')}
            </Button>
            <Button
              className="flex-1 h-14 font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={handleApplyFilters}
            >
              <Check className="w-5 h-5 mr-2" />
              {t('filter.apply')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Filter;
