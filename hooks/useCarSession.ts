import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CarSession, CarPhoto } from '../types';
import { generateUniqueId } from '../utils/helpers';
import { useGallery } from './useGallery'; // Import useGallery hook
import { useCredits } from './useCredits';
import { useCarAngles } from './useCarAngles';

export const useCarSession = () => {
  const [activeSession, setActiveSession] = useState<CarSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { addImage } = useGallery(); // Get the addImage function from useGallery
  const { useCredit, skipCreditCheck } = useCredits();
  const { carAngles } = useCarAngles();

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
  const createSession = async (
    make: string,
    model: string,
    year: number
  ): Promise<CarSession> => {
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
        completed: false,
      };

      await AsyncStorage.setItem(
        'active_car_session',
        JSON.stringify(newSession)
      );
      setActiveSession(newSession);
      return newSession;
    } catch (err) {
      console.error('Misslyckades med att skapa session:', err);
      setError('Kunde inte skapa en ny session');
      throw err;
    }
  };

  // Add a photo to the active session
  const addPhoto = async (
    uri: string,
    angleId: string
  ): Promise<CarPhoto | null> => {
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
        createdAt: Date.now(),
      };

      const updatedPhotos = [...activeSession.photos, newPhoto];
      const updatedSession = {
        ...activeSession,
        photos: updatedPhotos,
        updatedAt: Date.now(),
      };

      await AsyncStorage.setItem(
        'active_car_session',
        JSON.stringify(updatedSession)
      );
      setActiveSession(updatedSession);
      return newPhoto;
    } catch (err) {
      console.error('Misslyckades med att lägga till bild:', err);
      setError('Kunde inte lägga till bilden');
      return null;
    }
  };

  // Update a photo in the session
  const updatePhoto = async (
    photoId: string,
    updates: Partial<CarPhoto>
  ): Promise<boolean> => {
    if (!activeSession) {
      setError('Ingen aktiv session');
      return false;
    }

    try {
      const photoIndex = activeSession.photos.findIndex(
        (p) => p.id === photoId
      );

      if (photoIndex === -1) {
        setError('Bilden hittades inte');
        return false;
      }

      const updatedPhotos = [...activeSession.photos];
      updatedPhotos[photoIndex] = { ...updatedPhotos[photoIndex], ...updates };

      const updatedSession = {
        ...activeSession,
        photos: updatedPhotos,
        updatedAt: Date.now(),
      };

      await AsyncStorage.setItem(
        'active_car_session',
        JSON.stringify(updatedSession)
      );
      setActiveSession(updatedSession);
      return true;
    } catch (err) {
      console.error('Misslyckades med att uppdatera bild:', err);
      setError('Kunde inte uppdatera bilden');
      return false;
    }
  };

  // Update multiple photos with backgrounds at once
  const updateAllBackgrounds = async (
    updates: Array<{
      id: string;
      finalImageUri: string;
      backgroundAdded: boolean;
    }>
  ): Promise<boolean> => {
    if (!activeSession) {
      setError('Ingen aktiv session');
      return false;
    }

    try {
      // Create a copy of the photos array
      const updatedPhotos = [...activeSession.photos];

      // Update each photo that matches an ID in the updates array
      updates.forEach((update) => {
        const photoIndex = updatedPhotos.findIndex((p) => p.id === update.id);
        if (photoIndex !== -1) {
          updatedPhotos[photoIndex] = {
            ...updatedPhotos[photoIndex],
            finalImageUri: update.finalImageUri,
            backgroundAdded: update.backgroundAdded,
          };
        }
      });

      // Create the updated session
      const updatedSession = {
        ...activeSession,
        photos: updatedPhotos,
        updatedAt: Date.now(),
      };

      // Save to storage
      await AsyncStorage.setItem(
        'active_car_session',
        JSON.stringify(updatedSession)
      );
      setActiveSession(updatedSession);
      return true;
    } catch (err) {
      console.error('Misslyckades med att uppdatera flera bilder:', err);
      setError('Kunde inte uppdatera bildernas bakgrunder');
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
      // Get only the exterior photos that we want to save
      const exteriorsToSave = activeSession.photos.filter((photo) => {
        const angle = carAngles.find((a) => a.id === photo.angleId);
        return angle && !angle.isInterior;
      });

      console.log(
        `Preparing to save ${exteriorsToSave.length} exterior photos...`
      );

      // Process all photos before completing
      const processedPhotos = await Promise.all(
        activeSession.photos.map(async (photo) => {
          // For interior photos or photos we don't want to save to gallery, just return them as-is
          const angle = carAngles.find((a) => a.id === photo.angleId);
          if (!angle || angle.isInterior) {
            return {
              ...photo,
              processed: true,
            };
          }

          // For each exterior photo, either use the edited version or the original
          const imageToSave = photo.finalImageUri || photo.uri;

          // Use a credit for each photo saved (will be bypassed if skipCreditCheck is true)
          const creditUsed = await useCredit();
          if (!creditUsed && !skipCreditCheck) {
            console.error('Failed to use credit for photo:', photo.id);
            // Continue anyway for this demo
          }

          // Get the angle name for this photo
          const angleName = angle?.name || 'Okänd vinkel';

          // Save each image to gallery with metadata
          try {
            await addImage(
              imageToSave,
              {
                carMake: activeSession.carMake,
                carModel: activeSession.carModel,
                year: activeSession.year,
                angleId: photo.angleId,
                sessionId: activeSession.id,
                angleName,
              },
              `${activeSession.carMake} ${activeSession.carModel}`
            );
            console.log(`Saved to gallery: ${photo.id} - ${angleName}`);
          } catch (err) {
            console.error('Failed to save image to gallery:', err);
            // Continue with other photos instead of aborting the whole process
          }

          return {
            ...photo,
            processed: true,
            backgroundAdded: photo.backgroundAdded || false,
            finalImageUri: photo.finalImageUri || null,
          };
        })
      );

      const completedSession = {
        ...activeSession,
        photos: processedPhotos,
        completed: true,
        updatedAt: Date.now(),
      };

      // Save to local storage
      const allSessionsJson = await AsyncStorage.getItem('completed_sessions');
      let allSessions = allSessionsJson ? JSON.parse(allSessionsJson) : [];
      allSessions = [...allSessions, completedSession];

      await AsyncStorage.setItem(
        'completed_sessions',
        JSON.stringify(allSessions)
      );
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
    return activeSession.photos.filter((photo) => photo.angleId === angleId);
  };

  return {
    activeSession,
    loading,
    error,
    createSession,
    addPhoto,
    updatePhoto,
    updateAllBackgrounds, // Export the new function
    completeSession,
    getPhotosForAngle,
    loadActiveSession,
  };
};
