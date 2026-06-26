import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { sosTypes, mockResponders, mockIncidents, mockWeatherAlerts } from "./mockData";
import type { Incident, Responder, WeatherAlert } from "./mockData";

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
  const q = query(incidentsRef, orderBy("timestamp", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const incidents: Incident[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const sosType = sosTypes.find((t) => t.id === data.type);
      incidents.push({
        id: doc.id,
        type: data.type,
        location: data.location,
        status: data.status,
        requiredSkills: sosType ? sosType.requiredSkills : [],
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        requesterName: data.requesterName || "Unknown",
        aiClassification: data.aiClassification,
      });
    });
    callback(incidents);
  });

  return unsubscribe;
};

export const getIncidentById = async (incidentId: string): Promise<Incident | null> => {
  const incidentRef = doc(db, "incidents", incidentId);
  const docSnap = await getDoc(incidentRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    const sosType = sosTypes.find((t) => t.id === data.type);
    return {
      id: docSnap.id,
      type: data.type,
      location: data.location,
      status: data.status,
      requiredSkills: sosType ? sosType.requiredSkills : [],
      timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
      requesterName: data.requesterName || "Unknown",
      aiClassification: data.aiClassification,
    };
  }
  return null;
}

export const acceptIncident = async (incidentId: string) => {
  const incidentRef = doc(db, "incidents", incidentId);
  try {
    await updateDoc(incidentRef, {
      status: "accepted",
    });
  } catch (error) {
    console.error("Error accepting incident:", error);
    throw error;
  }
};

export const subscribeToResponders = (callback: (responders: Responder[]) => void) => {
  const respondersRef = collection(db, "responders");

  const unsubscribe = onSnapshot(respondersRef, (snapshot) => {
    const responders: Responder[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Responder;
      responders.push({ ...data, id: doc.id });
    });
    callback(responders);
  });

  return unsubscribe;
};

export const subscribeToWeatherAlerts = (callback: (alerts: WeatherAlert[]) => void) => {
  const alertsRef = collection(db, "weatherAlerts");
  const q = query(alertsRef, orderBy("expiresAt", "asc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const alerts: WeatherAlert[] = [];
    const now = new Date();
    snapshot.forEach((doc) => {
      const data = doc.data() as WeatherAlert;
      // optionally filter out expired alerts client side if not doing server query
      if (new Date(data.expiresAt) > now) {
        alerts.push({ ...data, id: doc.id });
      }
    });
    callback(alerts);
  });

  return unsubscribe;
};

export const seedDatabase = async () => {
  console.log("Seeding Database...");
  
  const incidentsRef = collection(db, "incidents");
  for (const incident of mockIncidents) {
    await setDoc(doc(incidentsRef, incident.id), {
      ...incident,
      timestamp: new Date(incident.timestamp)
    });
  }

  const respondersRef = collection(db, "responders");
  for (const responder of mockResponders) {
    await setDoc(doc(respondersRef, responder.id), responder);
  }

  const alertsRef = collection(db, "weatherAlerts");
  for (const alert of mockWeatherAlerts) {
    await setDoc(doc(alertsRef, alert.id), alert);
  }

  console.log("Database seeding complete!");
};
