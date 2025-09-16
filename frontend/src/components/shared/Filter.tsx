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
import { Separator } from "@/components/ui/separator";
import { Filter as FilterIcon, X } from "lucide-react";
import { useState, useEffect } from "react";

const categories = [
  { id: "vegetables", label: "Vegetables", icon: "🥬" },
  { id: "fruits", label: "Fruits", icon: "🍎" },
  { id: "honey", label: "Honey", icon: "🍯" },
  { id: "handicrafts", label: "Handicrafts", icon: "🎨" },
  { id: "other", label: "Other", icon: "📦" },
];

interface FilterProps {
  onFilterChange: (filters: {
    categories: string[];
    distance: number;
  }) => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
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
    });
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setDistance(100);
    onFilterChange({
      categories: [],
      distance: 100,
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
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-xl">Filter Products</SheetTitle>
          <SheetDescription>
            Refine your search by category and distance
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Categories Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Categories</h3>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryChange(category.id)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <span className="text-2xl">{category.icon}</span>
                  <span className="flex-1 text-sm group-hover:text-foreground transition-colors">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Distance Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Maximum Distance</h3>
              <span className="text-sm font-medium text-green-600">
                {distance === 100 ? "Any distance" : `${distance} km`}
              </span>
            </div>
            
            {/* Preset buttons */}
            <div className="flex gap-2">
              {[5, 10, 25, 100].map((preset) => (
                <Button
                  key={preset}
                  variant={distance === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPresetDistance(preset)}
                  className="flex-1 text-xs"
                >
                  {preset === 100 ? "Any" : `${preset}km`}
                </Button>
              ))}
            </div>

            {/* Slider */}
            <div className="px-2">
              <Slider
                value={[distance]}
                onValueChange={(value) => setDistance(value[0])}
                max={100}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleResetFilters}
            disabled={selectedCategories.length === 0 && distance === 100}
          >
            Reset
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700" 
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Filter;
