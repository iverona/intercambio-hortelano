"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useCallback, useMemo, useState } from "react";
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

    const handleRecenter = () => {
        if (map && userLocation) {
            map.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
            map.setZoom(13);
        }
    };

    if (loadError) return <div>Error loading map</div>;
    if (!isLoaded) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />;

    return (
        <div className={cn("relative w-full h-full rounded-lg overflow-hidden", className)}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={initialCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
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

            {/* Recenter Button */}
            {userLocation && (
                <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-4 right-4 shadow-md bg-white hover:bg-gray-100 text-gray-700"
                    onClick={handleRecenter}
                    title="Recenter on me"
                >
                    <Navigation className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
