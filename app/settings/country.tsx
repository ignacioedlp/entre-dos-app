import { useState } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Toast } from 'toastify-react-native';
import { SUPPORTED_COUNTRIES } from '../../lib/countries';

export default function CountrySettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation('settings');
  const { user, updateProfile } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(user?.country ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectCountry = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    setIsLoading(true);
    try {
      await api.put('/profiles/me', { country: countryCode });
      if (user) {
        updateProfile({
          ...user,
          country: countryCode,
        });
      }
      setIsLoading(false);
    } catch {
      Toast.error(t('country.saveError'));
      setIsLoading(false);
    }
  };

  const getCountryName = (country: (typeof SUPPORTED_COUNTRIES)[number]) => {
    if (i18n.language.startsWith('es')) {
      return country.name_es;
    }
    return country.name_en;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.background} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('country.title')}</Text>
      </View>

      {SUPPORTED_COUNTRIES.map((country, idx) => {
        const isSelected = selectedCountry === country.code;
        return (
          <Pressable
            key={country.code}
            onPress={() => handleSelectCountry(country.code)}
            disabled={isLoading}
            style={[styles.row, idx === 0 && styles.rowFirst, isLoading && styles.rowDisabled]}
          >
            {country.flag}
            <Text style={styles.label}>{getCountryName(country)}</Text>
            {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.accent} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    backgroundColor: Colors.textPrimary,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  headerTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  flag: {
    fontSize: 24,
  },
  label: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
