/* import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useCarSession } from '../../hooks/useCarSession';
import { useCarAngles } from '../../hooks/useCarAngles';
import { getCarFullName, hasAllRequiredAngles } from '../../utils/helpers';
import CarCamera from '../../components/CarCamera';
import { useDummyRemoveBg } from '../../hooks/useDummyRemoveBg';

export default function CarAnglesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    activeSession,
    loading: sessionLoading,
    addPhoto,
    getPhotosForAngle,
  } = useCarSession();
  const { carAngles, getExteriorAngles, getInteriorAngles, getRequiredAngles } =
    useCarAngles();
  const [showCamera, setShowCamera] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { removeBg } = useDummyRemoveBg();

  // Redirect if no active session
  useEffect(() => {
    if (!sessionLoading && !activeSession) {
      router.replace('/car');
    }
  }, [sessionLoading, activeSession]);

  // Get photographed angles
  const getPhotographedAngles = (): string[] => {
    if (!activeSession) return [];
    return activeSession.photos.map((photo) => photo.angleId);
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!activeSession) return { exterior: 0, interior: 0, total: 0 };

    const photographed = getPhotographedAngles();
    const exterior = getExteriorAngles().filter((angle) =>
      photographed.includes(angle.id)
    ).length;
    const interior = getInteriorAngles().filter((angle) =>
      photographed.includes(angle.id)
    ).length;

    return {
      exterior,
      interior,
      exteriorTotal: getExteriorAngles().length,
      interiorTotal: getInteriorAngles().length,
      total: photographed.length,
      totalAngles: getExteriorAngles().length + getInteriorAngles().length,
    };
  };

  // Handle when a photo is taken
  const handlePhotoTaken = async (photoUri: string, angleId: string) => {
    if (!activeSession) return;

    setProcessing(true);
    try {
      // Process the image through the background removal service
      console.log('Bearbetar bild...');
      const processedImageUri = await removeBg(photoUri);

      // Add the photo to the session
      await addPhoto(processedImageUri, angleId);

      // Stay in camera mode to continue taking photos of other angles
    } catch (error) {
      console.error('Fel vid bildbehandling:', error);
      Alert.alert(
        'Bearbetningsfel',
        'Kunde inte bearbeta bilden. Vill du försöka igen?',
        [
          { text: 'Ja', onPress: () => {} }, // Just stay in camera mode
          { text: 'Avbryt kameravy', onPress: () => setShowCamera(false) },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle completion check
  const handleContinue = () => {
    if (!activeSession) return;

    const requiredAngles = getRequiredAngles().map((a) => a.id);
    const hasAllRequired = hasAllRequiredAngles(
      activeSession.photos,
      requiredAngles
    );

    if (!hasAllRequired) {
      Alert.alert(
        'Saknade bilder',
        'Alla obligatoriska vinklar har inte fotograferats. Vill du fortsätta ändå?',
        [
          { text: 'Nej', style: 'cancel' },
          { text: 'Ja', onPress: () => router.push('/car/edit') },
        ]
      );
    } else {
      router.push('/car/edit');
    }
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

  if (showCamera || processing) {
    return (
      <View style={{ flex: 1 }}>
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingText}>Bearbetar bild...</Text>
          </View>
        )}

        <CarCamera
          exteriorAngles={getExteriorAngles()}
          interiorAngles={getInteriorAngles()}
          onPhotoTaken={handlePhotoTaken}
          onCancel={() => setShowCamera(false)}
          photographedAngles={getPhotographedAngles()}
        />
      </View>
    );
  }

  const progress = calculateProgress();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Fotografera bil
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {activeSession && (
        <Text style={[styles.carName, { color: colors.text }]}>
          {getCarFullName(
            activeSession.carMake,
            activeSession.carModel,
            activeSession.year
          )}
        </Text>
      )}

      <View style={styles.cameraPromptContainer}>
        <Text style={[styles.cameraPromptText, { color: colors.text }]}>
          Tryck på knappen nedan för att börja fotografera din bil
        </Text>

        <TouchableOpacity
          style={[
            styles.startCameraButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => setShowCamera(true)}
        >
          <Ionicons
            name="camera"
            size={24}
            color="#fff"
            style={styles.cameraIcon}
          />
          <Text style={styles.startCameraText}>Öppna kamera</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            Fotostatus
          </Text>

          <View style={styles.progressItem}>
            <Text
              style={[styles.progressLabel, { color: colors.textSecondary }]}
            >
              Exteriör:
            </Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>
              {progress.exterior} av {progress.exteriorTotal} vinklar
            </Text>
          </View>

          <View style={styles.progressItem}>
            <Text
              style={[styles.progressLabel, { color: colors.textSecondary }]}
            >
              Interiör:
            </Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>
              {progress.interior} av {progress.interiorTotal} vinklar
            </Text>
          </View>

          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.background2 },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(progress.total / progress.totalAngles) * 100}%`,
                },
              ]}
            />
          </View>

          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Totalt: {progress.total} av {progress.totalAngles} vinklar
            fotograferade
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Fortsätt till redigering</Text>
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
  carName: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
  },
  cameraPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraPromptText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  startCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 30,
  },
  cameraIcon: {
    marginRight: 10,
  },
  startCameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginVertical: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  continueButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  processingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewToggleText: {
    fontWeight: 'bold',
  },
});
 */
