import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Background } from '../types';

// Default backgrounds
const DEFAULT_BACKGROUNDS: Background[] = [
  {
    id: 'studio_white',
    name: 'Studio (vit)',
    uri: require('../assets/backgrounds/background.jpg'),
  },
];

export const useBackgrounds = () => {
  const [backgrounds, setBackgrounds] = useState<Background[]>(DEFAULT_BACKGROUNDS);
  const [selectedBackground, setSelectedBackground] = useState<Background | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Load saved custom backgrounds on component mount
  useEffect(() => {
    loadCustomBackgrounds();
  }, []);
  
  // Load any custom backgrounds from storage
  const loadCustomBackgrounds = async () => {
    try {
      setLoading(true);
      const customBgJson = await AsyncStorage.getItem('custom_backgrounds');
      
      if (customBgJson) {
        const customBackgrounds: Background[] = JSON.parse(customBgJson);
        setBackgrounds([...DEFAULT_BACKGROUNDS, ...customBackgrounds]);
      }
      
      // Load last selected background
      const lastSelectedBgJson = await AsyncStorage.getItem('selected_background');
      if (lastSelectedBgJson) {
        const lastBg: Background = JSON.parse(lastSelectedBgJson);
        setSelectedBackground(lastBg);
      } else if (backgrounds.length > 0) {
        setSelectedBackground(backgrounds[0]);
      }
    } catch (err) {
      console.error('Failed to load backgrounds:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a custom background
  const addCustomBackground = async (name: string, uri: string): Promise<Background | null> => {
    try {
      const newBackground: Background = {
        id: `custom_${Date.now()}`,
        name,
        uri,
      };
      
      const customBgJson = await AsyncStorage.getItem('custom_backgrounds');
      let customBackgrounds: Background[] = customBgJson ? JSON.parse(customBgJson) : [];
      customBackgrounds = [...customBackgrounds, newBackground];
      
      await AsyncStorage.setItem('custom_backgrounds', JSON.stringify(customBackgrounds));
      
      setBackgrounds([...DEFAULT_BACKGROUNDS, ...customBackgrounds]);
      return newBackground;
    } catch (err) {
      console.error('Failed to add background:', err);
      return null;
    }
  };
  
  // Select a background
  const selectBackground = async (background: Background): Promise<void> => {
    try {
      setSelectedBackground(background);
      await AsyncStorage.setItem('selected_background', JSON.stringify(background));
    } catch (err) {
      console.error('Failed to select background:', err);
    }
  };
  
  return {
    backgrounds,
    selectedBackground,
    loading,
    addCustomBackground,
    selectBackground,
  };
};
