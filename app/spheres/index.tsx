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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSocial, Circle } from '../../hooks/useSocial';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { SphereXpBar } from '../../components/SphereXpBar';
import { getSphereTierForXp } from '../../constants/SphereLevels';
import { HOLO_COLORS, SHINE_COLORS } from '../../constants/PremiumStyles';
import * as Haptics from 'expo-haptics';

const HOLO_BORDER = 2;
const SHINE_OPACITY = 0.45;

// --- Onboarding steps for create flow ---
const ONBOARDING_STEPS = [
  {
    title: 'What is a Sphere?',
    body: 'A Sphere is an invite-only group. Pool OT Points for perks, missions, and future OrbTap shop items. Share experiences and chat with your circle.',
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

// --- Premium sphere tile ---
function SphereCard({ circle, onPress }: { circle: Circle; onPress: () => void }) {
  const accent = circle.type === 'couple' ? '#EC4899' : circle.type === 'fami' ? '#F59E0B' : '#8B5CF6';
  return (
    <TouchableOpacity style={styles.cardWrap} onPress={onPress} activeOpacity={0.95}>
      <LinearGradient
        colors={[...HOLO_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.holoBorder, { padding: HOLO_BORDER }]}
      >
        <View style={[styles.cardInner, { backgroundColor: '#0d0d12' }]}>
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
              <OTPointsBadge amount={circle.totalPoints} size={16} label="pts" compact textColor="#F59E0B" />
            </View>
            <Text style={styles.cardName}>{circle.name}</Text>
            <Text style={styles.cardMeta}>{circle.members.length} members · Pool {circle.poolBalance} OT</Text>
            {circle.posts && circle.posts.length > 0 && (
              <Text style={styles.cardActivity}>{circle.posts.length} recent post{circle.posts.length !== 1 ? 's' : ''}</Text>
            )}
            <View style={styles.tapRow}>
              <Text style={styles.tapText}>Open sphere</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
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
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState<Circle['type']>('pal');

  const isOnboarding = step < ONBOARDING_STEPS.length;
  const currentStep = ONBOARDING_STEPS[step];

  const handleNext = () => {
    Haptics.selectionAsync();
    if (step < ONBOARDING_STEPS.length - 1) setStep(step + 1);
    else setStep(ONBOARDING_STEPS.length);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isOnboarding ? 'Create a Sphere' : 'Name your sphere'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {isOnboarding ? (
            <>
              <View style={styles.onboardBody}>
                <View style={[styles.onboardIconWrap, { backgroundColor: '#8B5CF6' + '30' }]}>
                  <Ionicons name={currentStep.icon} size={40} color="#8B5CF6" />
                </View>
                <Text style={styles.onboardTitle}>{currentStep.title}</Text>
                <Text style={styles.onboardBodyText}>{currentStep.body}</Text>
              </View>
              <View style={styles.stepDots}>
                {ONBOARDING_STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === step && styles.dotActive]}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.onboardNext} onPress={handleNext} activeOpacity={0.9}>
                <Text style={styles.onboardNextText}>{step < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get started'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Sphere name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Weekend Crew"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="words"
              />
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeRow}>
                {(['couple', 'fami', 'pal'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, type === t && styles.typeOptionActive]}
                    onPress={() => { Haptics.selectionAsync(); setType(t); }}
                  >
                    <Ionicons
                      name={t === 'couple' ? 'heart' : t === 'fami' ? 'home' : 'people'}
                      size={22}
                      color={type === t ? '#fff' : 'rgba(255,255,255,0.6)'}
                    />
                    <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>
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
  const router = useRouter();
  const { circles, createCircle } = useSocial();
  const [createVisible, setCreateVisible] = useState(false);

  const handleCreate = (name: string, type: Circle['type']) => {
    const newCircle = createCircle(name, type);
    if (newCircle) router.push(`/spheres/${newCircle.id}` as any);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0f0f12', '#1a1a20', '#0a0a0d']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spheres</Text>
          <Text style={styles.headerSub}>Invite-only groups. Pool points. Share experiences.</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.leaderboardCta}>
            <View style={styles.leaderboardCtaLeft}>
              <Ionicons name="trophy" size={22} color="#F59E0B" />
              <View>
                <Text style={styles.leaderboardCtaTitle}>Sphere leaderboard</Text>
                <Text style={styles.leaderboardCtaSub}>Compete for top team status. Verified visits & missions raise your sphere level.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.leaderboardCtaBtn} onPress={() => router.push('/leaderboard' as any)} activeOpacity={0.9}>
              <Text style={styles.leaderboardCtaBtnText}>See ranks</Text>
              <Ionicons name="chevron-forward" size={18} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Your spheres</Text>
          {circles.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>
                <Ionicons name="people" size={48} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No spheres yet</Text>
              <Text style={styles.emptySub}>Create one and invite others with a code. Pool OT Points for perks and missions.</Text>
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
            style={styles.createCard}
            onPress={() => { Haptics.selectionAsync(); setCreateVisible(true); }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['rgba(139,92,246,0.25)', 'rgba(139,92,246,0.08)']}
              style={styles.createCardGrad}
            >
              <Ionicons name="add-circle" size={40} color="#8B5CF6" />
              <Text style={styles.createCardText}>Create new Sphere</Text>
              <Text style={styles.createCardSub}>Invite-only. Pool OT Points. Share experiences.</Text>
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
  scrollContent: { padding: 20, paddingBottom: 48 },
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
  leaderboardCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  leaderboardCtaTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  leaderboardCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 16 },
  leaderboardCtaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F59E0B' },
  leaderboardCtaBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
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
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFF', marginBottom: 20 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeOption: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 2, borderColor: 'transparent' },
  typeOptionActive: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.15)' },
  typeOptionText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  typeOptionTextActive: { color: '#FFF' },
  createBtn: { height: 52, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
