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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useCarSession } from '../../hooks/useCarSession';
import { useCarAngles } from '../../hooks/useCarAngles';
import ImageEditor from '../../components/ImageEditor';
import { CarPhoto } from '../../types';

export default function CarEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { activeSession, loading: sessionLoading, updatePhoto, completeSession } = useCarSession();
  const { carAngles } = useCarAngles();
  const [currentlyEditing, setCurrentlyEditing] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  
  // Omdirigera om ingen aktiv session finns
  useEffect(() => {
    if (!sessionLoading && !activeSession) {
      router.replace('/car');
    }
  }, [sessionLoading, activeSession]);
  
  // Hämta exteriörbilder som behöver bakgrunder
  const getExteriorPhotos = () => {
    if (!activeSession) return [];
    
    return activeSession.photos.filter(photo => {
      const angle = carAngles.find(a => a.id === photo.angleId);
      return angle && !angle.isInterior;
    });
  };
  
  // Hantera sparandet av den redigerade bilden
  const handleSaveEdit = async (finalImageUri: string) => {
    if (!currentlyEditing || !activeSession) return;
    
    try {
      await updatePhoto(currentlyEditing, { 
        backgroundAdded: true,
        finalImageUri: finalImageUri
      });
      setCurrentlyEditing(null);
    } catch (error) {
      console.error('Fel vid sparande av redigerad bild:', error);
      Alert.alert('Fel', 'Kunde inte spara den redigerade bilden.');
    }
  };
  
  // Hämta vinkelnamnet för en bild
  const getAngleName = (angleId: string): string => {
    const angle = carAngles.find(a => a.id === angleId);
    return angle ? angle.name : 'Okänd vinkel';
  };
  
  // Kontrollera om all redigering är klar
  const isEditingComplete = (): boolean => {
    const exteriorPhotos = getExteriorPhotos();
    return exteriorPhotos.every(photo => photo.backgroundAdded);
  };
  
  // Hantera avslutning av sessionen
  const handleComplete = async () => {
    if (!activeSession) return;
    
    if (!isEditingComplete()) {
      Alert.alert(
        'Inte färdig',
        'Det finns exteriörbilder som inte har fått en bakgrund än. Vill du fortsätta ändå?',
        [
          { text: 'Nej', style: 'cancel' },
          { text: 'Ja', onPress: finishSession }
        ]
      );
    } else {
      finishSession();
    }
  };
  
  const finishSession = async () => {
    setProcessingComplete(true);
    try {
      await completeSession();
      Alert.alert(
        'Klart!',
        'Fotosessionen är avslutad. Bilderna har sparats.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte avsluta sessionen.');
    } finally {
      setProcessingComplete(false);
    }
  };
  
  if (sessionLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (currentlyEditing) {
    const photo = activeSession?.photos.find(p => p.id === currentlyEditing);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Lägg till bakgrunder</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Redigera exteriörbilder för att lägga till bakgrund
      </Text>
      
      <FlatList
        data={getExteriorPhotos()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.photosList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.photoItem, { backgroundColor: colors.surface }]}
            onPress={() => setCurrentlyEditing(item.id)}
          >
            <Image 
              source={{ uri: item.finalImageUri || item.uri }} 
              style={styles.photoThumbnail}
              resizeMode="cover"
            />
            
            <View style={styles.photoInfo}>
              <Text style={[styles.angleName, { color: colors.text }]}>
                {getAngleName(item.angleId)}
              </Text>
              
              <View style={[
                styles.statusBadge, 
                { backgroundColor: item.backgroundAdded ? colors.success : colors.warning }
              ]}>
                <Text style={styles.statusText}>
                  {item.backgroundAdded ? 'Bakgrund tillagd' : 'Behöver bakgrund'}
                </Text>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Inga exteriörbilder tillgängliga
            </Text>
          </View>
        }
      />
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.primary }]}
          onPress={handleComplete}
          disabled={processingComplete}
        >
          {processingComplete ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.completeText}>Avsluta och spara bilder</Text>
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
    paddingHorizontal: 15,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
  },
  photoThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  photoInfo: {
    flex: 1,
    marginLeft: 15,
  },
  angleName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
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
  completeButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
