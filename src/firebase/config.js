import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            "AIzaSyCOk0XqbjdH7hOm2r3a_B_ngBYxxtxmC7o",
  authDomain:        "mrjk-mart.firebaseapp.com",
  projectId:         "mrjk-mart",
  storageBucket:     "mrjk-mart.firebasestorage.app",
  messagingSenderId: "932659417217",
  appId:             "1:932659417217:web:b42079c18ad4a13082fd80",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
