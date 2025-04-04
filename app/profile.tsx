import React from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();

  return (
    <View style={styles(colors).container}>
      <Text style={styles(colors).title}>Profil</Text>

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
          AiFoto hjälper dig att automatiskt ta bort bakgrunden från dina bildfiler.
          Perfekt för att skapa professionella bilder av dina fordon.
        </Text>
        <Text style={styles(colors).aboutText}>Version 1.0.0</Text>
      </View>

      <TouchableOpacity style={styles(colors).button}>
        <Text style={styles(colors).buttonText}>Kontakta support</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
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
  }
});
