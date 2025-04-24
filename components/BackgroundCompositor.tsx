import React, { useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import ViewShot, { ViewShotProperties } from 'react-native-view-shot';

interface BackgroundCompositorProps {
  imageUri: string;
  backgroundUri: any;
  width?: number;
  height?: number;
  onCapture: (uri: string) => void;
  onError?: (error: Error) => void;
}

/**
 * A component that composes an image with a background and allows capturing the result
 */
const BackgroundCompositor: React.FC<BackgroundCompositorProps> = ({
  imageUri,
  backgroundUri,
  width = 1920,
  height = 1080,
}) => {
  const viewShotRef = useRef<
    ViewShot & { capture: (options?: ViewShotProperties) => Promise<string> }
  >(null);

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        options={{
          width,
          height,
        }}
        style={styles.compositionView}
      >
        {/* Background image */}
        <Image
          source={
            typeof backgroundUri === 'string'
              ? { uri: backgroundUri }
              : backgroundUri
          }
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />

        {/* Car image centered */}
        <View
          style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            top: '25%',
            left: '25%',
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="contain"
          />
        </View>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compositionView: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
});

export default BackgroundCompositor;

// Export a utility function to directly capture an image composition
export const captureComposition = async (
  viewShotRef: React.RefObject<
    ViewShot & { capture: (options?: any) => Promise<string> }
  >,
  options = {
    width: 1920,
    height: 1080,
  }
): Promise<string> => {
  if (!viewShotRef.current) {
    throw new Error('ViewShot reference is not available');
  }

  // Use a basic options object that's compatible with react-native-view-shot
  const result = await viewShotRef.current.capture({
    width: options.width,
    height: options.height,
    result: 'file',
  });

  return result;
};
