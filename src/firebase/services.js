import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, where,
  serverTimestamp, increment
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db, storage } from './config';

// ── APPS ──────────────────────────────────────────────────

export async function getAllApps() {
  const q = query(
    collection(db, 'apps'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPublishedApps() {
  const q = query(
    collection(db, 'apps'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAppById(id) {
  const snap = await getDoc(doc(db, 'apps', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addApp(appData) {
  const docRef = await addDoc(collection(db, 'apps'), {
    ...appData,
    downloadCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateApp(id, updates) {
  await updateDoc(doc(db, 'apps', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApp(id) {
  // Delete app file from Storage if exists
  try {
    const appSnap = await getDoc(doc(db, 'apps', id));
    if (appSnap.exists()) {
      const data = appSnap.data();
      if (data.storagePath) {
        await deleteObject(ref(storage, data.storagePath));
      }
      if (data.iconPath) {
        await deleteObject(ref(storage, data.iconPath));
      }
      if (data.previewPaths?.length) {
        for (const path of data.previewPaths) {
          await deleteObject(ref(storage, path));
        }
      }
    }
  } catch (e) {
    console.warn('Storage delete error (may not exist):', e);
  }
  await deleteDoc(doc(db, 'apps', id));
}

export async function incrementDownload(id) {
  await updateDoc(doc(db, 'apps', id), {
    downloadCount: increment(1)
  });
}

// ── FILE UPLOAD WITH PROGRESS ──────────────────────────────

export function uploadFile(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on('state_changed',
      (snapshot) => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(pct);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
}

// ── COMMENTS ──────────────────────────────────────────────

export async function getComments(appId) {
  const q = query(
    collection(db, 'comments'),
    where('appId', '==', appId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addComment(appId, authorName, text) {
  await addDoc(collection(db, 'comments'), {
    appId,
    authorName,
    text,
    hidden: false,
    createdAt: serverTimestamp(),
  });
}

export async function hideComment(id, hidden) {
  await updateDoc(doc(db, 'comments', id), { hidden });
}

export async function deleteComment(id) {
  await deleteDoc(doc(db, 'comments', id));
}

// ── CONTACTS ──────────────────────────────────────────────

export async function addContact(name, contact, message) {
  await addDoc(collection(db, 'contacts'), {
    name, contact, message,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getAllContacts() {
  const q = query(
    collection(db, 'contacts'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markContactRead(id) {
  await updateDoc(doc(db, 'contacts', id), { read: true });
}

export async function deleteContact(id) {
  await deleteDoc(doc(db, 'contacts', id));
}

// ── SETTINGS ──────────────────────────────────────────────

export async function getSettings(key) {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data() : null;
}

export async function saveSettings(key, data) {
  await updateDoc(doc(db, 'settings', key), data).catch(() =>
    addDoc(collection(db, 'settings'), { ...data, _key: key })
  );
}
