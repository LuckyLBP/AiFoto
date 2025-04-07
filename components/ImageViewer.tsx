import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GalleryImage } from '../types';

interface ImageViewerProps {
  images: GalleryImage[];
  initialImageIndex: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialImageIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  
  const goToNextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const goToPreviousImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const showNavButtons = images.length > 1;
  const currentImage = images[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>
      
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: currentImage.uri }}
          style={styles.image}
          contentFit="contain"
        />
      </View>
      
      {/* Navigation buttons */}
      {showNavButtons && (
        <>
          {currentIndex > 0 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.leftButton]} 
              onPress={goToPreviousImage}
            >
              <Ionicons name="chevron-back" size={40} color="#fff" />
            </TouchableOpacity>
          )}
          
          {currentIndex < images.length - 1 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.rightButton]} 
              onPress={goToNextImage}
            >
              <Ionicons name="chevron-forward" size={40} color="#fff" />
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
  },
  leftButton: {
    left: 15,
  },
  rightButton: {
    right: 15,
  }
});

export default ImageViewer;
