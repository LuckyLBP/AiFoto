import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useCarSession } from '../../hooks/useCarSession';
import { useCarAngles } from '../../hooks/useCarAngles';
import { useDummyRemoveBg } from '../../hooks/useDummyRemoveBg';

// Sample backgrounds - replace with actual backgrounds from your app
const BACKGROUNDS = [
  {
    id: '1',
    name: 'Standard',
    image: require('../../assets/backgrounds/background.jpg'),
  },
  {
    id: '2',
    name: 'Studio',
    image: require('../../assets/backgrounds/background.jpg'),
  },
  {
    id: '3',
    name: 'Utomhus',
    image: require('../../assets/backgrounds/background.jpg'),
  },
  {
    id: '4',
    name: 'Stad',
    image: require('../../assets/backgrounds/background.jpg'),
  },
  {
    id: '5',
    name: 'Natur',
    image: require('../../assets/backgrounds/background.jpg'),
  },
];

const windowWidth = Dimensions.get('window').width;
const ITEM_WIDTH = (windowWidth - 60) / 2;

export default function BackgroundSelectorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { activeSession, loading, updateAllBackgrounds } = useCarSession();
  const { carAngles } = useCarAngles();
  const { removeBg } = useDummyRemoveBg();
  const [selectedBackground, setSelectedBackground] = useState<string | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectBackground = (id: string) => {
    setSelectedBackground(id);
  };

  const handleConfirmApply = () => {
    if (selectedBackground) {
      setShowConfirmation(true);
    } else {
      Alert.alert('Välj bakgrund', 'Vänligen välj en bakgrund först');
    }
  };

  const handleApplyToAll = async () => {
    if (!selectedBackground || !activeSession) {
      setShowConfirmation(false);
      return;
    }

    const selectedBg = BACKGROUNDS.find((bg) => bg.id === selectedBackground);
    if (!selectedBg) {
      setShowConfirmation(false);
      return;
    }

    setProcessing(true);
    try {
      // Get all the exterior photos that need backgrounds
      const exteriorPhotos = activeSession.photos.filter((photo) => {
        const angle = carAngles.find((a) => a.id === photo.angleId);
        return angle && !angle.isInterior;
      });

      // Apply the background to all photos only when save is pressed
      const results = await Promise.all(
        exteriorPhotos.map(async (photo) => {
          try {
            // Just using removeBg as a placeholder
            const imageWithBg = await removeBg(photo.uri);
            return {
              id: photo.id,
              success: true,
              finalImageUri: imageWithBg,
            };
          } catch (error) {
            console.error('Failed to process photo', photo.id, error);
            return {
              id: photo.id,
              success: false,
              finalImageUri: undefined, // Adding this explicitly to match type
            };
          }
        })
      );

      // Filter out failed results and make sure finalImageUri exists
      const successfulResults = results
        .filter(
          (r): r is { id: string; success: true; finalImageUri: string } =>
            r.success && !!r.finalImageUri
        )
        .map((r) => ({
          id: r.id,
          finalImageUri: r.finalImageUri,
          backgroundAdded: true,
        }));

      // Update all photos in the session
      await updateAllBackgrounds(successfulResults);

      Alert.alert(
        'Bakgrund sparad',
        'Bakgrunden har tillämpats på alla bilder',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error applying backgrounds:', error);
      Alert.alert('Fel', 'Kunde inte tillämpa bakgrunden på alla bilder.');
    } finally {
      setProcessing(false);
      setShowConfirmation(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Spara bakgrund
            </Text>
            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              Vill du tillämpa denna bakgrund på alla bilder? Detta kan ta en
              stund.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={{ color: colors.text }}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleApplyToAll}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff' }}>Spara</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Välj bakgrund
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={[styles.subtitle, { color: colors.text }]}>
        Välj en bakgrund att förhandsgranska
      </Text>

      <FlatList
        data={BACKGROUNDS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.backgroundsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.backgroundItem,
              selectedBackground === item.id && styles.selectedBackground,
              { borderColor: colors.primary },
            ]}
            onPress={() => handleSelectBackground(item.id)}
          >
            <Image
              source={item.image}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
            <View
              style={[
                styles.backgroundNameContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.backgroundName, { color: colors.text }]}>
                {item.name}
              </Text>
            </View>
            {selectedBackground === item.id && (
              <View
                style={[
                  styles.selectedIndicator,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={handleConfirmApply}
          disabled={processing || !selectedBackground}
        >
          <Text style={styles.applyButtonText}>Använd bakgrund</Text>
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
  closeButton: {
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
  backgroundsList: {
    padding: 10,
  },
  backgroundItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedBackground: {
    borderWidth: 2,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backgroundName: {
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    opacity: 1,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 8,
  },
});
