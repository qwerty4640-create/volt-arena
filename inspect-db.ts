import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspect() {
  console.log("Fetching workouts for user XkISu8M0QTbzpMHSb4g7YXpOPLv2...");
  const workoutsSnap = await getDocs(collection(db, 'users/XkISu8M0QTbzpMHSb4g7YXpOPLv2/workouts'));
  console.log(`Found ${workoutsSnap.size} workouts in Firestore.`);
  
  for (const doc of workoutsSnap.docs) {
    const data = doc.data();
    console.log(`Workout ID: ${doc.id}, Name: ${data.title}`);
    if (data.exercises) {
      for (const ex of data.exercises) {
        if ('gifUrl' in ex) {
          console.log(`  - Exercise: ${ex.name}, gifUrl: ${ex.gifUrl}`);
        } else {
          console.log(`  - Exercise: ${ex.name} has no gifUrl property`);
        }
      }
    }
  }
}

inspect().catch(err => {
  console.error("Inspection error:", err);
});
