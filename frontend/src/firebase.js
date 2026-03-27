import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZT7E5raOEtBUp9xvZW3ecVlsqVCAic7k",
  authDomain: "sanjeevani-5.firebaseapp.com",
  projectId: "sanjeevani-5",
  storageBucket: "sanjeevani-5.firebasestorage.app",
  messagingSenderId: "791254489794",
  appId: "1:791254489794:web:7818f9ef16c7e7e484795b",
  measurementId: "G-3B3WP1VLV9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
