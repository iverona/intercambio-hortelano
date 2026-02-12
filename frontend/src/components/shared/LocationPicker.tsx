"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Check, RotateCcw } from "lucide-react";
import LocationSearchInput from "@/components/shared/LocationSearchInput";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useI18n } from "@/locales/provider";

export interface LocationData {
    latitude: number;
    longitude: number;
    geohash: string;
    address?: string;
}

interface LocationPickerProps {
    /** Called when the user confirms their location selection */
    onLocationConfirm: (location: LocationData) => void | Promise<void>;
    /** Whether an external save operation is in progress */
    saving?: boolean;
    /** Labels customization — defaults to onboarding.* keys */
    labels?: {
        shareLocationButton?: string;
        enterManuallyButton?: string;
        manualInputDescription?: string;
        searchPlaceholder?: string;
        selectedLocationLabel?: string;
        confirmButton?: string;
        changeButton?: string;
        loadingButton?: string;
        backButton?: string;
        description?: string;
    };
    /** Whether to show the descriptive text above the buttons */
    showDescription?: boolean;
    className?: string;
}

export default function LocationPicker({
    onLocationConfirm,
    saving = false,
    labels,
    showDescription = true,
    className,
}: LocationPickerProps) {
    const t = useI18n();
    const { getCurrentLocation, loading: geoLoading, error: geoError, clearError } = useGeolocation();

    const [showManualInput, setShowManualInput] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<LocationData | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Resolved labels with defaults
    const l = {
        shareLocationButton: labels?.shareLocationButton || t('onboarding.share_location_button'),
        enterManuallyButton: labels?.enterManuallyButton || t('onboarding.enter_manually_button'),
        manualInputDescription: labels?.manualInputDescription || t('onboarding.manual_input_description'),
        searchPlaceholder: labels?.searchPlaceholder || t('onboarding.location_search_placeholder'),
        selectedLocationLabel: labels?.selectedLocationLabel || t('onboarding.selected_location_label'),
        confirmButton: labels?.confirmButton || t('onboarding.confirm_location_button'),
        changeButton: labels?.changeButton || t('onboarding.change_location_button'),
        loadingButton: labels?.loadingButton || t('onboarding.loading_button'),
        backButton: labels?.backButton || t('common.back'),
        description: labels?.description || t('onboarding.description'),
    };

    const isLoading = geoLoading || saving || isConfirming;

    const handleGeoLocation = async () => {
        clearError();
        const location = await getCurrentLocation();
        if (location) {
            // GPS location doesn't need confirmation — the browser already asked for permission
            setIsConfirming(true);
            try {
                await onLocationConfirm(location);
            } finally {
                setIsConfirming(false);
            }
        }
    };

    const handleManualSelect = (location: {
        latitude: number;
        longitude: number;
        geohash: string;
        address: string;
    }) => {
        setPendingLocation(location);
    };

    const handleConfirm = async () => {
        if (!pendingLocation) return;
        setIsConfirming(true);
        try {
            await onLocationConfirm(pendingLocation);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleChange = () => {
        setPendingLocation(null);
    };

    const handleEnterManually = () => {
        setShowManualInput(true);
        setPendingLocation(null);
        clearError();
    };

    const handleBackFromManual = () => {
        setShowManualInput(false);
        setPendingLocation(null);
        clearError();
    };

    return (
        <div className={className}>
            <div className="space-y-6">
                {showDescription && (
                    <p className="text-center text-gray-600 dark:text-gray-400 font-serif">
                        {l.description}
                    </p>
                )}

                {!showManualInput ? (
                    // Step 1: Choose between GPS and manual input
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={handleGeoLocation}
                            disabled={isLoading}
                            className="bg-primary hover:bg-[#7a8578] text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {l.loadingButton}
                                </>
                            ) : (
                                <>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {l.shareLocationButton}
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleEnterManually}
                            variant="outline"
                            disabled={isLoading}
                        >
                            {l.enterManuallyButton}
                        </Button>
                    </div>
                ) : pendingLocation && pendingLocation.address ? (
                    // Step 3: Confirmation step — show selected location
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {l.selectedLocationLabel}
                                </p>
                                <p className="text-base font-semibold text-foreground">
                                    {pendingLocation.address}
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleConfirm}
                            className="w-full bg-primary hover:bg-[#7a8578] text-white shadow-lg"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {l.loadingButton}
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    {l.confirmButton}
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleChange}
                            variant="outline"
                            className="w-full"
                            disabled={isLoading}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {l.changeButton}
                        </Button>
                    </div>
                ) : (
                    // Step 2: Manual search input
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {l.manualInputDescription}
                        </p>
                        <LocationSearchInput
                            onLocationSelect={handleManualSelect}
                            placeholder={l.searchPlaceholder}
                            className="w-full"
                        />
                        <Button
                            onClick={handleBackFromManual}
                            variant="outline"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {l.backButton}
                        </Button>
                    </div>
                )}

                {geoError && (
                    <p className="text-red-500 text-sm mt-4 text-center">{geoError}</p>
                )}
            </div>
        </div>
    );
}
