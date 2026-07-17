import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Importación necesaria
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAw4Ku7IkzgiBJCSyfq58d0oAPU0x0Su18",
  authDomain: "smartcheck-e4576.firebaseapp.com",
  databaseURL: "https://smartcheck-e4576-default-rtdb.firebaseio.com",
  projectId: "smartcheck-e4576",
  storageBucket: "smartcheck-e4576.firebasestorage.app",
  messagingSenderId: "560008620986",
  appId: "1:560008620986:web:d778d583d646abf8dc0b83",
  measurementId: "G-8LQLPE128R"
};

// Inicializamos la app
const app = initializeApp(firebaseConfig);

// Inicializamos Auth con persistencia
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Inicializamos Firestore
const db = getFirestore(app); // <-- Inicialización necesaria

// Exportamos tanto auth como db
export { auth, db };