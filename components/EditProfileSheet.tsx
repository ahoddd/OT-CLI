import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Image, Switch, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import { safeHaptics, Haptics } from '../utils/safeHaptics';

export interface EditProfileForm {
  name: string;
  tagline?: string;
  bio: string;
  username: string;
  discoverable: boolean;
  image: string | null;
}

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  currentName: string;
  currentTagline?: string;
  currentBio: string;
  currentUsername?: string;
  currentDiscoverable?: boolean;
  currentImage?: string;
  onSave: (form: EditProfileForm) => void;
}

export const EditProfileSheet = ({
  visible,
  onClose,
  currentName,
  currentTagline = '',
  currentBio,
  currentUsername = '',
  currentDiscoverable = true,
  currentImage,
  onSave,
}: EditProfileSheetProps) => {
  const { isDark, colors } = useTheme();
  const [name, setName] = useState(currentName);
  const [tagline, setTagline] = useState(currentTagline);
  const [bio, setBio] = useState(currentBio);
  const [username, setUsername] = useState(currentUsername);
  const [discoverable, setDiscoverable] = useState(currentDiscoverable);
  const [image, setImage] = useState<string | null>(currentImage || null);

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setTagline(currentTagline);
      setBio(currentBio);
      setUsername(currentUsername);
      setDiscoverable(currentDiscoverable);
      setImage(currentImage || null);
    }
  }, [visible, currentName, currentTagline, currentBio, currentUsername, currentDiscoverable, currentImage]);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      name: name.trim().slice(0, 60) || currentName,
      tagline: tagline.trim().slice(0, 60) || undefined,
      bio: bio.trim().slice(0, 160),
      username: username.trim().replace(/^@/, '').slice(0, 32),
      discoverable,
      image,
    });
    onClose();
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  return (
    <Modal transparent visible={visible} animationType="slide">
      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <BlurView intensity={isDark ? 50 : 80} tint={isDark ? "dark" : "light"} style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrapper}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>EDIT IDENTITY</Text>
                  <View style={styles.headerActions}>
                    <TouchableOpacity onPress={dismissKeyboard} style={styles.dismissBtn} hitSlop={12}>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                      <Text style={[styles.dismissText, { color: colors.textSecondary }]}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { dismissKeyboard(); onClose(); }} hitSlop={12}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* AVATAR PICKER */}
                  <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarBtn}>
                      {image ? (
                        <Image source={{ uri: image }} style={styles.avatarImg} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
                          <Ionicons name="camera" size={32} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.editBadge}>
                        <Ionicons name="pencil" size={12} color="#000" />
                      </View>
                    </TouchableOpacity>
                    <Text style={[styles.changeText, { color: COLORS.neonBlue[0] }]}>Change Avatar</Text>
                  </View>

                  <View style={styles.form}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>DISPLAY NAME</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={name}
                      onChangeText={(t) => setName(t.slice(0, 60))}
                      placeholder="Your display name"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={60}
                      returnKeyType="next"
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>SHORT TAGLINE (e.g. &quot;Coffee hunter · Austin&quot;)</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={tagline}
                      onChangeText={setTagline}
                      placeholder="One line that shows under your name"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={60}
                      returnKeyType="next"
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>BIO</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 80 }]}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      maxLength={160}
                      placeholder="A bit about you..."
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="done"
                      blurOnSubmit
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>@USERNAME (for friends & search)</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={username ? `@${username}` : ''}
                      onChangeText={(t) => setUsername(t.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32))}
                      placeholder="@handle"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={33}
                      returnKeyType="done"
                      blurOnSubmit
                    />

                    <View style={[styles.switchRow, { borderColor: colors.border }]}>
                      <Text style={[styles.switchLabel, { color: colors.text }]}>Public profile — show on leaderboards & in search</Text>
                      <Switch
                        value={discoverable}
                        onValueChange={setDiscoverable}
                        trackColor={{ false: colors.border, true: COLORS.neonBlue[0] + '99' }}
                        thumbColor={discoverable ? COLORS.neonBlue[0] : colors.textSecondary}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveText}>UPDATE PROFILE</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
          </KeyboardAvoidingView>
        </BlurView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  wrapper: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  card: { borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, maxHeight: '90%' },
  scrollContent: { paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dismissBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dismissText: { fontSize: 14, fontWeight: '600' },
  
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarBtn: { marginBottom: 8 },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  changeText: { fontSize: 12, fontWeight: 'bold' },

  form: { gap: 16 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, marginTop: 8 },
  switchLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  saveBtn: { backgroundColor: COLORS.neonBlue[0], padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 }
});
