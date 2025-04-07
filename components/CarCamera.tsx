import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CarAngle } from '../types';
import * as ScreenOrientation from 'expo-screen-orientation';

interface CarCameraProps {
  carAngle: CarAngle;
  onPhotoTaken: (uri: string) => void;
  onCancel: () => void;
}

const CarCamera: React.FC<CarCameraProps> = ({ carAngle, onPhotoTaken, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const cameraRef = useRef<CameraView>(null);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  
  // Listen for orientation changes
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };
    
    // Set initial orientation
    updateOrientation();
    
    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    
    // Allow rotation on this screen
    ScreenOrientation.unlockAsync();
    
    return () => {
      // Clean up listener and lock back to portrait when leaving
      subscription.remove();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);
  
  const handleTakePhoto = async () => {
    if (cameraRef.current && !isTakingPhoto) {
      setIsTakingPhoto(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          exif: false,
        });
        
        if (photo) {
          console.log('Foto taget:', photo.uri);
          setTempPhotoUri(photo.uri);
        }
      } catch (error) {
        console.error('Fel vid fotografering:', error);
        alert('Kunde inte ta foto. Försök igen.');
      } finally {
        setIsTakingPhoto(false);
      }
    }
  };

  const handleUsePicture = () => {
    if (tempPhotoUri) {
      onPhotoTaken(tempPhotoUri);
    }
  };
  
  const retakePicture = () => {
    setTempPhotoUri(null);
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

  // If we have a temporary photo, show it with accept/retake buttons
  if (tempPhotoUri) {
    return (
      <View style={styles.container}>
        <View style={[
          styles.previewHeader, 
          orientation === 'landscape' && styles.previewHeaderLandscape
        ]}>
          <TouchableOpacity onPress={retakePicture}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Förhandsvisning</Text>
          <View style={{ width: 28 }} />
        </View>
        
        <Image
          source={{ uri: tempPhotoUri }}
          style={styles.previewImage}
          contentFit="cover"
        />
        
        <View style={[
          styles.previewControls,
          orientation === 'landscape' && styles.previewControlsLandscape
        ]}>
          <TouchableOpacity style={styles.previewButton} onPress={retakePicture}>
            <Text style={styles.previewButtonText}>Ta om</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.previewButton, styles.acceptButton]} 
            onPress={handleUsePicture}
          >
            <Text style={styles.previewButtonText}>Använd foto</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Otherwise show the camera
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        mute={true}
      >
        {/* Top bar med vinkelnamn */}
        <View style={[
          styles.topBar,
          orientation === 'landscape' && styles.topBarLandscape
        ]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onCancel}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.angleText}>{carAngle.name}</Text>
          
          {orientation === 'landscape' ? (
            <View style={styles.orientationBadge}>
              <Ionicons name="phone-landscape" size={20} color="white" />
              <Text style={styles.orientationText}>Landscape Mode</Text>
            </View>
          ) : (
            <View style={styles.orientationBadge}>
              <Ionicons name="phone-portrait" size={20} color="white" />
              <Text style={styles.orientationText}>Portrait Mode</Text>
            </View>
          )}
        </View>
        
        {/* Kontur-/guideöverlägg */}
        {carAngle.outlineImage && (
          <View style={styles.outlineContainer}>
            <Image
              source={carAngle.outlineImage}
              style={[
                styles.outlineImage,
                orientation === 'landscape' ? 
                  { width: windowWidth * 0.6, height: windowHeight * 0.7 } :
                  { width: windowWidth * 0.8, height: windowHeight * 0.5 }
              ]}
              contentFit="contain"
            />
          </View>
        )}
        
        {/* Beskrivningstooltip */}
        <View style={[
          styles.tooltipContainer,
          orientation === 'landscape' && styles.tooltipContainerLandscape
        ]}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              {carAngle.description}
            </Text>
          </View>
        </View>
        
        {/* Bottom controls using Expo's recommended pattern */}
        <View style={[
          styles.shutterContainer,
          orientation === 'landscape' && styles.shutterContainerLandscape
        ]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Avbryt</Text>
          </TouchableOpacity>
          
          <Pressable onPress={handleTakePhoto} disabled={isTakingPhoto}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  { opacity: pressed || isTakingPhoto ? 0.7 : 1 }
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
          
          <View style={{ width: 80 }}></View>
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
  flipButton: {
    padding: 8,
  },
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
    right: 30,
    left: 'auto',
    alignItems: 'flex-end',
    maxWidth: '40%',
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
  // Preview styles
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  previewHeaderLandscape: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 30,
  },
  previewControlsLandscape: {
    paddingBottom: 20,
  },
  previewButton: {
    flex: 1,
    padding: 15,
    margin: 10,
    borderRadius: 10,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34A853',
  },
  previewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default CarCamera;
