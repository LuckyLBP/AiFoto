import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useCredits = () => {
  const [credits, setCredits] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [skipCreditCheck, setSkipCreditCheck] = useState<boolean>(false);

  // Load skip credit check setting on mount
  useEffect(() => {
    const loadSkipSetting = async () => {
      try {
        const skipSetting = await AsyncStorage.getItem('skip_credit_check');
        setSkipCreditCheck(skipSetting === 'true');
      } catch (err) {
        console.error('Failed to load skip credit setting:', err);
      }
    };

    loadSkipSetting();
  }, []);

  // Watch for authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadUserCredits(user.uid);
      } else {
        setUserId(null);
        setCredits(5); // Set a default value for non-authenticated users
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load user credits from Firestore
  const loadUserCredits = async (uid: string) => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setCredits(userData.credits || 5);
      } else {
        // If the user document doesn't exist, initialize with default credits
        await updateDoc(userRef, { credits: 5 });
        setCredits(5);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load user credits:', err);
      setError('Could not load credits. Please try again.');
      // Set default credits even on error
      setCredits(5);
    } finally {
      setLoading(false);
    }
  };

  // Use a credit (decrement by 1)
  const useCredit = async (): Promise<boolean> => {
    // If skip credit check is enabled, return true without deducting
    if (skipCreditCheck) {
      return true;
    }

    if (credits <= 0) {
      setError('No credits available');
      return false;
    }

    // Update local state first
    setCredits((prev) => prev - 1);

    // For authenticated users, update Firestore
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          credits: increment(-1),
        });
      } catch (err) {
        console.error('Failed to update Firestore credits:', err);
        // Continue even if Firestore update fails
      }
    }

    return true;
  };

  // Add credits to user account
  const addCredits = async (amount: number): Promise<boolean> => {
    // For authenticated users, update Firestore
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          credits: increment(amount),
        });
      } catch (err) {
        console.error('Failed to update Firestore credits:', err);
        // Continue even if Firestore update fails
      }
    }

    // Always update local state
    setCredits((prev) => prev + amount);
    return true;
  };

  // Toggle skip credit check setting
  const toggleSkipCreditCheck = async (): Promise<void> => {
    try {
      const newValue = !skipCreditCheck;
      setSkipCreditCheck(newValue);
      await AsyncStorage.setItem('skip_credit_check', newValue.toString());
    } catch (err) {
      console.error('Failed to toggle skip credit setting:', err);
    }
  };

  // Reset credits to default value
  const resetCredits = async (): Promise<void> => {
    setCredits(5);
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { credits: 5 });
      } catch (err) {
        console.error('Failed to reset credits in Firestore:', err);
      }
    }
  };

  return {
    credits,
    loading,
    error,
    useCredit,
    addCredits,
    skipCreditCheck,
    toggleSkipCreditCheck,
    resetCredits,
    hasEnoughCredits: (amount: number = 1): boolean => {
      return skipCreditCheck || credits >= amount;
    },
  };
};
