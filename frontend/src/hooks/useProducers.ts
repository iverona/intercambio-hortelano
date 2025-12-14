import { useState, useEffect } from "react";
import { Producer } from "@/types/user";
import { UserService } from "@/services/user.service";
import { getDistance } from "@/lib/geolocation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useProducers = () => {
    const [producers, setProducers] = useState<Producer[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Fetch user location - Reuse logic or this could be moved to a shared useUserLocation hook in future
    useEffect(() => {
        const fetchUserLocation = async () => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.location?.latitude && userData.location?.longitude) {
                        setUserLocation({
                            latitude: userData.location.latitude,
                            longitude: userData.location.longitude
                        });
                    }
                }
            }
        };
        fetchUserLocation();
    }, [user]);

    useEffect(() => {
        const fetchProducers = async () => {
            setLoading(true);
            try {
                const producersData = await UserService.getProducers();

                // Calculate distances if user location is available
                const processedProducers = producersData.map(producer => {
                    let distance: number | undefined;

                    if (userLocation && producer.location?.latitude && producer.location?.longitude) {
                        distance = getDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            producer.location.latitude,
                            producer.location.longitude
                        );
                    }

                    return { ...producer, distance } as Producer;
                });

                setProducers(processedProducers);
            } catch (error) {
                console.error("Error fetching producers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducers();
    }, [userLocation]);

    return { producers, loading };
};
