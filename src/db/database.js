import { openDB } from 'idb';

export async function getAuthDB() {
  return openDB('mrjkmart-auth', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('adminAuth')) {
        db.createObjectStore('adminAuth');
      }
    },
  });
}

export async function saveAdminKey(salt, hash) {
  const db = await getAuthDB();
  await db.put('adminAuth', { salt, hash }, 'key');
}

export async function getAdminKey() {
  const db = await getAuthDB();
  return db.get('adminAuth', 'key');
}

export async function hasAdminKey() {
  const key = await getAdminKey();
  return !!key;
}
