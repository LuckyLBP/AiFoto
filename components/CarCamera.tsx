import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import {
  Camera,
  CameraView,
  CameraType,
  useCameraPermissions,
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CarAngle } from '../types';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as ImagePicker from 'expo-image-picker';

interface CarCameraProps {
  exteriorAngles: CarAngle[];
  interiorAngles: CarAngle[];
  onPhotoTaken: (uri: string, angleId: string) => void;
  onCancel: () => void;
  onDone: () => void; // New prop to handle done/continue to editing
  photographedAngles: string[]; // Array of photographed angle IDs
}

const CarCamera: React.FC<CarCameraProps> = ({
  exteriorAngles,
  interiorAngles,
  onPhotoTaken,
  onCancel,
  onDone,
  photographedAngles,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );
  const [viewMode, setViewMode] = useState<'exterior' | 'interior'>('exterior');
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const angleListRef = useRef<FlatList>(null);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  // Get all angles based on current view mode
  const angles = viewMode === 'exterior' ? exteriorAngles : interiorAngles;

  // Get current angle
  const currentAngle =
    angles[currentAngleIndex] || (angles.length > 0 ? angles[0] : null);

  // Reset angle index when switching between interior/exterior
  useEffect(() => {
    setCurrentAngleIndex(0);
  }, [viewMode]);

  // Listen for orientation changes
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    // Set initial orientation
    updateOrientation();

    // Listen for dimension changes
    const subscription = Dimensions.addEventListener(
      'change',
      updateOrientation
    );

    // Allow rotation on this screen
    ScreenOrientation.unlockAsync();

    return () => {
      // Clean up listener and lock back to portrait when leaving
      subscription.remove();
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  // Scroll to selected angle
  useEffect(() => {
    if (angleListRef.current && angles.length > 0) {
      angleListRef.current.scrollToIndex({
        index: currentAngleIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentAngleIndex, angles]);

  const handleTakePhoto = async () => {
    if (!currentAngle) return;

    if (cameraRef.current && !isTakingPhoto) {
      setIsTakingPhoto(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          exif: false,
        });

        if (photo) {
          console.log('Foto taget:', photo.uri);
          // Pass both the photo URI and the current angle ID
          onPhotoTaken(photo.uri, currentAngle.id);
        }
      } catch (error) {
        console.error('Fel vid fotografering:', error);
        alert('Kunde inte ta foto. Försök igen.');
      } finally {
        setIsTakingPhoto(false);
      }
    }
  };

  const handleUploadImage = async () => {
    if (!currentAngle) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Bild uppladdad:', selectedImage.uri);
        onPhotoTaken(selectedImage.uri, currentAngle.id);
      }
    } catch (error) {
      console.error('Fel vid uppladdning:', error);
      alert('Kunde inte ladda upp bilden. Försök igen.');
    }
  };

  const handleAngleSelect = (index: number) => {
    setCurrentAngleIndex(index);
  };

  const isAnglePhotographed = (angleId: string): boolean => {
    return photographedAngles.includes(angleId);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Ingen åtkomst till kameran</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Ge tillstånd</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show the camera with the angle slider
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} mute={true}>
        {/* Top bar med vinkelnamn och växla mellan inre/yttre */}
        <View
          style={[
            styles.topBar,
            orientation === 'landscape' && styles.topBarLandscape,
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={onCancel}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          {/* New Done button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onDone}
            disabled={photographedAngles.length === 0}
          >
            <Text
              style={[
                styles.doneButtonText,
                photographedAngles.length === 0 && styles.disabledText,
              ]}
            >
              Klar ({photographedAngles.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Kontur-/guideöverlägg */}
        {currentAngle && currentAngle.outlineImage && (
          <View style={styles.outlineContainer}>
            <Image
              source={currentAngle.outlineImage}
              style={[
                styles.outlineImage,
                orientation === 'landscape'
                  ? { width: windowWidth * 0.6, height: windowHeight * 0.7 }
                  : { width: windowWidth * 0.8, height: windowHeight * 0.5 },
              ]}
              contentFit="contain"
            />
          </View>
        )}

        {/* Angles slider */}
        <View
          style={[
            styles.angleSliderContainer,
            orientation === 'landscape' && styles.angleSliderContainerLandscape,
          ]}
        >
          <FlatList
            ref={angleListRef}
            data={angles}
            horizontal={orientation === 'portrait'}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onScrollToIndexFailed={() => {}}
            contentContainerStyle={
              orientation === 'landscape'
                ? styles.angleListContainerLandscape
                : styles.angleListContainer
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.angleItem,
                  currentAngleIndex === index && styles.selectedAngleItem,
                  orientation === 'landscape' && styles.angleItemLandscape,
                ]}
                onPress={() => handleAngleSelect(index)}
              >
                {isAnglePhotographed(item.id) && (
                  <View style={styles.checkmarkBadge}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
                <Text
                  style={[
                    styles.angleItemText,
                    currentAngleIndex === index && styles.selectedAngleItemText,
                  ]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                {item.requiredForListing && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Obligatorisk</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Beskrivningstooltip */}
        {currentAngle && (
          <View
            style={[
              styles.tooltipContainer,
              orientation === 'landscape' && styles.tooltipContainerLandscape,
            ]}
          >
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>{currentAngle.description}</Text>
            </View>
          </View>
        )}

        {/* Bottom controls with upload button */}
        <View
          style={[
            styles.shutterContainer,
            orientation === 'landscape' && styles.shutterContainerLandscape,
          ]}
        >
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Avbryt</Text>
          </TouchableOpacity>

          {/* Camera shutter button */}
          <Pressable onPress={handleTakePhoto} disabled={isTakingPhoto}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  { opacity: pressed || isTakingPhoto ? 0.7 : 1 },
                ]}
              >
                {isTakingPhoto ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.shutterBtnInner} />
                )}
              </View>
            )}
          </Pressable>

          {/* Upload button */}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadImage}
            disabled={isTakingPhoto}
          >
            <Ionicons name="images" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  topBarLandscape: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  viewToggleButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewToggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // ...existing styles...

  // Updated styles for upload button
  uploadButton: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // New styles for done button
  doneButton: {
    backgroundColor: 'rgba(52, 168, 83, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledText: {
    opacity: 0.5,
  },

  // Existing styles remain the same
  angleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orientationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  orientationText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 6,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  outlineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineImage: {
    opacity: 0.6,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipContainerLandscape: {
    bottom: 30,
    alignItems: 'flex-end',
    right: 'auto',
  },
  tooltip: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    maxWidth: '80%',
  },
  tooltipText: {
    color: 'white',
    textAlign: 'center',
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  shutterContainerLandscape: {
    right: 30,
    left: 'auto',
    bottom: '50%',
    width: 'auto',
    flexDirection: 'column',
    justifyContent: 'center',
    transform: [{ translateY: 50 }],
  },
  cancelButton: {
    width: 80,
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  shutterBtn: {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'white',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Angle slider styles
  angleSliderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 110,
    height: 70,
  },
  angleSliderContainerLandscape: {
    top: 0,
    bottom: 0,
    right: 'auto',
    width: 90,
    height: '100%',
    paddingTop: 80,
    paddingBottom: 50,
  },
  angleListContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  angleListContainerLandscape: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  angleItem: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 6,
    width: 100,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  angleItemLandscape: {
    marginVertical: 6,
    marginHorizontal: 0,
    width: 80,
  },
  selectedAngleItem: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: '#fff',
    borderWidth: 2,
  },
  angleItemText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedAngleItemText: {
    color: 'white',
    fontWeight: 'bold',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#34A853',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requiredBadge: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: 'rgba(251, 188, 5, 0.7)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 8,
    color: '#000',
  },
});

export default CarCamera;
