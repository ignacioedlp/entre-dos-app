import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { ThemeColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { apiUpdateDisplayName } from '@/lib/api';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Typography } from '@/components/ui/Typography';
import { useScaledFontSize } from '@/context/FontScaleContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('settings');
  const { user, updateProfile } = useAuth();
  const inputFontSize = useScaledFontSize(18);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const { pickFromGallery, pickFromCamera, isPending: avatarPending } = useAvatarUpload();

  function showAvatarOptions() {
    const options = [t('profile.camera'), t('profile.gallery'), t('profile.cancel')];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, (index) => {
        if (index === 0) pickFromCamera();
        else if (index === 1) pickFromGallery();
      });
    } else {
      Alert.alert(t('profile.changePhoto'), undefined, [
        { text: t('profile.camera'), onPress: pickFromCamera },
        { text: t('profile.gallery'), onPress: pickFromGallery },
        { text: t('profile.cancel'), style: 'cancel' },
      ]);
    }
  }

  const mutation = useMutation({
    mutationFn: apiUpdateDisplayName,
    onSuccess: (updatedProfile) => {
      updateProfile(updatedProfile);
      setEditing(false);
    },
  });

  function startEditing() {
    setNameValue(user?.displayName ?? '');
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function handleSave() {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('profile.title')}
        </Typography>
        <Pressable onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Avatar + Name Section */}
      <View style={styles.avatarSection}>
        <Pressable onPress={showAvatarOptions} disabled={avatarPending}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={48} color={colors.textMuted} />
              </View>
            )}
            {avatarPending && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
        </Pressable>

        {/* Name below avatar */}
        {!editing ? (
          <Pressable onPress={startEditing} style={styles.nameUnderAvatar}>
            <Typography variant="bodyBold" baseFontSize={20}>
              {user?.displayName || t('profile.namePlaceholder')}
            </Typography>
            <Ionicons name="pencil" size={16} color={colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={styles.editContainerInline}>
            <TextInput
              style={[styles.nameInputInline, { fontSize: inputFontSize }]}
              value={nameValue}
              onChangeText={setNameValue}
              placeholder={t('profile.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              textAlign="center"
            />
            <View style={styles.editActions}>
              <Pressable
                onPress={handleSave}
                disabled={mutation.isPending || !nameValue.trim()}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && { opacity: 0.8 },
                  (mutation.isPending || !nameValue.trim()) && { opacity: 0.5 },
                ]}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Typography variant="button" color="#ffffff">
                    {t('profile.save')}
                  </Typography>
                )}
              </Pressable>
              <Pressable onPress={cancelEditing} style={styles.cancelBtn}>
                <Typography variant="body" baseFontSize={14} color={colors.textSecondary}>
                  {t('profile.cancel')}
                </Typography>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 24,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      color: colors.textPrimary,
    },

    // Avatar
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
      gap: 12,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 60,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },

    // Name under avatar
    nameUnderAvatar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    // Edit mode inline
    editContainerInline: {
      alignItems: 'center',
      gap: 12,
      width: '100%',
      paddingHorizontal: 24,
    },
    nameInputInline: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontFamily: 'Inter_700Bold',
      color: colors.textPrimary,
      width: '100%',
    },
    editActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: {
      alignItems: 'center',
      paddingVertical: 4,
    },
  });
}
