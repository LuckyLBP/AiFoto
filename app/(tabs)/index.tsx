import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeProvider';
import { useDummyRemoveBg } from '../../hooks/useDummyRemoveBg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGallery } from '../../hooks/useGallery';
import { Ionicons } from '@expo/vector-icons';
import { useCredits } from '../../hooks/useCredits';
import CreditDisplay from '../../components/CreditDisplay';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const { removeBg, isLoading, error } = useDummyRemoveBg();
  const { addImage } = useGallery();
  const { credits, useCredit } = useCredits();

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
        console.error('Error processing image:', err);
        Alert.alert(
          'Processing Failed',
          'Could not process the image. Please try again or check your internet connection.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Save the processed image to gallery
  const saveToGallery = async () => {
    if (processedImage) {
      // Check if user has credits available
      if (credits <= 0) {
        Alert.alert(
          'Inga krediter tillgängliga',
          'Du har inte tillräckligt med krediter för att spara denna bild. Vänligen köp fler krediter.',
          [
            { text: 'Avbryt', style: 'cancel' },
            { text: 'Köp krediter', onPress: () => router.push('/profile') },
          ]
        );
        return;
      }

      try {
        // First deduct a credit
        const creditDeducted = await useCredit();

        if (!creditDeducted) {
          Alert.alert('Fel', 'Kunde inte dra kredit. Försök igen.');
          return;
        }

        // Then save the image
        const savedImage = await addImage(processedImage);
        if (savedImage) {
          Alert.alert(
            'Klart!',
            'Bilden har sparats i galleriet! 1 kredit har använts.',
            [{ text: 'OK', onPress: () => router.push('/gallery') }]
          );
        } else {
          Alert.alert('Fel', 'Kunde inte spara bilden i galleriet.');
        }
      } catch (err) {
        console.error('Error saving to gallery:', err);
        Alert.alert('Fel', 'Kunde inte spara i galleriet.');
      }
    }
  };

  // Navigate to the car photography flow
  const startCarPhotoFlow = () => {
    router.push('/car');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles(colors).scrollContent}>
        {/* Header section with app name and credits */}
        <View style={styles(colors).header}>
          <View>
            <Text style={styles(colors).appName}>AiFoto</Text>
            <Text style={styles(colors).appTagline}>
              Professionella bilbilder gjorda enkelt
            </Text>
          </View>
          <CreditDisplay onPress={() => router.push('/profile')} />
        </View>

        {/* Main feature card */}
        <TouchableOpacity
          style={styles(colors).mainFeatureCard}
          onPress={startCarPhotoFlow}
        >
          <View style={styles(colors).mainFeatureContent}>
            <View style={styles(colors).mainFeatureTextContainer}>
              <Text style={styles(colors).mainFeatureTitle}>
                Fotografera bil
              </Text>
              <Text style={styles(colors).mainFeatureDescription}>
                Guidad fotografering med automatisk bakgrundsborttagning
              </Text>
              <View style={styles(colors).featureButtonContainer}>
                <Text style={styles(colors).startButtonText}>Starta nu</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles(colors).mainFeatureIconContainer}>
              <Ionicons name="car" size={48} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Secondary actions */}
        <View style={styles(colors).secondaryActionsContainer}>
          <TouchableOpacity
            style={styles(colors).actionCard}
            onPress={openCamera}
          >
            <Ionicons name="camera" size={32} color={colors.primary} />
            <Text style={styles(colors).actionTitle}>Kamera</Text>
            <Text style={styles(colors).actionDescription}>
              Ta ett nytt foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles(colors).actionCard}
            onPress={pickImage}
          >
            <Ionicons name="images" size={32} color={colors.primary} />
            <Text style={styles(colors).actionTitle}>Galleri</Text>
            <Text style={styles(colors).actionDescription}>
              Välj befintlig bild
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles(colors).actionCard}
            onPress={() => router.push('/gallery')}
          >
            <Ionicons name="folder" size={32} color={colors.primary} />
            <Text style={styles(colors).actionTitle}>Mina bilder</Text>
            <Text style={styles(colors).actionDescription}>
              Visa sparade bilder
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image preview and processing */}
        {image && (
          <View style={styles(colors).processingSection}>
            <Text style={styles(colors).sectionTitle}>Bildredigering</Text>

            <View style={styles(colors).imageContainer}>
              <Image
                source={{ uri: processedImage || image }}
                style={styles(colors).image}
                resizeMode="contain"
              />
              {isLoading && (
                <View style={styles(colors).loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles(colors).loadingText}>Bearbetar...</Text>
                </View>
              )}
            </View>

            <View style={styles(colors).actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles(colors).processButton,
                  isLoading && styles(colors).disabledButton,
                ]}
                onPress={processImage}
                disabled={isLoading}
              >
                <Ionicons
                  name="color-wand-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles(colors).buttonText}>
                  {isLoading ? 'Bearbetar...' : 'Ta bort bakgrund'}
                </Text>
              </TouchableOpacity>

              {processedImage && (
                <TouchableOpacity
                  style={styles(colors).saveButton}
                  onPress={saveToGallery}
                >
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles(colors).buttonText}>Spara i galleri</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && (
              <View style={styles(colors).errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles(colors).errorText}>{error}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    scrollContent: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 8,
    },
    appName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
    },
    appTagline: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    mainFeatureCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    mainFeatureContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mainFeatureTextContainer: {
      flex: 1,
      paddingRight: 16,
    },
    mainFeatureTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    mainFeatureDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 22,
    },
    featureButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    startButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      marginRight: 8,
    },
    mainFeatureIconContainer: {
      backgroundColor: 'rgba(66, 133, 244, 0.1)',
      padding: 16,
      borderRadius: 16,
    },
    secondaryActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    actionCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 8,
    },
    actionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    processingSection: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    imageContainer: {
      width: '100%',
      height: 300,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: '#fff',
      marginTop: 12,
      fontSize: 16,
    },
    actionButtonsContainer: {
      gap: 12,
    },
    processButton: {
      backgroundColor: colors.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 10,
    },
    disabledButton: {
      opacity: 0.7,
    },
    saveButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 10,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(234, 67, 53, 0.1)',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    errorText: {
      color: colors.error,
      marginLeft: 8,
      flex: 1,
    },
  });
