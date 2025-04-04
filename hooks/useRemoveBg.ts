import { useState } from 'react';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

// You should store this in a secure environment variable
const REMOVE_BG_API_KEY = 'aay9Lpk91psu5LSvMhMtyoCk';
const API_URL = 'https://api.remove.bg/v1.0/removebg';

export const useRemoveBg = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeBg = async (imageUri: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting background removal for image:', imageUri);
      
      // Read the image as base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Image read as base64, length:', base64Image.length);
      
      // Make the API request with base64 data directly in the JSON payload
      const response = await axios({
        method: 'POST',
        url: API_URL,
        data: {
          image_file_b64: base64Image,
          size: 'auto',
          format: 'png',
          shadow_type: 'auto',
          type: 'auto',
        },
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      });
      
      console.log('API response received, status:', response.status);
      
      if (response.status >= 200 && response.status < 300) {
        // Convert array buffer to base64
        const result = arrayBufferToBase64(response.data);
        
        // Save to file
        const tempDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const tempFilePath = `${tempDirectory}processed_image_${Date.now()}.png`;
        
        await FileSystem.writeAsStringAsync(
          tempFilePath,
          result,
          { encoding: FileSystem.EncodingType.Base64 }
        );
        
        console.log('Background removed successfully, saved to:', tempFilePath);
        setIsLoading(false);
        return tempFilePath;
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Remove.bg error details:', err);
      setIsLoading(false);
      
      // Format a more helpful error message
      let errorMessage = 'Failed to process image';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorData = err.response.data;
          errorMessage = `API Error: ${err.response.status} - ${
            typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
          }`;
        } else if (err.request) {
          errorMessage = 'No response received from server. Please check your internet connection.';
        } else {
          errorMessage = `Request error: ${err.message}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error('Formatted error message:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Helper function to convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return binary.length > 0 ? btoa(binary) : '';
  };

  return { removeBg, isLoading, error };
};
