import { useState } from 'react';
import * as FileSystem from 'expo-file-system';

export const useDummyRemoveBg = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Dummy implementation that simulates background removal
   * Just returns the original image after a short delay to simulate processing
   */
  const removeBg = async (imageUri: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting dummy background removal for image:', imageUri);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Option 1: Just return the original image
      // return imageUri;
      
      // Option 2: Create a copy of the image with a new filename to simulate processing
      const tempDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const tempFilePath = `${tempDirectory}dummy_processed_${Date.now()}.jpg`;
      
      await FileSystem.copyAsync({
        from: imageUri,
        to: tempFilePath
      });
      
      console.log('Dummy background removal complete:', tempFilePath);
      return tempFilePath;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Dummy removal error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { removeBg, isLoading, error };
};
