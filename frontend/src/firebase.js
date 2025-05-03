// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBahV0ZqL6_ngugvteAwOgs8S64GPmIaeA",
  authDomain: "purevote-cca49.firebaseapp.com",
  projectId: "purevote-cca49",
  storageBucket: "purevote-cca49.firebasestorage.app",
  messagingSenderId: "723825763130",
  appId: "1:723825763130:web:039687475da9421a276603",
  measurementId: "G-D9SJC1STWK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);