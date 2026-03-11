import { useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../types';

export const useFavorites = () => {
  const [savedProducts, setSavedProducts] = useState<string[]>([]);

  const fetchFavorites = async () => {
    if (!auth.currentUser) return;
    const favPath = `favorites/${auth.currentUser.uid}`;
    try {
      const favDoc = await getDoc(doc(db, "favorites", auth.currentUser.uid));
      if (favDoc.exists()) {
        setSavedProducts(favDoc.data().items || []);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, favPath);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    if (!auth.currentUser) return;
    const favPath = `favorites/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, "favorites", auth.currentUser.uid), {
        items: newFavorites,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, favPath);
    }
  };

  const toggleSave = (productId: string) => {
    setSavedProducts(prev => {
      const newFavorites = prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  return {
    savedProducts,
    toggleSave,
    fetchFavorites,
    saveFavorites
  };
};
