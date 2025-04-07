import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import ViewShot from "react-native-view-shot";
import { Ionicons } from '@expo/vector-icons';
import { EditableImage, Background } from '../types';
import { useBackgrounds } from '../hooks/useBackgrounds';

interface ImageEditorProps {
  processedImage: string;
  onSave: (finalImage: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ processedImage, onSave, onCancel }) => {
  const defaultImageState = {
    uri: processedImage,
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0
  };
  
  const [editableImage, setEditableImage] = useState<EditableImage>(defaultImageState);
  const [isLoading, setIsLoading] = useState(false);
  const { backgrounds, selectedBackground, selectBackground } = useBackgrounds();
  
  // Get screen dimensions for boundary checks
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const editorCanvasRef = useRef<View>(null);
  const [canvasBounds, setCanvasBounds] = useState({ 
    width: screenWidth, 
    height: screenHeight / 2, // Default estimate for canvas height
    x: 0,
    y: 0
  });
  
  // Track the last gesture state to avoid jumps between gestures
  const lastGesture = useRef({
    dx: 0, 
    dy: 0, 
    initialDistance: 0,
    initialRotation: 0,
    lastScale: 1,
    lastRotation: 0,
    // Add a flag to track when we're in the middle of a scale/rotate gesture
    isScalingOrRotating: false
  });

  // Measure the canvas bounds when mounted
  useEffect(() => {
    if (editorCanvasRef.current) {
      editorCanvasRef.current.measure((x, y, width, height, pageX, pageY) => {
        setCanvasBounds({
          width,
          height,
          x: pageX,
          y: pageY
        });
      });
    }
  }, []);
  
  // Helper function to calculate distance between two points
  const getDistance = (touch1: { pageX: number, pageY: number }, touch2: { pageX: number, pageY: number }): number => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Helper function to calculate angle between two points
  const getAngle = (touch1: { pageX: number, pageY: number }, touch2: { pageX: number, pageY: number }): number => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.atan2(dy, dx);
  };

  // PanResponder to handle dragging, pinch to zoom, and rotation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        // Reset the accumulated delta on new gesture
        lastGesture.current.dx = 0;
        lastGesture.current.dy = 0;
        
        // For pinch and rotation, store initial state
        if (event.nativeEvent.touches.length === 2) {
          const touch1 = event.nativeEvent.touches[0];
          const touch2 = event.nativeEvent.touches[1];
          
          // Store both initial distance and rotation angle
          lastGesture.current.initialDistance = getDistance(touch1, touch2);
          lastGesture.current.initialRotation = getAngle(touch1, touch2);
          
          // Remember the current scale and rotation when starting the gesture
          lastGesture.current.lastScale = editableImage.scale;
          lastGesture.current.lastRotation = editableImage.rotation;
          lastGesture.current.isScalingOrRotating = true;
        }
      },
      onPanResponderMove: (event, gestureState) => {
        // Single finger drag - handle position with better sensitivity
        if (event.nativeEvent.touches.length === 1) {
          // If we were previously scaling/rotating, we need to reset
          if (lastGesture.current.isScalingOrRotating) {
            lastGesture.current.isScalingOrRotating = false;
            return; // Skip this move event to avoid jumps
          }
          
          // Calculate the deltas since the last move event
          const deltaX = gestureState.dx - lastGesture.current.dx;
          const deltaY = gestureState.dy - lastGesture.current.dy;
          
          // Store the current gestureState for next comparison
          lastGesture.current.dx = gestureState.dx;
          lastGesture.current.dy = gestureState.dy;
          
          setEditableImage(prev => {
            // Apply a dampening factor to make movements less sensitive
            const dampening = 0.5; // Adjust this factor as needed for smoother movement
            const newX = prev.position.x + deltaX * dampening;
            const newY = prev.position.y + deltaY * dampening;
            
            // Calculate bounds with more flexibility to keep image visible
            const imageWidth = canvasBounds.width * prev.scale * 0.25;
            const imageHeight = canvasBounds.height * prev.scale * 0.25;
            
            const minX = -imageWidth;
            const maxX = canvasBounds.width - imageWidth;
            const minY = -imageHeight;
            const maxY = canvasBounds.height - imageHeight;
            
            // Apply boundaries
            const boundedX = Math.min(Math.max(newX, minX), maxX);
            const boundedY = Math.min(Math.max(newY, minY), maxY);
            
            return {
              ...prev,
              position: {
                x: boundedX,
                y: boundedY
              }
            };
          });
        }
        // Two finger gesture - handle scale and rotation separately
        else if (event.nativeEvent.touches.length === 2) {
          const touch1 = event.nativeEvent.touches[0];
          const touch2 = event.nativeEvent.touches[1];
          
          // Calculate current values
          const currentDistance = getDistance(touch1, touch2);
          
          // Prevent division by zero or very small numbers
          if (lastGesture.current.initialDistance < 1) {
            lastGesture.current.initialDistance = currentDistance;
            return;
          }
          
          const currentAngle = getAngle(touch1, touch2);
          
          // Apply smoothing to scale changes to prevent jumpiness
          // Only apply a fraction of the scale change per frame
          const smoothingFactor = 0.3; // Adjust for more/less smoothing (0.1-0.5 range works well)
          
          // Calculate the relative scale change from the initial pinch with smoothing
          const rawScaleFactor = currentDistance / lastGesture.current.initialDistance;
          const smoothedScaleFactor = 1 + (rawScaleFactor - 1) * smoothingFactor;
          
          // Calculate the change in rotation in degrees with the same smoothing
          const rawRotationDelta = (currentAngle - lastGesture.current.initialRotation) * (180 / Math.PI);
          const smoothedRotationDelta = rawRotationDelta * smoothingFactor;
          
          setEditableImage(prev => {
            // Calculate new scale with bounds
            const newScale = Math.min(Math.max(prev.scale * smoothedScaleFactor, 0.3), 3);
            
            // Apply rotation with smoothing
            const newRotation = prev.rotation + smoothedRotationDelta;
            
            // Update the reference values for next calculation
            lastGesture.current.lastScale = newScale;
            lastGesture.current.lastRotation = newRotation;
            lastGesture.current.initialDistance = currentDistance;
            lastGesture.current.initialRotation = currentAngle;
            
            return {
              ...prev,
              scale: newScale,
              rotation: newRotation
            };
          });
        }
      },
      onPanResponderRelease: () => {
        // On release, reset the gesture tracking flag
        lastGesture.current.isScalingOrRotating = false;
      },
    })
  ).current;

  const viewShotRef = useRef<ViewShot>(null);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Use ViewShot to capture the final composition
      if (!viewShotRef.current) {
        throw new Error('ViewShot ref is not available');
      }
      
      // Capture the entire editor canvas as an image
      const uri = await (viewShotRef.current as any).capture();
      console.log('Captured composition image at:', uri);
      
      // Pass the captured image URI to the onSave callback
      onSave(uri);
    } catch (error) {
      console.error('Fel vid sparande av bild:', error);
      alert('Kunde inte spara bild. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset position function
  const resetPosition = () => {
    setEditableImage(defaultImageState);
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

      {/* Wrap the editor canvas in ViewShot */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: "png", quality: 0.9 }}
        style={styles.editorCanvas}
      >
        {/* Background image */}
        {selectedBackground && (
          <Image 
            source={selectedBackground.uri} 
            style={styles.backgroundImage} 
            resizeMode="cover"
          />
        )}
        
        {/* Car image - movable with constraints */}
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
              ],
              left: '25%',
              top: '20%',
            }
          ]}
        >
          <Image source={{ uri: processedImage }} style={styles.carImage} resizeMode="contain" />
        </View>
        
        {/* Don't include the reset button in the ViewShot */}
      </ViewShot>
      
      {/* Reset position button - outside ViewShot */}
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={resetPosition}
      >
        <Ionicons name="refresh" size={24} color="white" />
        <Text style={styles.resetButtonText}>Återställ position</Text>
      </TouchableOpacity>

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

        {/* Instructions for gestures */}
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpText}>
            • Dra med ett finger för att placera bilden
          </Text>
          <Text style={styles.helpText}>
            • Använd två fingrar för att zooma och rotera
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
  helpTextContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  helpText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  resetButton: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ImageEditor;
