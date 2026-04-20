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
  if (!id) throw new Error('No app ID provided');
  try {
    // Try to delete Cloudinary assets if paths exist
    const snap = await getDoc(doc(db, 'apps', id));
    if (snap.exists()) {
      // Note: Cloudinary deletion needs API secret
      // which can't be exposed in frontend.
      // Just delete Firestore doc — Cloudinary files
      // will remain but that's acceptable for free tier.
      console.log('Deleting app:', snap.data().name);
    }
  } catch (e) {
    console.warn('Pre-delete check failed:', e);
  }
  // Delete the Firestore document
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
  try {
    // Try with orderBy first (needs index)
    const q = query(
      collection(db, 'comments'),
      where('appId', '==', appId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    if (err.code === 'failed-precondition') {
      // Index not created yet — fallback without orderBy
      console.warn('Index missing, using fallback query');
      const q2 = query(
        collection(db, 'comments'),
        where('appId', '==', appId)
      );
      const snap2 = await getDocs(q2);
      return snap2.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });
    }
    throw err;
  }
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
