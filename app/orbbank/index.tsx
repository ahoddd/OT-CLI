/**
 * OrbBank™ — Goal Jars screen.
 * Create named savings jars, route OT earnings into them, redeem when ready.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/Colors';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import {
  getUserJars,
  createJar,
  deleteJar,
  setActiveJar,
  type OrbBankJar,
} from '../../services/orbBank';
import {
  ORB_BANK_GOAL_TEMPLATES,
  ORB_BANK_AUTO_SAVE_OPTIONS,
} from '../../constants/OrbBankGoals';

export default function OrbBankScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { user } = useAuth();

  const [jars, setJars] = useState<OrbBankJar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(ORB_BANK_GOAL_TEMPLATES[0].key);
  const [customLabel, setCustomLabel] = useState('');
  const [autoSave, setAutoSave] = useState(0);
  const [creating, setCreating] = useState(false);

  const loadJars = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getUserJars(user.uid);
      setJars(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadJars(); }, [user?.uid]);

  const handleCreate = async () => {
    if (creating || !user?.uid) return;
    setCreating(true);
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const template = ORB_BANK_GOAL_TEMPLATES.find(t => t.key === selectedTemplate)!;
      await createJar(user.uid, {
        uid: user.uid,
        label: selectedTemplate === 'custom' && customLabel.trim() ? customLabel.trim() : template.label,
        emoji: template.emoji,
        targetOT: template.targetOT,
        autoSavePercent: autoSave,
        partnerCategoryTags: template.partnerCategoryTags,
        isActive: jars.length === 0,
      });
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreate(false);
      await loadJars();
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (jarId: string) => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await deleteJar(jarId);
    await loadJars();
  };

  const handleSetActive = async (jarId: string) => {
    if (!user?.uid) return;
    safeHaptics.selectionAsync();
    await setActiveJar(user.uid, jarId);
    await loadJars();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>OrbBank™</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: themeGold }]}
          onPress={() => { safeHaptics.selectionAsync(); setShowCreate(true); }}
        >
          <Ionicons name="add" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[themeGold + '22', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={{ fontSize: 32 }}>🏦</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Goal Jar Savings</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Route your OT earnings into goal jars. Top up via the app. Redeem when you're ready.
          </Text>
          <TouchableOpacity
            style={[styles.topUpCTA, { borderColor: themeGold }]}
            onPress={() => router.push('/orbbank/topup')}
            activeOpacity={0.8}
          >
            <Text style={[styles.topUpCTAText, { color: themeGold }]}>Top up OT →</Text>
          </TouchableOpacity>
        </Animated.View>

        {loading ? (
          <ActivityIndicator color={themeGold} style={{ marginTop: 40 }} />
        ) : jars.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No goal jars yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Create your first jar to start saving OT for something special.
            </Text>
            <TouchableOpacity
              style={[styles.createJarBtn, { backgroundColor: themeGold }]}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.createJarBtnText}>Create goal jar</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          jars.map((jar, i) => {
            const progress = Math.min(jar.currentOT / jar.targetOT, 1);
            return (
              <Animated.View
                key={jar.id}
                entering={FadeInDown.delay(i * 80).duration(400)}
                style={[styles.jarCard, { backgroundColor: colors.surface, borderColor: jar.isActive ? themeGold : colors.border }]}
              >
                <View style={styles.jarHeader}>
                  <Text style={{ fontSize: 28 }}>{jar.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.jarLabel, { color: colors.text }]}>{jar.label}</Text>
                    <Text style={[styles.jarMeta, { color: colors.textSecondary }]}>
                      Auto-save: {jar.autoSavePercent > 0 ? `${jar.autoSavePercent}%` : 'Off'}
                    </Text>
                  </View>
                  {jar.isActive ? (
                    <View style={[styles.activeBadge, { backgroundColor: themeGold + '22' }]}>
                      <Text style={[styles.activeBadgeText, { color: themeGold }]}>ACTIVE</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => handleSetActive(jar.id)} style={[styles.setActiveBtn, { borderColor: colors.border }]}>
                      <Text style={[styles.setActiveBtnText, { color: colors.textSecondary }]}>Set active</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(jar.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.jarProgress}>
                  <Text style={[styles.jarOT, { color: themeGold }]}>{jar.currentOT.toLocaleString()} OT</Text>
                  <Text style={[styles.jarTarget, { color: colors.textSecondary }]}> / {jar.targetOT.toLocaleString()} OT</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: themeGold, width: `${Math.round(progress * 100)}%` as `${number}%` },
                    ]}
                  />
                </View>
                {progress >= 1 && (
                  <TouchableOpacity
                    style={[styles.redeemBtn, { backgroundColor: themeGold }]}
                    onPress={() => router.push('/(tabs)/wallet')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.redeemBtnText}>Redeem Night Pack 🎉</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Create Jar Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Goal Jar</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Choose a template</Text>
            {ORB_BANK_GOAL_TEMPLATES.map(template => (
              <TouchableOpacity
                key={template.key}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: selectedTemplate === template.key ? themeGold + '18' : colors.surface,
                    borderColor: selectedTemplate === template.key ? themeGold : colors.border,
                  },
                ]}
                onPress={() => { safeHaptics.selectionAsync(); setSelectedTemplate(template.key); }}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 24 }}>{template.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.templateLabel, { color: colors.text }]}>{template.label}</Text>
                  <Text style={[styles.templateSub, { color: colors.textSecondary }]}>
                    {template.targetOT.toLocaleString()} OT · {template.description}
                  </Text>
                </View>
                {selectedTemplate === template.key && (
                  <Ionicons name="checkmark-circle" size={20} color={themeGold} />
                )}
              </TouchableOpacity>
            ))}
            {selectedTemplate === 'custom' && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={customLabel}
                onChangeText={setCustomLabel}
                placeholder="Name your jar"
                placeholderTextColor={colors.textSecondary}
              />
            )}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>Auto-save from earnings</Text>
            <View style={styles.autoSaveRow}>
              {ORB_BANK_AUTO_SAVE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.autoSaveChip,
                    {
                      backgroundColor: autoSave === opt.value ? themeGold : colors.surface,
                      borderColor: autoSave === opt.value ? themeGold : colors.border,
                    },
                  ]}
                  onPress={() => { safeHaptics.selectionAsync(); setAutoSave(opt.value); }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.autoSaveText, { color: autoSave === opt.value ? '#000' : colors.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.createJarBtn, { backgroundColor: themeGold, opacity: creating ? 0.7 : 1, marginTop: 24 }]}
              onPress={handleCreate}
              disabled={creating}
              activeOpacity={0.85}
            >
              {creating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.createJarBtnText}>Create Jar →</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 60, gap: 12 },
  heroCard: { borderRadius: 20, padding: 24, overflow: 'hidden', gap: 8, marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: '800' },
  heroSub: { fontSize: 14, lineHeight: 20 },
  topUpCTA: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start', marginTop: 4 },
  topUpCTAText: { fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  createJarBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  createJarBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  jarCard: { borderRadius: 20, padding: 16, borderWidth: 1.5, gap: 10 },
  jarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jarLabel: { fontSize: 16, fontWeight: '700' },
  jarMeta: { fontSize: 12 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: '700' },
  setActiveBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  setActiveBtnText: { fontSize: 11, fontWeight: '600' },
  jarProgress: { flexDirection: 'row', alignItems: 'baseline' },
  jarOT: { fontSize: 20, fontWeight: '800' },
  jarTarget: { fontSize: 13 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  redeemBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  redeemBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalScroll: { paddingHorizontal: 20, paddingBottom: 60 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  templateCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, gap: 12, marginBottom: 8 },
  templateLabel: { fontSize: 15, fontWeight: '700' },
  templateSub: { fontSize: 12, marginTop: 2 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginTop: 8 },
  autoSaveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  autoSaveChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  autoSaveText: { fontSize: 13, fontWeight: '600' },
});
