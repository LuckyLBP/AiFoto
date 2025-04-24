import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useCredits } from '../../hooks/useCredits';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { credits, loading, skipCreditCheck, toggleSkipCreditCheck } =
    useCredits();
  const [isSending, setIsSending] = useState(false);

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const subscriptionPlans = [
    {
      id: 'monthly',
      name: 'Månadsprenumeration',
      price: '399 kr/mån',
      description: '100 bilder/månad, förnyelse varje månad',
    },
    {
      id: 'yearly',
      name: 'Årsprenumeration',
      price: '3490 kr/år',
      description: '500 bilder/år, sparar 30% jämfört med månadspris',
    },
    {
      id: 'onetime',
      name: 'Engångsköp',
      price: 'Från 699 kr',
      description: '50 bilder, ingen prenumeration, använd när du vill',
    },
    {
      id: 'enterprise',
      name: 'Företagspaket',
      price: 'Kontakta oss',
      description: '1000+ bilder, dedikerad support, anpassade lösningar',
    },
  ];

  const handleSubmitContactForm = async () => {
    // Validate form
    if (!name.trim() || !email.trim() || !message.trim() || !selectedPlan) {
      Alert.alert(
        'Ofullständig information',
        'Vänligen fyll i alla fält och välj en betalningsplan.'
      );
      return;
    }

    setIsSending(true);
    try {
      // Simulate sending the contact form
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success message
      Alert.alert(
        'Meddelande skickat',
        'Tack för ditt intresse! Vi kommer att kontakta dig inom kort för att diskutera ditt val av ' +
          (selectedPlan === 'monthly'
            ? 'månadsabonnemang.'
            : selectedPlan === 'yearly'
            ? 'årsabonnemang.'
            : selectedPlan === 'onetime'
            ? 'engångsköp av krediter.'
            : 'företagspaket.'),
        [{ text: 'OK' }]
      );

      // Clear form
      setName('');
      setEmail('');
      setMessage('');
      setSelectedPlan(null);
    } catch (error) {
      console.error('Fel vid sändning av kontaktformulär:', error);
      Alert.alert('Fel', 'Kunde inte skicka meddelandet. Försök igen senare.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // The auth state listener in _layout.tsx will handle redirection
    } catch (error) {
      console.error('Error signing out: ', error);
      Alert.alert('Fel', 'Kunde inte logga ut. Försök igen.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles(colors).container}>
        <Text style={styles(colors).title}>Profil</Text>

        <View style={styles(colors).creditCard}>
          <View style={styles(colors).creditHeader}>
            <Text style={styles(colors).creditTitle}>Dina krediter</Text>
            <View style={styles(colors).creditBadge}>
              <Ionicons name="star" size={20} color="#fff" />
              <Text style={styles(colors).creditCount}>
                {loading ? '...' : skipCreditCheck ? '∞' : credits}
              </Text>
            </View>
          </View>
          <Text style={styles(colors).creditExplanation}>
            Krediter används när du sparar bilder. En kredit per sparad bild.
          </Text>

          {/* New toggle button for skipping credit check */}
          <TouchableOpacity
            style={[
              styles(colors).skipCreditsButton,
              skipCreditCheck && styles(colors).skipCreditsActive,
            ]}
            onPress={toggleSkipCreditCheck}
          >
            <Ionicons
              name={skipCreditCheck ? 'infinite' : 'card'}
              size={18}
              color={skipCreditCheck ? '#fff' : colors.text}
              style={styles(colors).skipCreditsIcon}
            />
            <Text
              style={[
                styles(colors).skipCreditsText,
                skipCreditCheck && styles(colors).skipCreditsActiveText,
              ]}
            >
              {skipCreditCheck
                ? 'Obegränsade krediter aktivt'
                : 'Aktivera obegränsade krediter'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles(colors).sectionTitle}>
          Köp krediter eller abonnemang
        </Text>

        <View style={styles(colors).subscriptionPlansContainer}>
          {subscriptionPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles(colors).subscriptionPlan,
                selectedPlan === plan.id && styles(colors).selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles(colors).planHeader}>
                <Text style={styles(colors).planName}>{plan.name}</Text>
                <Text style={styles(colors).planPrice}>{plan.price}</Text>
              </View>
              <Text style={styles(colors).planDescription}>
                {plan.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles(colors).sectionTitle}>Kontakta oss</Text>
        <View style={styles(colors).formContainer}>
          <Text style={styles(colors).formLabel}>Namn</Text>
          <TextInput
            style={styles(colors).textInput}
            value={name}
            onChangeText={setName}
            placeholder="Ditt namn"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles(colors).formLabel}>E-postadress</Text>
          <TextInput
            style={styles(colors).textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="din.email@exempel.se"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles(colors).formLabel}>Meddelande</Text>
          <TextInput
            style={[styles(colors).textInput, styles(colors).textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Beskriv dina behov eller ställ frågor om våra tjänster..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles(colors).submitButton}
            onPress={handleSubmitContactForm}
            disabled={isSending}
          >
            <Text style={styles(colors).submitButtonText}>
              {isSending ? 'Skickar...' : 'Skicka förfrågan'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Inställningar</Text>

          <View style={styles(colors).settingRow}>
            <Text style={styles(colors).settingText}>Mörkt läge</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          <View style={styles(colors).settingRow}>
            <Text style={styles(colors).settingText}>Högkvalitetsbilder</Text>
            <Switch
              value={true}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Om appen</Text>
          <Text style={styles(colors).aboutText}>
            AiFoto hjälper dig att automatiskt ta bort bakgrunden från dina
            bildfiler. Perfekt för att skapa professionella bilder av dina
            fordon.
          </Text>
          <Text style={styles(colors).aboutText}>Version 1.0.0</Text>
        </View>

        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Konto</Text>
          <TouchableOpacity
            style={styles(colors).logoutButton}
            onPress={handleSignOut}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#fff"
              style={styles(colors).logoutIcon}
            />
            <Text style={styles(colors).logoutButtonText}>Logga ut</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      marginTop: 10,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingText: {
      fontSize: 16,
      color: colors.text,
    },
    aboutText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 10,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    creditCard: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    creditHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    creditTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    creditBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    creditCount: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 8,
    },
    creditExplanation: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    subscriptionPlansContainer: {
      marginBottom: 20,
    },
    subscriptionPlan: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedPlan: {
      borderColor: colors.primary,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    planName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    planPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    formContainer: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
      marginTop: 10,
    },
    textInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    skipCreditsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 15,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: colors.backgroundAlt || '#f0f0f0',
      alignSelf: 'center',
    },
    skipCreditsActive: {
      backgroundColor: colors.primary,
    },
    skipCreditsIcon: {
      marginRight: 8,
    },
    skipCreditsText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    skipCreditsActiveText: {
      color: '#fff',
    },
    logoutButton: {
      backgroundColor: '#f44336',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 10,
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });
