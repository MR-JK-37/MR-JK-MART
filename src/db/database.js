import { openDB } from 'idb';

const DB_NAME = 'mrjkmart_admin';
const DB_VERSION = 2; // Upgraded version to separate cleanly

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('adminAuth')) {
          db.createObjectStore('adminAuth', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ═══════════════════════════════════════════
// ADMIN AUTH
// ═══════════════════════════════════════════

export async function getAdminAuth() {
  const db = await getDB();
  return db.get('adminAuth', 'key');
}

export async function setAdminAuth(authData) {
  const db = await getDB();
  await db.put('adminAuth', { id: 'key', ...authData });
}
