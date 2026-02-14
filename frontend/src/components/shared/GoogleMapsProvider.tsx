"use client";

import { createContext, useContext, ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
