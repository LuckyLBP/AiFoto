import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CarSession, CarPhoto } from '../types';
import { generateUniqueId } from '../utils/helpers';

export const useCarSession = () => {
  const [activeSession, setActiveSession] = useState<CarSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load active session on component mount
  useEffect(() => {
    loadActiveSession();
  }, []);
  
  // Load any active session from storage
  const loadActiveSession = async () => {
    try {
      setLoading(true);
      const sessionJson = await AsyncStorage.getItem('active_car_session');
      
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        setActiveSession(session);
      } else {
        setActiveSession(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Misslyckades med att ladda aktiv session:', err);
      setError('Kunde inte ladda aktiv session');
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new car photo session
  const createSession = async (make: string, model: string, year: number): Promise<CarSession> => {
    try {
      const newSession: CarSession = {
        id: generateUniqueId(),
        dealershipId: 'default', // Ersätt med faktisk bilhandlare-ID när auth är implementerad
        userId: 'default', // Ersätt med faktiskt användar-ID när auth är implementerad
        carMake: make,
        carModel: model,
        year: year,
        photos: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completed: false
      };
      
      await AsyncStorage.setItem('active_car_session', JSON.stringify(newSession));
      setActiveSession(newSession);
      return newSession;
    } catch (err) {
      console.error('Misslyckades med att skapa session:', err);
      setError('Kunde inte skapa en ny session');
      throw err;
    }
  };
  
  // Add a photo to the active session
  const addPhoto = async (uri: string, angleId: string): Promise<CarPhoto | null> => {
    if (!activeSession) {
      setError('Ingen aktiv session');
      return null;
    }
    
    try {
      const newPhoto: CarPhoto = {
        id: generateUniqueId(),
        uri: uri,
        angleId: angleId,
        processed: false,
        backgroundRemoved: false,
        backgroundAdded: false,
        createdAt: Date.now()
      };
      
      const updatedPhotos = [...activeSession.photos, newPhoto];
      const updatedSession = {
        ...activeSession,
        photos: updatedPhotos,
        updatedAt: Date.now()
      };
      
      await AsyncStorage.setItem('active_car_session', JSON.stringify(updatedSession));
      setActiveSession(updatedSession);
      return newPhoto;
    } catch (err) {
      console.error('Misslyckades med att lägga till bild:', err);
      setError('Kunde inte lägga till bilden');
      return null;
    }
  };
  
  // Update a photo in the session
  const updatePhoto = async (photoId: string, updates: Partial<CarPhoto>): Promise<boolean> => {
    if (!activeSession) {
      setError('Ingen aktiv session');
      return false;
    }
    
    try {
      const photoIndex = activeSession.photos.findIndex(p => p.id === photoId);
      
      if (photoIndex === -1) {
        setError('Bilden hittades inte');
        return false;
      }
      
      const updatedPhotos = [...activeSession.photos];
      updatedPhotos[photoIndex] = { ...updatedPhotos[photoIndex], ...updates };
      
      const updatedSession = {
        ...activeSession,
        photos: updatedPhotos,
        updatedAt: Date.now()
      };
      
      await AsyncStorage.setItem('active_car_session', JSON.stringify(updatedSession));
      setActiveSession(updatedSession);
      return true;
    } catch (err) {
      console.error('Misslyckades med att uppdatera bild:', err);
      setError('Kunde inte uppdatera bilden');
      return false;
    }
  };
  
  // Complete the session
  const completeSession = async (): Promise<boolean> => {
    if (!activeSession) {
      setError('Ingen aktiv session');
      return false;
    }
    
    try {
      const completedSession = {
        ...activeSession,
        completed: true,
        updatedAt: Date.now()
      };
      
      // I en riktig app skulle vi skicka detta till en server
      // För nu sparar vi det bara lokalt
      const allSessionsJson = await AsyncStorage.getItem('completed_sessions');
      let allSessions = allSessionsJson ? JSON.parse(allSessionsJson) : [];
      allSessions = [...allSessions, completedSession];
      
      await AsyncStorage.setItem('completed_sessions', JSON.stringify(allSessions));
      await AsyncStorage.removeItem('active_car_session');
      
      setActiveSession(null);
      return true;
    } catch (err) {
      console.error('Misslyckades med att avsluta session:', err);
      setError('Kunde inte avsluta sessionen');
      return false;
    }
  };
  
  // Get photos for a specific angle
  const getPhotosForAngle = (angleId: string): CarPhoto[] => {
    if (!activeSession) return [];
    return activeSession.photos.filter(photo => photo.angleId === angleId);
  };
  
  return {
    activeSession,
    loading,
    error,
    createSession,
    addPhoto,
    updatePhoto,
    completeSession,
    getPhotosForAngle,
    loadActiveSession
  };
};
