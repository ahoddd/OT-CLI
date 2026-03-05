/**
 * Meal Proposal Composer — partner creates/edits meal proposals.
 * Template-based fast flow: meal type → vibe → details → preview → publish.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import type { PartnerTier } from '../constants/PartnerTiers';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ICONS,
  MEAL_VIBE_TAGS,
  PARTY_SIZE_PRESETS,
  EXPIRY_PRESETS,
  containsExternalContent,
  validateMealProposal,
  type MealType,
  type MealVibeTag,
  type MealMenuItem,
  type MealProposal,
  type MealProposalStatus,
} from '../constants/MealProposals';
import { getMealTierLimits } from '../constants/MealProposalTierConfig';

interface MealProposalComposerProps {
  partnerTier: PartnerTier;
  partnerId: string;
  partnerName: string;
  partnerVerified: boolean;
  onPublish: (draft: Omit<MealProposal, 'id' | 'analytics' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; errors?: { field: string; message: string }[] }>;
  onCancel: () => void;
  existingActiveCount: number;
}

export function MealProposalComposer({
  partnerTier,
  partnerId,
  partnerName,
  partnerVerified,
  onPublish,
  onCancel,
  existingActiveCount,
}: MealProposalComposerProps) {
  const { colors } = useTheme();
  const limits = getMealTierLimits(partnerTier);
  const tierColor = PARTNER_TIER_COLORS[partnerTier];

  const [step, setStep] = useState<'type' | 'vibe' | 'details' | 'preview'>('type');
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [vibeTags, setVibeTags] = useState<MealVibeTag[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricingMode, setPricingMode] = useState<'per_person' | 'total'>('per_person');
  const [priceStr, setPriceStr] = useState('');
  const [minPeople, setMinPeople] = useState(1);
  const [maxPeople, setMaxPeople] = useState(4);
  const [menuItems, setMenuItems] = useState<MealMenuItem[]>([{ name: '', description: '', priceCents: undefined }]);
  const [expiryIdx, setExpiryIdx] = useState(1);
  const [confirmPricing, setConfirmPricing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const canPublish = partnerVerified;
  const atLimit = existingActiveCount >= limits.maxActiveProposals;

  const toggleVibe = (tag: MealVibeTag) => {
    setVibeTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const addMenuItem = () => {
    if (menuItems.length >= 10) return;
    setMenuItems((prev) => [...prev, { name: '', description: '', priceCents: undefined }]);
  };

  const updateMenuItem = (index: number, field: keyof MealMenuItem, value: string | number | undefined) => {
    setMenuItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeMenuItem = (index: number) => {
    if (menuItems.length <= 1) return;
    setMenuItems((prev) => prev.filter((_, i) => i !== index));
  };

  const priceCents = useMemo(() => {
    const parsed = parseFloat(priceStr);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }, [priceStr]);

  const draft = useMemo((): Partial<MealProposal> => ({
    partnerId,
    status: canPublish ? 'PUBLISHED' : 'DRAFT' as MealProposalStatus,
    mealType: mealType ?? undefined,
    title,
    description,
    photos: [],
    pricing: {
      ...(pricingMode === 'per_person' ? { priceCentsPerPerson: priceCents } : { priceCentsTotal: priceCents }),
      currency: 'USD',
    },
    partySize: { minPeople, maxPeople },
    menuItems: menuItems.filter((m) => m.name.trim().length > 0),
    availability: { expiresAt: Date.now() + EXPIRY_PRESETS[expiryIdx].ms },
    targeting: { tags: vibeTags, sphereTargets: ['SOLO', 'COUPLE', 'PAL', 'FAMILY'] },
    cta: { kind: 'NAVIGATE' },
    trust: { requiresPartnerVerified: true },
    partnerName,
    partnerTier,
    partnerVerified,
  }), [partnerId, canPublish, mealType, title, description, pricingMode, priceCents, minPeople, maxPeople, menuItems, expiryIdx, vibeTags, partnerName, partnerTier, partnerVerified]);

  const validationErrors = useMemo(() => validateMealProposal(draft as Partial<MealProposal>), [draft]);

  const handlePublish = useCallback(async () => {
    if (containsExternalContent(title) || containsExternalContent(description)) {
      Alert.alert('Content blocked', 'Links, emails, and phone numbers are not allowed.');
      return;
    }
    if (!confirmPricing) {
      Alert.alert('Confirm pricing', 'Please confirm that pricing is accurate before publishing.');
      return;
    }
    if (validationErrors.length > 0) {
      Alert.alert('Missing fields', validationErrors.map((e) => e.message).join('\n'));
      return;
    }
    if (atLimit) {
      Alert.alert('Limit reached', `You have ${existingActiveCount}/${limits.maxActiveProposals} active proposals. Pause or remove one.`);
      return;
    }
    setPublishing(true);
    try {
      const result = await onPublish(draft as Omit<MealProposal, 'id' | 'analytics' | 'createdAt' | 'updatedAt'>);
      if (!result.success && result.errors) {
        Alert.alert('Error', result.errors.map((e) => e.message).join('\n'));
      }
    } finally {
      setPublishing(false);
    }
  }, [draft, confirmPricing, validationErrors, atLimit, existingActiveCount, limits.maxActiveProposals, onPublish, title, description]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Step indicator */}
      <View style={styles.stepRow}>
        {(['type', 'vibe', 'details', 'preview'] as const).map((s, i) => (
          <View key={s} style={[styles.stepDot, { backgroundColor: step === s ? colors.primary : colors.border }]}>
            <Text style={[styles.stepNum, { color: step === s ? '#000' : colors.textSecondary }]}>{i + 1}</Text>
          </View>
        ))}
      </View>

      {/* Tier banner */}
      <View style={[styles.tierBanner, { backgroundColor: tierColor + '14', borderColor: tierColor + '44' }]}>
        <Text style={[styles.tierLabel, { color: tierColor }]}>
          {partnerTier === 'platinum' ? 'PRO' : partnerTier === 'gold' ? 'Premium' : 'Free'} · {existingActiveCount}/{limits.maxActiveProposals} active
        </Text>
      </View>

      {!canPublish && (
        <View style={[styles.verifyBanner, { backgroundColor: '#f59e0b22', borderColor: '#f59e0b44' }]}>
          <Ionicons name="warning" size={18} color="#f59e0b" />
          <Text style={[styles.verifyText, { color: colors.text }]}>Get verified to publish. Drafts only for now.</Text>
        </View>
      )}

      {/* Step 1: Meal Type */}
      {step === 'type' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What meal?</Text>
          <View style={styles.chipRow}>
            {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((mt) => (
              <TouchableOpacity
                key={mt}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: mealType === mt ? colors.primary + '22' : colors.surface,
                    borderColor: mealType === mt ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMealType(mt)}
              >
                <Ionicons name={MEAL_TYPE_ICONS[mt] as any} size={22} color={mealType === mt ? colors.primary : colors.textSecondary} />
                <Text style={[styles.typeLabel, { color: mealType === mt ? colors.primary : colors.text }]}>{MEAL_TYPE_LABELS[mt]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {mealType && (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('vibe')}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Step 2: Vibe tags */}
      {step === 'vibe' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Target vibe</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Choose 1+ vibes to help match diners</Text>
          <View style={styles.chipRow}>
            {MEAL_VIBE_TAGS.map((vt) => (
              <TouchableOpacity
                key={vt.id}
                style={[
                  styles.vibeChip,
                  {
                    backgroundColor: vibeTags.includes(vt.id) ? colors.primary + '22' : colors.surface,
                    borderColor: vibeTags.includes(vt.id) ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleVibe(vt.id)}
              >
                <Ionicons name={vt.icon as any} size={16} color={vibeTags.includes(vt.id) ? colors.primary : colors.textSecondary} />
                <Text style={[styles.vibeLabel, { color: vibeTags.includes(vt.id) ? colors.primary : colors.text }]}>{vt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setStep('type')}><Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('details')}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Details */}
      {step === 'details' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Proposal details</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title (6–60 chars)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Date Night Tasting Menu"
            placeholderTextColor={colors.textSecondary}
            maxLength={60}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Description (20–240 chars)</Text>
          <TextInput
            style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell diners what to expect..."
            placeholderTextColor={colors.textSecondary}
            maxLength={240}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Pricing</Text>
          <View style={styles.pricingRow}>
            <TouchableOpacity
              style={[styles.pricingChip, { backgroundColor: pricingMode === 'per_person' ? colors.primary + '22' : colors.surface, borderColor: pricingMode === 'per_person' ? colors.primary : colors.border }]}
              onPress={() => setPricingMode('per_person')}
            >
              <Text style={{ color: pricingMode === 'per_person' ? colors.primary : colors.text, fontWeight: '700', fontSize: 13 }}>Per person</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pricingChip, { backgroundColor: pricingMode === 'total' ? colors.primary + '22' : colors.surface, borderColor: pricingMode === 'total' ? colors.primary : colors.border }]}
              onPress={() => setPricingMode('total')}
            >
              <Text style={{ color: pricingMode === 'total' ? colors.primary : colors.text, fontWeight: '700', fontSize: 13 }}>Total</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={priceStr}
            onChangeText={setPriceStr}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Party size</Text>
          <View style={styles.chipRow}>
            {PARTY_SIZE_PRESETS.map((s) => (
              <TouchableOpacity
                key={`min_${s}`}
                style={[styles.sizeChip, { backgroundColor: minPeople === s ? colors.primary + '22' : colors.surface, borderColor: minPeople === s ? colors.primary : colors.border }]}
                onPress={() => setMinPeople(s)}
              >
                <Text style={{ color: minPeople === s ? colors.primary : colors.text, fontWeight: '700', fontSize: 13 }}>{s}</Text>
              </TouchableOpacity>
            ))}
            <Text style={[styles.sizeDash, { color: colors.textSecondary }]}>to</Text>
            {PARTY_SIZE_PRESETS.filter((s) => s >= minPeople).map((s) => (
              <TouchableOpacity
                key={`max_${s}`}
                style={[styles.sizeChip, { backgroundColor: maxPeople === s ? colors.primary + '22' : colors.surface, borderColor: maxPeople === s ? colors.primary : colors.border }]}
                onPress={() => setMaxPeople(s)}
              >
                <Text style={{ color: maxPeople === s ? colors.primary : colors.text, fontWeight: '700', fontSize: 13 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Menu items (1–10)</Text>
          {menuItems.map((item, idx) => (
            <View key={idx} style={styles.menuItemRow}>
              <TextInput
                style={[styles.menuInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={item.name}
                onChangeText={(v) => updateMenuItem(idx, 'name', v)}
                placeholder={`Item ${idx + 1}`}
                placeholderTextColor={colors.textSecondary}
              />
              {menuItems.length > 1 && (
                <TouchableOpacity onPress={() => removeMenuItem(idx)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addMenuItem} style={styles.addItemBtn}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[{ color: colors.primary, fontWeight: '600', fontSize: 13 }]}>Add item</Text>
          </TouchableOpacity>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Expires in</Text>
          <View style={styles.chipRow}>
            {EXPIRY_PRESETS.map((ep, idx) => (
              <TouchableOpacity
                key={ep.label}
                style={[styles.vibeChip, { backgroundColor: expiryIdx === idx ? colors.primary + '22' : colors.surface, borderColor: expiryIdx === idx ? colors.primary : colors.border }]}
                onPress={() => setExpiryIdx(idx)}
              >
                <Text style={{ color: expiryIdx === idx ? colors.primary : colors.text, fontWeight: '700', fontSize: 13 }}>{ep.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setStep('vibe')}><Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('preview')}>
              <Text style={styles.nextBtnText}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 4: Preview + Publish */}
      {step === 'preview' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>

          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.mealBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.mealBadgeText, { color: colors.primary }]}>{mealType ? MEAL_TYPE_LABELS[mealType] : ''}</Text>
              </View>
              <Text style={[styles.previewPartner, { color: colors.textSecondary }]}>{partnerName}</Text>
              {partnerVerified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
            </View>
            <Text style={[styles.previewTitle, { color: colors.text }]}>{title || 'Proposal title'}</Text>
            <Text style={[styles.previewDesc, { color: colors.textSecondary }]}>{description || 'Description...'}</Text>
            <View style={styles.previewMeta}>
              <Text style={[styles.previewPrice, { color: colors.text }]}>
                {priceCents > 0 ? `$${(priceCents / 100).toFixed(2)}${pricingMode === 'per_person' ? '/person' : ' total'}` : 'Price TBD'}
              </Text>
              <Text style={[styles.previewParty, { color: colors.textSecondary }]}>for {minPeople}–{maxPeople}</Text>
            </View>
            {menuItems.filter((m) => m.name.trim()).length > 0 && (
              <View style={styles.previewMenu}>
                {menuItems.filter((m) => m.name.trim()).slice(0, 3).map((m, i) => (
                  <Text key={i} style={[styles.previewMenuItem, { color: colors.textSecondary }]}>• {m.name}</Text>
                ))}
              </View>
            )}
            <View style={styles.previewVibes}>
              {vibeTags.map((t) => {
                const vt = MEAL_VIBE_TAGS.find((v) => v.id === t);
                return vt ? <View key={t} style={[styles.previewVibeChip, { backgroundColor: colors.primary + '14' }]}>
                  <Text style={[{ color: colors.primary, fontSize: 11, fontWeight: '600' }]}>{vt.label}</Text>
                </View> : null;
              })}
            </View>
          </View>

          {validationErrors.length > 0 && (
            <View style={[styles.errorBox, { borderColor: '#ef4444' }]}>
              {validationErrors.map((e, i) => (
                <Text key={i} style={styles.errorText}>• {e.message}</Text>
              ))}
            </View>
          )}

          <View style={[styles.confirmRow, { borderColor: colors.border }]}>
            <Switch value={confirmPricing} onValueChange={setConfirmPricing} trackColor={{ true: colors.primary }} />
            <Text style={[styles.confirmLabel, { color: colors.text }]}>I confirm pricing is accurate</Text>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setStep('details')}><Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.publishBtn, { backgroundColor: canPublish && !atLimit ? colors.primary : colors.border }]}
              onPress={handlePublish}
              disabled={publishing || !canPublish || atLimit}
            >
              <Text style={[styles.publishBtnText, { color: canPublish ? '#000' : colors.textSecondary }]}>
                {publishing ? 'Publishing...' : canPublish ? 'Publish' : 'Save Draft'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACE.base, paddingBottom: 80 },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACE.sm, marginBottom: SPACE.lg },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 12, fontWeight: '800' },
  tierBanner: { padding: SPACE.sm, borderRadius: RADIUS.sm, borderWidth: 1, marginBottom: SPACE.sm, alignItems: 'center' },
  tierLabel: { fontSize: 12, fontWeight: '700' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, padding: SPACE.sm, borderRadius: RADIUS.sm, borderWidth: 1, marginBottom: SPACE.base },
  verifyText: { fontSize: 12, fontWeight: '600', flex: 1 },
  section: { marginBottom: SPACE.xl },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: SPACE.sm },
  sectionSub: { fontSize: 13, marginBottom: SPACE.base },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginBottom: SPACE.base },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, paddingHorizontal: SPACE.base, borderRadius: RADIUS.md, borderWidth: 1.5, flex: 1, justifyContent: 'center', minWidth: 100 },
  typeLabel: { fontSize: 14, fontWeight: '700' },
  vibeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1 },
  vibeLabel: { fontSize: 13, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: SPACE.xs, marginTop: SPACE.md },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.md, fontSize: 15, marginBottom: SPACE.sm },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  pricingRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.sm },
  pricingChip: { flex: 1, paddingVertical: SPACE.sm, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center' },
  sizeChip: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1 },
  sizeDash: { alignSelf: 'center', fontSize: 13, fontWeight: '600' },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.xs },
  menuInput: { flex: 1, borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.sm, fontSize: 14 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACE.xs },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACE.lg },
  nextBtn: { paddingVertical: SPACE.md, paddingHorizontal: SPACE.xl, borderRadius: RADIUS.md },
  nextBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  backText: { fontSize: 14, fontWeight: '600' },
  previewCard: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.base, marginBottom: SPACE.base },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  mealBadge: { paddingVertical: 2, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs },
  mealBadgeText: { fontSize: 11, fontWeight: '800' },
  previewPartner: { fontSize: 12, fontWeight: '600', flex: 1 },
  previewTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  previewDesc: { fontSize: 13, marginBottom: SPACE.sm, lineHeight: 18 },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  previewPrice: { fontSize: 14, fontWeight: '700' },
  previewParty: { fontSize: 12 },
  previewMenu: { marginBottom: SPACE.sm },
  previewMenuItem: { fontSize: 12, marginBottom: 2 },
  previewVibes: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  previewVibeChip: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  errorBox: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: SPACE.base },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderTopWidth: 1, marginBottom: SPACE.base },
  confirmLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  publishBtn: { paddingVertical: SPACE.md, paddingHorizontal: SPACE.xl, borderRadius: RADIUS.md },
  publishBtnText: { fontSize: 15, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: SPACE.md },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
