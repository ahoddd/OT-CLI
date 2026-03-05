/**
 * OrbSwipe v1.1 — "Tune" controls bottom sheet: radius, indoor-only, hide categories, show fewer sponsored.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useOrbSwipePreferences } from '../hooks/useOrbSwipePreferences';
import { ORBSWIPE_RADIUS_PRESETS_MI, ORBSWIPE_HIDE_CATEGORY_OPTIONS } from '../constants/OrbSwipeConfig';

export interface OrbSwipeControlsSheetProps {
  visible: boolean;
  onClose: () => void;
  /** When true, show "Show fewer sponsored" toggle (paid tier). */
  showFewerSponsoredOption?: boolean;
}

export function OrbSwipeControlsSheet({
  visible,
  onClose,
  showFewerSponsoredOption = false,
}: OrbSwipeControlsSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { prefs, setRadiusMiles, setIndoorOnly, setHideCategoryIds, setShowFewerSponsored } = useOrbSwipePreferences();

  const toggleCategory = (id: string) => {
    const next = prefs.hideCategoryIds.includes(id)
      ? prefs.hideCategoryIds.filter((c) => c !== id)
      : [...prefs.hideCategoryIds, id];
    setHideCategoryIds(next);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 24,
            paddingTop: Math.max(insets.top, 12),
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Tune your deck</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* Radius */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Radius</Text>
          <View style={styles.presetRow}>
            {ORBSWIPE_RADIUS_PRESETS_MI.map((mi) => (
              <TouchableOpacity
                key={mi}
                onPress={() => setRadiusMiles(mi)}
                style={[
                  styles.presetPill,
                  { borderColor: colors.border, backgroundColor: prefs.radiusMiles === mi ? colors.primary + '22' : colors.surfaceHighlight },
                ]}
              >
                <Text style={[styles.presetText, { color: prefs.radiusMiles === mi ? colors.primary : colors.text }]}>{mi} mi</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Indoor only */}
          <View style={[styles.row, { borderTopColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Indoor only</Text>
            <Switch
              value={prefs.indoorOnly}
              onValueChange={setIndoorOnly}
              trackColor={{ false: colors.border, true: colors.primary + '99' }}
              thumbColor={colors.surface}
            />
          </View>

          {/* Show fewer sponsored — only if paid tier and option enabled */}
          {showFewerSponsoredOption && (
            <View style={[styles.row, { borderTopColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Show fewer sponsored</Text>
              <Switch
                value={prefs.showFewerSponsored}
                onValueChange={setShowFewerSponsored}
                trackColor={{ false: colors.border, true: colors.primary + '99' }}
                thumbColor={colors.surface}
              />
            </View>
          )}

          {/* Hide categories */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>Hide categories</Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Hidden for 7 days. Tap to toggle.</Text>
          <View style={styles.chipsWrap}>
            {ORBSWIPE_HIDE_CATEGORY_OPTIONS.map((opt) => {
              const selected = prefs.hideCategoryIds.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => toggleCategory(opt.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? colors.primary + '22' : colors.surfaceHighlight, borderColor: selected ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selected ? colors.primary : colors.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '800' },
  scroll: { maxHeight: 400 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  sectionHint: { fontSize: 11, marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  presetText: { fontSize: 14, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
});
