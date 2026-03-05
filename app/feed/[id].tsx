/**
 * OrbFeed Post Detail — full content, CTA, why-seeing-this, integrity note.
 * Loads real post from Firestore by id; falls back to not found.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import { getPostTypeLabel, getCtaLabel } from '../../constants/OrbFeed';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { feedPostSharePayload } from '../../utils/shareToSocial';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { feedPostDeepLink } from '../../constants/AppLinks';
import { getOrbPostById } from '../../services/orbPosts';
import { useAuth } from '../../context/AuthContext';
import { usePartners } from '../../context/PartnersContext';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { isAdminEmail } from '../../constants/Admin';
import { deletePost } from '../../services/adminDelete';
import { useI18n } from '../../context/I18nContext';

export default function OrbFeedPostDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [post, setPost] = useState<Awaited<ReturnType<typeof getOrbPostById>> | undefined>(undefined);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const { user } = useAuth();
  const { getPartner } = usePartners();
  const isAdmin = isAdminEmail(user?.email);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      setPost(null);
      return;
    }
    let cancelled = false;
    getOrbPostById(id).then((p) => {
      if (!cancelled) setPost(p ?? null);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (post === undefined) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Post</Text>
        </View>
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={COLORS.neonBlue[0]} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Post</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCta = () => {
    if (post.cta.kind === 'NAVIGATE' && post.cta.targetRef.startsWith('partner_')) {
      const partnerId = post.cta.targetRef.replace('partner_', '');
      router.push({ pathname: '/partner/[id]', params: { id: partnerId } } as any);
      return;
    }
    if (post.type === 'DROP' && post.cta.targetRef) {
      router.push({ pathname: '/drop/[id]', params: { id: post.cta.targetRef } } as any);
      return;
    }
    // Default: open partner
    router.push({ pathname: '/partner/[id]', params: { id: post.partnerId } } as any);
  };

  const handleShare = () => {
    setSharePayload(feedPostSharePayload(
      `${post.title} — ${post.partnerName}. See it on OrbTap!`,
      feedPostDeepLink(post.id),
    ));
    setShareSheetVisible(true);
  };

  const whySeeing = 'Nearby'; // Could be: Following | Trending | Sponsored
  const partner = getPartner(post.partnerId);
  const tierColor = PARTNER_TIER_COLORS[partner?.tier ?? 'silver'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
<TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {post.partnerName}
        </Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => {
              alertDialog('Delete post?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    const res = await deletePost(post.id);
                    setDeleting(false);
                    if (res.success) router.back();
                    else showErrorAlert(
                      'Post couldn’t be deleted',
                      res.message ?? 'We couldn’t remove this post. Please try again.',
                    );
                  },
                },
              ]);
            }}
            style={styles.shareBtn}
            disabled={deleting}
          >
            <Ionicons name="trash-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.partnerRow, { borderLeftColor: tierColor, borderLeftWidth: 4, paddingLeft: 12 }]}>
          <Text style={[styles.partnerName, { color: colors.text }]}>{post.partnerName}</Text>
          {post.partnerVerified && <VerifiedBadge size={16} tier={partner?.tier} />}
        </View>
        <View style={[styles.typePill, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.typePillText, { color: colors.textSecondary }]}>
            {getPostTypeLabel(post.type)}
          </Text>
        </View>
        {post.mediaRefs.length > 0 ? (
          <Image source={{ uri: post.mediaRefs[0] }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
            <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
          </View>
        )}
        <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
        <Text style={[styles.postBody, { color: colors.text }]}>{post.body}</Text>
        {(post.stats?.redemptionsVerified ?? 0) > 0 && (
          <Text style={[styles.momentum, { color: COLORS.success }]}>
            Proof-backed: {post.stats?.redemptionsVerified ?? 0} verified redemptions
          </Text>
        )}
        <Text style={[styles.whySeeing, { color: colors.textSecondary }]}>
          Why you're seeing this: {whySeeing}
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: tierColor }]}
          onPress={handleCta}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaButtonText}>{getCtaLabel(post.cta.kind)}</Text>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </ScrollView>
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share post"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700' },
  shareBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  partnerName: { fontSize: 18, fontWeight: '700' },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  typePillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  heroImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  heroPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  postBody: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  momentum: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  whySeeing: { fontSize: 12, marginBottom: 20 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: { fontSize: 16, fontWeight: '800', color: '#000' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16 },
});
