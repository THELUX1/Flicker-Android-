// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ¡Pegá acá tu configuración real!
const firebaseConfig = {
  apiKey: "AIzaSyC1KyUO1eBzPDO4QzBqMQzLu3Lh-uZnXn4",
  authDomain: "cumple-2731c.firebaseapp.com",
  databaseURL: "https://cumple-2731c-default-rtdb.firebaseio.com",
  projectId: "cumple-2731c",
  storageBucket: "cumple-2731c.firebasestorage.app",
  messagingSenderId: "265528475513",
  appId: "1:265528475513:web:e4c0894c712bb0fc0039a8",
  measurementId: "G-Q6V5NG8YNT"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);