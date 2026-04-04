import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import 'dotenv/config';

async function run() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

  console.log(`Starting seed for project: ${projectId}, database: ${databaseId}`);

  let adminApp;
  try {
    adminApp = initializeApp({ projectId: projectId });
    console.log('Firebase Admin App initialized.');
  } catch (e) {
    console.error('Failed to initialize Firebase Admin App:', e);
    return;
  }

  const db = getFirestore(adminApp, databaseId);
  console.log('Firestore instance obtained.');


  try {
    const data = JSON.parse(fs.readFileSync('problems.json', 'utf8'));
    console.log(`Read ${data.length} problems from JSON.`);

    const collection = db.collection('problems');
    console.log('Database connection verified, starting batch process.');

    
    // Chunking into batches of 400
    for (let i = 0; i < data.length; i += 400) {
      const chunk = data.slice(i, i + 400);
      const batch = db.batch();
      
      chunk.forEach((item, index) => {
        const id = `prob_${i + index + 1}`; // Deterministic ID
        const ref = collection.doc(id);
        batch.set(ref, {
          ...item,
          id: id,
          createdAt: new Date().toISOString()
        });
      });

      console.log(`Committing batch ${i/400 + 1}...`);
      await batch.commit();
      console.log(`Batch ${i/400 + 1} done.`);
    }

    const finalSnapshot = await collection.count().get();
    console.log(`✅ Success! Total problems in DB: ${finalSnapshot.data().count}`);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  }
}

run();
