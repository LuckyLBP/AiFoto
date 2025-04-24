import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useCarSession } from '../../hooks/useCarSession';
import { useCarAngles } from '../../hooks/useCarAngles';
import { useGallery } from '../../hooks/useGallery';
import ImageEditor from '../../components/ImageEditor';
import { CarPhoto } from '../../types';
import { useCredits } from '../../hooks/useCredits';
import CreditDisplay from '../../components/CreditDisplay';

const DEFAULT_BACKGROUND_IMAGE = require('../../assets/backgrounds/background.jpg');
const windowWidth = Dimensions.get('window').width;
const CARD_WIDTH = windowWidth - 40;
const CARD_HEIGHT = (CARD_WIDTH / 16) * 9;

export default function CarEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    activeSession,
    loading: sessionLoading,
    updatePhoto,
    completeSession,
  } = useCarSession();
  const { carAngles } = useCarAngles();
  const { addImage } = useGallery();
  const { credits, useCredit, skipCreditCheck } = useCredits();
  const [currentlyEditing, setCurrentlyEditing] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Omdirigera om ingen aktiv session finns
  useEffect(() => {
    if (!sessionLoading && !activeSession) {
      router.replace('/car');
    }
  }, [sessionLoading, activeSession]);

  // Get all photos that can be edited with backgrounds
  const getEditablePhotos = () => {
    if (!activeSession) return [];

    return activeSession.photos.filter((photo) => {
      const angle = carAngles.find((a) => a.id === photo.angleId);
      return angle && !angle.isInterior;
    });
  };

  // Handle saving the edited image
  const handleSaveEdit = async (finalImageUri: string) => {
    if (!currentlyEditing || !activeSession) return;

    // Check if user has credits - use the hasEnoughCredits helper
    if (!skipCreditCheck && credits <= 0) {
      Alert.alert(
        'Inga krediter tillgängliga',
        'Du har inte tillräckligt med krediter för att spara denna bild. Vänligen köp fler krediter eller aktivera obegränsade krediter i din profil.',
        [
          { text: 'Avbryt', style: 'cancel' },
          { text: 'Köp krediter', onPress: () => router.push('/profile') },
        ]
      );
      return;
    }

    try {
      // First deduct credit
      const creditDeducted = await useCredit();

      if (!creditDeducted) {
        Alert.alert('Fel', 'Kunde inte dra kredit. Försök igen.');
        return;
      }

      // Get the current photo
      const currentPhoto = activeSession.photos.find(
        (p) => p.id === currentlyEditing
      );
      if (!currentPhoto) return;

      // Get angle name
      const angle = carAngles.find((a) => a.id === currentPhoto.angleId);
      const angleName = angle?.name || 'Okänd vinkel';

      // Then add to gallery with metadata
      const savedGalleryImage = await addImage(
        finalImageUri,
        {
          carMake: activeSession.carMake,
          carModel: activeSession.carModel,
          year: activeSession.year,
          angleId: currentPhoto.angleId,
          sessionId: activeSession.id,
          angleName,
        },
        `${activeSession.carMake} ${activeSession.carModel}`
      );

      // Update the session with the URI
      await updatePhoto(currentlyEditing, {
        backgroundAdded: true,
        finalImageUri: finalImageUri,
      });

      setCurrentlyEditing(null);

      // Show success message
      if (savedGalleryImage) {
        Alert.alert(
          'Bild sparad',
          'Bilden har sparats till galleriet och till sessionen. 1 kredit har använts.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Fel vid sparande av redigerad bild:', error);
      Alert.alert('Fel', 'Kunde inte spara den redigerade bilden.');
    }
  };

  // Get angle name for a photo
  const getAngleName = (angleId: string): string => {
    const angle = carAngles.find((a) => a.id === angleId);
    return angle ? angle.name : 'Okänd vinkel';
  };

  // Check if all editing is complete - no longer required as editing is optional
  const isEditingComplete = (): boolean => {
    return true; // All photos are considered complete since editing is optional
  };

  // Handle completion of the session
  const handleComplete = async () => {
    // Get only photos that we want to save (exteriors)
    const photosToSave = getEditablePhotos().length;

    if (photosToSave === 0) {
      Alert.alert(
        'Inga bilder att spara',
        'Det finns inga bilder att spara. Ta några bilder först.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if user has enough credits
    if (!skipCreditCheck && credits < photosToSave) {
      Alert.alert(
        'Otillräckliga krediter',
        `Du har ${credits} krediter men behöver ${photosToSave} för att spara alla bilder. Vänligen köp fler krediter eller aktivera obegränsade krediter i din profil.`,
        [
          { text: 'Avbryt', style: 'cancel' },
          { text: 'Gå till profil', onPress: () => router.push('/profile') },
        ]
      );
      return;
    }

    Alert.alert(
      'Spara alla bilder',
      `Är du nöjd med bilderna? ${photosToSave} bilder kommer att sparas till galleriet${
        !skipCreditCheck
          ? ` och ${photosToSave} krediter kommer att användas`
          : ''
      }.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Spara alla', onPress: finishSession },
      ]
    );
  };

  const finishSession = async () => {
    setProcessingComplete(true);
    try {
      console.log('Starting to complete session...');

      // Complete the session which will save all images to gallery
      const success = await completeSession();

      if (success) {
        console.log('Session completed successfully');
        Alert.alert(
          'Klart!',
          'Fotosessionen är avslutad. Alla bilder har sparats till galleriet.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      } else {
        throw new Error('Session completion returned false');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Fel', 'Kunde inte avsluta sessionen. Försök igen.');
    } finally {
      setProcessingComplete(false);
    }
  };

  // Open background selection modal - Fix the missing function
  const openBackgroundSelector = () => {
    router.push('/car/background-selector');
  };

  if (sessionLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (currentlyEditing) {
    const photo = activeSession?.photos.find((p) => p.id === currentlyEditing);
    if (!photo) return null;

    return (
      <ImageEditor
        processedImage={photo.uri}
        onSave={handleSaveEdit}
        onCancel={() => setCurrentlyEditing(null)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Dina bilder</Text>
        <CreditDisplay compact={true} />
      </View>

      <Text style={[styles.subtitle, { color: colors.text }]}>
        Kontrollera dina bilder - redigera vid behov eller spara alla med
        standardbakgrund
      </Text>

      <FlatList
        data={getEditablePhotos()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.photosList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.photoCard, { backgroundColor: colors.surface }]}
            onPress={() => setCurrentlyEditing(item.id)}
          >
            <View style={styles.imageContainer}>
              {/* If an image is edited (has finalImageUri), show only that image */}
              {item.finalImageUri ? (
                <Image
                  source={{ uri: item.finalImageUri }}
                  style={styles.fullImage}
                  resizeMode="cover"
                />
              ) : (
                /* Otherwise show the car image on top of the default background */
                <>
                  <Image
                    source={DEFAULT_BACKGROUND_IMAGE}
                    style={styles.defaultBackground}
                    resizeMode="cover"
                  />
                  <View style={styles.carImageWrapper}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.carImage}
                      resizeMode="contain"
                    />
                  </View>
                </>
              )}

              {/* Status badge to show if image has been edited */}
              {item.backgroundAdded && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Text style={styles.statusText}>Redigerad</Text>
                </View>
              )}

              {/* Edit button overlay */}
              <View style={styles.editOverlay}>
                <Ionicons name="pencil" size={24} color="#fff" />
              </View>
            </View>

            <View style={styles.photoInfo}>
              <Text style={[styles.angleName, { color: colors.text }]}>
                {getAngleName(item.angleId)}
              </Text>

              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={() => setCurrentlyEditing(item.id)}
              >
                <Ionicons
                  name="brush"
                  size={16}
                  color="#fff"
                  style={styles.editIcon}
                />
                <Text style={styles.editButtonText}>
                  {item.backgroundAdded ? 'Redigera bild' : 'Redigera bild'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Inga bilder tillgängliga för redigering
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.backgroundButton, { backgroundColor: colors.surface }]}
          onPress={openBackgroundSelector}
        >
          <Ionicons
            name="images-outline"
            size={24}
            color={colors.text}
            style={styles.backgroundIcon}
          />
          <Text style={[styles.backgroundButtonText, { color: colors.text }]}>
            Välj bakgrund för alla bilder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.primary }]}
          onPress={handleComplete}
          disabled={processingComplete}
        >
          {processingComplete ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.completeText}>Spara alla bilder</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  photosList: {
    padding: 20,
  },
  photoCard: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
    backgroundColor: '#000', // Black background for better contrast
    overflow: 'hidden',
  },
  defaultBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  carImageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Ensures car image is above background
  },
  carImage: {
    width: '85%', // Makes the car image slightly smaller than container
    height: '85%',
    backgroundColor: 'transparent', // Ensure transparency is preserved
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  // Add an edit overlay to indicate the image is editable
  editOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoInfo: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  angleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  editIcon: {
    marginRight: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  backgroundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  backgroundIcon: {
    marginRight: 10,
  },
  backgroundButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  completeButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
