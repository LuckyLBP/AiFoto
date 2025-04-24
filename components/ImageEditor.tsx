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
  ScrollView,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { EditableImage, Background } from '../types';
import { useBackgrounds } from '../hooks/useBackgrounds';

interface ImageEditorProps {
  processedImage: string;
  onSave: (finalImage: string) => void;
  onCancel: () => void;
  // Optional props for specifying a background directly
  initialBackground?: Background;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  processedImage,
  onSave,
  onCancel,
  initialBackground,
}) => {
  const defaultImageState = {
    uri: processedImage,
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
  };

  const [editableImage, setEditableImage] =
    useState<EditableImage>(defaultImageState);
  const [isLoading, setIsLoading] = useState(false);
  const { backgrounds, selectedBackground, selectBackground } =
    useBackgrounds();

  // Use the initialBackground if provided, otherwise use the selectedBackground
  useEffect(() => {
    if (initialBackground) {
      selectBackground(initialBackground);
    }
  }, [initialBackground]);

  // We'll keep the app in portrait mode but render our canvas in landscape orientation
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Set landscape dimensions for our canvas (swapping width and height)
  const canvasWidth = screenHeight * 0.6; // Use 60% of screen height as width
  const canvasHeight = screenWidth * 0.4; // Use 40% of screen width as height

  // Track the last gesture state to avoid jumps between gestures
  const lastGesture = useRef({
    dx: 0,
    dy: 0,
    initialDistance: 0,
    initialRotation: 0,
    lastScale: 1,
    lastRotation: 0,
    // Add a flag to track when we're in the middle of a scale/rotate gesture
    isScalingOrRotating: false,
  });

  // Helper function to calculate distance between two points
  const getDistance = (
    touch1: { pageX: number; pageY: number },
    touch2: { pageX: number; pageY: number }
  ): number => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Helper function to calculate angle between two points
  const getAngle = (
    touch1: { pageX: number; pageY: number },
    touch2: { pageX: number; pageY: number }
  ): number => {
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

          setEditableImage((prev) => {
            // Apply a dampening factor to make movements less sensitive
            const dampening = 0.5; // Adjust this factor as needed for smoother movement
            const newX = prev.position.x + deltaX * dampening;
            const newY = prev.position.y + deltaY * dampening;

            // Calculate bounds with more flexibility to keep image visible
            const imageWidth = canvasWidth * prev.scale * 0.25;
            const imageHeight = canvasHeight * prev.scale * 0.25;

            const minX = -imageWidth;
            const maxX = canvasWidth - imageWidth;
            const minY = -imageHeight;
            const maxY = canvasHeight - imageHeight;

            // Apply boundaries
            const boundedX = Math.min(Math.max(newX, minX), maxX);
            const boundedY = Math.min(Math.max(newY, minY), maxY);

            return {
              ...prev,
              position: {
                x: boundedX,
                y: boundedY,
              },
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
          const rawScaleFactor =
            currentDistance / lastGesture.current.initialDistance;
          const smoothedScaleFactor =
            1 + (rawScaleFactor - 1) * smoothingFactor;

          // Calculate the change in rotation in degrees with the same smoothing
          const rawRotationDelta =
            (currentAngle - lastGesture.current.initialRotation) *
            (180 / Math.PI);
          const smoothedRotationDelta = rawRotationDelta * smoothingFactor;

          setEditableImage((prev) => {
            // Calculate new scale with bounds
            const newScale = Math.min(
              Math.max(prev.scale * smoothedScaleFactor, 0.3),
              3
            );

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
              rotation: newRotation,
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

      // Always capture in landscape format with 16:9 aspect ratio
      const uri = await (viewShotRef.current as any).capture({
        format: 'jpg',
        quality: 0.9,
        width: 1920, // Fixed landscape width (16:9 ratio)
        height: 1080, // Fixed landscape height (16:9 ratio)
        result: 'file',
      });
      console.log('Captured landscape image at:', uri);

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

      <View style={styles.editorContentContainer}>
        {/* Landscape ViewShot canvas - this will be rendered in portrait app orientation */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'jpg', quality: 0.9 }}
          style={styles.landscapeCanvas}
        >
          {/* Background image */}
          {selectedBackground && (
            <Image
              source={selectedBackground.uri}
              style={styles.landscapeBackground}
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
                  { rotate: `${editableImage.rotation}deg` },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: processedImage }}
              style={styles.carImage}
              resizeMode="contain"
            />
          </View>
        </ViewShot>

        {/* Reset position button - outside ViewShot */}
        <TouchableOpacity style={styles.resetButton} onPress={resetPosition}>
          <Ionicons name="refresh" size={24} color="white" />
          <Text style={styles.resetButtonText}>Återställ position</Text>
        </TouchableOpacity>

        {/* Controls container */}
        <View style={styles.controlsContainer}>
          {/* Background selector */}
          <Text style={styles.controlLabel}>Bakgrund</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.backgroundSelector}
          >
            {backgrounds.map((bg) => (
              <TouchableOpacity
                key={bg.id}
                style={[
                  styles.backgroundOption,
                  selectedBackground?.id === bg.id && styles.selectedBackground,
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
    </View>
  );
};

// Utility function to apply default background to an image
// This should be used instead of a static method
export const captureImageWithBackground = async (
  viewRef: React.RefObject<
    ViewShot & { capture: (options?: any) => Promise<string> }
  >,
  options = {
    width: 1920,
    height: 1080,
  }
): Promise<string> => {
  try {
    if (!viewRef.current) {
      throw new Error('ViewShot ref is not available');
    }

    // Capture the content of the ViewShot using any type to avoid type errors
    const uri = await viewRef.current.capture({
      width: options.width,
      height: options.height,
      result: 'file',
    });

    return uri;
  } catch (error) {
    console.error('Error capturing image with background:', error);
    throw error;
  }
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
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
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
  editorContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },

  // Updated landscape canvas styles
  landscapeCanvas: {
    width: '100%',
    aspectRatio: 16 / 9, // Force 16:9 aspect ratio (landscape)
    backgroundColor: '#000', // Black background to show image boundaries
    marginVertical: 20,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },

  landscapeBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },

  carImageContainer: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: '25%', // Center vertically
    left: '25%', // Center horizontally
  },

  carImage: {
    width: '100%',
    height: '100%',
  },

  controlsContainer: {
    width: '100%',
    paddingVertical: 15,
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
    top: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ImageEditor;
