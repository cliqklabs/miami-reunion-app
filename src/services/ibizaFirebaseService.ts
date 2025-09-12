// Firebase service for Ibiza Mockery App
// Handles user sessions and image storage for gallery functionality

import { db, storage, auth } from '../config/ibiza-firebase';
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export interface UserSession {
  id: string;
  name: string;
  timestamp: Date;
  imagesGenerated: number;
  gender: 'male' | 'female';
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
  gender: 'male' | 'female';
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
export const createUserSession = async (userName: string, gender: 'male' | 'female'): Promise<UserSession | null> => {
  if (!db) return null;

  try {
    const userId = await initializeAuth();
    if (!userId) return null;

    const sessionData = {
      name: userName,
      gender: gender,
      timestamp: Timestamp.now(),
      imagesGenerated: 0,
    };

    const docRef = await addDoc(collection(db, 'ibiza-users'), sessionData);

    return {
      id: docRef.id,
      name: userName,
      gender: gender,
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
  generatedImageDataUrl: string,
  gender: 'male' | 'female'
): Promise<GeneratedImage | null> => {
  if (!db || !storage) return null;

  try {
    // Upload original image to storage
    const originalImageRef = ref(storage, `ibiza-originals/${userId}/${Date.now()}-original.jpg`);
    const originalResponse = await fetch(originalImageDataUrl);
    const originalBlob = await originalResponse.blob();
    await uploadBytes(originalImageRef, originalBlob);
    const originalImageUrl = await getDownloadURL(originalImageRef);

    // Upload generated image to storage
    const generatedImageRef = ref(storage, `ibiza-generated/${userId}/${styleId}-${Date.now()}.jpg`);
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
      gender,
      timestamp: Timestamp.now(),
      inGallery: false,
    };

    const docRef = await addDoc(collection(db, 'ibiza-images'), imageData);

    // Update user's image count
    const userQuery = query(collection(db, 'ibiza-users'), where('name', '==', userName));
    const userDocs = await getDocs(userQuery);
    if (!userDocs.empty) {
      const userDoc = userDocs.docs[0];
      await updateDoc(doc(db, 'ibiza-users', userDoc.id), {
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
      gender,
      timestamp: new Date(),
      inGallery: false,
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
      collection(db, 'ibiza-images'),
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

// Update gallery status for an image
export const updateImageGalleryStatus = async (
  userId: string,
  styleId: string,
  inGallery: boolean
): Promise<boolean> => {
  if (!db) return false;

  try {
    const q = query(
      collection(db, 'ibiza-images'),
      where('userId', '==', userId),
      where('styleId', '==', styleId)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('No image found for userId:', userId, 'styleId:', styleId);
      return false;
    }

    const imageDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'ibiza-images', imageDoc.id), {
      inGallery: inGallery,
      updatedAt: Timestamp.now()
    });

    console.log('Updated gallery status for image:', imageDoc.id, 'inGallery:', inGallery);
    return true;
  } catch (error) {
    console.error('Failed to update image gallery status:', error);
    return false;
  }
};

// Get all gallery images from all users
export const getAllGalleryImages = async (): Promise<GeneratedImage[]> => {
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'ibiza-images'),
      where('inGallery', '==', true),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as GeneratedImage[];
  } catch (error) {
    console.error('Failed to fetch all gallery images:', error);
    return [];
  }
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(db && storage && auth);
};
