import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  sendEmailVerification,
  reload
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Sign up a new user with email and password
 */
export const signUp = (email: string, pass: string) => 
  createUserWithEmailAndPassword(auth, email, pass);

/**
 * Sign in an existing user with email and password
 */
export const signIn = (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

/**
 * Sign in with Google
 */
export const signInWithGoogle = () => 
  signInWithPopup(auth, googleProvider);

/**
 * Sign out the current user
 */
export const signOut = () => firebaseSignOut(auth);

/**
 * Auth state listener
 */
export const onAuthChange = (callback: (user: User | null) => void) => 
  onAuthStateChanged(auth, callback);

/**
 * Send email verification to a user
 */
export const sendVerificationEmail = (user: User) => 
  sendEmailVerification(user);

/**
 * Reload the user's data (useful for checking if emailVerified changed)
 */
export const reloadUser = (user: User) => 
  reload(user);
