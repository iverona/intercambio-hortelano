// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6K_OBpZILceY9MMQlQv4V82Q02katUG0",
  authDomain: "portal-intercambio-hortelano.firebaseapp.com",
  projectId: "portal-intercambio-hortelano",
  storageBucket: "portal-intercambio-hortelano.firebasestorage.app",
  messagingSenderId: "821327219227",
  appId: "1:821327219227:web:4b131074d1365a707246be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
