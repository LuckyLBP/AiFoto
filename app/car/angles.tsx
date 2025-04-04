import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert
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
  const { activeSession, loading: sessionLoading, addPhoto, getPhotosForAngle } = useCarSession();
  const { carAngles, getExteriorAngles, getInteriorAngles, getRequiredAngles } = useCarAngles();
  const [activeCameraAngle, setActiveCameraAngle] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'exterior' | 'interior'>('exterior');
  const [processing, setProcessing] = useState(false);
  const { removeBg } = useDummyRemoveBg();
  
  // Redirect if no active session
  useEffect(() => {
    if (!sessionLoading && !activeSession) {
      router.replace('/car');
    }
  }, [sessionLoading, activeSession]);
  
  // Handle when a photo is taken
  const handlePhotoTaken = async (photoUri: string) => {
    if (!activeCameraAngle || !activeSession) return;
    
    setProcessing(true);
    try {
      // Process the image through the background removal service
      console.log('Bearbetar bild...');
      const processedImageUri = await removeBg(photoUri);
      
      // Add the photo to the session
      await addPhoto(processedImageUri, activeCameraAngle.id);
      setActiveCameraAngle(null);
    } catch (error) {
      console.error('Fel vid bildbehandling:', error);
      Alert.alert(
        'Bearbetningsfel',
        'Kunde inte bearbeta bilden. Vill du försöka igen?',
        [
          { text: 'Ja', onPress: () => setActiveCameraAngle(activeCameraAngle) },
          { text: 'Nej', onPress: () => setActiveCameraAngle(null) }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };
  
  // Check if an angle has been photographed
  const isAnglePhotographed = (angleId: string): boolean => {
    if (!activeSession) return false;
    return getPhotosForAngle(angleId).length > 0;
  };
  
  // Get the display angles based on the current view mode
  const getDisplayAngles = () => {
    return viewMode === 'exterior' ? getExteriorAngles() : getInteriorAngles();
  };
  
  // Handle completion check
  const handleContinue = () => {
    if (!activeSession) return;
    
    const requiredAngles = getRequiredAngles().map(a => a.id);
    const hasAllRequired = hasAllRequiredAngles(activeSession.photos, requiredAngles);
    
    if (!hasAllRequired) {
      Alert.alert(
        'Saknade bilder',
        'Alla obligatoriska vinklar har inte fotograferats. Vill du fortsätta ändå?',
        [
          { text: 'Nej', style: 'cancel' },
          { text: 'Ja', onPress: () => router.push('/car/edit') }
        ]
      );
    } else {
      router.push('/car/edit');
    }
  };
  
  if (sessionLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (activeCameraAngle) {
    return (
      <CarCamera
        carAngle={activeCameraAngle}
        onPhotoTaken={handlePhotoTaken}
        onCancel={() => setActiveCameraAngle(null)}
      />
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>Bearbetar bild...</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Fotografera bil</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {activeSession && (
        <Text style={[styles.carName, { color: colors.text }]}>
          {getCarFullName(activeSession.carMake, activeSession.carModel, activeSession.year)}
        </Text>
      )}
      
      <View style={styles.viewToggle}>
        <TouchableOpacity 
          style={[
            styles.viewToggleButton, 
            viewMode === 'exterior' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setViewMode('exterior')}
        >
          <Text style={[
            styles.viewToggleText,
            viewMode === 'exterior' && { color: '#fff' }
          ]}>
            Exteriör
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.viewToggleButton, 
            viewMode === 'interior' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setViewMode('interior')}
        >
          <Text style={[
            styles.viewToggleText,
            viewMode === 'interior' && { color: '#fff' }
          ]}>
            Interiör
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={getDisplayAngles()}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.anglesList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.angleItem, 
              { backgroundColor: colors.surface },
              isAnglePhotographed(item.id) && styles.photographedAngle
            ]} 
            onPress={() => setActiveCameraAngle(item)}
          >
            {isAnglePhotographed(item.id) && (
              <View style={styles.checkmarkBadge}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
            
            {item.outlineImage && (
              <Image 
                source={item.outlineImage} 
                style={styles.angleOutline}
                resizeMode="contain"
              />
            )}
            
            <Text style={[styles.angleName, { color: colors.text }]}>{item.name}</Text>
            
            {item.requiredForListing && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Obligatorisk</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      
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
  anglesList: {
    padding: 10,
  },
  angleItem: {
    flex: 1,
    margin: 8,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    height: 150,
    justifyContent: 'center',
    position: 'relative',
  },
  photographedAngle: {
    borderWidth: 2,
    borderColor: '#34A853',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#34A853',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  angleOutline: {
    width: 80,
    height: 80,
    opacity: 0.7,
    marginBottom: 10,
  },
  angleName: {
    textAlign: 'center',
    fontWeight: '500',
  },
  requiredBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(251, 188, 5, 0.7)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    color: '#000',
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
});
