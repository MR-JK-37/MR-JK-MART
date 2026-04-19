import { openDB } from 'idb';

const DB_NAME = 'mrjkmart';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Apps store
        if (!db.objectStoreNames.contains('apps')) {
          const appStore = db.createObjectStore('apps', { keyPath: 'id', autoIncrement: true });
          appStore.createIndex('name', 'name');
          appStore.createIndex('category', 'category');
          appStore.createIndex('createdAt', 'createdAt');
        }

        // Comments store
        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
          commentStore.createIndex('appId', 'appId');
          commentStore.createIndex('createdAt', 'createdAt');
        }

        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
          contactStore.createIndex('createdAt', 'createdAt');
        }

        // Admin auth store
        if (!db.objectStoreNames.contains('adminAuth')) {
          db.createObjectStore('adminAuth', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ═══════════════════════════════════════════
// APPS CRUD
// ═══════════════════════════════════════════

export async function getAllApps() {
  const db = await getDB();
  const apps = await db.getAll('apps');
  return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getApp(id) {
  const db = await getDB();
  return db.get('apps', Number(id));
}

export async function addApp(app) {
  const db = await getDB();
  const now = new Date().toISOString();
  const newApp = {
    ...app,
    downloadCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const id = await db.add('apps', newApp);
  return { ...newApp, id };
}

export async function updateApp(id, data) {
  const db = await getDB();
  const existing = await db.get('apps', Number(id));
  if (!existing) throw new Error('App not found');
  const updated = {
    ...existing,
    ...data,
    id: Number(id),
    updatedAt: new Date().toISOString(),
  };
  await db.put('apps', updated);
  return updated;
}

export async function deleteApp(id) {
  const db = await getDB();
  await db.delete('apps', Number(id));
  // Also delete associated comments
  const comments = await getCommentsByApp(Number(id));
  const tx = db.transaction('comments', 'readwrite');
  for (const c of comments) {
    await tx.store.delete(c.id);
  }
  await tx.done;
}

export async function incrementDownloadCount(id) {
  const db = await getDB();
  const app = await db.get('apps', Number(id));
  if (app) {
    app.downloadCount = (app.downloadCount || 0) + 1;
    await db.put('apps', app);
    return app.downloadCount;
  }
  return 0;
}

// ═══════════════════════════════════════════
// COMMENTS CRUD
// ═══════════════════════════════════════════

export async function getCommentsByApp(appId) {
  const db = await getDB();
  const index = db.transaction('comments').store.index('appId');
  const comments = await index.getAll(Number(appId));
  return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addComment(comment) {
  const db = await getDB();
  const newComment = {
    ...comment,
    appId: Number(comment.appId),
    createdAt: new Date().toISOString(),
    hidden: false,
  };
  const id = await db.add('comments', newComment);
  return { ...newComment, id };
}

export async function updateComment(id, data) {
  const db = await getDB();
  const existing = await db.get('comments', Number(id));
  if (!existing) return;
  const updated = { ...existing, ...data };
  await db.put('comments', updated);
  return updated;
}

export async function deleteComment(id) {
  const db = await getDB();
  await db.delete('comments', Number(id));
}

export async function getAllCommentsCount() {
  const db = await getDB();
  const all = await db.getAll('comments');
  return all.length;
}

// ═══════════════════════════════════════════
// CONTACTS CRUD
// ═══════════════════════════════════════════

export async function getAllContacts() {
  const db = await getDB();
  const contacts = await db.getAll('contacts');
  return contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addContact(contact) {
  const db = await getDB();
  const newContact = {
    ...contact,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const id = await db.add('contacts', newContact);
  return { ...newContact, id };
}

export async function deleteContact(id) {
  const db = await getDB();
  await db.delete('contacts', Number(id));
}

export async function markContactRead(id) {
  const db = await getDB();
  const contact = await db.get('contacts', Number(id));
  if (contact) {
    contact.read = true;
    await db.put('contacts', contact);
  }
}

export async function getUnreadContactCount() {
  const db = await getDB();
  const all = await db.getAll('contacts');
  return all.filter(c => !c.read).length;
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

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════

export async function getSetting(key) {
  const db = await getDB();
  const result = await db.get('settings', key);
  return result?.value;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}
