import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCredits } from '../hooks/useCredits';
import { useTheme } from '../theme/ThemeProvider';

interface CreditDisplayProps {
  onPress?: () => void;
  compact?: boolean;
}

const CreditDisplay: React.FC<CreditDisplayProps> = ({
  onPress,
  compact = false,
}) => {
  const { credits, loading } = useCredits();
  const { colors } = useTheme();

  // If credits are loading, show a placeholder
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          compact && styles.compactContainer,
          { backgroundColor: colors.surface },
        ]}
      >
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // Render the credit display as either a touchable or regular view
  const CreditContent = () => (
    <>
      <Ionicons name="star" size={compact ? 16 : 20} color={colors.primary} />
      <Text
        style={[
          styles.creditText,
          compact && styles.compactText,
          { color: colors.text },
        ]}
      >
        {credits} {!compact && 'Credits'}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          compact && styles.compactContainer,
          { backgroundColor: colors.surface },
        ]}
        onPress={onPress}
      >
        <CreditContent />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        compact && styles.compactContainer,
        { backgroundColor: colors.surface },
      ]}
    >
      <CreditContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  compactContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  creditText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  compactText: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default CreditDisplay;
