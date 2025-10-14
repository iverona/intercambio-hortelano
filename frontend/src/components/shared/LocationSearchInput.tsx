"use client";

import { useEffect, useRef, useState } from "react";
import { geohashForLocation } from "geofire-common";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoadScript } from "@react-google-maps/api";

interface LocationSearchInputProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    geohash: string;
    address: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

const libraries: ("places")[] = ["places"];

export default function LocationSearchInput({
  onLocationSelect,
  placeholder = "Search for your location...",
  className,
}: LocationSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // Initialize the autocomplete widget
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode"],
      fields: ["formatted_address", "geometry"],
    });

    // Add listener for place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place || !place.geometry || !place.geometry.location) {
        console.error("No place details available");
        return;
      }

      setIsLoading(true);
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || "";
      
      // Generate geohash with precision 7 (approximately 150m x 150m)
      const geohash = geohashForLocation([lat, lng], 7);
      
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        geohash,
        address,
      });
      
      setIsLoading(false);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onLocationSelect]);

  if (loadError) {
    return (
      <div className="text-red-500 text-sm">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={!isLoaded || isLoading}
          className={cn(
            "w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:bg-gray-50 disabled:cursor-not-allowed",
            "text-sm"
          )}
        />
        {(isLoading || !isLoaded) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {!isLoaded && (
        <p className="text-xs text-gray-500 mt-1">Loading location search...</p>
      )}
    </div>
  );
}
