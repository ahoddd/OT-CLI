/**
 * OrbVote poll card — premium, customizable, one-vote-per-user.
 * Supports custom accent, tagline, partner link. Animated progress.
 * Share-after-vote: users can share poll results to social.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/Colors';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import { useTheme } from '../hooks/useTheme';
import { useWalletContext } from '../context/WalletContext';
import { usePartners } from '../context/PartnersContext';
import { Poll } from '../constants/Polls';
import { LEDGER_REASON } from '../constants/OrbinomicsPolicy';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { ORBTAP_APP_LINK } from '../constants/AppLinks';
import { pollSharePayload } from '../utils/shareToSocial';
import { ShareToSocialSheet } from './ShareToSocialSheet';

const POLL_VOTE_REWARD = 5;

/** Single option row with animated progress bar. */
function PollOptionRow({
  opt,
  i,
  total,
  percent,
  effectiveVoted,
  accent,
  colors,
  voting,
  handleVote,
}: {
  opt: { label: string; votes: number };
  i: number;
  total: number;
  percent: number;
  effectiveVoted: number | null;
  accent: string;
  colors: { text: string; textSecondary: string; border: string };
  voting: boolean;
  handleVote: (i: number) => void;
}) {
  const isSelected = effectiveVoted === i;
  const barWidth = useSharedValue(0);

  useEffect(() => {
    if (effectiveVoted !== null) {
      barWidth.value = withTiming(percent / 100, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [effectiveVoted, percent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
  }));

  return (
    <TouchableOpacity
      style={[
        styles.optionBtn,
        { borderColor: isSelected ? accent : colors.border },
        isSelected && { backgroundColor: accent + '14' },
      ]}
      onPress={() => handleVote(i)}
      disabled={effectiveVoted !== null || voting}
      activeOpacity={0.8}
    >
      {effectiveVoted !== null && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: accent + '35' } as const, barStyle]} />
      )}
      <View style={styles.optionContent}>
        <Text style={[styles.optionText, { color: colors.text, fontWeight: isSelected ? '700' : '500' }]}>{opt.label}</Text>
        {effectiveVoted !== null && (
          <View style={styles.percentRow}>
            <Text style={[styles.percent, { color: colors.textSecondary }]}>{percent}%</Text>
            {isSelected && <Ionicons name="checkmark-circle" size={18} color={COLORS.success ?? '#4ade80'} />}
          </View>
        )}
      </View>
      {voting && effectiveVoted === null ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionIndex: number) => Promise<{ success: boolean; error?: string }>;
  votedOption?: number | null;
  /** Make card more prominent (e.g. for featured spot) */
  variant?: 'default' | 'featured';
  /** Admin only: show delete and call on delete */
  onDelete?: (pollId: string) => void | Promise<void>;
  showDeleteButton?: boolean;
}

export const PollCard = ({ poll, onVote, votedOption: initialVoted, variant = 'default', onDelete, showDeleteButton }: PollCardProps) => {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const router = useRouter();
  const { addTransaction } = useWalletContext();
  const { getPartner } = usePartners();
  const [voted, setVoted] = useState<number | null>(initialVoted ?? null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (initialVoted != null) setVoted(initialVoted);
  }, [initialVoted]);

  const effectiveVoted = voted ?? initialVoted ?? null;

  const handleVote = async (index: number) => {
    if (effectiveVoted !== null || voting) return;

    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (onVote) {
      setVoting(true);
      const result = await onVote(poll.id, index);
      setVoting(false);
      if (!result.success) return;
      setVoted(index);
      addTransaction({
        type: 'earn',
        amount: POLL_VOTE_REWARD,
        reason: LEDGER_REASON.EMIT_POLL_VOTE,
        ref: { actionId: `poll_${poll.id}` },
      });
    } else {
      setVoted(index);
      addTransaction({
        type: 'earn',
        amount: POLL_VOTE_REWARD,
        reason: LEDGER_REASON.EMIT_POLL_VOTE,
        ref: { actionId: `poll_${poll.id}` },
      });
    }
  };

  const handlePartnerPress = () => {
    if (poll.partnerId) {
      safeHaptics.selectionAsync();
      router.push(`/partner/${poll.partnerId}` as any);
    }
  };

  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; title?: string; url?: string } | null>(null);

  const handleShare = (p: Poll) => {
    safeHaptics.selectionAsync();
    const topOpt = p.options.reduce((a, b) => (b.votes > a.votes ? b : a));
    const total = p.totalVotes || 1;
    const pct = Math.round((topOpt.votes / total) * 100);
    const message = `${p.question}\n\nLeading: "${topOpt.label}" (${pct}%). Vote and earn OT on OrbTap OrbVote.`;
    setSharePayload(pollSharePayload(message, `${ORBTAP_APP_LINK}/vote`));
    setShareSheetVisible(true);
  };

  const isSponsored = poll.type === 'sponsored';
  const isFeatured = poll.type === 'featured';
  const defaultAccent = isSponsored ? themeGold : isFeatured ? (COLORS.neonBlue?.[0] ?? '#60a5fa') : COLORS.success ?? '#4ade80';
  // Partner polls always use their account tier color. Only admin-created polls (no partner / custom accent) use accentColor.
  const partner = poll.partnerId ? getPartner(poll.partnerId) : undefined;
  const partnerTierColor = partner ? PARTNER_TIER_COLORS[partner.tier] : (poll.partnerTier ? PARTNER_TIER_COLORS[poll.partnerTier] : null);
  const accent = partnerTierColor ?? poll.accentColor ?? defaultAccent;
  const isProminent = variant === 'featured' || isSponsored || isFeatured;

  const isDark = colors.background === '#000' || colors.background?.includes('0a') || true;

  return (
    <View style={[
      styles.container,
      { borderColor: accent + '55', borderLeftColor: accent },
      isProminent
        ? { backgroundColor: 'transparent' }
        : { backgroundColor: colors.surface },
      isProminent && styles.containerProminent,
    ]}>
      {/* Glassmorphism for featured/sponsored polls */}
      {isProminent && (
        <>
          {Platform.OS !== 'web' ? (
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,24,0.88)', borderRadius: 16 }]} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: accent + '08', borderRadius: 16 }]} pointerEvents="none" />
        </>
      )}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeRow}>
            {isSponsored && (
              <View style={[styles.badge, { backgroundColor: accent + '28' }]}>
                <Ionicons name="star" size={10} color={accent} />
                <Text style={[styles.badgeText, { color: accent }]}>SPONSORED</Text>
              </View>
            )}
            {isFeatured && !isSponsored && (
              <View style={[styles.badge, { backgroundColor: accent + '28' }]}>
                <Ionicons name="flash" size={10} color={accent} />
                <Text style={[styles.badgeText, { color: accent }]}>FEATURED</Text>
              </View>
            )}
            {poll.totalVotes > 0 && (
              <View style={[styles.liveDot, { backgroundColor: COLORS.success }]} />
            )}
            {/* Earn OT pill — key engagement trigger */}
            <View style={[styles.earnPill, { backgroundColor: accent + '20', borderColor: accent + '50' }]}>
              <Text style={[styles.earnPillText, { color: accent }]}>+{POLL_VOTE_REWARD} OT</Text>
            </View>
          </View>
          <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={handlePartnerPress} disabled={!poll.partnerId} style={styles.partnerWrap}>
            <Text style={[styles.partner, { color: colors.textSecondary }]} numberOfLines={1}>
              {poll.partnerName}
            </Text>
            {poll.partnerId && <Ionicons name="open-outline" size={12} color={colors.textSecondary} />}
          </TouchableOpacity>
          {showDeleteButton && onDelete && (
            <TouchableOpacity
              onPress={() => Alert.alert('Delete poll?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onDelete(poll.id) }])}
              style={styles.deleteBtn}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
          <Text style={[styles.question, { color: colors.text }]}>{poll.question}</Text>
          {poll.tagline ? (
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>{poll.tagline}</Text>
          ) : null}
        </View>
        <View style={[styles.timerWrap, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
          <Text style={[styles.timer, { color: accent }]}>{poll.timeLeft}</Text>
        </View>
      </View>

      <View style={styles.options}>
        {poll.options.map((opt, i) => {
          const total = poll.totalVotes || 1;
          const percent = Math.round((opt.votes / total) * 100);
          return (
            <PollOptionRow
              key={i}
              opt={opt}
              i={i}
              total={total}
              percent={percent}
              effectiveVoted={effectiveVoted}
              accent={accent}
              colors={colors}
              voting={voting}
              handleVote={handleVote}
            />
          );
        })}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.votes, { color: colors.textSecondary }]}>
          {poll.totalVotes.toLocaleString()} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
        {effectiveVoted !== null ? (
          <View style={styles.footerRight}>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: accent + '22', borderColor: accent + '55' }]}
              onPress={() => handleShare(poll)}
            >
              <Ionicons name="share-social-outline" size={14} color={accent} />
              <Text style={[styles.shareBtnText, { color: accent }]}>Share</Text>
            </TouchableOpacity>
            <View style={[styles.rewardBadge, { backgroundColor: COLORS.success + '22' }]}>
              <Ionicons name="add-circle" size={12} color={COLORS.success ?? '#4ade80'} />
              <Text style={[styles.rewardText, { color: COLORS.success ?? '#4ade80' }]}>+{POLL_VOTE_REWARD} OT</Text>
            </View>
          </View>
        ) : null}
      </View>
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share poll"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  containerProminent: {
    borderWidth: 1.5,
    borderLeftWidth: 6,
    padding: 22,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerLeft: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  earnPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  earnPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  partnerWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
  partner: { fontSize: 11, fontWeight: '600', flex: 1 },
  deleteBtn: { padding: 4 },
  question: { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  tagline: { fontSize: 13, marginTop: 6, fontStyle: 'italic', opacity: 0.9 },
  timerWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 12,
    borderWidth: 1,
  },
  timer: { fontSize: 11, fontWeight: '800' },
  options: { gap: 12 },
  optionBtn: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: { fontSize: 15 },
  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  percent: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 12, fontWeight: '700' },
  votes: { fontSize: 12, fontWeight: '600' },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  rewardText: { fontSize: 12, fontWeight: '800' },
});
