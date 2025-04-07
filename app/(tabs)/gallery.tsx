import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeProvider';
import { useGallery } from '../../hooks/useGallery';
import ImageViewer from '../../components/ImageViewer';

export default function GalleryScreen() {
  const { colors } = useTheme();
  const { images, deleteImage } = useGallery();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setViewerVisible(true);
  };

  const closeImageViewer = () => {
    setViewerVisible(false);
  };

  if (images.length === 0) {
    return (
      <View style={[styles(colors).container, styles(colors).emptyContainer]}>
        <Text style={styles(colors).emptyText}>Inga bilder sparade än</Text>
      </View>
    );
  }

  if (viewerVisible) {
    return (
      <ImageViewer
        images={images}
        initialImageIndex={selectedImageIndex}
        onClose={closeImageViewer}
      />
    );
  }

  return (
    <View style={styles(colors).container}>
      <Text style={styles(colors).title}>Ditt galleri</Text>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item, index }) => (
          <View style={[styles(colors).imageContainer, { width: '47%' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openImageViewer(index)}
              style={styles(colors).imageTouchable}
            >
              <Image 
                source={{ uri: item.uri }} 
                style={styles(colors).image} 
                contentFit="cover"
                transition={300}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles(colors).deleteButton} 
              onPress={() => deleteImage(item.id)}
            >
              <Text style={styles(colors).deleteText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  imageContainer: {
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  imageTouchable: {
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});