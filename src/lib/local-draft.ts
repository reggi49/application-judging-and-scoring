import Dexie, { type Table } from "dexie";

export type LocalDraft = {
  key: string; // `${scope}:${kodeKarya}`
  uuid: string;
  values: Record<string, string>; // kode kriteria → teks input
  catatan: string;
  clientUpdatedAt: number;
  dirty: boolean; // true = belum terkonfirmasi tersimpan di server
  nama?: string;
  whatsapp?: string;
  deskripsi?: string;
  showDeskripsi?: boolean;
};

class RwsaLocalDb extends Dexie {
  drafts!: Table<LocalDraft, string>;
  constructor() {
    super("rwsa-local");
    this.version(1).stores({ drafts: "key" });
  }
}

let instance: RwsaLocalDb | null = null;
const memory = new Map<string, LocalDraft>(); // cadangan bila IndexedDB tidak tersedia (mis. mode privat)
let idbBroken = false;

function getDb() {
  if (idbBroken || typeof indexedDB === "undefined") return null;
  instance ??= new RwsaLocalDb();
  return instance;
}

export async function loadDraft(key: string): Promise<LocalDraft | undefined> {
  const db = getDb();
  if (db) {
    try {
      return await db.drafts.get(key);
    } catch {
      idbBroken = true;
    }
  }
  return memory.get(key);
}

export async function saveDraft(d: LocalDraft): Promise<void> {
  memory.set(d.key, d);
  const db = getDb();
  if (!db) return;
  try {
    await db.drafts.put(d);
  } catch {
    idbBroken = true;
  }
}

export async function removeDraft(key: string): Promise<void> {
  memory.delete(key);
  const db = getDb();
  if (!db) return;
  try {
    await db.drafts.delete(key);
  } catch {
    idbBroken = true;
  }
}

