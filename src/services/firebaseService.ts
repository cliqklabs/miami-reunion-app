// Firebase service for Miami Reunion App
// Handles user sessions and image storage for gallery functionality

import { db, storage, auth } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, Timestamp, orderBy, setDoc } from 'firebase/firestore';
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
      inGallery: false, // Fixed: Only hearts should add to gallery
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

// Update gallery status for an image
export const updateImageGalleryStatus = async (
  userId: string,
  styleId: string,
  inGallery: boolean
): Promise<boolean> => {
  if (!db) return false;

  try {
    // Find the image by userId and styleId
    const q = query(
      collection(db, 'images'),
      where('userId', '==', userId),
      where('styleId', '==', styleId)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('No image found for userId:', userId, 'styleId:', styleId);
      return false;
    }

    // Update the first matching image (there should only be one)
    const imageDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'images', imageDoc.id), {
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
    // Ensure user is authenticated before accessing Firestore
    if (!auth.currentUser) {
      await initializeAuth();
    }

    const q = query(
      collection(db, 'images'),
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

// Emoji Reactions Functions

export interface EmojiReaction {
  emoji: string;
  count: number;
  users: string[];
}

// Save emoji reaction to Firebase
export const saveEmojiReaction = async (
  imageId: string,
  emoji: string,
  userNickname: string,
  isAdding: boolean
): Promise<boolean> => {
  if (!db) return false;

  try {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      await initializeAuth();
    }

    const reactionDocRef = doc(db, 'reactions', `${imageId}-${emoji}`);
    const reactionDoc = await getDoc(reactionDocRef);

    if (reactionDoc.exists()) {
      const data = reactionDoc.data();
      const users = data.users || [];
      
      let updatedUsers: string[];
      if (isAdding) {
        // Add user if not already in the list
        updatedUsers = users.includes(userNickname) ? users : [...users, userNickname];
      } else {
        // Remove user from the list
        updatedUsers = users.filter((user: string) => user !== userNickname);
      }

      if (updatedUsers.length === 0) {
        // Delete the document if no users left
        await updateDoc(reactionDocRef, {
          count: 0,
          users: [],
          updatedAt: Timestamp.now()
        });
      } else {
        // Update with new user list
        await updateDoc(reactionDocRef, {
          count: updatedUsers.length,
          users: updatedUsers,
          updatedAt: Timestamp.now()
        });
      }
    } else if (isAdding) {
      // Create new reaction document - using setDoc to use the specific ID
      const reactionData = {
        imageId,
        emoji,
        count: 1,
        users: [userNickname],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(reactionDocRef, reactionData);
    }

    return true;
  } catch (error) {
    console.error('Failed to save emoji reaction:', error);
    return false;
  }
};

// Get emoji reactions for an image
export const getEmojiReactions = async (imageId: string): Promise<Record<string, EmojiReaction>> => {
  if (!db) return {};

  try {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      await initializeAuth();
    }

    const q = query(
      collection(db, 'reactions'),
      where('imageId', '==', imageId)
    );

    const querySnapshot = await getDocs(q);
    const reactions: Record<string, EmojiReaction> = {};

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.count > 0) {
        reactions[data.emoji] = {
          emoji: data.emoji,
          count: data.count,
          users: data.users || []
        };
      }
    });

    return reactions;
  } catch (error) {
    console.error('Failed to get emoji reactions:', error);
    return {};
  }
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(db && storage && auth);
};
