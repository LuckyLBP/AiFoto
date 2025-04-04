import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useCarSession } from '../../hooks/useCarSession';

export default function NewCarSession() {
  const { colors } = useTheme();
  const router = useRouter();
  const { createSession } = useCarSession();
  
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [year, setYear] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateSession = async () => {
    if (!carMake || !carModel || !year) {
      Alert.alert(
        'Ofullständig information',
        'Vänligen fyll i alla fält för att fortsätta.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert(
        'Ogiltigt årtal',
        'Vänligen ange ett giltigt årtal.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setIsCreating(true);
      await createSession(carMake, carModel, yearNum);
      router.push('/car/angles');
    } catch (error) {
      Alert.alert(
        'Fel',
        'Kunde inte skapa en ny session. Försök igen.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Ny fotosession</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Ange information om fordonet
          </Text>
          
          <View style={[styles.formGroup, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Märke</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
              value={carMake}
              onChangeText={setCarMake}
              placeholder="T.ex. Volvo"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={[styles.formGroup, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Modell</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
              value={carModel}
              onChangeText={setCarModel}
              placeholder="T.ex. XC60"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={[styles.formGroup, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Årsmodell</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
              value={year}
              onChangeText={setYear}
              placeholder="T.ex. 2023"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleCreateSession}
            disabled={isCreating}
          >
            <Text style={styles.buttonText}>
              {isCreating ? 'Skapar...' : 'Fortsätt till fotografering'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Du kommer att guidas genom fotografering av fordonet från olika vinklar.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  formGroup: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 1,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  helpText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
  },
});
