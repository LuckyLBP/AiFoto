import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeProvider';
import { useGallery, GalleryImage } from '../../hooks/useGallery';
import ImageViewer from '../../components/ImageViewer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function GalleryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { folders, isLoading, refreshGallery } = useGallery();

  // State for full-screen viewer
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<GalleryImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Load on mount
  useEffect(() => {
    refreshGallery();
  }, []);

  // Open folder detail modal using Expo Router
  const openFolderDetail = (folderId: string) => {
    router.push({
      pathname: '/gallery/[folderId]',
      params: { folderId },
    });
  };

  // Open full-screen image viewer
  const openImageViewer = (images: GalleryImage[], index: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(index);
    setViewerVisible(true);
  };

  // Close full-screen image viewer
  const closeImageViewer = () => {
    setViewerVisible(false);
  };

  // Render folder grid item
  const renderFolderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles(colors).folderItem}
      onPress={() => openFolderDetail(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles(colors).folderImageContainer}>
        <Image
          source={{ uri: item.coverImage }}
          style={styles(colors).folderCoverImage}
          contentFit="cover"
        />
      </View>
      <View style={styles(colors).folderInfo}>
        <Text style={styles(colors).folderName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles(colors).folderCount}>
          {item.imageCount} {item.imageCount === 1 ? 'bild' : 'bilder'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Loading view
  if (isLoading) {
    return (
      <View style={[styles(colors).container, styles(colors).centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles(colors).emptyText, { marginTop: 20 }]}>
          Laddar bilder...
        </Text>
      </View>
    );
  }

  // Empty state
  if (folders.length === 0) {
    return (
      <View style={[styles(colors).container, styles(colors).centerContent]}>
        <Ionicons
          name="images-outline"
          size={80}
          color={colors.textSecondary}
          style={{ opacity: 0.5 }}
        />
        <Text style={styles(colors).emptyText}>Inga bilder sparade än</Text>
        <Text style={styles(colors).emptySubtext}>
          Bilder du sparar kommer att visas här
        </Text>
      </View>
    );
  }

  // Full-screen image viewer
  if (viewerVisible && selectedImages.length > 0) {
    return (
      <ImageViewer
        images={selectedImages}
        initialImageIndex={selectedImageIndex}
        onClose={closeImageViewer}
      />
    );
  }

  return (
    <View style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).title}>Mitt galleri</Text>
      </View>

      {/* Folders grid */}
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        renderItem={renderFolderItem}
        numColumns={2}
        columnWrapperStyle={styles(colors).gridRow}
        contentContainerStyle={styles(colors).gridContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 20,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    gridContainer: {
      padding: 10,
      paddingBottom: 100, // Extra padding at bottom
    },
    gridRow: {
      justifyContent: 'space-between',
      marginHorizontal: 10,
    },
    folderItem: {
      width: screenWidth / 2 - 25,
      marginBottom: 20,
      borderRadius: 12,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    folderImageContainer: {
      width: '100%',
      height: screenWidth / 2 - 25, // Square aspect ratio
      backgroundColor: '#eee', // Placeholder color
    },
    folderCoverImage: {
      width: '100%',
      height: '100%',
    },
    folderInfo: {
      padding: 12,
    },
    folderName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    folderCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
