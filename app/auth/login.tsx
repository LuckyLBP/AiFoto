import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { auth } from '../../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { useTheme } from '../../theme/ThemeProvider';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to home
        router.replace('/');
      }
    });

    return unsubscribe;
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Fel', 'Vänligen fyll i e-post och lösenord');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Create a new user
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Router will handle navigation from the onAuthStateChanged listener
    } catch (error: any) {
      let errorMessage = 'Ett fel uppstod. Försök igen.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'E-postadressen används redan av ett annat konto.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Ogiltig e-postadress.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        errorMessage = 'Fel e-post eller lösenord.';
      }

      Alert.alert('Autentiseringsfel', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Stack.Screen options={{ title: '', headerShown: false }} />

      <ScrollView contentContainerStyle={styles(colors).container}>
        <View style={styles(colors).logoContainer}>
          <Text style={styles(colors).logo}>AiFoto</Text>
          <Text style={styles(colors).tagline}>
            Professionella bilbilder på ett enkelt sätt
          </Text>
        </View>

        <View style={styles(colors).formContainer}>
          <Text style={styles(colors).title}>
            {isSignUp ? 'Skapa konto' : 'Logga in'}
          </Text>

          <View style={styles(colors).inputContainer}>
            <Text style={styles(colors).label}>E-post</Text>
            <TextInput
              style={styles(colors).input}
              placeholder="din.email@exempel.se"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles(colors).inputContainer}>
            <Text style={styles(colors).label}>Lösenord</Text>
            <TextInput
              style={styles(colors).input}
              placeholder="Lösenord"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles(colors).submitButton}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles(colors).submitButtonText}>
                {isSignUp ? 'Skapa konto' : 'Logga in'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles(colors).toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
          >
            <Text style={styles(colors).toggleButtonText}>
              {isSignUp
                ? 'Har du redan ett konto? Logga in'
                : 'Inget konto? Skapa ett nytt'}
            </Text>
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
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    formContainer: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
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
    toggleButton: {
      marginTop: 16,
      alignItems: 'center',
    },
    toggleButtonText: {
      color: colors.primary,
      fontSize: 14,
    },
  });
