import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { GlobalAnnouncement } from '../services/globalAnnouncements';

interface GlobalAnnouncementBannerProps {
  announcement: GlobalAnnouncement;
  onDismiss: () => void;
}

export function GlobalAnnouncementBanner({ announcement, onDismiss }: GlobalAnnouncementBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.banner, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{announcement.title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>{announcement.body}</Text>
        </View>
        <TouchableOpacity hitSlop={16} onPress={onDismiss} style={[styles.close, { backgroundColor: colors.background }]}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  body: { fontSize: 12, lineHeight: 16 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
});
