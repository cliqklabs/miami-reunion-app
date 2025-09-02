// Firebase service for Miami Reunion App
// Handles user sessions and image storage for gallery functionality

import { db, storage, auth } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export interface UserSession {
  id: string;
  name: string;
  timestamp: Date;
  imagesGenerated: number;
}

export interface GeneratedImage {
  id: string;
  userId: string;
  userName: string;
  styleId: string;
  styleName: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  timestamp: Date;
  inGallery: boolean;
}

// Initialize anonymous authentication
export const initializeAuth = async (): Promise<string | null> => {
  if (!auth) return null;

  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  } catch (error) {
    console.error('Anonymous authentication failed:', error);
    return null;
  }
};

// Create or update user session
export const createUserSession = async (userName: string): Promise<UserSession | null> => {
  if (!db) return null;

  try {
    const userId = await initializeAuth();
    if (!userId) return null;

    const sessionData = {
      name: userName,
      timestamp: Timestamp.now(),
      imagesGenerated: 0,
    };

    const docRef = await addDoc(collection(db, 'users'), sessionData);

    return {
      id: docRef.id,
      name: userName,
      timestamp: new Date(),
      imagesGenerated: 0,
    };
  } catch (error) {
    console.error('Failed to create user session:', error);
    return null;
  }
};

// Save generated image to Firebase
export const saveGeneratedImage = async (
  userId: string,
  userName: string,
  styleId: string,
  styleName: string,
  originalImageDataUrl: string,
  generatedImageDataUrl: string
): Promise<GeneratedImage | null> => {
  if (!db || !storage) return null;

  try {
    // Upload original image to storage
    const originalImageRef = ref(storage, `originals/${userId}/${Date.now()}-original.jpg`);
    const originalResponse = await fetch(originalImageDataUrl);
    const originalBlob = await originalResponse.blob();
    await uploadBytes(originalImageRef, originalBlob);
    const originalImageUrl = await getDownloadURL(originalImageRef);

    // Upload generated image to storage
    const generatedImageRef = ref(storage, `generated/${userId}/${styleId}-${Date.now()}.jpg`);
    const generatedResponse = await fetch(generatedImageDataUrl);
    const generatedBlob = await generatedResponse.blob();
    await uploadBytes(generatedImageRef, generatedBlob);
    const generatedImageUrl = await getDownloadURL(generatedImageRef);

    // Save metadata to Firestore
    const imageData = {
      userId,
      userName,
      styleId,
      styleName,
      originalImageUrl,
      generatedImageUrl,
      timestamp: Timestamp.now(),
      inGallery: true,
    };

    const docRef = await addDoc(collection(db, 'images'), imageData);

    // Update user's image count
    const userQuery = query(collection(db, 'users'), where('name', '==', userName));
    const userDocs = await getDocs(userQuery);
    if (!userDocs.empty) {
      const userDoc = userDocs.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        imagesGenerated: userDoc.data().imagesGenerated + 1,
      });
    }

    return {
      id: docRef.id,
      userId,
      userName,
      styleId,
      styleName,
      originalImageUrl,
      generatedImageUrl,
      timestamp: new Date(),
      inGallery: true,
    };
  } catch (error) {
    console.error('Failed to save generated image:', error);
    return null;
  }
};

// Get user's gallery images
export const getUserGallery = async (userName: string): Promise<GeneratedImage[]> => {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'images'),
      where('userName', '==', userName),
      where('inGallery', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as GeneratedImage[];
  } catch (error) {
    console.error('Failed to fetch user gallery:', error);
    return [];
  }
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(db && storage && auth);
};
