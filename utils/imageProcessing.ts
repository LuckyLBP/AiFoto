import * as FileSystem from 'expo-file-system';

/**
 * A utility function that returns the original image URI
 * This is a simple fallback when proper image compositing isn't available
 */
export const applyBackgroundToImage = async (
  imageUri: string,
  backgroundUri: any, // Can be either a require() or a URL string
  options = {
    width: 1920, // 16:9 landscape
    height: 1080,
    quality: 0.9,
    format: 'jpg' as const,
  }
): Promise<string> => {
  try {
    // In the real implementation, we would composite the images here
    console.warn(
      'applyBackgroundToImage: Image composition not implemented - returning original image'
    );
    return imageUri;
  } catch (error) {
    console.error('Error applying background to image:', error);
    throw new Error('Failed to apply background to image');
  }
};

/**
 * Utility function to save an image to a temporary cache file
 */
export const saveImageToCache = async (
  uri: string,
  format = 'jpg'
): Promise<string> => {
  try {
    const fileName = `temp_${Date.now()}.${format}`;
    const destinationUri = `${FileSystem.cacheDirectory}${fileName}`;

    // Copy the image to the cache directory
    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.error('Error saving image to cache:', error);
    throw error;
  }
};

/**
 * Alternative approach: Direct image compositing
 * This is a placeholder for a more practical approach in React Native
 */
export const composeImagesWithBackground = async (
  imageUri: string,
  backgroundUri: any // require('../assets/backgrounds/some-bg.jpg')
): Promise<string> => {
  try {
    // Return the original image URI as a fallback solution
    console.warn(
      'composeImagesWithBackground: Not implemented - returning original image'
    );
    return imageUri;
  } catch (error) {
    console.error('Error compositing images:', error);
    throw error;
  }
};
