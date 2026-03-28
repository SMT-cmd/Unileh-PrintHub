import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = { 
  apiKey: "AIzaSyBjvZiWW-7hnPOxz71zBI41qMOsb4AczBA", 
  authDomain: "unilesh-4285c.firebaseapp.com", 
  projectId: "unilesh-4285c", 
  storageBucket: "unilesh-4285c.firebasestorage.app", 
  messagingSenderId: "260573469597", 
  appId: "1:260573469597:web:aac7b0b0d4e03d8d142d74", 
  measurementId: "G-1M50LQLHY0" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Optional Analytics (may fail in some environments)
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics could not be initialized:", e);
}

/**
 * Generates a short, human-readable order ID.
 */
function generateShortId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous O, 0, I, 1
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UPH-${result}`;
}

/**
 * Saves a print order to Firestore.
 */
async function saveOrder(orderData) {
  try {
    const shortId = generateShortId();
    const orderWithId = {
      ...orderData,
      orderNumber: shortId,
      status: 'Pending',
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, "orders"), orderWithId);
    return docRef.id;
  } catch (error) {
    console.error("Error saving order: ", error);
    throw error;
  }
}

/**
 * Fetches a single order from Firestore by ID.
 */
async function getOrder(orderId) {
  try {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error fetching order: ", error);
    throw error;
  }
}

/**
 * Saves a student portal assistance request to Firestore.
 */
async function savePortalRequest(requestData) {
  try {
    const docRef = await addDoc(collection(db, "portalRequests"), requestData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving portal request: ", error);
    throw error;
  }
}

/**
 * Saves an advert inquiry to Firestore.
 */
async function saveAdvertRequest(advertData) {
  try {
    const docRef = await addDoc(collection(db, "advertRequests"), {
      ...advertData,
      status: 'Pending',
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving advert request: ", error);
    throw error;
  }
}

async function saveFeedbackSuggestion(feedbackData) {
  try {
    const docRef = await addDoc(collection(db, "feedbackSuggestions"), {
      ...feedbackData,
      status: 'Pending',
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving feedback suggestion: ", error);
    throw error;
  }
}

/**
 * Real-time listener for active adverts.
 */
function listenToActiveAdverts(placement, callback) {
  const now = new Date().toISOString();
  const q = query(
    collection(db, "adverts"),
    where("startDate", "<=", now),
    where("endDate", ">=", now)
  );
  
  return onSnapshot(q, (snapshot) => {
    const ads = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.placement === placement || data.placement === 'Both') {
        ads.push({ id: doc.id, ...data });
      }
    });
    callback(ads);
  });
}

/**
 * Real-time listener for announcements.
 */
function listenToAnnouncements(callback) {
  const now = new Date().toISOString();
  const q = query(
    collection(db, "announcements"),
    where("expiryDate", ">=", now),
    orderBy("expiryDate", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}

/**
 * Real-time listener for partners.
 */
function listenToPartners(callback) {
  const q = query(collection(db, "partners"), orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}

// Export to window
window.db = db;
window.auth = auth;
window.saveOrder = saveOrder;
window.getOrder = getOrder;
window.savePortalRequest = savePortalRequest;
window.saveAdvertRequest = saveAdvertRequest;
window.saveFeedbackSuggestion = saveFeedbackSuggestion;
window.listenToActiveAdverts = listenToActiveAdverts;
window.listenToAnnouncements = listenToAnnouncements;
window.listenToPartners = listenToPartners;

// Export Firebase methods for other scripts
window.firebaseMethods = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp
};
