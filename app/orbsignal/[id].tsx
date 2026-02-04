import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSignal } from '../../hooks/useSignal';
import { useGame } from '../../context/GameContext';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { getOrbSignalMarket, VOTE_COST } from '../../constants/OrbSignal';
import { COLORS } from '../../constants/Colors';
import * as Haptics from 'expo-haptics';

async function shareMarket(question: string, voted?: string) {
  try {
    const message = voted
      ? `I voted ${voted} on "${question}" — see the odds on OrbTap Orb Signal.`
      : `"${question}" — What do you think? Vote with OT Points on OrbTap Orb Signal.`;
    await Share.share({ title: 'Orb Signal', message, url: undefined });
  } catch {}
}

export default function SignalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getMarket, placeForecast } = useSignal();
  const { points, purchaseUpgrade } = useGame();
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOutcome, setSubmittedOutcome] = useState<number | null>(null);

  const marketId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined;
  const market = marketId ? getOrbSignalMarket(marketId) ?? getMarket(marketId) : undefined;
  const canAfford = points >= VOTE_COST;

  const handleSelect = useCallback((idx: number) => {
    Haptics.selectionAsync();
    setSelectedOutcome(idx);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedOutcome === null || !market) return;
    const ok = purchaseUpgrade(VOTE_COST, 0);
    if (!ok) return;
    placeForecast(market.id, selectedOutcome, VOTE_COST);
    setSubmittedOutcome(selectedOutcome);
    setSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [market, selectedOutcome, purchaseUpgrade, placeForecast]);

  const handleShare = useCallback(() => {
    if (!market) return;
    Haptics.selectionAsync();
    const outcomeLabel = submittedOutcome !== null ? market.outcomes[submittedOutcome] : undefined;
    shareMarket(market.question, outcomeLabel);
  }, [market, submittedOutcome]);

  if (!market) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.notFound}>Market not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0f12', '#1a1a20', '#0a0a0d']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orb Signal</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerShare}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <View style={[styles.categoryPill, market.featured && styles.categoryPillFeatured]}>
              <Text style={styles.categoryText}>{market.category}</Text>
            </View>
            {market.endingSoon && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Ending soon</Text>
              </View>
            )}
            <Text style={styles.question}>{market.question}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>Pool: {market.pool.toLocaleString()} OT Points</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>Ends {market.endsAtShort}</Text>
              </View>
            </View>
            {market.rewardNote && (
              <Text style={styles.rewardNote}>{market.rewardNote}</Text>
            )}
          </Animated.View>

          {!submitted ? (
            <>
              <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.section}>
                <Text style={styles.sectionTitle}>Choose your prediction</Text>
                <Text style={styles.sectionSub}>Vote with {VOTE_COST} OT Points. Correct forecasts earn bonus.</Text>
                <View style={styles.outcomeList}>
                  {market.outcomes.map((outcome, idx) => {
                    const isYes = outcome.toLowerCase() === 'yes';
                    const pct = market.percentages[idx] ?? 0;
                    const isSelected = selectedOutcome === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.outcomeCard,
                          isSelected && styles.outcomeCardSelected,
                          isYes && styles.outcomeCardYes,
                          !isYes && styles.outcomeCardNo,
                        ]}
                        onPress={() => handleSelect(idx)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={
                            isYes
                              ? isSelected ? ['#0D9488', '#14B8A6'] : ['rgba(13,148,136,0.25)', 'rgba(20,184,166,0.2)']
                              : isSelected ? ['#E11D48', '#F43F5E'] : ['rgba(225,29,72,0.25)', 'rgba(244,63,94,0.2)']
                          }
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.outcomeInner}>
                          <Text style={[styles.outcomeLabel, isSelected && styles.outcomeLabelSelected]}>
                            {outcome}
                          </Text>
                          <Text style={[styles.outcomePct, isSelected && styles.outcomePctSelected]}>
                            {pct}%
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.outcomeCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>

              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Vote cost</Text>
                <OTPointsBadge amount={VOTE_COST} size={18} label="pts" compact textColor="#F59E0B" />
              </View>
              {!canAfford && (
                <Text style={styles.cantAfford}>You need {VOTE_COST - points} more OT Points to vote.</Text>
              )}

              <TouchableOpacity
                style={[styles.confirmBtn, (!canAfford || selectedOutcome === null) && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!canAfford || selectedOutcome === null}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={selectedOutcome === 0 ? ['#0D9488', '#14B8A6'] : ['#E11D48', '#F43F5E']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.confirmBtnText}>
                  CONFIRM — {selectedOutcome !== null ? market.outcomes[selectedOutcome] : 'Pick one'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={styles.successWrap}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Vote recorded</Text>
              <Text style={styles.successSub}>
                You predicted <Text style={styles.successBold}>{market.outcomes[submittedOutcome!]}</Text>.
                Correct forecasts earn reputation and bonus OT Points.
              </Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                <Ionicons name="share-social" size={22} color="#000" />
                <Text style={styles.shareBtnText}>Share your pick</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backToSignals} onPress={() => router.back()}>
                <Text style={styles.backToSignalsText}>Back to Orb Signal</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.explainer}>
            <Text style={styles.explainerTitle}>How odds work</Text>
            <Text style={styles.explainerBody}>
              The percentages show the current market view: e.g. 72% YES means most forecasters think it will happen.
              Your vote updates the odds slightly. When the market closes, correct predictors earn bonus OT Points and Orb Rep — no cash value, just bragging rights and in-app rewards.
            </Text>
          </Animated.View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Entertainment only. No wagering. Not financial advice. OT Points have no cash value.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0d' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBack: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerShare: { padding: 8 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  notFound: { color: '#fff', fontSize: 16, padding: 20 },
  backBtn: { padding: 8 },
  hero: { marginBottom: 28 },
  categoryPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  categoryPillFeatured: { backgroundColor: 'rgba(245,158,11,0.25)' },
  categoryText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.2)', marginBottom: 14 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  question: { fontSize: 24, fontWeight: '800', color: '#FFF', lineHeight: 32, marginBottom: 16 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  rewardNote: { fontSize: 13, color: 'rgba(245,158,11,0.95)' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  sectionSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  outcomeList: { gap: 12 },
  outcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  outcomeCardSelected: { borderColor: 'rgba(255,255,255,0.5)' },
  outcomeCardYes: {},
  outcomeCardNo: {},
  outcomeInner: { flex: 1 },
  outcomeLabel: { fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  outcomeLabelSelected: { color: '#FFF' },
  outcomePct: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  outcomePctSelected: { color: 'rgba(255,255,255,0.95)' },
  outcomeCheck: { marginLeft: 12 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  costLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  cantAfford: { fontSize: 13, color: '#EF4444', marginBottom: 12 },
  confirmBtn: { height: 56, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  successWrap: { alignItems: 'center', paddingVertical: 24 },
  successIconWrap: { marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  successSub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successBold: { fontWeight: '800', color: '#FFF' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 16, marginBottom: 16 },
  shareBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  backToSignals: { paddingVertical: 12 },
  backToSignalsText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  explainer: { marginTop: 32, padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  explainerTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  explainerBody: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
  disclaimer: { marginTop: 24, paddingHorizontal: 8 },
  disclaimerText: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 14 },
});
