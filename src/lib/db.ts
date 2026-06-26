import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import type { Incident } from "./mockData";

export const createIncident = async (
  type: string,
  location: { lat: number; lng: number },
  requesterName: string,
  extraInfo?: string
) => {
  const incidentsRef = collection(db, "incidents");
  const newIncident = {
    type,
    location,
    status: "pending",
    requesterName,
    aiClassification: extraInfo || null,
    timestamp: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(incidentsRef, newIncident);
    return docRef.id;
  } catch (error) {
    console.error("Error creating incident:", error);
    throw error;
  }
};

export const subscribeToIncidents = (callback: (incidents: Incident[]) => void) => {
  const incidentsRef = collection(db, "incidents");
  // Order by newest first
  const q = query(incidentsRef, orderBy("timestamp", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const incidents: Incident[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      incidents.push({
        id: doc.id,
        type: data.type,
        location: data.location,
        status: data.status,
        requiredSkills: data.requiredSkills || [], // Normally fetched from SOS types, mock for now
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        requesterName: data.requesterName || "Unknown",
        aiClassification: data.aiClassification,
      });
    });
    callback(incidents);
  });

  return unsubscribe;
};

export const acceptIncident = async (incidentId: string) => {
  const incidentRef = doc(db, "incidents", incidentId);
  try {
    await updateDoc(incidentRef, {
      status: "accepted",
      // optionally could save responderId here
    });
  } catch (error) {
    console.error("Error accepting incident:", error);
    throw error;
  }
};
