import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import { useDummyRemoveBg } from '../hooks/useDummyRemoveBg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGallery } from '../hooks/useGallery';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const { removeBg, isLoading, error } = useDummyRemoveBg();
  const { addImage } = useGallery();

  // Handle incoming image from camera screen
  useEffect(() => {
    if (params.imageUri) {
      setImage(params.imageUri as string);
      setProcessedImage(params.imageUri as string);
    }
  }, [params.imageUri]);
  
  // Navigate to the camera screen
  const openCamera = () => {
    router.push('/camera');
  };

  // Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setProcessedImage(null);
    }
  };

  // Process image to remove background
  const processImage = async () => {
    if (image) {
      try {
        console.log('Processing image...');
        const result = await removeBg(image);
        console.log('Image processed successfully');
        setProcessedImage(result);
      } catch (err) {
        console.error("Error processing image:", err);
        Alert.alert(
          "Processing Failed",
          "Could not process the image. Please try again or check your internet connection.",
          [{ text: "OK" }]
        );
      }
    }
  };
  
  // Save the processed image to gallery
  const saveToGallery = async () => {
    if (processedImage) {
      try {
        const savedImage = await addImage(processedImage);
        if (savedImage) {
          Alert.alert(
            "Success",
            "Image saved to your gallery!",
            [{ text: "OK", onPress: () => router.push('/gallery') }]
          );
        } else {
          Alert.alert("Error", "Failed to save image to gallery.");
        }
      } catch (err) {
        console.error("Error saving to gallery:", err);
        Alert.alert("Error", "Could not save to gallery.");
      }
    }
  };

  return (
    <View style={styles(colors).container}>
      <Text style={styles(colors).title}>Ta eller välj en bild</Text>
      
      <View style={styles(colors).buttonContainer}>
        <TouchableOpacity style={styles(colors).button} onPress={openCamera}>
          <Text style={styles(colors).buttonText}>Ta foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles(colors).button} onPress={pickImage}>
          <Text style={styles(colors).buttonText}>Välj från galleri</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <>
          <View style={styles(colors).imageContainer}>
            <Image source={{ uri: processedImage || image }} style={styles(colors).image} resizeMode="contain" />
            {isLoading && (
              <ActivityIndicator size="large" color={colors.primary} style={{ position: 'absolute' }} />
            )}
          </View>
          
          <View style={styles(colors).actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles(colors).processButton, isLoading && { opacity: 0.7 }]} 
              onPress={processImage}
              disabled={isLoading}
            >
              <Text style={styles(colors).buttonText}>
                {isLoading ? 'Bearbetar...' : 'Ta bort bakgrund'}
              </Text>
            </TouchableOpacity>
            
            {processedImage && (
              <TouchableOpacity 
                style={styles(colors).saveButton} 
                onPress={saveToGallery}
              >
                <Text style={styles(colors).buttonText}>Spara i galleri</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {error && (
            <Text style={{ color: colors.error, marginTop: 10 }}>
              Ett fel uppstod: {error}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

// Update styles to include new components
const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actionButtonsContainer: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  processButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
});
