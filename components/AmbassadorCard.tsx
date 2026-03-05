import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import { safeHaptics } from '../utils/safeHaptics';
import { userInviteUrl } from '../constants/AppLinks';
import { userInviteSharePayload } from '../utils/shareToSocial';

export const AmbassadorCard = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const cardBg = isDark ? colors.surface : colors.surfaceHighlight;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const titleColor = colors.text;
  const descColor = colors.textSecondary;

  const handleInvite = async () => {
    safeHaptics.selectionAsync();
    try {
      const url = user?.uid ? userInviteUrl(user.uid) : 'https://orbtap.com';
      const payload = userInviteSharePayload(url, 'Join me on OrbTap — discover deals, earn points.');
      const message = payload.url ? `${payload.message} ${payload.url}` : payload.message;
      await Share.share({ message, title: payload.title });
    } catch (error) {
      if (__DEV__) console.warn('AmbassadorCard share error:', error);
    }
  };

  if (!user?.uid) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <LinearGradient
          colors={[themeGold + '22', 'transparent']}
          style={styles.glow}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: titleColor }]}>AMBASSADOR</Text>
              <Text style={[styles.sub, { color: themeGold }]}>Invite & Earn</Text>
            </View>
            <OrbTapLogoMark variant="hero" width={56} height={48} />
          </View>
          <View style={styles.middle}>
            <Text style={[styles.desc, { color: descColor }]}>
              Earn <Text style={{ color: themeGold }}>500 XP</Text> + <Text style={{ color: COLORS.success }}>250 PTS</Text> for every verified explorer you recruit.
            </Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={handleInvite} activeOpacity={0.88}>
            <LinearGradient
              colors={[themeGold, COLORS.gold[1]]}
              style={styles.btnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="share-social" size={16} color="#000" />
              <Text style={styles.btnText}>SHARE INVITE LINK</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 10 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  glow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, opacity: 0.25, borderRadius: 75 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  sub: { fontSize: 12, fontWeight: 'bold' },
  middle: { marginBottom: 20 },
  desc: { fontSize: 13, lineHeight: 20 },
  btn: { borderRadius: 12, overflow: 'hidden' },
  btnGrad: { padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});
