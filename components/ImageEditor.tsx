import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Dimensions,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { EditableImage, Background } from '../types';
import { useBackgrounds } from '../hooks/useBackgrounds';

interface ImageEditorProps {
  processedImage: string;
  onSave: (finalImage: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ processedImage, onSave, onCancel }) => {
  const [editableImage, setEditableImage] = useState<EditableImage>({
    uri: processedImage,
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { backgrounds, selectedBackground, selectBackground } = useBackgrounds();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        setEditableImage(prev => ({
          ...prev,
          position: {
            x: prev.position.x + gestureState.dx,
            y: prev.position.y + gestureState.dy
          }
        }));
      },
      onPanResponderRelease: () => {
        // Du kan lägga till gränskontroller här
      },
    })
  ).current;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // I en riktig app skulle du använda react-native-view-shot eller ett liknande bibliotek
      // för att ta en bild av den slutliga kompositionen
      // För nu, simulerar vi bara detta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Returnerar bara den bearbetade bilden för närvarande
      // I verkligheten skulle detta vara en ny bild med bilen placerad på bakgrunden
      onSave(processedImage);
    } catch (error) {
      console.error('Fel vid sparande av bild:', error);
      alert('Kunde inte spara bild. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScaleChange = (value: number) => {
    setEditableImage(prev => ({
      ...prev,
      scale: value
    }));
  };

  const handleRotationChange = (value: number) => {
    setEditableImage(prev => ({
      ...prev,
      rotation: value * 180 // Konvertera skjutreglagets värde (0-1) till grader (0-180)
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redigera bild</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <Text style={styles.saveText}>Spara</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.editorCanvas}>
        {/* Bakgrundsbild */}
        {selectedBackground && (
          <Image 
            source={selectedBackground.uri} 
            style={styles.backgroundImage} 
            resizeMode="cover"
          />
        )}
        
        {/* Bilbild - flyttbar med panResponder */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.carImageContainer,
            {
              transform: [
                { translateX: editableImage.position.x },
                { translateY: editableImage.position.y },
                { scale: editableImage.scale },
                { rotate: `${editableImage.rotation}deg` }
              ]
            }
          ]}
        >
          <Image source={{ uri: processedImage }} style={styles.carImage} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {/* Bakgrundsväljare */}
        <Text style={styles.controlLabel}>Bakgrund</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.backgroundSelector}>
          {backgrounds.map(bg => (
            <TouchableOpacity 
              key={bg.id}
              style={[
                styles.backgroundOption,
                selectedBackground?.id === bg.id && styles.selectedBackground
              ]}
              onPress={() => selectBackground(bg)}
            >
              <Image source={bg.uri} style={styles.backgroundThumbnail} />
              <Text style={styles.backgroundName}>{bg.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bildkontroller */}
        <View style={styles.imageControls}>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Storlek</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2}
              value={editableImage.scale}
              onValueChange={handleScaleChange}
              minimumTrackTintColor="#4285F4"
              maximumTrackTintColor="#D1D1D1"
            />
          </View>

          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Rotation</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={editableImage.rotation / 180}
              onValueChange={handleRotationChange}
              minimumTrackTintColor="#4285F4"
              maximumTrackTintColor="#D1D1D1"
            />
          </View>
        </View>

        <View style={styles.helpTextContainer}>
          <Text style={styles.helpText}>
            Dra bilden för att placera den mot bakgrunden
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editorCanvas: {
    flex: 1,
    backgroundColor: '#eee',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  carImageContainer: {
    position: 'absolute',
    top: '20%',
    left: '25%',
    width: '50%',
    height: '50%',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  backgroundSelector: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  backgroundOption: {
    marginRight: 10,
    alignItems: 'center',
    width: 80,
  },
  selectedBackground: {
    borderWidth: 2,
    borderColor: '#4285F4',
    borderRadius: 10,
  },
  backgroundThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 5,
  },
  backgroundName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  imageControls: {
    marginBottom: 15,
  },
  controlGroup: {
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  helpTextContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  helpText: {
    color: '#666',
    fontSize: 14,
  },
});

export default ImageEditor;
