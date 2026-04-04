import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

const adminApp = initializeApp({ projectId: projectId });
const db = getFirestore(adminApp, databaseId);

async function check() {
  try {
    const snapshot = await db.collection('problems').limit(5).get();
    console.log(`Found ${snapshot.size} problems in '${databaseId}'`);
    snapshot.forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data().title}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('❌ Check Failed:', err.message);
    process.exit(1);
  }
}

check();
