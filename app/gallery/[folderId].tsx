import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeProvider';
import { useGallery, GalleryImage } from '../../hooks/useGallery';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ImageViewer from '../../components/ImageViewer';

const { width: screenWidth } = Dimensions.get('window');

export default function FolderDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const { folders, getImagesForFolder, deleteImage } = useGallery();

  const [folderImages, setFolderImages] = useState<GalleryImage[]>([]);
  const [folderName, setFolderName] = useState('');

  // State for full-screen viewer
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Load folder data on mount
  useEffect(() => {
    if (folderId) {
      // Get folder name
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        setFolderName(folder.name);
      }

      // Get images for this folder
      const images = getImagesForFolder(folderId);
      setFolderImages(images);
    }
  }, [folderId, folders]);

  // Open full-screen image viewer
  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setViewerVisible(true);
  };

  // Handle delete image
  const handleDeleteImage = (imageId: string) => {
    deleteImage(imageId);
    // Update local state to remove the deleted image
    setFolderImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  // Render image grid item
  const renderImageItem = ({ item, index }: any) => (
    <TouchableOpacity
      style={styles(colors).imageItem}
      onPress={() => openImageViewer(index)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles(colors).image}
        contentFit="cover"
      />

      {item.metadata?.angleName && (
        <View style={styles(colors).imageLabel}>
          <Text style={styles(colors).imageLabelText}>
            {item.metadata.angleName}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles(colors).deleteButton}
        onPress={() => handleDeleteImage(item.id)}
      >
        <Ionicons name="trash-outline" size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Full-screen image viewer
  if (viewerVisible) {
    return (
      <ImageViewer
        images={folderImages}
        initialImageIndex={selectedImageIndex}
        onClose={() => setViewerVisible(false)}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          title: folderName,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          presentation: 'modal',
          headerBackTitle: 'Tillbaka',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles(colors).container}>
        {folderImages.length > 0 ? (
          <FlatList
            data={folderImages}
            keyExtractor={(item) => item.id}
            renderItem={renderImageItem}
            numColumns={3}
            contentContainerStyle={styles(colors).gridContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles(colors).emptyContainer}>
            <Text style={styles(colors).emptyText}>
              Inga bilder i denna mapp
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gridContainer: {
      padding: 5,
    },
    imageItem: {
      width: (screenWidth - 40) / 3,
      height: (screenWidth - 40) / 3,
      margin: 5,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageLabel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    imageLabelText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '500',
    },
    deleteButton: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 15,
      width: 26,
      height: 26,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
