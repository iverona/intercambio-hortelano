import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const handleUserRedirect = async (
  user: User,
  router: AppRouterInstance
) => {
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (userDoc.exists()) {
    const userData = userDoc.data();
    if (userData.onboardingComplete === false) {
      router.push("/onboarding");
    } else {
      router.push("/");
    }
  } else {
    // Fallback for users that might not have a document,
    // or for the case where the document is created just after this check.
    // The Google Auth flow handles new user creation, so this is mainly a safeguard.
    router.push("/");
  }
};
