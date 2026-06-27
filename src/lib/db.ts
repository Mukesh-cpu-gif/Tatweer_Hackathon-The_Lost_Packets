import { db } from "./firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { Coordinates } from "./geo";
import { sosTypes, mockResponders, mockIncidents, mockWeatherAlerts, mockBlockades, mockSafeRoutes } from "./mockData";
import type { Incident, Responder, SOSCategory, WeatherAlert, Blockade, SafeRoute } from "./mockData";

const FIRESTORE_FALLBACK_MS = 3000;
const LOCAL_INCIDENTS_KEY = "aounak-local-incidents";
const CLIENT_SESSION_KEY = "aounak-client-session-id";

export type IncidentBlockKey =
  | "contact"
  | "crisis"
  | "venomousDiagnostics"
  | "fuel"
  | "vehicleStuck"
  | "livestock"
  | "water"
  | "medical"
  | "legacyDetails";

export interface CommunityProfile {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  skills: string[];
  medicalDetails: string;
  available: boolean;
  location?: Coordinates;
}

export interface CommunityProfileInput {
  name: string;
  phone: string;
  vehicleType: string;
  skills: string[];
  medicalDetails?: string;
  available: boolean;
  location?: Coordinates;
}

export interface IncidentBlock {
  id: string;
  key: IncidentBlockKey;
  title: string;
  summary: string;
  clientSessionId: string;
  updatedByUid?: string | null;
  updatedAt: string;
}

export interface IncidentBlockInput {
  key: IncidentBlockKey;
  title: string;
  summary: string;
  clientSessionId: string;
  updatedByUid?: string | null;
}

export interface IncidentSummaryInput {
  type: string;
  location: Coordinates;
  requesterName?: string;
  clientSessionId?: string;
  createdByUid?: string | null;
  notifiedCount?: number;
  isVoiceCommand?: boolean;
}

export type ResponderProfile = CommunityProfile;
export type ResponderProfileInput = CommunityProfileInput;

const isBrowser = () => typeof window !== "undefined";

export const getClientSessionId = () => {
  if (!isBrowser()) return "server-session";

  const current = window.localStorage.getItem(CLIENT_SESSION_KEY);
  if (current) return current;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(CLIENT_SESSION_KEY, next);
  return next;
};

const warnFirestoreFallback = (feature: string, error?: unknown) => {
  console.warn(`${feature} is using local demo data because Firestore is unavailable.`, error);
};

const localCommunityProfileKey = (uid: string) => `aounak-community-profile-${uid}`;
const legacyResponderProfileKey = (uid: string) => `aounak-responder-profile-${uid}`;
const localIncidentBlocksKey = (incidentId: string) => `aounak-local-incident-blocks-${incidentId}`;

const isCoordinates = (value: unknown): value is Coordinates => {
  if (!value || typeof value !== "object") return false;
  const maybeCoords = value as { lat?: unknown; lng?: unknown };
  return typeof maybeCoords.lat === "number" && typeof maybeCoords.lng === "number";
};

const readStringArray = (value: unknown) => {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
};

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

const normalizeIncidentType = (value: unknown): SOSCategory => {
  const match = sosTypes.find((category) => category.id === value);
  return match?.id ?? "medical";
};

const getSosType = (type: string) => sosTypes.find((category) => category.id === type);

const readResponderCounts = (value: unknown) => {
  if (!value || typeof value !== "object") return { notified: 0, enRoute: 0 };
  const maybeCounts = value as { notified?: unknown; enRoute?: unknown };
  return {
    notified: typeof maybeCounts.notified === "number" ? maybeCounts.notified : 0,
    enRoute: typeof maybeCounts.enRoute === "number" ? maybeCounts.enRoute : 0,
  };
};

const toIncident = (id: string, data: Record<string, unknown>): Incident => {
  const type = normalizeIncidentType(data.type);
  const sosType = getSosType(type);
  const location = isCoordinates(data.location) ? data.location : { lat: 23.543, lng: 55.487 };

  return {
    id,
    type,
    location,
    status: data.status === "accepted" || data.status === "resolved" ? data.status : "pending",
    requiredSkills: readStringArray(data.requiredSkills).length
      ? readStringArray(data.requiredSkills)
      : sosType?.requiredSkills ?? [],
    timestamp: timestampToIso(data.timestamp),
    requesterName: typeof data.requesterName === "string" ? data.requesterName : "Emergency Guest",
    aiClassification: typeof data.aiClassification === "string" ? data.aiClassification : undefined,
    clientSessionId: typeof data.clientSessionId === "string" ? data.clientSessionId : undefined,
    createdByUid: typeof data.createdByUid === "string" ? data.createdByUid : undefined,
    responderCounts: readResponderCounts(data.responderCounts),
    acceptedBy: readStringArray(data.acceptedBy),
    acceptedByNames: readStringArray(data.acceptedByNames),
  };
};

const toCommunityProfile = (id: string, data: Record<string, unknown>): CommunityProfile | null => {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const vehicleType = typeof data.vehicleType === "string" ? data.vehicleType.trim() : "";

  if (!name && !phone) return null;

  return {
    id,
    name,
    phone,
    vehicleType,
    skills: readStringArray(data.skills),
    medicalDetails: typeof data.medicalDetails === "string" ? data.medicalDetails : "",
    available: typeof data.available === "boolean" ? data.available : true,
    location: isCoordinates(data.location) ? data.location : undefined,
  };
};

const toResponderDirectoryProfile = (id: string, data: Record<string, unknown>): Responder | null => {
  const profile = toCommunityProfile(id, data);
  if (!profile?.location) return null;

  return {
    id,
    name: profile.name,
    phone: typeof data.publicPhone === "string" ? data.publicPhone : profile.phone,
    skills: profile.skills,
    location: profile.location,
    available: profile.available,
    vehicleType: profile.vehicleType,
  };
};

const toIncidentBlock = (id: string, data: Record<string, unknown>): IncidentBlock => ({
  id,
  key: (typeof data.key === "string" ? data.key : id) as IncidentBlockKey,
  title: typeof data.title === "string" ? data.title : id,
  summary: typeof data.summary === "string" ? data.summary : "",
  clientSessionId: typeof data.clientSessionId === "string" ? data.clientSessionId : "",
  updatedByUid: typeof data.updatedByUid === "string" ? data.updatedByUid : null,
  updatedAt: timestampToIso(data.updatedAt),
});

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

const getIncidentFallback = () => {
  const localIncidents = readLocalIncidents();
  return [...localIncidents, ...mockIncidents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

const readLocalCommunityProfile = (uid: string): CommunityProfile | null => {
  if (!isBrowser()) return null;

  try {
    const raw =
      window.localStorage.getItem(localCommunityProfileKey(uid)) ??
      window.localStorage.getItem(legacyResponderProfileKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return toCommunityProfile(uid, parsed);
  } catch {
    return null;
  }
};

const writeLocalCommunityProfile = (uid: string, profile: CommunityProfileInput) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    localCommunityProfileKey(uid),
    JSON.stringify({
      ...profile,
      id: uid,
      medicalDetails: profile.medicalDetails ?? "",
    })
  );
};

const readLocalIncidentBlocks = (incidentId: string): IncidentBlock[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(localIncidentBlocksKey(incidentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalIncidentBlocks = (incidentId: string, blocks: IncidentBlock[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(localIncidentBlocksKey(incidentId), JSON.stringify(blocks));
};

const upsertLocalIncidentBlock = (incidentId: string, block: IncidentBlock) => {
  const existing = readLocalIncidentBlocks(incidentId);
  const nextBlocks = [block, ...existing.filter((item) => item.key !== block.key)];
  writeLocalIncidentBlocks(incidentId, nextBlocks);
};

export const saveCommunityProfile = async (uid: string, profile: CommunityProfileInput) => {
  const localProfile = {
    name: profile.name.trim(),
    phone: profile.phone.trim(),
    vehicleType: profile.vehicleType.trim(),
    skills: profile.skills.map((skill) => skill.trim()).filter(Boolean),
    medicalDetails: (profile.medicalDetails ?? "").trim(),
    available: profile.available,
    ...(profile.location ? { location: profile.location } : {}),
  };
  const cleanedProfile = {
    ...localProfile,
    updatedAt: serverTimestamp(),
  };

  writeLocalCommunityProfile(uid, localProfile);

  try {
    await setDoc(doc(db, "profiles", uid), cleanedProfile, { merge: true });
    await setDoc(
      doc(db, "responderDirectory", uid),
      {
        name: cleanedProfile.name,
        publicPhone: cleanedProfile.phone,
        vehicleType: cleanedProfile.vehicleType,
        skills: cleanedProfile.skills,
        available: cleanedProfile.available,
        ...(profile.location ? { location: profile.location } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    warnFirestoreFallback("Community profile save", error);
  }
};

export const subscribeCommunityProfile = (
  uid: string,
  callback: (profile: CommunityProfile | null) => void
) => {
  const profileRef = doc(db, "profiles", uid);
  let settled = false;
  let unsubscribe = () => {};
  const localProfile = readLocalCommunityProfile(uid);
  if (localProfile) callback(localProfile);

  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Community profile");
    callback(readLocalCommunityProfile(uid));
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    profileRef,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      if (!snapshot.exists()) {
        callback(readLocalCommunityProfile(uid));
        return;
      }

      callback(toCommunityProfile(snapshot.id, snapshot.data()));
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Community profile", error);
      callback(readLocalCommunityProfile(uid));
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const subscribeResponderDirectory = (callback: (responders: Responder[]) => void) => {
  const respondersRef = collection(db, "responderDirectory");
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
      snapshot.forEach((documentSnapshot) => {
        const responder = toResponderDirectoryProfile(documentSnapshot.id, documentSnapshot.data());
        if (responder) responders.push(responder);
      });
      callback(responders.length ? responders : mockResponders);
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

export const createIncidentSummary = async (input: IncidentSummaryInput) => {
  const sosType = getSosType(input.type);
  const clientSessionId = input.clientSessionId ?? getClientSessionId();
  const requiredSkills = sosType?.requiredSkills ?? [];
  const newIncident = {
    type: sosType?.id ?? "medical",
    location: input.location,
    status: "pending",
    requesterName: input.requesterName?.trim() || "Emergency Guest",
    requiredSkills,
    clientSessionId,
    createdByUid: input.createdByUid ?? null,
    responderCounts: {
      notified: input.notifiedCount ?? 0,
      enRoute: 0,
    },
    acceptedBy: [],
    acceptedByNames: [],
    isVoiceCommand: Boolean(input.isVoiceCommand),
    timestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, "incidents"), newIncident);
    return docRef.id;
  } catch (error) {
    warnFirestoreFallback("Incident creation", error);
    const localIncident: Incident = {
      id: `LOCAL-${Date.now()}`,
      type: newIncident.type as SOSCategory,
      location: input.location,
      status: "pending",
      requiredSkills,
      timestamp: new Date().toISOString(),
      requesterName: newIncident.requesterName,
      isVoiceCommand: newIncident.isVoiceCommand,
      clientSessionId,
      createdByUid: input.createdByUid ?? undefined,
      responderCounts: newIncident.responderCounts,
      acceptedBy: [],
      acceptedByNames: [],
    };
    writeLocalIncidents([localIncident, ...readLocalIncidents()]);
    return localIncident.id;
  }
};

export const subscribeIncidentSummary = (
  incidentId: string,
  callback: (incident: Incident | null) => void
) => {
  const incidentRef = doc(db, "incidents", incidentId);
  let settled = false;
  let unsubscribe = () => {};

  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Incident summary");
    callback(getIncidentFallback().find((incident) => incident.id === incidentId) ?? null);
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    incidentRef,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      callback(snapshot.exists() ? toIncident(snapshot.id, snapshot.data()) : null);
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Incident summary", error);
      callback(getIncidentFallback().find((incident) => incident.id === incidentId) ?? null);
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const upsertIncidentBlock = async (incidentId: string, block: IncidentBlockInput) => {
  const cleanBlock = {
    key: block.key,
    title: block.title.trim(),
    summary: block.summary.trim(),
    clientSessionId: block.clientSessionId,
    updatedByUid: block.updatedByUid ?? null,
    updatedAt: serverTimestamp(),
  };

  const localBlock: IncidentBlock = {
    ...cleanBlock,
    id: block.key,
    updatedAt: new Date().toISOString(),
  };
  upsertLocalIncidentBlock(incidentId, localBlock);

  try {
    await setDoc(doc(db, "incidents", incidentId, "blocks", block.key), cleanBlock, { merge: true });
  } catch (error) {
    warnFirestoreFallback("Incident block save", error);
  }
};

export const subscribeIncidentBlocks = (
  incidentId: string,
  callback: (blocks: IncidentBlock[]) => void
) => {
  const blocksRef = collection(db, "incidents", incidentId, "blocks");
  let settled = false;
  let unsubscribe = () => {};
  const localBlocks = readLocalIncidentBlocks(incidentId);
  if (localBlocks.length) callback(localBlocks);

  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Incident blocks");
    callback(readLocalIncidentBlocks(incidentId));
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    blocksRef,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const blocks: IncidentBlock[] = [];
      snapshot.forEach((documentSnapshot) => {
        blocks.push(toIncidentBlock(documentSnapshot.id, documentSnapshot.data()));
      });
      callback(blocks.sort((a, b) => a.title.localeCompare(b.title)));
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Incident blocks", error);
      callback(readLocalIncidentBlocks(incidentId));
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const createIncident = async (
  type: string,
  location: Coordinates,
  requesterName: string,
  extraInfo?: string
) => {
  const clientSessionId = getClientSessionId();
  const incidentId = await createIncidentSummary({
    type,
    location,
    requesterName,
    clientSessionId,
  });

  if (extraInfo?.trim()) {
    await upsertIncidentBlock(incidentId, {
      key: "legacyDetails",
      title: "Additional Details",
      summary: extraInfo,
      clientSessionId,
    });
  }

  return incidentId;
};

export const subscribeToIncidents = (callback: (incidents: Incident[]) => void) => {
  const incidentsRef = collection(db, "incidents");
  const incidentQuery = query(incidentsRef, orderBy("timestamp", "desc"));
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
    incidentQuery,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const incidents: Incident[] = [];
      snapshot.forEach((documentSnapshot) => {
        incidents.push(toIncident(documentSnapshot.id, documentSnapshot.data()));
      });
      callback(incidents.length ? incidents : getIncidentFallback());
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
  try {
    const docSnap = await getDoc(doc(db, "incidents", incidentId));
    if (docSnap.exists()) return toIncident(docSnap.id, docSnap.data());
  } catch (error) {
    warnFirestoreFallback("Incident lookup", error);
  }

  return getIncidentFallback().find((incident) => incident.id === incidentId) ?? null;
};

export const acceptIncident = async (
  incidentId: string,
  responder?: { uid?: string; name?: string }
) => {
  const responderId = responder?.uid ?? `local-${getClientSessionId()}`;
  const responderName = responder?.name ?? "Community Helper";

  try {
    await updateDoc(doc(db, "incidents", incidentId), {
      status: "accepted",
      acceptedBy: arrayUnion(responderId),
      acceptedByNames: arrayUnion(responderName),
      "responderCounts.enRoute": increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    warnFirestoreFallback("Incident acceptance", error);
    writeLocalIncidents(
      readLocalIncidents().map((incident) =>
        incident.id === incidentId
          ? {
              ...incident,
              status: "accepted",
              acceptedBy: Array.from(new Set([...(incident.acceptedBy ?? []), responderId])),
              acceptedByNames: Array.from(new Set([...(incident.acceptedByNames ?? []), responderName])),
              responderCounts: {
                notified: incident.responderCounts?.notified ?? 0,
                enRoute: (incident.responderCounts?.enRoute ?? 0) + 1,
              },
            }
          : incident
      )
    );
  }
};

export const subscribeToResponderProfile = subscribeCommunityProfile;
export const saveResponderProfile = saveCommunityProfile;

export const updateResponderAvailability = async (uid: string, available: boolean) => {
  const localProfile = readLocalCommunityProfile(uid);
  if (localProfile) {
    writeLocalCommunityProfile(uid, { ...localProfile, available });
  }

  try {
    await setDoc(
      doc(db, "profiles", uid),
      {
        available,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await setDoc(
      doc(db, "responderDirectory", uid),
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

export const subscribeToResponders = subscribeResponderDirectory;

export const subscribeToWeatherAlerts = (callback: (alerts: WeatherAlert[]) => void) => {
  const alertsRef = collection(db, "weatherAlerts");
  const alertQuery = query(alertsRef, orderBy("expiresAt", "asc"));
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
    alertQuery,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const alerts: WeatherAlert[] = [];
      const now = new Date();
      snapshot.forEach((documentSnapshot) => {
        const data = documentSnapshot.data() as WeatherAlert;
        if (new Date(data.expiresAt) > now) {
          alerts.push({ ...data, id: documentSnapshot.id });
        }
      });
      callback(alerts.length ? alerts : mockWeatherAlerts);
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

// ─── Blockades & Safe Routes Database Actions ──────────────────────
const LOCAL_BLOCKADES_KEY = "aounak-local-blockades";
const LOCAL_SAFE_ROUTES_KEY = "aounak-local-safe-routes";

const readLocalBlockades = (): Blockade[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_BLOCKADES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeLocalBlockades = (blockades: Blockade[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(LOCAL_BLOCKADES_KEY, JSON.stringify(blockades));
};

const readLocalSafeRoutes = (): SafeRoute[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SAFE_ROUTES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeLocalSafeRoutes = (routes: SafeRoute[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(LOCAL_SAFE_ROUTES_KEY, JSON.stringify(routes));
};

export const saveBlockade = async (blockadeInput: Omit<Blockade, "id"> & { id?: string }) => {
  const id = blockadeInput.id ?? `BLK-${Date.now()}`;
  const blockade: Blockade = {
    id,
    name: blockadeInput.name.trim(),
    type: blockadeInput.type,
    location: blockadeInput.location,
    radiusKm: blockadeInput.radiusKm,
  };

  const localBlockades = readLocalBlockades();
  writeLocalBlockades([blockade, ...localBlockades.filter((b) => b.id !== id)]);

  try {
    await setDoc(doc(db, "blockades", id), {
      ...blockade,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    warnFirestoreFallback("Blockade save", error);
  }
  return id;
};

export const subscribeToBlockades = (callback: (blockades: Blockade[]) => void) => {
  const blockadesRef = collection(db, "blockades");
  let settled = false;
  let unsubscribe = () => {};

  const localBlockades = readLocalBlockades();
  callback(localBlockades.length ? localBlockades : mockBlockades);

  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Blockades list");
    callback(readLocalBlockades().length ? readLocalBlockades() : mockBlockades);
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    blockadesRef,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const blockades: Blockade[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        blockades.push({
          id: docSnap.id,
          name: data.name,
          type: data.type,
          location: data.location,
          radiusKm: data.radiusKm,
        });
      });
      const finalBlockades = blockades.length ? blockades : mockBlockades;
      writeLocalBlockades(finalBlockades);
      callback(finalBlockades);
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Blockades list", error);
      const fallback = readLocalBlockades().length ? readLocalBlockades() : mockBlockades;
      callback(fallback);
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const saveSafeRoute = async (routeInput: Omit<SafeRoute, "id"> & { id?: string }) => {
  const id = routeInput.id ?? `SR-${Date.now()}`;
  const route: SafeRoute = {
    id,
    name: routeInput.name.trim(),
    creatorName: routeInput.creatorName.trim(),
    path: routeInput.path,
    difficulty: routeInput.difficulty,
    vehicleRequirements: routeInput.vehicleRequirements.trim(),
    createdAt: routeInput.createdAt || new Date().toISOString(),
    startPoint: routeInput.startPoint || routeInput.path[0],
    endPoint: routeInput.endPoint || routeInput.path[routeInput.path.length - 1],
  };

  const localRoutes = readLocalSafeRoutes();
  writeLocalSafeRoutes([route, ...localRoutes.filter((r) => r.id !== id)]);

  try {
    await setDoc(doc(db, "safe_routes", id), {
      ...route,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    warnFirestoreFallback("Safe route save", error);
  }
  return id;
};

export const subscribeToSafeRoutes = (callback: (routes: SafeRoute[]) => void) => {
  const routesRef = collection(db, "safe_routes");
  let settled = false;
  let unsubscribe = () => {};

  const localRoutes = readLocalSafeRoutes();
  callback(localRoutes.length ? localRoutes : mockSafeRoutes);

  const fallbackTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    warnFirestoreFallback("Safe routes list");
    callback(readLocalSafeRoutes().length ? readLocalSafeRoutes() : mockSafeRoutes);
    unsubscribe();
  }, FIRESTORE_FALLBACK_MS);

  unsubscribe = onSnapshot(
    routesRef,
    (snapshot) => {
      settled = true;
      clearTimeout(fallbackTimer);
      const routes: SafeRoute[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        routes.push({
          id: docSnap.id,
          name: data.name,
          creatorName: data.creatorName,
          path: data.path,
          difficulty: data.difficulty,
          vehicleRequirements: data.vehicleRequirements,
          createdAt: data.createdAt,
          startPoint: data.startPoint,
          endPoint: data.endPoint,
        });
      });
      const finalRoutes = routes.length ? routes : mockSafeRoutes;
      writeLocalSafeRoutes(finalRoutes);
      callback(finalRoutes);
    },
    (error) => {
      settled = true;
      clearTimeout(fallbackTimer);
      warnFirestoreFallback("Safe routes list", error);
      const fallback = readLocalSafeRoutes().length ? readLocalSafeRoutes() : mockSafeRoutes;
      callback(fallback);
    }
  );

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribe();
  };
};

export const seedDatabase = async () => {
  // Seed blockades and safe routes
  try {
    for (const b of mockBlockades) {
      await setDoc(doc(db, "blockades", b.id), { ...b, updatedAt: serverTimestamp() });
    }
    for (const r of mockSafeRoutes) {
      await setDoc(doc(db, "safe_routes", r.id), { ...r, updatedAt: serverTimestamp() });
    }
  } catch (e) {
    console.error("Failed seeding blockades/safe_routes", e);
  }

  const incidentsRef = collection(db, "incidents");
  for (const incident of mockIncidents) {
    await setDoc(doc(incidentsRef, incident.id), {
      ...incident,
      requiredSkills: incident.requiredSkills,
      clientSessionId: incident.clientSessionId ?? "seeded-demo",
      createdByUid: incident.createdByUid ?? null,
      responderCounts: incident.responderCounts ?? { notified: 3, enRoute: incident.status === "accepted" ? 1 : 0 },
      acceptedBy: incident.acceptedBy ?? [],
      acceptedByNames: incident.acceptedByNames ?? [],
      timestamp: new Date(incident.timestamp),
      updatedAt: new Date(incident.timestamp),
    });
  }

  const responderDirectoryRef = collection(db, "responderDirectory");
  const legacyRespondersRef = collection(db, "responders");
  for (const responder of mockResponders) {
    const directoryProfile = {
      name: responder.name,
      publicPhone: responder.phone,
      skills: responder.skills,
      location: responder.location,
      available: responder.available,
      vehicleType: responder.vehicleType,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(responderDirectoryRef, responder.id), directoryProfile);
    await setDoc(doc(legacyRespondersRef, responder.id), directoryProfile);
  }

  const alertsRef = collection(db, "weatherAlerts");
  for (const alert of mockWeatherAlerts) {
    await setDoc(doc(alertsRef, alert.id), alert);
  }
};
