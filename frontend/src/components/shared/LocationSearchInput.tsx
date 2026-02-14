"use client";

import { useEffect, useRef, useState } from "react";
import { geohashForLocation } from "geofire-common";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoogleMaps } from "@/components/shared/GoogleMapsProvider";

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

export default function LocationSearchInput({
  onLocationSelect,
  placeholder = "Search for your location...",
  className,
}: LocationSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isLoaded, loadError } = useGoogleMaps();
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      console.log("LocationSearchInput: Not loaded or no input ref", { isLoaded, hasInput: !!inputRef.current });
      return;
    }

    if (autocompleteRef.current) {
      console.log("LocationSearchInput: Autocomplete already initialized");
      return;
    }

    console.log("LocationSearchInput: Initializing Autocomplete...");

    // Initialize the autocomplete widget
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode"],
      fields: ["formatted_address", "geometry"],
    });
    autocompleteRef.current = autocomplete;

    // Add listener for place selection
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        return;
      }

      setIsLoading(true);

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || "";

      // Generate geohash with precision 7 (approximately 150m x 150m)
      const geohash = geohashForLocation([lat, lng], 7);

      if (onLocationSelectRef.current) {
        onLocationSelectRef.current({
          latitude: lat,
          longitude: lng,
          geohash,
          address,
        });
      }

      setIsLoading(false);
    });

    // Handle Enter key to select the first suggestion if the user doesn't click
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        // Prevent form submission
        e.preventDefault();
      }
    };
    inputRef.current.addEventListener("keydown", handleKeyDown);

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
      if (inputRef.current) {
        inputRef.current.removeEventListener("keydown", handleKeyDown);
      }
      autocompleteRef.current = null;
    };
  }, [isLoaded]);

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
