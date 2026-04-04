import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import 'dotenv/config';

// 1. Initialize Firebase Admin
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('❌ ERROR: VITE_FIREBASE_PROJECT_ID not found in .env');
  process.exit(1);
}

const adminApp = initializeApp({
  projectId: projectId
});

const db = getFirestore(adminApp, process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);

async function seed() {
  try {
    const data = JSON.parse(fs.readFileSync('problems.json', 'utf8'));
    console.log(`🚀 Forging ${data.length} challenges into Firestore...`);

    let count = 0;
    let batch = db.batch();

    for (const item of data) {
      const problemRef = db.collection('problems').doc();
      
      const seededProblem = {
        title: item.title,
        difficulty: item.difficulty,
        tags: item.tags || [],
        description: item.description,
        inputFormat: item.input_format,
        outputFormat: item.output_format,
        constraints: item.constraints,
        sampleInput: item.sample_input,
        sampleOutput: item.sample_output,
        testCases: item.test_cases.map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.output
        })),
        solutionCode: item.solution_code || {},
        createdAt: new Date().toISOString(),
        authorId: 'system_forge'
      };

      batch.set(problemRef, seededProblem);
      count++;

      // Firestore Batch limit is 500
      if (count % 400 === 0) {
        console.log(`♻️  Committing checkpoint batch (${count}/${data.length})...`);
        await batch.commit();
        console.log(`✅ Batch of 400 committed successfully.`);
        batch = db.batch(); // Start fresh batch
      }
    }

    if (count % 400 !== 0) {
      await batch.commit();
      console.log(`✅ Final batch of ${count % 400} committed successfully.`);
    }
    
    console.log(`✅ DATABASE IGNITION SUCCESSFUL. ${count} Problems live.`);
  } catch (err) {
    console.error('❌ CRITICAL SEED FAILURE:', err);
  } finally {
    process.exit(0);
  }
}

seed();
