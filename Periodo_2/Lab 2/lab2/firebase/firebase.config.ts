// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChbUmAd-ZK1wG5RJ6dvYQMX5C1x2xo1Js",
  authDomain: "tc3005b-tec.firebaseapp.com",
  projectId: "tc3005b-tec",
  storageBucket: "tc3005b-tec.firebasestorage.app",
  messagingSenderId: "961724233567",
  appId: "1:961724233567:web:e37052129c2bcd2d2528ea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };