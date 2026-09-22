import { storage } from "@core/lib/storage";

export const SYNC_COLLECTIONS = [
  "flashcards",
  "leetcode_problems",
  "articles",
  "snippets",
  "study_phases",
  "diagrams",
  "quiz_exams",
  "quiz_questions",
  "quiz_attempts",
  "study_roadmaps",
  "roadmap_nodes",
  "roadmap_links",
] as const;

export type SyncCollection = typeof SYNC_COLLECTIONS[number];
export type SyncRecord = { id: string; updatedAt?: string; createdAt?: string; [key: string]: unknown };

export interface SyncIdentity {
  deviceId: string;
  deviceName: string;
}

export interface SyncHostInfo {
  address: string;
  token: string;
  expires_at: number;
}

export interface SyncPackage {
  format: "dunots-sync";
  version: 1;
  exportedAt: string;
  source: SyncIdentity;
  collections: Record<SyncCollection, SyncRecord[]>;
}

export interface SyncPreview {
  added: number;
  updated: number;
  unchanged: number;
  conflicts: number;
  byCollection: Array<{ collection: SyncCollection; added: number; updated: number; unchanged: number; conflicts: number }>;
}

const DEVICE_ID_KEY = "dunots.device-id";
const DEVICE_NAME_KEY = "dunots.device-name";

function makeDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "device-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

export function makePairingToken() {
  return makeDeviceId();
}

export function getDeviceIdentity(): SyncIdentity {
  if (typeof window === "undefined") return { deviceId: "server", deviceName: "Dunots" };
  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = makeDeviceId();
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  const storedName = window.localStorage.getItem(DEVICE_NAME_KEY);
  return { deviceId, deviceName: storedName?.trim() || "Meu notebook" };
}

export function saveDeviceName(deviceName: string) {
  const cleaned = deviceName.trim().slice(0, 60) || "Meu notebook";
  window.localStorage.setItem(DEVICE_NAME_KEY, cleaned);
  return cleaned;
}

function emptyCollections(): Record<SyncCollection, SyncRecord[]> {
  return Object.fromEntries(SYNC_COLLECTIONS.map((collection) => [collection, []])) as unknown as Record<SyncCollection, SyncRecord[]>;
}

export async function createSyncPackage(source: SyncIdentity): Promise<SyncPackage> {
  const collections = emptyCollections();
  for (const collection of SYNC_COLLECTIONS) {
    collections[collection] = await storage.list<SyncRecord>(collection);
  }
  return {
    format: "dunots-sync",
    version: 1,
    exportedAt: new Date().toISOString(),
    source,
    collections,
  };
}

export function parseSyncPackage(value: unknown): SyncPackage {
  if (!value || typeof value !== "object") throw new Error("O arquivo não contém um pacote válido.");
  const raw = value as Partial<SyncPackage>;
  if (raw.format !== "dunots-sync" || raw.version !== 1 || !raw.collections || typeof raw.collections !== "object") {
    throw new Error("Este arquivo não é um pacote de sincronização do Dunots.");
  }
  const collections = emptyCollections();
  for (const collection of SYNC_COLLECTIONS) {
    const records = (raw.collections as Partial<Record<SyncCollection, unknown>>)[collection];
    if (records === undefined) continue;
    if (!Array.isArray(records)) throw new Error("A coleção " + collection + " está inválida.");
    collections[collection] = records.filter((record): record is SyncRecord => Boolean(record && typeof record === "object" && typeof (record as { id?: unknown }).id === "string"));
  }
  const source = raw.source && typeof raw.source === "object"
    ? raw.source as SyncIdentity
    : { deviceId: "unknown", deviceName: "Dispositivo desconhecido" };
  return {
    format: "dunots-sync",
    version: 1,
    exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
    source: { deviceId: String(source.deviceId || "unknown"), deviceName: String(source.deviceName || "Dispositivo desconhecido") },
    collections,
  };
}

function recordTime(record: SyncRecord) {
  return record.updatedAt ?? record.createdAt ?? "";
}

function sameRecord(left: SyncRecord, right: SyncRecord) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function previewSyncPackage(local: Record<SyncCollection, SyncRecord[]>, incoming: SyncPackage): SyncPreview {
  const byCollection = SYNC_COLLECTIONS.map((collection) => {
    const localById = new Map(local[collection].map((record) => [record.id, record]));
    let added = 0;
    let updated = 0;
    let unchanged = 0;
    let conflicts = 0;
    for (const record of incoming.collections[collection]) {
      const existing = localById.get(record.id);
      if (!existing) {
        added++;
        continue;
      }
      if (sameRecord(existing, record)) {
        unchanged++;
        continue;
      }
      const incomingTime = recordTime(record);
      const localTime = recordTime(existing);
      if (incomingTime && localTime && incomingTime > localTime) updated++;
      else conflicts++;
    }
    return { collection, added, updated, unchanged, conflicts };
  });
  return {
    added: byCollection.reduce((total, item) => total + item.added, 0),
    updated: byCollection.reduce((total, item) => total + item.updated, 0),
    unchanged: byCollection.reduce((total, item) => total + item.unchanged, 0),
    conflicts: byCollection.reduce((total, item) => total + item.conflicts, 0),
    byCollection,
  };
}

export async function readLocalSyncData() {
  const collections = emptyCollections();
  for (const collection of SYNC_COLLECTIONS) {
    collections[collection] = await storage.list<SyncRecord>(collection);
  }
  return collections;
}

export async function applySyncPackage(incoming: SyncPackage) {
  const local = await readLocalSyncData();
  const preview = previewSyncPackage(local, incoming);
  for (const collection of SYNC_COLLECTIONS) {
    const localById = new Map(local[collection].map((record) => [record.id, record]));
    for (const record of incoming.collections[collection]) {
      const existing = localById.get(record.id);
      const shouldApply = !existing || sameRecord(existing, record) || recordTime(record) > recordTime(existing);
      if (shouldApply) await storage.put(collection, record);
    }
  }
  return preview;
}

export function downloadSyncPackage(syncPackage: SyncPackage) {
  const blob = new Blob([JSON.stringify(syncPackage, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "dunots-sync-" + new Date().toISOString().slice(0, 10) + ".dunots";
  anchor.click();
  URL.revokeObjectURL(url);
}