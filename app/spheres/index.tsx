import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSocial, Circle } from '../../hooks/useSocial';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { useTheme } from '../../hooks/useTheme';
import { useMissions } from '../../context/MissionsContext';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { SphereXpBar } from '../../components/SphereXpBar';
import { getSphereTierForXp } from '../../constants/SphereLevels';
import { HOLO_COLORS, SHINE_COLORS } from '../../constants/PremiumStyles';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { useTutorial } from '../../context/TutorialContext';
import { useI18n } from '../../context/I18nContext';

const HOLO_BORDER = 2;
const SHINE_OPACITY = 0.45;

// --- Onboarding steps for create flow ---
const ONBOARDING_STEPS = [
  {
    title: 'What is a Sphere?',
    body: 'Pool OT Points with people you actually go out with. Complete plans together, earn at real spots, and share experiences — not just split bills.',
    icon: 'people' as const,
  },
  {
    title: 'Choose a type',
    body: 'Couple: you + one. Fami: family. Pal: friends or squad. You can create multiple spheres.',
    icon: 'heart' as const,
  },
  {
    title: 'Invite with a code',
    body: 'Share your unique invite code. Members join with one tap. Only people with the code can join.',
    icon: 'key' as const,
  },
];

// --- Missions + Map integration: drive foot traffic with your Sphere ---
function MissionsMapCard({ router, colors }: { router: ReturnType<typeof useRouter>; colors: { text: string; textSecondary: string; primary: string } }) {
  const { todayMissions } = useMissions();
  const missionCount = todayMissions.length;
  return (
    <View style={styles.missionsMapCard}>
      <View style={styles.missionsMapCardLeft}>
        <View style={[styles.missionsMapCardIcon, { backgroundColor: colors.primary + '40' }]}>
          <Ionicons name="flag" size={22} color={colors.primary} />
        </View>
        <View style={styles.missionsMapCardTextWrap}>
          <Text style={[styles.missionsMapCardTitle, { color: colors.text }]}>Missions & map</Text>
          <Text style={[styles.missionsMapCardSub, { color: colors.textSecondary }]}>
            Do missions with your Sphere. Visit partners together, earn OT and Sphere XP. Every mission you complete levels up your Spheres and sends real foot traffic to partners.
          </Text>
        </View>
      </View>
      <View style={styles.missionsMapCardActions}>
        <TouchableOpacity
          style={[styles.missionsMapCardBtn, { backgroundColor: colors.primary }]}
          onPress={() => { safeHaptics.selectionAsync(); router.push('/missions' as any); }}
          activeOpacity={0.9}
        >
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.missionsMapCardBtnText}>Open missions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.missionsMapCardBtnOutlined, { borderColor: colors.textSecondary }]}
          onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/(tabs)', params: { focusMissions: '1' } } as any); }}
          activeOpacity={0.9}
        >
          <Ionicons name="map" size={16} color={colors.textSecondary} />
          <Text style={[styles.missionsMapCardBtnOutlinedText, { color: colors.textSecondary }]}>View map</Text>
        </TouchableOpacity>
      </View>
      {missionCount > 0 && (
        <Text style={[styles.missionsMapCardHint, { color: colors.textSecondary }]}>
          {missionCount} mission{missionCount !== 1 ? 's' : ''} active — complete them to level up your Spheres
        </Text>
      )}
    </View>
  );
}

// --- Premium sphere tile ---
function SphereCard({ circle, onPress }: { circle: Circle; onPress: () => void }) {
  const { colors } = useTheme();
  const accent = circle.type === 'couple' ? '#EC4899' : circle.type === 'fami' ? '#F59E0B' : '#8B5CF6';
  return (
    <TouchableOpacity style={styles.cardWrap} onPress={onPress} activeOpacity={0.95}>
      <LinearGradient
        colors={[...HOLO_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.holoBorder, { padding: HOLO_BORDER }]}
      >
        <View style={[styles.cardInner, { backgroundColor: colors.surface }]}>
          <View style={[styles.tierBar, { backgroundColor: accent }]} />
          <LinearGradient
            colors={[...SHINE_COLORS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { opacity: SHINE_OPACITY }]}
            pointerEvents="none"
          />
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={[styles.typePill, { backgroundColor: accent + '30' }]}>
                <Ionicons
                  name={circle.type === 'couple' ? 'heart' : circle.type === 'fami' ? 'home' : 'people'}
                  size={16}
                  color={accent}
                />
                <Text style={[styles.typeText, { color: accent }]}>
                  {circle.type === 'couple' ? 'Couple' : circle.type === 'fami' ? 'Family' : 'Pals'}
                </Text>
              </View>
              <OTPointsBadge amount={circle.totalPoints} size={16} label="pts" compact textColor={colors.text} />
            </View>
            <Text style={[styles.cardName, { color: colors.text }]}>{circle.name}</Text>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
              {circle.members.length} members · Pool {circle.poolBalance} OT
              {(circle.missionsCompletedCount ?? 0) > 0 && ` · ${circle.missionsCompletedCount} missions`}
            </Text>
            {circle.posts && circle.posts.length > 0 && (
              <Text style={[styles.cardActivity, { color: colors.textSecondary }]}>{circle.posts.length} recent post{circle.posts.length !== 1 ? 's' : ''}</Text>
            )}
            <View style={styles.tapRow}>
              <Text style={[styles.tapText, { color: colors.textSecondary }]}>Open sphere</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// --- Create sphere modal with onboarding ---
function CreateSphereModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, type: Circle['type']) => void;
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState<Circle['type']>('pal');

  const isOnboarding = step < ONBOARDING_STEPS.length;
  const currentStep = ONBOARDING_STEPS[step];

  const handleNext = () => {
    safeHaptics.selectionAsync();
    if (step < ONBOARDING_STEPS.length - 1) setStep(step + 1);
    else setStep(ONBOARDING_STEPS.length);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCreate(name.trim(), type);
    setName('');
    setType('pal');
    setStep(0);
    onClose();
  };

  const handleClose = () => {
    setStep(0);
    setName('');
    setType('pal');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable style={[styles.modalBox, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isOnboarding ? 'Create a Sphere' : 'Name your sphere'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {isOnboarding ? (
            <>
              <View style={styles.onboardBody}>
                <View style={[styles.onboardIconWrap, { backgroundColor: '#8B5CF6' + '30' }]}>
                  <Ionicons name={currentStep.icon} size={40} color="#8B5CF6" />
                </View>
                <Text style={[styles.onboardTitle, { color: colors.text }]}>{currentStep.title}</Text>
                <Text style={[styles.onboardBodyText, { color: colors.textSecondary }]}>{currentStep.body}</Text>
              </View>
              <View style={styles.stepDots}>
                {ONBOARDING_STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === step ? styles.dotActive : { backgroundColor: colors.border }]}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.onboardNext} onPress={handleNext} activeOpacity={0.9}>
                <Text style={[styles.onboardNextText, { color: '#fff' }]}>{step < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get started'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Sphere name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Weekend Crew"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.typeRow}>
                {(['couple', 'fami', 'pal'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, type === t && styles.typeOptionActive, { backgroundColor: type === t ? 'rgba(139,92,246,0.15)' : colors.surfaceHighlight, borderColor: type === t ? '#8B5CF6' : colors.border }]}
                    onPress={() => { safeHaptics.selectionAsync(); setType(t); }}
                  >
                    <Ionicons
                      name={t === 'couple' ? 'heart' : t === 'fami' ? 'home' : 'people'}
                      size={22}
                      color={type === t ? '#8B5CF6' : colors.textSecondary}
                    />
                    <Text style={[styles.typeOptionText, { color: type === t ? colors.text : colors.textSecondary }]}>
                      {t === 'couple' ? 'Couple' : t === 'fami' ? 'Family' : 'Pals'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={!name.trim()}
                activeOpacity={0.9}
              >
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={StyleSheet.absoluteFill} />
                <Text style={styles.createBtnText}>Create Sphere</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function SpheresScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();
  const [showSpheresTutorial, setShowSpheresTutorial] = useState(false);
  const { circles, createCircle } = useSocial();
  const { tier: userTier } = useEffectiveTier();
  const [createVisible, setCreateVisible] = useState(false);

  React.useEffect(() => {
    if (shouldShowTutorial('spheres')) setShowSpheresTutorial(true);
  }, [shouldShowTutorial]);

  const handleCreate = (name: string, type: Circle['type']) => {
    const result = createCircle(name, type, userTier);
    if (!result.success) {
      const limitText = result.limit === 2 ? 'Free accounts can create up to 2 spheres. Upgrade to Premium for more.' : `You've reached the sphere limit (${result.limit}). Upgrade for more.`;
      Alert.alert('Sphere Limit Reached', limitText, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/premium' as any) },
      ]);
      return;
    }
    router.push(`/spheres/${result.circle.id}` as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.background, colors.surface, colors.background]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Spheres</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Invite-only groups. Pool points. Share experiences.</Text>
        </View>

        <GuidedTutorialOverlay
          visible={showSpheresTutorial}
          tutorialId="spheres"
          onClose={() => { markCompleted('spheres'); setShowSpheresTutorial(false); }}
          onSkipAll={() => { setSkipAllTutorials(); setShowSpheresTutorial(false); }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.joinCodeCta, { backgroundColor: '#8B5CF6' + '22', borderColor: '#8B5CF6' + '55' }]}
            onPress={() => { safeHaptics.selectionAsync(); router.push('/spheres/join' as any); }}
            activeOpacity={0.88}
          >
            <Ionicons name="key" size={24} color="#8B5CF6" />
            <View style={styles.joinCodeCtaText}>
              <Text style={[styles.joinCodeCtaTitle, { color: colors.text }]}>Join with a code</Text>
              <Text style={[styles.joinCodeCtaSub, { color: colors.textSecondary }]}>Have an invite code? Enter it to join a Sphere</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </TouchableOpacity>

          <View style={styles.leaderboardCta}>
            <View style={styles.leaderboardCtaLeft}>
              <Ionicons name="trophy" size={22} color="#F59E0B" style={styles.leaderboardCtaIcon} />
              <View style={styles.leaderboardCtaTextWrap}>
                <Text style={[styles.leaderboardCtaTitle, { color: colors.text }]}>Sphere leaderboard</Text>
                <Text style={[styles.leaderboardCtaSub, { color: colors.textSecondary }]}>Compete for top team status. Verified visits & missions raise your sphere level.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.leaderboardCtaBtn} onPress={() => router.push('/leaderboard' as any)} activeOpacity={0.9}>
              <Text style={[styles.leaderboardCtaBtnText, { color: '#000' }]}>See ranks</Text>
              <Ionicons name="chevron-forward" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          <MissionsMapCard router={router} colors={colors} />

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your spheres</Text>
          {circles.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>
                <Ionicons name="people" size={48} color="#8B5CF6" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No spheres yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create one and invite others with a code. Pool OT Points for perks and missions.</Text>
            </View>
          ) : (
            circles.map((circle) => (
              <SphereCard
                key={circle.id}
                circle={circle}
                onPress={() => router.push(`/spheres/${circle.id}` as any)}
              />
            ))
          )}

          <TouchableOpacity
            style={[styles.createCard, { borderColor: 'rgba(139,92,246,0.4)' }]}
            onPress={() => { safeHaptics.selectionAsync(); setCreateVisible(true); }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['rgba(139,92,246,0.25)', 'rgba(139,92,246,0.08)']}
              style={styles.createCardGrad}
            >
              <Ionicons name="add-circle" size={40} color="#8B5CF6" />
              <Text style={[styles.createCardText, { color: colors.text }]}>Create new Sphere</Text>
              <Text style={[styles.createCardSub, { color: colors.textSecondary }]}>Invite-only. Pool OT Points. Share experiences.</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <CreateSphereModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0d' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerBack: { marginBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  joinCodeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  joinCodeCtaText: { flex: 1 },
  joinCodeCtaTitle: { fontSize: 16, fontWeight: '800' },
  joinCodeCtaSub: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 16 },
  cardWrap: { marginBottom: 14, borderRadius: 18, overflow: 'hidden' },
  holoBorder: { borderRadius: 18, overflow: 'hidden' },
  cardInner: { borderRadius: 16, overflow: 'hidden', minHeight: 120 },
  tierBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 1 },
  cardContent: { padding: 18, paddingTop: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typeText: { fontSize: 12, fontWeight: '700' },
  cardName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  cardMeta: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  cardStats: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  cardBenefit: { fontSize: 11, color: '#A78BFA', marginBottom: 6 },
  cardActivity: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  tapRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tapText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  empty: { alignItems: 'center', paddingVertical: 40, marginBottom: 20 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  leaderboardCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: 16, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  leaderboardCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  leaderboardCtaIcon: { flexShrink: 0 },
  leaderboardCtaTextWrap: { flex: 1, minWidth: 0 },
  leaderboardCtaTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  leaderboardCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 16 },
  leaderboardCtaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F59E0B', flexShrink: 0, marginLeft: 12 },
  leaderboardCtaBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  missionsMapCard: { marginBottom: 20, padding: 16, backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)' },
  missionsMapCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  missionsMapCardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  missionsMapCardTextWrap: { flex: 1, minWidth: 0 },
  missionsMapCardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  missionsMapCardSub: { fontSize: 13, lineHeight: 19 },
  missionsMapCardActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  missionsMapCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  missionsMapCardBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  missionsMapCardBtnOutlined: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  missionsMapCardBtnOutlinedText: { fontSize: 14, fontWeight: '700' },
  missionsMapCardHint: { fontSize: 12, fontWeight: '600', marginTop: 12 },
  createCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', marginTop: 8 },
  createCardGrad: { padding: 24, alignItems: 'center' },
  createCardText: { fontSize: 17, fontWeight: '800', color: '#FFF', marginTop: 12 },
  createCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1a1a1f', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  modalClose: { padding: 8 },
  onboardBody: { alignItems: 'center', marginBottom: 24 },
  onboardIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  onboardTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 12, textAlign: 'center' },
  onboardBodyText: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 22, textAlign: 'center', paddingHorizontal: 16 },
  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#8B5CF6', width: 24 },
  onboardNext: { backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  onboardNextText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 20,
    borderWidth: 1,
  },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeOption: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 2, borderColor: 'transparent' },
  typeOptionActive: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.15)' },
  typeOptionText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  typeOptionTextActive: { color: '#FFF' },
  createBtn: { height: 52, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
