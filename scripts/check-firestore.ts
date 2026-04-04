import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkCount() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
  
  const adminApp = initializeApp({ projectId: projectId });
  const db = getFirestore(adminApp, databaseId);
  
  const snapshot = await db.collection('problems').count().get();
  console.log(`Total problems in Firestore: ${snapshot.data().count}`);
  process.exit(0);
}

checkCount();
