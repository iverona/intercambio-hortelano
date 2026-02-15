"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { Navigation, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    label?: string;
    title?: string;
    imageUrl?: string;
    category?: string;
    type: 'product' | 'producer';
}

interface MapComponentProps {
    markers: MapMarker[];
    center?: { lat: number; lng: number };
    userLocation?: { latitude: number; longitude: number } | null;
    className?: string;
    onMarkerClick?: (marker: MapMarker) => void;
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 40.4168, // Madrid
    lng: -3.7038,
};

// SVG Path for the Leaf
const LEAF_PATH = "M12 2C12 2 12 6 12 10C12 14 9 17 5 17C4 17 3 16 3 15C3 13 5 11 8 11C11 11 12 13 12 15M12 2C12 2 12 6 12 10C12 14 15 17 19 17C20 17 21 16 21 15C21 13 19 11 16 11C13 11 12 13 12 15";
// Simplified SVG for Marker icon (simulating the Leaf)
const LEAF_SVG = {
    path: "M12,2C12,2 12,6 12,10C12,14 9,17 5,17C4,17 3,16 3,15C3,13 5,11 8,11C11,11 12,13 12,15M12,2C12,2 12,6 12,10C12,14 15,17 19,17C20,17 21,16 21,15C21,13 19,11 16,11C13,11 12,13 12,15",
    fillColor: "#22c55e",
    fillOpacity: 1,
    strokeColor: "#166534",
    strokeWeight: 2,
    scale: 2,
    anchor: { x: 12, y: 15 } as google.maps.Point,
};


export default function MapComponent({
    markers,
    center,
    userLocation,
    className,
    onMarkerClick,
}: MapComponentProps) {
    const { isLoaded, loadError } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Center logic
    const initialCenter = useMemo(() => {
        if (userLocation) {
            return { lat: userLocation.latitude, lng: userLocation.longitude };
        }
        return center || defaultCenter;
    }, [userLocation, center]);

    const handleRecenter = useCallback(() => {
        if (map && userLocation) {
            map.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
            map.setZoom(13);
        }
    }, [map, userLocation]);

    // Auto-center based on browser geolocation if no userLocation is available
    useEffect(() => {
        if (isLoaded && map && !userLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    map.panTo(pos);
                    map.setZoom(11); // Slightly wider zoom for initial auto-center
                },
                () => {
                    // Fail silently or handle error (e.g. user denied permission)
                }
            );
        }
    }, [isLoaded, map, userLocation]);

    if (loadError) return <div>Error loading map</div>;
    if (!isLoaded) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />;

    return (
        <div className={cn("relative w-full h-full rounded-lg overflow-hidden", className)}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={initialCenter}
                zoom={8}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                        },
                    ],
                }}
            >
                {/* User Location Marker */}
                {userLocation && (
                    <Marker
                        position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                        icon={{
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: "#3b82f6",
                            fillOpacity: 1,
                            strokeColor: "white",
                            strokeWeight: 2,
                        }}
                        title="Tu ubicación"
                    />
                )}

                {/* Product/Producer Markers */}
                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={{ lat: marker.latitude, lng: marker.longitude }}
                        icon={LEAF_SVG}
                        onClick={() => setSelectedMarker(marker)}
                    />
                ))}

                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="p-1 max-w-[200px] text-gray-900 border-none">
                            {selectedMarker.imageUrl && (
                                <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden bg-gray-100">
                                    <Image
                                        src={selectedMarker.imageUrl}
                                        alt={selectedMarker.title || ""}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <h3 className="font-bold text-sm mb-1 leading-tight">{selectedMarker.title}</h3>
                            {selectedMarker.category && (
                                <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full mb-2 inline-block">
                                    {selectedMarker.category}
                                </span>
                            )}
                            <div className="mt-2">
                                <Button
                                    asChild
                                    size="sm"
                                    className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-white"
                                >
                                    <Link href={selectedMarker.type === 'product' ? `/product/${selectedMarker.id}` : `/producers/${selectedMarker.id}`}>
                                        Ver detalles
                                        <ArrowRight className="ml-1.5 h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Custom Unified Controls Stack */}
            <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-[200]">
                {/* Recenter Button */}
                <Button
                    size="icon"
                    variant="secondary"
                    className="shadow-lg bg-white hover:bg-gray-100 text-gray-700 rounded-full h-10 w-10 border border-gray-200"
                    onClick={() => {
                        if (userLocation) {
                            handleRecenter();
                        } else {
                            // Fallback to browser geolocation
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((position) => {
                                    map?.panTo({
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude
                                    });
                                    map?.setZoom(13);
                                });
                            }
                        }
                    }}
                    title="Centrar mapa"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M13 2L13 5M13 19L13 22M5 12L2 12M22 12L19 12"></path></svg>
                </Button>

                {/* Zoom Controls Pill */}
                <div className="flex flex-col bg-white rounded-full shadow-lg border border-gray-200 overflow-hidden">
                    <button
                        className="p-2.5 hover:bg-gray-100 text-gray-700 transition-colors border-b border-gray-100"
                        onClick={() => map?.setZoom((map.getZoom() || 8) + 1)}
                        title="Acercar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button
                        className="p-2.5 hover:bg-gray-100 text-gray-700 transition-colors"
                        onClick={() => map?.setZoom((map.getZoom() || 8) - 1)}
                        title="Alejar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
