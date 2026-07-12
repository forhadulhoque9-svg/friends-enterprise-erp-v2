/**
 * Friends Enterprise ERP - Firebase Auth and Google Sign-In Utility
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Avoid initializing multiple times
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let googleUserEmail: string | null = null;
let googleUserName: string | null = null;

// Initialize listeners
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Access token might not be in-memory if page refreshed. 
      // We will need the user to click sign-in or we retrieve from memory.
      if (cachedAccessToken) {
        googleUserEmail = user.email;
        googleUserName = user.displayName;
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Since Firebase Auth onAuthStateChanged triggers on refresh, but doesn't give the raw OAuth provider access token,
        // we can flag that they are authenticated but need token, or wait for manual sign-in.
        // We can cache the email to show they were connected.
        googleUserEmail = user.email;
        googleUserName = user.displayName;
        if (!isSigningIn) {
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      googleUserEmail = null;
      googleUserName = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google.');
    }
    cachedAccessToken = credential.accessToken;
    googleUserEmail = result.user.email;
    googleUserName = result.user.displayName;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getGoogleUserInfo = () => {
  return {
    email: googleUserEmail,
    name: googleUserName,
  };
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  googleUserEmail = null;
  googleUserName = null;
};
