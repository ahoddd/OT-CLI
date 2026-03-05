import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { GlobalAnnouncement } from '../services/globalAnnouncements';
import type { Partner } from '../constants/MockData';
import { usePartners } from '../context/PartnersContext';

const { width } = Dimensions.get('window');
const CARD_MAX_WIDTH = Math.min(width - 32, 400);

interface GlobalAnnouncementModalProps {
  visible: boolean;
  announcement: GlobalAnnouncement | null;
  onDismiss: () => void;
}

export function GlobalAnnouncementModal({ visible, announcement, onDismiss }: GlobalAnnouncementModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getPartner } = usePartners();
  const topInset = insets.top + 12;

  if (!visible || !announcement) return null;

  const openPartner = (id: string) => {
    onDismiss();
    setTimeout(() => router.push({ pathname: '/partner/[id]', params: { id } } as any), 100);
  };
  const openPeople = () => {
    onDismiss();
    setTimeout(() => router.push('/people' as any), 100);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.center, { paddingTop: topInset, paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.headerRow}>
                <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.12)' }]}>
                  <Ionicons name="megaphone" size={18} color="#60a5fa" />
                  <Text style={[styles.badgeText, { color: '#60a5fa' }]}>From OrbTap</Text>
                </View>
                <TouchableOpacity
                  hitSlop={16}
                  onPress={onDismiss}
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}
                >
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{announcement.title}</Text>
              {announcement.imageUrl ? (
                <Image source={{ uri: announcement.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : null}
              <Text style={[styles.body, { color: colors.textSecondary }]} selectable>{announcement.body}</Text>
              {(announcement.taggedPartnerIds?.length || announcement.taggedUserIds?.length) ? (
                <View style={styles.tagsWrap}>
                  {announcement.taggedPartnerIds?.map((id) => {
                    const partner = getPartner(id);
                    const label = partner?.name ?? id;
                    return (
                      <TouchableOpacity key={`p-${id}`} onPress={() => openPartner(id)} style={[styles.tag, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                        <Ionicons name="business" size={14} color={colors.text} />
                        <Text style={[styles.tagText, { color: colors.text }]} numberOfLines={1}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {announcement.taggedUserIds?.map((id) => (
                    <TouchableOpacity key={`u-${id}`} onPress={openPeople} style={[styles.tag, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                      <Ionicons name="person" size={14} color={colors.text} />
                      <Text style={[styles.tagText, { color: colors.text }]} numberOfLines={1}>User</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity
                onPress={onDismiss}
                style={[styles.cta, { backgroundColor: colors.text }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.ctaText, { color: colors.background }]}>Got it</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: CARD_MAX_WIDTH,
    maxWidth: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: { fontSize: 13, fontWeight: '700' },
  cta: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
