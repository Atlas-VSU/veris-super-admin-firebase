import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase.config";

export type UserData = {
  uid: string; name: string; email: string; avatar: string;
  role?: string; orgId?: string; accessLevel?: number;
};

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          const snap = await getDoc(doc(db, "users", authUser.uid));
          if (snap.exists()) {
            const d = snap.data();
            setUser({
              uid: d.id,
              name: d.name,
              email: authUser.email || "",
              avatar: authUser.photoURL || "",
              role: d.role,
              orgId: d.orgId,
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return { user, loading, isAuthenticated: !!user, signOut: () => auth.signOut() };
}
