import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc,
  query, orderBy, where,
  serverTimestamp, increment
} from 'firebase/firestore';
import { db } from './config';

// ── APPS ─────────────────────────────────────────────────

export async function getPublishedApps() {
  const snap = await getDocs(
    query(
      collection(db, 'apps'),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllApps() {
  const snap = await getDocs(
    query(collection(db, 'apps'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAppById(id) {
  const snap = await getDoc(doc(db, 'apps', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createApp(data) {
  const docRef = await addDoc(collection(db, 'apps'), {
    ...data,
    downloadCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateApp(id, data) {
  await updateDoc(doc(db, 'apps', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApp(id) {
  // Cloudinary deletion handled separately or skipped for now
  await deleteDoc(doc(db, 'apps', id));
}

export async function incrementDownload(id) {
  await updateDoc(doc(db, 'apps', id), {
    downloadCount: increment(1),
  });
}

export async function toggleLike(id, isLiking) {
  await updateDoc(doc(db, 'apps', id), {
    likeCount: increment(isLiking ? 1 : -1),
  });
}

// ── COMMENTS ─────────────────────────────────────────────

export async function getComments(appId) {
  const snap = await getDocs(
    query(
      collection(db, 'comments'),
      where('appId', '==', appId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function postComment(appId, authorName, text) {
  await addDoc(collection(db, 'comments'), {
    appId, authorName, text,
    hidden: false,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'apps', appId), {
    commentCount: increment(1),
  });
}

export async function setCommentHidden(id, hidden) {
  await updateDoc(doc(db, 'comments', id), { hidden });
}

export async function deleteComment(id) {
  await deleteDoc(doc(db, 'comments', id));
}

// ── CONTACTS ─────────────────────────────────────────────

export async function submitContact(name, contact, message) {
  await addDoc(collection(db, 'contacts'), {
    name, contact, message,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getAllContacts() {
  const snap = await getDocs(
    query(collection(db, 'contacts'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markContactRead(id) {
  await updateDoc(doc(db, 'contacts', id), { read: true });
}

export async function deleteContact(id) {
  await deleteDoc(doc(db, 'contacts', id));
}

// ── SETTINGS ─────────────────────────────────────────────

export async function getSettings(key) {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data() : null;
}

export async function saveSettings(key, values) {
  await setDoc(doc(db, 'settings', key), values, { merge: true });
}
