import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "preptalk-7eca3",
  appId: "1:193250537864:web:0608a48190c87c6e534a3d",
  apiKey: "AIzaSyAkh7Dpr1WDfVxKOUnCQORL3TEUnzV9QGw",
  authDomain: "preptalk-7eca3.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Attempting sign in with dummy credentials...");
    const cred = await signInWithEmailAndPassword(auth, "anshu1209ol@gmail.com", "password123");
    console.log("Logged in user:", cred.user.uid);
    
    console.log("Fetching user profile...");
    const docRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      console.log("Profile found:", snap.data());
    } else {
      console.log("Profile NOT found!");
    }
  } catch (error) {
    console.error("Firebase Error:");
    console.error(error.code);
    console.error(error.message);
  }
}
test();
