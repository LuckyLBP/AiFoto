import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface GalleryImage {
  id: string;
  uri: string;
  createdAt: number;
}

export const useGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load images on mount
  useEffect(() => {
    loadImages();
  }, []);
  
  // Load saved images from AsyncStorage
  const loadImages = async () => {
    try {
      setIsLoading(true);
      const savedImagesJson = await AsyncStorage.getItem('gallery_images');
      
      if (savedImagesJson) {
        const savedImages: GalleryImage[] = JSON.parse(savedImagesJson);
        // Verify images still exist
        const existingImages = await verifyImagesExist(savedImages);
        setImages(existingImages);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add image to gallery
  const addImage = async (uri: string): Promise<GalleryImage | null> => {
    try {
      // Create a permanent copy in app documents directory
      const fileName = `gallery_${Date.now()}.png`;
      const destinationUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      // Create image object
      const newImage: GalleryImage = {
        id: fileName,
        uri: destinationUri,
        createdAt: Date.now()
      };
      
      // Update state and storage
      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      await AsyncStorage.setItem('gallery_images', JSON.stringify(updatedImages));
      
      return newImage;
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      return null;
    }
  };
  
  // Delete image from gallery
  const deleteImage = async (id: string) => {
    try {
      const imageToDelete = images.find(img => img.id === id);
      
      if (imageToDelete) {
        // Delete the file
        try {
          await FileSystem.deleteAsync(imageToDelete.uri);
        } catch (e) {
          console.warn('File may have already been deleted:', e);
        }
        
        // Update state and storage
        const updatedImages = images.filter(img => img.id !== id);
        setImages(updatedImages);
        await AsyncStorage.setItem('gallery_images', JSON.stringify(updatedImages));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
  
  // Helper to verify images still exist in the filesystem
  const verifyImagesExist = async (images: GalleryImage[]): Promise<GalleryImage[]> => {
    const existingImages = [];
    
    for (const image of images) {
      try {
        const info = await FileSystem.getInfoAsync(image.uri);
        if (info.exists) {
          existingImages.push(image);
        }
      } catch (e) {
        // Skip this image if error
      }
    }
    
    return existingImages;
  };
  
  return {
    images,
    isLoading,
    addImage,
    deleteImage,
    refreshGallery: loadImages
  };
};
