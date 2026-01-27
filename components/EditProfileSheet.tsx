import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  currentName: string;
  currentBio: string;
  currentImage?: string;
  onSave: (name: string, bio: string, image: string | null) => void;
}

export const EditProfileSheet = ({ visible, onClose, currentName, currentBio, currentImage, onSave }: EditProfileSheetProps) => {
  const { isDark, colors } = useTheme();
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState(currentBio);
  const [image, setImage] = useState<string | null>(currentImage || null);

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(name, bio, image);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <BlurView intensity={isDark ? 50 : 80} tint={isDark ? "dark" : "light"} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrapper}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>EDIT IDENTITY</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

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
                onChangeText={setName}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>BIO / TAGLINE</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 80 }]}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={100}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>UPDATE PROFILE</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  wrapper: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: "#000", shadowOffset: {width:0,height:10}, shadowOpacity: 0.3, shadowRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarBtn: { marginBottom: 8 },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  changeText: { fontSize: 12, fontWeight: 'bold' },

  form: { gap: 16 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  saveBtn: { backgroundColor: COLORS.neonBlue[0], padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 }
});
