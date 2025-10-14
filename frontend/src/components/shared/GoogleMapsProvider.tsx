"use client";

import { ReactNode } from "react";

interface GoogleMapsProviderProps {
  children: ReactNode;
}

// This component is now a simple wrapper since we're using useLoadScript
// directly in the LocationSearchInput component
export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  return <>{children}</>;
}
