import { useState, useEffect, useCallback } from "react";
import { UserData } from "@/types/user";
import { UserService } from "@/services/user.service";
import { AuthService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import imageCompression from "browser-image-compression";

export const useUser = () => {
    const { user, refreshUser } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async () => {
        if (!user) {
            setUserData(null);
            setLoading(false);
            return;
        }

        try {
            const data = await UserService.getUserProfile(user.uid);
            setUserData(data);
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError("Failed to load user profile");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const updateProfileData = async (data: Partial<UserData>) => {
        if (!user) return;
        try {
            await UserService.updateUserProfile(user.uid, data);
            setUserData((prev) => (prev ? { ...prev, ...data } : null));
            return true;
        } catch (err) {
            console.error("Error updating profile:", err);
            throw err;
        }
    };

    const uploadAvatar = async (file: File) => {
        if (!user) return;
        setIsUploading(true);
        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 512,
                useWebWorker: true,
            });

            const oldAvatarUrl = userData?.avatarUrl;

            const newAvatarUrl = await UserService.uploadAvatar(
                user.uid,
                compressedFile
            );

            // Update Firestore
            await UserService.updateUserProfile(user.uid, { avatarUrl: newAvatarUrl });

            // Update Auth Profile
            await AuthService.updateUserProfileAuth(user, { photoURL: newAvatarUrl });
            await refreshUser();

            // Update Local State
            setUserData(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);

            // Delete old avatar if exists and successful
            if (oldAvatarUrl) {
                try {
                    await UserService.deleteAvatar(user.uid, oldAvatarUrl);
                } catch (delError) {
                    console.warn("Could not delete old avatar, but new one is set:", delError);
                }
            }


        } catch (err) {
            console.error("Error uploading avatar:", err);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    const deleteAvatar = async () => {
        if (!user || !userData?.avatarUrl) return;
        setIsUploading(true);
        try {
            await UserService.deleteAvatar(user.uid, userData.avatarUrl);

            // Update Firestore
            await UserService.updateUserProfile(user.uid, { avatarUrl: "" });

            // Update Auth Profile
            await AuthService.updateUserProfileAuth(user, { photoURL: "" });
            await refreshUser();

            setUserData(prev => prev ? { ...prev, avatarUrl: "" } : null);
        } catch (err) {
            console.error("Error deleting avatar:", err);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        userData,
        loading,
        isUploading,
        error,
        updateProfileData,
        uploadAvatar,
        deleteAvatar,
        refreshUserData: fetchUserData
    };
};

export const useUserProfile = (userId: string | null | undefined) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) {
            setUser(null);
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            setLoading(true);
            try {
                const data = await UserService.getUserProfile(userId);
                setUser(data);
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    return { user, loading };
};
