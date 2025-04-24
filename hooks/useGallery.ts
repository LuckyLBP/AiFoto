import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface GalleryImage {
  id: string;
  uri: string;
  createdAt: number;
  category?: string;
  metadata?: {
    carMake?: string;
    carModel?: string;
    year?: number;
    angleId?: string;
    sessionId?: string;
    angleName?: string;
  };
}

export interface GalleryFolder {
  id: string;
  name: string;
  coverImage: string; // URI of cover image
  imageCount: number;
  createdAt: number;
  updatedAt: number;
}

export const useGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
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

        // Generate folders from the categories in images
        if (existingImages.length > 0) {
          generateFolders(existingImages);
        }
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate folder structure from images
  const generateFolders = (images: GalleryImage[]) => {
    // Group images by category
    const categoryGroups: Record<string, GalleryImage[]> = {};

    images.forEach((img) => {
      const category = img.category || 'Uncategorized';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(img);
    });

    // Create folders from categories
    const newFolders: GalleryFolder[] = Object.entries(categoryGroups).map(
      ([name, groupImages]) => {
        // Sort images by createdAt to get the most recent one as cover
        const sortedImages = [...groupImages].sort(
          (a, b) => b.createdAt - a.createdAt
        );
        const latestImage = sortedImages[0];

        return {
          id: `folder_${name.replace(/\s+/g, '_').toLowerCase()}`,
          name,
          coverImage: latestImage.uri,
          imageCount: groupImages.length,
          createdAt: Math.min(...groupImages.map((img) => img.createdAt)),
          updatedAt: Math.max(...groupImages.map((img) => img.createdAt)),
        };
      }
    );

    // Sort folders by updatedAt (most recent first)
    newFolders.sort((a, b) => b.updatedAt - a.updatedAt);
    setFolders(newFolders);
  };

  // Add image to gallery with additional metadata
  const addImage = async (
    uri: string,
    metadata?: GalleryImage['metadata'],
    category?: string
  ): Promise<GalleryImage | null> => {
    try {
      console.log(`Adding image to gallery with category: ${category}`);

      // Create a permanent copy in app documents directory
      const fileName = `gallery_${Date.now()}.png`;
      const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });

      // Create image object with metadata
      const newImage: GalleryImage = {
        id: fileName,
        uri: destinationUri,
        createdAt: Date.now(),
        metadata,
        category: category || 'Uncategorized',
      };

      // Update state and storage
      const updatedImages = [...images, newImage];
      setImages(updatedImages);

      // Save images to AsyncStorage
      await AsyncStorage.setItem(
        'gallery_images',
        JSON.stringify(updatedImages)
      );

      // Regenerate folders with the new image
      generateFolders(updatedImages);

      console.log(
        `Successfully added image: ${fileName} to category: ${category}`
      );
      return newImage;
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      return null;
    }
  };

  // Delete image from gallery
  const deleteImage = async (id: string) => {
    try {
      const imageToDelete = images.find((img) => img.id === id);

      if (imageToDelete) {
        // Delete the file
        try {
          await FileSystem.deleteAsync(imageToDelete.uri);
        } catch (e) {
          console.warn('File may have already been deleted:', e);
        }

        // Update state
        const updatedImages = images.filter((img) => img.id !== id);
        setImages(updatedImages);

        // Update AsyncStorage
        await AsyncStorage.setItem(
          'gallery_images',
          JSON.stringify(updatedImages)
        );

        // Regenerate folders after deletion
        generateFolders(updatedImages);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Helper to verify images still exist in the filesystem
  const verifyImagesExist = async (
    images: GalleryImage[]
  ): Promise<GalleryImage[]> => {
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

  // Get images for a specific folder/category
  const getImagesForFolder = (folderId: string): GalleryImage[] => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return [];

    return images.filter((img) => img.category === folder.name);
  };

  // Get images by category
  const getImagesByCategory = (category: string): GalleryImage[] => {
    return images.filter((img) => img.category === category);
  };

  const getImagesBySession = (sessionId: string): GalleryImage[] => {
    return images.filter((img) => img.metadata?.sessionId === sessionId);
  };

  const getImagesByCarModel = (
    carMake?: string,
    carModel?: string
  ): GalleryImage[] => {
    return images.filter((img) => {
      if (carMake && carModel) {
        return (
          img.metadata?.carMake === carMake &&
          img.metadata?.carModel === carModel
        );
      } else if (carMake) {
        return img.metadata?.carMake === carMake;
      }
      return false;
    });
  };

  return {
    images,
    folders,
    isLoading,
    addImage,
    deleteImage,
    refreshGallery: loadImages,
    getImagesForFolder,
    getImagesByCategory,
    getImagesBySession,
    getImagesByCarModel,
  };
};
