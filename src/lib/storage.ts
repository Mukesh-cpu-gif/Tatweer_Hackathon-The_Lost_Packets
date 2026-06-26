import type { Coordinates } from "./geo";

const DB_NAME = "aounak-offline";
const DB_VERSION = 1;
const SOS_STORE = "sosRequests";
const SYNC_ENDPOINT = "/api/sos/sync";

export type QueuedSosStatus = "queued" | "syncing" | "synced" | "failed";

export interface QueuedSosRequest {
  id: string;
  emergencyType: string;
  coords: Coordinates;
  extraInfo?: string;
  phone: string;
  smsBody: string;
  createdAt: string;
  updatedAt: string;
  status: QueuedSosStatus;
  attempts: number;
  lastError?: string;
}

type SosRequestInput = Omit<
  QueuedSosRequest,
  "id" | "createdAt" | "updatedAt" | "status" | "attempts"
>;

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openDb(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SOS_STORE)) {
        const store = db.createObjectStore(SOS_STORE, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(SOS_STORE, mode);
        const request = callback(transaction.objectStore(SOS_STORE));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      })
  );
}

export async function queueSosRequest(input: SosRequestInput) {
  const now = new Date().toISOString();
  const request: QueuedSosRequest = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: "queued",
    attempts: 0,
  };

  await withStore("readwrite", (store) => store.add(request));
  return request;
}

export async function getQueuedSosRequests() {
  return withStore<QueuedSosRequest[]>("readonly", (store) => store.getAll());
}

async function updateSosRequest(request: QueuedSosRequest) {
  return withStore("readwrite", (store) =>
    store.put({
      ...request,
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function syncQueuedSosRequests() {
  if (!isBrowser() || !navigator.onLine) return [];

  const requests = await getQueuedSosRequests();
  const pending = requests.filter((request) => request.status !== "synced");
  const synced: QueuedSosRequest[] = [];

  for (const request of pending) {
    const syncingRequest: QueuedSosRequest = {
      ...request,
      status: "syncing",
      attempts: request.attempts + 1,
      lastError: undefined,
    };

    await updateSosRequest(syncingRequest);

    try {
      const response = await fetch(SYNC_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncingRequest),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Sync failed with ${response.status}`);
      }

      const syncedRequest: QueuedSosRequest = {
        ...syncingRequest,
        status: "synced",
      };
      await updateSosRequest(syncedRequest);
      synced.push(syncedRequest);
    } catch (error) {
      await updateSosRequest({
        ...syncingRequest,
        status: "failed",
        lastError: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }

  return synced;
}

export function registerSosSync() {
  if (!isBrowser()) return () => {};

  const sync = () => {
    void syncQueuedSosRequests();
  };

  window.addEventListener("online", sync);
  sync();

  return () => window.removeEventListener("online", sync);
}
