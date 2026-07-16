import { Term } from "@/constants/types";
import { db } from "@/firebase/firebase.config";
import { collection, addDoc, Timestamp, updateDoc, doc, getDocs, CollectionReference, DocumentData, query, where } from "firebase/firestore";
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from "@/services/cacheService";


const termsCollection: CollectionReference<DocumentData> = collection(
    db,
    "terms"
  );

  // Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    // Re-throwing allows the calling UI to handle the failed state.
    throw new Error(`Failed to ${context}.`);
  };

export const createTerm = async (AY: string, sem: string) => {
    try {
      
        const term = await getActiveTerm();
        const duplicate = await checkForDuplicateTerms(AY, sem);
        if (duplicate) {
            throw new Error(`Active term for AY ${AY} (${sem}) already exists. Cannot create a duplicate.`);
        }
        await addDoc(termsCollection, {
            AY: AY,
            semester: sem,
            isActive : true,
            metadata: {
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            isDeleted: false,
        });
        if (term) {
            await updateDoc(doc(termsCollection, term!.id), {
            isActive: false,
            "metadata.updatedAt": Timestamp.now(),
        });
        }
        // Invalidate both term caches so the next calls get fresh data
        cacheService.invalidate(CACHE_KEYS.activeTerm());
        cacheService.invalidate(CACHE_KEYS.allTerms());

    } catch (error) {
        handleFirestoreError(error, `creating term`);
        return null;
    }
}
  
export const getActiveTerm = async () => {
    return cacheService.getOrFetch(
        CACHE_KEYS.activeTerm(),
        async () => {
            const q = query(termsCollection,
                where("isActive", "==", true),
                where("isDeleted", "==", false));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const termDoc = snapshot.docs[0];
                return { id: termDoc.id, AY: termDoc.data().AY, semester: termDoc.data().semester, isActive: termDoc.data().isActive } as Term;
            }
            return null;
        },
        CACHE_DURATIONS.TERMS
    );
}

export const getAllTerms = async () => {
    try {
        const snapshot = await getDocs(termsCollection);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            AY: doc.data().AY,
            semester: doc.data().semester,
            isActive: doc.data().isActive,
            metadata: doc.data().metadata,
            isDeleted: doc.data().isDeleted,
        })) as Term[];
    } catch (error) {
        handleFirestoreError(error, `fetching all Terms`);
        return [];
    }
}

export const checkForDuplicateTerms = async (AY: string, sem: string) => {
    try {
        const q = query(termsCollection,
            where("AY", "==", AY),
            where("semester", "==", sem));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return false;
        }
        return true;
    } catch (error) {
        handleFirestoreError(error, `checking duplicates`);
        return null;
    }
}

/**
 * Adds a brand-new term document to Firestore.
 * If `activate` is true the new term is marked isActive = true and any
 * currently-active term is deactivated.
 */
export const addTerm = async (
    AY: string,
    semester: string,
    activate: boolean = false
): Promise<{ id: string } | null> => {
    try {
        const newDocRef = await addDoc(termsCollection, {
            AY,
            semester,
            isActive: activate,
            isDeleted: false,
            metadata: {
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
        });

        if (activate) {
            // Deactivate the previously active term (if any)
            const currentActive = await getActiveTerm();
            if (currentActive) {
                await updateDoc(doc(termsCollection, currentActive.id!), {
                    isActive: false,
                    "metadata.updatedAt": Timestamp.now(),
                });
            }
        }

        // Invalidate caches so the next load gets fresh data
        cacheService.invalidate(CACHE_KEYS.activeTerm());
        cacheService.invalidate(CACHE_KEYS.allTerms());

        return { id: newDocRef.id };
    } catch (error) {
        handleFirestoreError(error, `adding term`);
        return null;
    }
};

/**
 * Sets an EXISTING term as the active term.
 * Returns 'not_found' when the AY+semester combo does not exist in Firestore,
 * 'already_active' when it is already the active term, or 'ok' on success.
 */
export const setActiveTerm = async (
    AY: string,
    semester: string
): Promise<"ok" | "not_found" | "already_active"> => {
    // Find the target term by AY + semester
    const q = query(
        termsCollection,
        where("AY", "==", AY),
        where("semester", "==", semester),
        where("isDeleted", "==", false)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
        return "not_found";
    }

    const targetDoc = snap.docs[0];
    const targetData = targetDoc.data();

    if (targetData.isActive === true) {
        return "already_active";
    }

    // Deactivate the current active term
    const currentActive = await getActiveTerm();
    if (currentActive && currentActive.id !== targetDoc.id) {
        await updateDoc(doc(termsCollection, currentActive.id!), {
            isActive: false,
            "metadata.updatedAt": Timestamp.now(),
        });
    }

    // Activate the target term
    await updateDoc(doc(termsCollection, targetDoc.id), {
        isActive: true,
        "metadata.updatedAt": Timestamp.now(),
    });

    // Invalidate caches
    cacheService.invalidate(CACHE_KEYS.activeTerm());
    cacheService.invalidate(CACHE_KEYS.allTerms());

    return "ok";
};

