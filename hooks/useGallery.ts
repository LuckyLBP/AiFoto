import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { storage, db, auth } from '../firebase/config';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface GalleryImage {
  id: string;
  uri: string;
  storagePath?: string; // Path in Firebase storage
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
  const [userId, setUserId] = useState<string | null>(null);

  // Watch for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return unsubscribe;
  }, []);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, [userId]);

  // Load images from Firestore and local storage
  const loadImages = async () => {
    try {
      setIsLoading(true);

      // First, load any cached images from AsyncStorage
      const cachedImagesJson = await AsyncStorage.getItem('gallery_images');
      let cachedImages: GalleryImage[] = cachedImagesJson
        ? JSON.parse(cachedImagesJson)
        : [];

      // Only keep images that still exist
      cachedImages = await verifyImagesExist(cachedImages);

      // If user is authenticated, load images from Firestore
      let firebaseImages: GalleryImage[] = [];
      if (userId) {
        const imagesCollection = collection(db, 'users', userId, 'images');
        const querySnapshot = await getDocs(imagesCollection);

        // Map firestore documents to our GalleryImage type
        firebaseImages = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data() as Omit<GalleryImage, 'id'>;
            return {
              id: doc.id,
              ...data,
            };
          })
        );

        // Merge with cached images, giving priority to remote images
        const mergedImages = [...cachedImages];

        // Add firebase images that aren't in the cache
        for (const fbImage of firebaseImages) {
          if (!mergedImages.some((img) => img.id === fbImage.id)) {
            mergedImages.push(fbImage);
          }
        }

        setImages(mergedImages);

        // Update the local cache
        await AsyncStorage.setItem(
          'gallery_images',
          JSON.stringify(mergedImages)
        );
      } else {
        // If not authenticated, just use cached images
        setImages(cachedImages);
      }

      // Generate folders from all available images
      if (cachedImages.length > 0 || firebaseImages.length > 0) {
        generateFolders([...cachedImages, ...firebaseImages]);
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
      // Trim the category to avoid issues with trailing spaces
      const category = (img.category || 'Uncategorized').trim();

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

  // Add image to gallery with Firebase integration
  const addImage = async (
    uri: string,
    metadata?: GalleryImage['metadata'],
    category?: string
  ): Promise<GalleryImage | null> => {
    try {
      // Ensure the category is trimmed to avoid issues with spaces
      const trimmedCategory = category ? category.trim() : 'Uncategorized';
      console.log(`Adding image to gallery with category: ${trimmedCategory}`);

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `gallery_${timestamp}.jpg`;

      // Create image object with metadata
      const newImage: GalleryImage = {
        id: `img_${timestamp}`,
        uri: uri, // Temporarily use the local URI
        createdAt: timestamp,
        metadata,
        category: trimmedCategory,
      };

      // If user is authenticated, upload to Firebase
      if (userId) {
        // First, read the file as a blob
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        // Convert file to blob for upload
        const response = await fetch(uri);
        const blob = await response.blob();

        // Create storage reference and upload
        const storagePath = `users/${userId}/images/${fileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload the file with progress monitoring
        const uploadTask = uploadBytesResumable(storageRef, blob);

        // Wait for upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Track upload progress if needed
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload progress: ${progress.toFixed(2)}%`);
            },
            (error) => {
              // Handle upload errors
              console.error('Error uploading image:', error);
              reject(error);
            },
            () => {
              // Upload completed
              resolve();
            }
          );
        });

        // Get the download URL
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Update image object with Firebase info
        newImage.uri = downloadURL;
        newImage.storagePath = storagePath;

        // Save image metadata to Firestore
        const imageDoc = doc(collection(db, 'users', userId, 'images'));
        await setDoc(imageDoc, {
          uri: downloadURL,
          storagePath: storagePath,
          createdAt: timestamp,
          metadata,
          category: trimmedCategory,
        });

        // Update ID with Firestore ID
        newImage.id = imageDoc.id;
      } else {
        // If not authenticated, save locally
        // Create a permanent copy in app documents directory
        const destinationUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({
          from: uri,
          to: destinationUri,
        });
        newImage.uri = destinationUri;
      }

      // Update state and storage
      const updatedImages = [...images, newImage];
      setImages(updatedImages);

      // Always update local cache
      await AsyncStorage.setItem(
        'gallery_images',
        JSON.stringify(updatedImages)
      );

      // Update folders
      generateFolders(updatedImages);

      console.log(
        `Successfully added image: ${newImage.id} to category: ${trimmedCategory}`
      );
      return newImage;
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      return null;
    }
  };

  // Delete image from gallery with Firebase integration
  const deleteImage = async (id: string) => {
    try {
      const imageToDelete = images.find((img) => img.id === id);
      if (!imageToDelete) return;

      // If authenticated and image has a storage path, delete from Firebase
      if (userId && imageToDelete.storagePath) {
        // Delete from Firebase Storage
        const storageRef = ref(storage, imageToDelete.storagePath);
        await deleteObject(storageRef);

        // Delete from Firestore
        const imageDocRef = doc(db, 'users', userId, 'images', id);
        await deleteDoc(imageDocRef);
      } else {
        // Otherwise, delete local file if it exists
        try {
          if (imageToDelete.uri.startsWith('file:')) {
            await FileSystem.deleteAsync(imageToDelete.uri);
          }
        } catch (e) {
          console.warn('File may have already been deleted:', e);
        }
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
        // If this is a Firebase URL, we assume it exists
        if (image.uri.startsWith('http')) {
          existingImages.push(image);
        } else {
          // For local files, check existence
          const info = await FileSystem.getInfoAsync(image.uri);
          if (info.exists) {
            existingImages.push(image);
          }
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

    // Get images with category exactly matching the folder name
    return images.filter((img) => {
      const imgCategory = (img.category || '').trim();
      return imgCategory === folder.name;
    });
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
