/**
 * Bottom sheet / modal to share content to Facebook, X, Instagram, TikTok, and More (system share).
 * Strategically used so OrbTap grows via social platforms.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { shareUrlToFacebook, shareToX, openSystemShareSheet, ensureSharePayloadWithOrbTapLink, type SharePayload } from '../utils/shareToSocial';
import { safeHaptics } from '../utils/safeHaptics';

export interface ShareToSocialSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Message, url, title, and optional imageUri for system share */
  payload: SharePayload;
  /** Optional short label e.g. "Share proof" / "Share invite" */
  label?: string;
}

const SOCIAL_ROW: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap | 'custom-x' | 'custom-upscrolled'; color: string }[] = [
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'x', label: 'X', icon: 'custom-x', color: '#000000' },
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#00F2EA' },
  { id: 'upscrolled', label: 'UpScrolled', icon: 'custom-upscrolled', color: '#6D28D9' },
];

export function ShareToSocialSheet({ visible, onClose, payload, label = 'Share' }: ShareToSocialSheetProps) {
  const { colors } = useTheme();

  const handlePlatform = async (platform: string) => {
    safeHaptics.selectionAsync();
    const payloadWithLink = ensureSharePayloadWithOrbTapLink(payload);
    const url = payloadWithLink.url ?? '';
    switch (platform) {
      case 'facebook':
        onClose();
        await shareUrlToFacebook(url, payloadWithLink.message);
        break;
      case 'x':
        onClose();
        await shareToX(payloadWithLink.message, url);
        break;
      case 'instagram':
      case 'tiktok':
      case 'upscrolled':
        // No direct share URLs for these; open system share first so it reliably appears, then close
        await openSystemShareSheet(payloadWithLink);
        onClose();
        break;
      default:
        await openSystemShareSheet(payloadWithLink);
        onClose();
    }
  };

  const handleMore = async () => {
    safeHaptics.selectionAsync();
    await openSystemShareSheet(ensureSharePayloadWithOrbTapLink(payload));
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Share with friends or post to your favorite apps. Your link works on web and in the App Store if they don’t have the app yet.
          </Text>
          <View style={styles.row}>
            {SOCIAL_ROW.map(({ id, label: platformLabel, icon, color }) => (
              <TouchableOpacity
                key={id}
                style={[styles.iconBtn, { backgroundColor: colors.background }]}
                onPress={() => handlePlatform(id)}
                activeOpacity={0.8}
              >
                {icon === 'custom-x' ? (
                  <View style={styles.xLogoWrap}>
                    <Image
                      source={require('../assets/images/x-logo.png')}
                      style={styles.xLogoImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : icon === 'custom-upscrolled' ? (
                  <View style={styles.upscrolledLogoWrap}>
                    <Image
                      source={{ uri: 'https://upscrolled.com/wp-content/uploads/2022/01/logo.png' }}
                      style={styles.upscrolledLogoImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={28} color={color} />
                )}
                <Text style={[styles.iconLabel, { color: colors.text }]} numberOfLines={1}>{platformLabel}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.moreBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleMore}
            activeOpacity={0.8}
            accessibilityLabel="More options"
            accessibilityRole="button"
          >
            <Ionicons name="share-social" size={22} color={colors.text} />
            <Text style={[styles.moreBtnText, { color: colors.text }]}>More options</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  sub: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  iconBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 72,
  },
  xLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xLogoImage: {
    width: 28,
    height: 28,
  },
  upscrolledLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  upscrolledLogoImage: {
    width: 28,
    height: 28,
  },
  iconLabel: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  moreBtnText: { fontSize: 15, fontWeight: '700' },
});
