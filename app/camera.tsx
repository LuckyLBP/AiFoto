import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDummyRemoveBg } from '../hooks/useDummyRemoveBg'; // Changed to dummy hook
import * as FileSystem from 'expo-file-system';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const { removeBg } = useDummyRemoveBg(); // Using dummy hook

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  async function handleTakePhoto() {
    if (cameraRef.current && !isTakingPhoto) {
      setIsTakingPhoto(true);
      try {
        // Take the photo
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          exif: false,
        });
        
        console.log('Photo taken:', photo.uri);
        
        // Process the image through the dummy API
        try {
          const processedImageUri = await removeBg(photo.uri);
          
          // Return to the home screen with the processed image
          router.push({
            pathname: '/',
            params: { imageUri: processedImageUri }
          });
        } catch (error) {
          console.error('Error processing image:', error);
          // If processing fails, just return the original image
          router.push({
            pathname: '/',
            params: { imageUri: photo.uri }
          });
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        alert('Failed to take photo. Please try again.');
      } finally {
        setIsTakingPhoto(false);
      }
    }
  }

  function handleDone() {
    // Return to previous screen
    router.back();
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        {/* Top bar with back button */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleDone}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
            <Ionicons name="camera-reverse" size={28} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Camera grid overlay for better composition */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}></View>
            <View style={styles.gridCell}></View>
            <View style={styles.gridCell}></View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}></View>
            <View style={styles.gridCell}></View>
            <View style={styles.gridCell}></View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}></View>
            <View style={styles.gridCell}></View>
            <View style={styles.gridCell}></View>
          </View>
        </View>
        
        {/* Bottom control bar */}
        <View style={styles.controlBar}>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={handleTakePhoto}
            disabled={isTakingPhoto}
          >
            {isTakingPhoto ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.captureButtonInner}></View>
            )}
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}></View> {/* Empty space for balance */}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  flipButton: {
    padding: 8,
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  doneButton: {
    flex: 1,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
