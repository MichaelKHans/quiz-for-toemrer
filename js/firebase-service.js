import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8WoEWReTrIMLwx3tqWCsbQHEstZL_SZA",
  authDomain: "toemrer-quiz.firebaseapp.com",
  databaseURL: "https://toemrer-quiz-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "toemrer-quiz",
  storageBucket: "toemrer-quiz.firebasestorage.app",
  messagingSenderId: "886942173921",
  appId: "1:886942173921:web:72da46b1b140bfa72bc5a0",
  measurementId: "G-VR5WV0R9SC"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * Gemmer hele databasen i skyen
 */
export async function saveDbToCloud(data) {
    try {
        await set(ref(db, 'quiz_database'), data);
        console.log("Cloud: Data gemt i Firebase!");
        return true;
    } catch (error) {
        console.error("Cloud Error: Kunne ikke gemme!", error);
        return false;
    }
}

/**
 * Henter hele databasen fra skyen
 */
export async function getDbFromCloud() {
    try {
        const snapshot = await get(ref(db, 'quiz_database'));
        if (snapshot.exists()) {
            console.log("Cloud: Data hentet fra Firebase!");
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Cloud Error: Kunne ikke hente data!", error);
        return null;
    }
}

/**
 * Opretter en ny live-session i skyen
 */
export async function createLiveSession(pin, data) {
    try {
        await set(ref(db, 'live_sessions/' + pin), data);
        console.log("Live: Session oprettet med PIN " + pin);
        return true;
    } catch (error) {
        console.error("Live Error: Kunne ikke oprette session!", error);
        return false;
    }
}

window.getDbFromCloud = getDbFromCloud;
window.createLiveSession = createLiveSession;
