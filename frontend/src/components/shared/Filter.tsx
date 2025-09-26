"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { categories } from "@/lib/categories";

interface FilterProps {
  onFilterChange: (filters: {
    categories: string[];
    distance: number;
    searchTerm: string;
    sortBy: string;
  }) => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
  const t = useI18n();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [distance, setDistance] = useState(100);
  const [sortBy, setSortBy] = useState("distance");
  const [isOpen, setIsOpen] = useState(false);

  // Calculate active filters count
  const activeFiltersCount = selectedCategories.length + (distance < 100 ? 1 : 0) + (sortBy !== 'distance' ? 1 : 0);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApplyFilters = () => {
    onFilterChange({
      categories: selectedCategories,
      distance,
      searchTerm: "", // searchTerm is not modified here
      sortBy,
    });
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setDistance(100);
    setSortBy("distance");
    onFilterChange({
      categories: [],
      distance: 100,
      searchTerm: "", // searchTerm is not modified here
      sortBy: "distance",
    });
  };

  const setPresetDistance = (value: number) => {
    setDistance(value);
  };

  const hasActiveFilters = selectedCategories.length > 0 || distance < 100 || sortBy !== 'distance';

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? (t as any)(category.translationKey) : categoryId;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="relative group flex items-center gap-2 hover:border-green-500 transition-all duration-300"
        >
          <FilterIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span>{t('header.filter')}</span>
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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200/20 rounded-l-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-transparent dark:from-green-950/20 dark:via-emerald-950/10 pointer-events-none" />
        <SheetHeader className="space-y-2 pb-6 text-center px-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            {t('filter.title')}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {t('filter.subtitle')}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-8 pb-20 px-6">
          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="mx-auto max-w-sm">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Active Filters</span>
                  <button onClick={handleResetFilters} className="text-xs text-green-600 hover:text-green-700 font-semibold">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(cat => (
                    <Badge key={cat} className="pl-3 pr-2 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm">
                      <span>{getCategoryName(cat)}</span>
                      <button onClick={() => handleCategoryChange(cat)} className="ml-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))}
                  {distance < 100 && (
                    <Badge className="pl-3 pr-2 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm">
                      <span>{`< ${distance} km`}</span>
                      <button onClick={() => setDistance(100)} className="ml-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  )}
                  {sortBy !== 'distance' && (
                    <Badge className="pl-3 pr-2 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm">
                      <span>{(t as any)(`filter.sort_options.${sortBy}`)}</span>
                      <button onClick={() => setSortBy('distance')} className="ml-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
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
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <div className={`
                    relative overflow-hidden rounded-3xl border-2 transition-all duration-300
                    ${selectedCategories.includes(category.id)
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg shadow-green-500/30' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md'
                    }
                  `}>
                    {selectedCategories.includes(category.id) && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in shadow-inner">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="p-5 flex flex-col items-center justify-center space-y-3 text-center h-32">
                      <span className="text-3xl transform transition-transform group-hover:scale-110 group-hover:rotate-6">
                        {category.icon}
                      </span>
                      <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                        {(t as any)(category.translationKey)}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-emerald-400/0 group-hover:from-green-400/10 group-hover:to-emerald-400/10 transition-all duration-300" />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('filter.sort_by')}</h3>
            <RadioGroup value={sortBy} onValueChange={setSortBy} className="grid grid-cols-1 gap-2 mx-auto max-w-sm">
              {[
                { value: 'distance', label: t('filter.sort_options.distance') },
                { value: 'date_newest', label: t('filter.sort_options.date_newest') },
                { value: 'date_oldest', label: t('filter.sort_options.date_oldest') },
                { value: 'price_low_high', label: t('filter.sort_options.price_low_high') },
                { value: 'price_high_low', label: t('filter.sort_options.price_high_low') },
              ].map(option => (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <Label 
                    htmlFor={option.value}
                    className={`
                      flex items-center justify-between px-5 py-3.5 rounded-2xl cursor-pointer transition-all duration-300
                      ${sortBy === option.value
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-500 shadow-md'
                        : 'bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 shadow-sm hover:shadow-lg'
                      }
                    `}
                  >
                    <span className={`font-medium text-sm ${sortBy === option.value ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {option.label}
                    </span>
                    {sortBy === option.value && (
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-inner" />
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
              <span className="text-sm font-semibold text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                {distance === 100 ? t('filter.any_distance') : `${distance} km`}
              </span>
            </div>
            
            <div className="mx-auto max-w-sm flex gap-2 p-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-full">
              {[5, 10, 25, 100].map((preset) => (
                <Button
                  key={preset}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPresetDistance(preset)}
                  className={`
                    relative flex-1 py-2.5 rounded-full font-semibold transition-all duration-300
                    ${distance === preset 
                      ? 'bg-white dark:bg-gray-700 shadow-md text-green-600 dark:text-green-400 scale-105' 
                      : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  {distance === preset && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full animate-pulse" />
                  )}
                  <span className="relative z-10">
                    {preset === 100 ? t('filter.any') : `${preset}km`}
                  </span>
                </Button>
              ))}
            </div>

            <div className="mx-auto max-w-sm px-3 pt-4">
              <Slider
                value={[distance]}
                onValueChange={(value) => setDistance(value[0])}
                max={100}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
                <span>0 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-14 font-bold border-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105" 
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('filter.reset')}
            </Button>
            <Button 
              className="flex-1 h-14 font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl" 
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
