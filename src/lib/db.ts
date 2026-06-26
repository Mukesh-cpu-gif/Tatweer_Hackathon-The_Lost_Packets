import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import type { Coordinates } from "./geo";
import { sosTypes, mockResponders, mockIncidents, mockWeatherAlerts } from "./mockData";
import type { Incident, Responder, WeatherAlert } from "./mockData";

const FIRESTORE_FALLBACK_MS = 3000;
const LOCAL_INCIDENTS_KEY = "aounak-local-incidents";

export interface ResponderProfile {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  vehicleType: string;
  available: boolean;
  location?: Coordinates;
}

export interface ResponderProfileInput {
  name: string;
  phone: string;
  skills: string[];
  vehicleType: string;
  available: boolean;
  location?: Coordinates;
}

const isCoordinates = (value: unknown): value is Coordinates => {
  if (!value || typeof value !== "object") return false;
  const maybeCoords = value as { lat?: unknown; lng?: unknown };
  return typeof maybeCoords.lat === "number" && typeof maybeCoords.lng === "number";
};

const readStringArray = (value: unknown) => {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
};

const isBrowser = () => typeof window !== "undefined";

const warnFirestoreFallback = (feature: string, error?: unknown) => {
  console.warn(`${feature} is using local demo data because Firestore is unavailable.`, error);
};

const localProfileKey = (uid: string) => `aounak-responder-profile-${uid}`;

const timestampToIso = (value: unknown) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  return new Date().toISOString();
};

const toIncident = (id: string, data: Record<string, unknown>): Incident => {
  const type = data.type as Incident["type"];
  const sosType = sosTypes.find((category) => category.id === type);
  const location = isCoordinates(data.location) ? data.location : { lat: 23.543, lng: 55.487 };

  return {
    id,
    type,
    location,
    status: data.status === "accepted" || data.status === "resolved" ? data.status : "pending",
    requiredSkills: sosType ? sosType.requiredSkills : [],
    timestamp: timestampToIso(data.timestamp),
    requesterName: typeof data.requesterName === "string" ? data.requesterName : "Unknown",
    aiClassification: typeof data.aiClassification === "string" ? data.aiClassification : undefined,
  };
};

const readLocalIncidents = (): Incident[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_INCIDENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalIncidents = (incidents: Incident[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(LOCAL_INCIDENTS_KEY, JSON.stringify(incidents));
};

const readLocalResponderProfile = (uid: string): ResponderProfile | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(localProfileKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return toResponderProfile(uid, parsed);
  } catch {
    return null;
  }
};

const writeLocalResponderProfile = (uid: string, profile: ResponderProfileInput) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    localProfileKey(uid),
    JSON.stringify({
      ...profile,
      id: uid,
    })
  );
};

const getIncidentFallback = () => {
  const localIncidents = readLocalIncidents();
  return [...localIncidents, ...mockIncidents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

const toResponderProfile = (id: string, data: Record<string, unknown>): ResponderProfile | null => {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const vehicleType = typeof data.vehicleType === "string" ? data.vehicleType.trim() : "";
  const skills = readStringArray(data.skills);

  if (!name && !phone) {
    return null;
  }

  return {
    id,
    name,
    phone,
    vehicleType,
    skills,
    available: typeof data.available === "boolean" ? data.available : true,
    location: isCoordinates(data.location) ? data.location : undefined,
  };
};

export const createIncident = async (
  type: string,
  location: { lat: number; lng: number },
  requesterName: string,
  extraInfo?: string
) => {
  const incidentsRef = collection(db, "incidents");
  const sosType = sosTypes.find((category) => category.id === type);
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
    warnFirestoreFallback("Incident creation", error);
    const localIncident: Incident = {
      id: `LOCAL-${Date.now()}`,
      type: type as Incident["type"],
      location,
      status: "pending",
      requiredSkills: sosType ? sosType.requiredSkills : [],
      timestamp: new Date().toISOString(),
      requesterName,
      aiClassification: extraInfo || undefined,
    };
    writeLocalIncidents([localIncident, ...readLocalIncidents()]);
    return localIncident.id;
  }
};

export const subscribeToIncidents = (callback: (incidents: Incident[]) => void) => {
  const incidentsRef = collection(db, "incidents");
  const q = query(incidentsRef, orderBy("timestamp", "desc"));
  let settled = false;
  let unsubscribe = () => {};
  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Incident feed");
    callback(getIncidentFallback());
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const incidents: Incident[] = [];
      snapshot.forEach((doc) => {
        incidents.push(toIncident(doc.id, doc.data()));
      });
      callback(incidents);
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Incident feed", error);
      callback(getIncidentFallback());
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const getIncidentById = async (incidentId: string): Promise<Incident | null> => {
  const incidentRef = doc(db, "incidents", incidentId);
  try {
    const docSnap = await getDoc(incidentRef);

    if (docSnap.exists()) {
      return toIncident(docSnap.id, docSnap.data());
    }
  } catch (error) {
    warnFirestoreFallback("Incident lookup", error);
  }

  return getIncidentFallback().find((incident) => incident.id === incidentId) ?? null;
}

export const acceptIncident = async (incidentId: string) => {
  const incidentRef = doc(db, "incidents", incidentId);
  try {
    await updateDoc(incidentRef, {
      status: "accepted",
    });
  } catch (error) {
    warnFirestoreFallback("Incident acceptance", error);
    writeLocalIncidents(
      readLocalIncidents().map((incident) =>
        incident.id === incidentId ? { ...incident, status: "accepted" } : incident
      )
    );
  }
};

export const subscribeToResponderProfile = (
  uid: string,
  callback: (profile: ResponderProfile | null) => void
) => {
  const responderRef = doc(db, "responders", uid);
  let settled = false;
  let unsubscribe = () => {};
  const localProfile = readLocalResponderProfile(uid);
  if (localProfile) {
    callback(localProfile);
  }

  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Responder profile");
    callback(readLocalResponderProfile(uid));
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    responderRef,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      if (!snapshot.exists()) {
        callback(readLocalResponderProfile(uid));
        return;
      }

      callback(toResponderProfile(snapshot.id, snapshot.data()));
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Responder profile", error);
      callback(readLocalResponderProfile(uid));
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const saveResponderProfile = async (uid: string, profile: ResponderProfileInput) => {
  const responderRef = doc(db, "responders", uid);
  const cleanedProfile = {
    name: profile.name.trim(),
    phone: profile.phone.trim(),
    vehicleType: profile.vehicleType.trim(),
    skills: profile.skills.map((skill) => skill.trim()).filter(Boolean),
    available: profile.available,
    ...(profile.location ? { location: profile.location } : {}),
    updatedAt: serverTimestamp(),
  };

  writeLocalResponderProfile(uid, profile);

  try {
    await setDoc(responderRef, cleanedProfile, { merge: true });
  } catch (error) {
    warnFirestoreFallback("Responder profile save", error);
  }
};

export const updateResponderAvailability = async (uid: string, available: boolean) => {
  const responderRef = doc(db, "responders", uid);
  const localProfile = readLocalResponderProfile(uid);
  if (localProfile) {
    writeLocalResponderProfile(uid, { ...localProfile, available });
  }

  try {
    await setDoc(
      responderRef,
      {
        available,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    warnFirestoreFallback("Responder availability", error);
  }
};

export const subscribeToResponders = (callback: (responders: Responder[]) => void) => {
  const respondersRef = collection(db, "responders");
  let settled = false;
  let unsubscribe = () => {};
  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Responder directory");
    callback(mockResponders);
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    respondersRef,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const responders: Responder[] = [];
      snapshot.forEach((doc) => {
        const profile = toResponderProfile(doc.id, doc.data());
        if (profile?.location) {
          responders.push({ ...profile, location: profile.location });
        }
      });
      callback(responders);
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Responder directory", error);
      callback(mockResponders);
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const subscribeToWeatherAlerts = (callback: (alerts: WeatherAlert[]) => void) => {
  const alertsRef = collection(db, "weatherAlerts");
  const q = query(alertsRef, orderBy("expiresAt", "asc"));
  let settled = false;
  let unsubscribe = () => {};
  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Weather alerts");
    callback(mockWeatherAlerts);
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const alerts: WeatherAlert[] = [];
      const now = new Date();
      snapshot.forEach((doc) => {
        const data = doc.data() as WeatherAlert;
        if (new Date(data.expiresAt) > now) {
          alerts.push({ ...data, id: doc.id });
        }
      });
      callback(alerts);
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Weather alerts", error);
      callback(mockWeatherAlerts);
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
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
