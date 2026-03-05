/**
 * PartnerApplySlide — Sub-components for the 8-slide partner apply wizard.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── SlideProgress ─────────────────────────────────────────────────────────
interface SlideProgressProps {
  current: number; // 0-indexed
  total: number;
  accentColor: string;
  trackColor: string;
}

export function SlideProgress({ current, total, accentColor, trackColor }: SlideProgressProps) {
  return (
    <View style={sp.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            sp.dot,
            {
              backgroundColor: i <= current ? accentColor : trackColor,
              width: i === current ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const sp = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
});

// ─── SlideCard ─────────────────────────────────────────────────────────────
interface SlideCardProps {
  children: React.ReactNode;
  style?: object;
}

export function SlideCard({ children, style }: SlideCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={[sc.card, style]}>
      {children}
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
});

// ─── CategoryGrid ──────────────────────────────────────────────────────────
export const BUSINESS_CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'dining', label: 'Dining', icon: 'restaurant' },
  { key: 'cafe', label: 'Cafe', icon: 'cafe' },
  { key: 'nightlife', label: 'Nightlife', icon: 'wine' },
  { key: 'retail', label: 'Retail', icon: 'bag' },
  { key: 'services', label: 'Services', icon: 'construct' },
  { key: 'hospitality', label: 'Hospitality', icon: 'bed' },
  { key: 'entertainment', label: 'Entertainment', icon: 'musical-notes' },
  { key: 'fitness', label: 'Fitness', icon: 'barbell' },
  { key: 'other', label: 'Other', icon: 'grid' },
];

interface CategoryGridProps {
  selected: string;
  onSelect: (key: string) => void;
  accentColor: string;
  colors: { surface: string; border: string; text: string; textSecondary: string };
}

export function CategoryGrid({ selected, onSelect, accentColor, colors }: CategoryGridProps) {
  return (
    <View style={cg.grid}>
      {BUSINESS_CATEGORIES.map((cat, i) => {
        const isSelected = selected === cat.key;
        return (
          <Animated.View key={cat.key} entering={FadeInDown.delay(i * 40).duration(300)}>
            <TouchableOpacity
              style={[
                cg.cell,
                {
                  backgroundColor: isSelected ? accentColor + '22' : colors.surface,
                  borderColor: isSelected ? accentColor : colors.border,
                },
              ]}
              onPress={() => onSelect(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={28} color={isSelected ? accentColor : colors.textSecondary} />
              <Text style={[cg.cellLabel, { color: isSelected ? accentColor : colors.text }]}>{cat.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const cg = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  cell: { width: (SCREEN_W - 48 - 24) / 3, alignItems: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, gap: 6 },
  cellLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});

// ─── GoalCard ──────────────────────────────────────────────────────────────
interface GoalOption {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { key: 'traffic', label: 'Drive Foot Traffic', description: 'Get more people through the door with targeted discovery', icon: 'walk' },
  { key: 'loyalty', label: 'Build Customer Loyalty', description: 'Turn one-time visitors into regulars with points & perks', icon: 'heart' },
  { key: 'promotions', label: 'Run Promotions', description: 'Flash deals and limited-time offers that create urgency', icon: 'flash' },
];

interface GoalCardProps {
  option: GoalOption;
  selected: boolean;
  onSelect: () => void;
  accentColor: string;
  colors: { surface: string; border: string; text: string; textSecondary: string };
  index: number;
}

export function GoalCard({ option, selected, onSelect, accentColor, colors, index }: GoalCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400).springify()}>
      <TouchableOpacity
        style={[
          gc.card,
          {
            backgroundColor: selected ? accentColor + '18' : colors.surface,
            borderColor: selected ? accentColor : colors.border,
          },
        ]}
        onPress={onSelect}
        activeOpacity={0.85}
      >
        <View style={[gc.iconWrap, { backgroundColor: selected ? accentColor + '33' : colors.border + '44' }]}>
          <Ionicons name={option.icon} size={24} color={selected ? accentColor : colors.textSecondary} />
        </View>
        <View style={gc.content}>
          <Text style={[gc.label, { color: selected ? accentColor : colors.text }]}>{option.label}</Text>
          <Text style={[gc.sub, { color: colors.textSecondary }]}>{option.description}</Text>
        </View>
        {selected && <Ionicons name="checkmark-circle" size={22} color={accentColor} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const gc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 14, marginBottom: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 13 },
});

// ─── SuperpowerChip ────────────────────────────────────────────────────────
export const SUPERPOWER_OPTIONS = [
  { key: 'drops', label: 'Flash Drops', description: 'Limited-time offers', icon: 'flash' as keyof typeof Ionicons.glyphMap },
  { key: 'stamps', label: 'Stamp Cards', description: 'Loyalty punch cards', icon: 'receipt' as keyof typeof Ionicons.glyphMap },
  { key: 'featured', label: 'Featured', description: 'Carousel placement', icon: 'star' as keyof typeof Ionicons.glyphMap },
];

interface SuperpowerChipProps {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onToggle: () => void;
  accentColor: string;
  colors: { surface: string; border: string; text: string; textSecondary: string };
  index: number;
}

export function SuperpowerChip({ label, description, icon, selected, onToggle, accentColor, colors, index }: SuperpowerChipProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400).springify()}>
      <TouchableOpacity
        style={[
          sw.wrap,
          {
            backgroundColor: selected ? accentColor + '18' : colors.surface,
            borderColor: selected ? accentColor : colors.border,
          },
        ]}
        onPress={onToggle}
        activeOpacity={0.85}
      >
        <View style={[sw.iconWrap, { backgroundColor: selected ? accentColor + '33' : colors.border + '33' }]}>
          <Ionicons name={icon} size={22} color={selected ? accentColor : colors.textSecondary} />
        </View>
        <View style={sw.content}>
          <Text style={[sw.label, { color: selected ? accentColor : colors.text }]}>{label}</Text>
          <Text style={[sw.sub, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <View style={[sw.checkbox, { borderColor: selected ? accentColor : colors.border, backgroundColor: selected ? accentColor : 'transparent' }]}>
          {selected && <Ionicons name="checkmark" size={14} color="#000" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const sw = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 14, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 13 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});

// ─── StatCarousel ──────────────────────────────────────────────────────────
const SOCIAL_PROOF_STATS = [
  { value: '850+', label: 'active partners', icon: 'business' as keyof typeof Ionicons.glyphMap },
  { value: '12,400+', label: 'explorers in your city', icon: 'people' as keyof typeof Ionicons.glyphMap },
  { value: '48K+', label: 'perks earned this week', icon: 'gift' as keyof typeof Ionicons.glyphMap },
  { value: '3–8/day', label: 'avg. verified visits (Gold)', icon: 'trending-up' as keyof typeof Ionicons.glyphMap },
  { value: '$2,400/mo', label: 'avg. Gold partner attribution', icon: 'card' as keyof typeof Ionicons.glyphMap },
];

interface StatCarouselProps {
  accentColor: string;
  colors: { surface: string; text: string; textSecondary: string };
}

export function StatCarousel({ accentColor, colors }: StatCarouselProps) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % SOCIAL_PROOF_STATS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const stat = SOCIAL_PROOF_STATS[idx];
  return (
    <Animated.View key={idx} entering={FadeIn.duration(500)} style={[stc.wrap, { backgroundColor: colors.surface }]}>
      <View style={[stc.iconWrap, { backgroundColor: accentColor + '22' }]}>
        <Ionicons name={stat.icon} size={28} color={accentColor} />
      </View>
      <Text style={[stc.value, { color: accentColor }]}>{stat.value}</Text>
      <Text style={[stc.label, { color: colors.textSecondary }]}>{stat.label}</Text>
      <View style={stc.dotRow}>
        {SOCIAL_PROOF_STATS.map((_, i) => (
          <View key={i} style={[stc.dot, { backgroundColor: i === idx ? accentColor : colors.textSecondary + '55', width: i === idx ? 16 : 6 }]} />
        ))}
      </View>
    </Animated.View>
  );
}

const stc = StyleSheet.create({
  wrap: { padding: 32, borderRadius: 24, alignItems: 'center', gap: 8 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  label: { fontSize: 16, textAlign: 'center' },
  dotRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot: { height: 6, borderRadius: 3 },
});
