import { Stack } from 'expo-router';

export default function GalleryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_bottom',
      }}
    />
  );
}
