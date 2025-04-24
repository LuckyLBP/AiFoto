import React, { useRef, useEffect } from 'react';
import { View, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { captureImageWithBackground } from '../components/ImageEditor';

// Component that can be used to compose an image with a background
export const BackgroundComposer = ({
  imageUri,
  backgroundUri,
  onCapture,
  onError,
}: {
  imageUri: string;
  backgroundUri: any; // Can be a required asset or URI string
  onCapture: (uri: string) => void;
  onError: (error: Error) => void;
}) => {
  const viewShotRef = useRef<ViewShot>(null);

  // Attempt to capture the composition when the component mounts
  useEffect(() => {
    const captureComposition = async () => {
      try {
        const uri = await captureImageWithBackground(viewShotRef);
        onCapture(uri);
      } catch (error) {
        onError(error);
      }
    };

    captureComposition();
  }, []);

  return (
    <ViewShot
      ref={viewShotRef}
      options={{ format: 'jpg', quality: 0.9 }}
      style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        top: -10000, // Position off-screen
        left: -10000,
      }}
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
          top: 0,
          left: 0,
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
  );
};

// Helper function to apply a background to an image using a temporary component
export const applyBackgroundToImage = (
  imageUri: string,
  backgroundUri: any = require('../assets/backgrounds/background.jpg')
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // In a real implementation, we would mount the BackgroundComposer component
    // and wait for the capture to complete.
    //
    // However, since we can't directly mount components in a utility function,
    // we'll just return the original image URI with a warning

    console.warn(
      'applyBackgroundToImage: Actual background composition requires mounting a component. Returning original image.'
    );
    resolve(imageUri);
  });
};
