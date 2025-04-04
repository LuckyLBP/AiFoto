import { StyleSheet, View } from 'react-native';

// This file is now only used for compatibility with expo development
export default function App() {
  // The root layout is defined in app/_layout.tsx
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
