// src/firebaseConfig.js
//
// 1) Ve a https://console.firebase.google.com → crea un proyecto (gratis).
// 2) Dentro del proyecto: "Compilación" → "Firestore Database" → "Crear base de datos"
//    (elige modo de producción; luego ajusta las reglas como se indica en README.md).
// 3) Ve a "Configuración del proyecto" (ícono de engranaje) → "Tus apps" → agrega una
//    app Web (</>) → copia el objeto firebaseConfig que te muestra Firebase.
// 4) Pega esos valores abajo, o mejor: crea un archivo ".env" en la raíz del proyecto
//    (mira ".env.example") para no dejar las llaves escritas directamente en el código.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// La app funciona en "modo local" (guardando solo en este navegador) hasta que
// completes estas variables. En cuanto configures Firebase, se conecta solo.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = isFirebaseConfigured ? getFirestore(app) : null;
