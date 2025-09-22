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
import { Filter as FilterIcon, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/locales/provider";

interface FilterProps {
  onFilterChange: (filters: {
    categories: string[];
    distance: number;
    searchTerm: string;
  }) => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
  const t = useI18n();
  const categories = [
    { id: "vegetables", label: t('filter.vegetables'), icon: "🥬" },
    { id: "fruits", label: t('filter.fruits'), icon: "🍎" },
    { id: "honey", label: t('filter.honey'), icon: "🍯" },
    { id: "handicrafts", label: t('filter.handicrafts'), icon: "🎨" },
    { id: "other", label: t('filter.other'), icon: "📦" },
  ];
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [distance, setDistance] = useState(100);
  const [isOpen, setIsOpen] = useState(false);

  // Calculate active filters count
  const activeFiltersCount = selectedCategories.length + (distance < 100 ? 1 : 0);

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
    });
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setDistance(100);
    onFilterChange({
      categories: [],
      distance: 100,
      searchTerm: "", // searchTerm is not modified here
    });
  };

  const setPresetDistance = (value: number) => {
    setDistance(value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative flex items-center gap-2">
          <FilterIcon className="h-4 w-4" />
          <span>{t('header.filter')}</span>
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-2 pb-6">
          <SheetTitle className="text-xl font-semibold">{t('filter.title')}</SheetTitle>
          <SheetDescription className="text-sm">
            {t('filter.subtitle')}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 pb-20">
          {/* Categories Section */}
          <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-xl p-5 space-y-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('filter.categories')}</h3>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {t('filter.clear_all')}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group"
                >
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryChange(category.id)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all duration-200"
                  />
                  <span className="text-2xl select-none">{category.icon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Distance Section */}
          <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-xl p-5 space-y-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('filter.distance')}</h3>
              <span className="text-sm font-semibold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                {distance === 100 ? t('filter.any_distance') : `${distance} km`}
              </span>
            </div>
            
            {/* Preset buttons */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {[5, 10, 25, 100].map((preset) => (
                <Button
                  key={preset}
                  variant={distance === preset ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPresetDistance(preset)}
                  className={`flex-1 text-xs font-medium transition-all duration-200 ${
                    distance === preset 
                      ? "bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {preset === 100 ? t('filter.any') : `${preset}km`}
                </Button>
              ))}
            </div>

            {/* Slider */}
            <div className="px-3 py-2">
              <Slider
                value={[distance]}
                onValueChange={(value) => setDistance(value[0])}
                max={100}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 h-11 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200" 
              onClick={handleResetFilters}
              disabled={selectedCategories.length === 0 && distance === 100}
            >
              {t('filter.reset')}
            </Button>
            <Button 
              className="flex-1 h-11 font-medium bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200" 
              onClick={handleApplyFilters}
            >
              {t('filter.apply')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Filter;
