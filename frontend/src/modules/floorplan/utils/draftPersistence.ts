import { FloorPlan } from '../types';

const DB_NAME = 'FloorPlanDraftDB';
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current_draft';

interface DraftData {
  plan: FloorPlan;
  baseVersion: number | null;
  savedAt: string;
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(plan: FloorPlan, baseVersion: number | null = null): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: DraftData = {
      plan,
      baseVersion,
      savedAt: new Date().toISOString()
    };
    const request = store.put(data, DRAFT_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadDraft(): Promise<DraftData | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(DRAFT_KEY);
    request.onsuccess = () => {
      resolve(request.result ? (request.result as DraftData) : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearDraft(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(DRAFT_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function hasDraft(): Promise<boolean> {
  const draft = await loadDraft();
  return draft !== null;
}
