/**
 * Partner Menu Edit — review/confirm editor: sections, items, prices, Tonight Pick, Publish.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/Colors';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useMenuContext } from '../../../context/MenuContext';
import { safeHaptics } from '../../../utils/safeHaptics';
import { alert as alertDialog } from '../../../utils/alert';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import type { MenuSection, MenuItem } from '../../../constants/PartnerMenu';
import { useI18n } from '../../../context/I18nContext';

const ITEM_TAGS = ['veg', 'vegan', 'gluten-free', 'spicy', 'dairy-free'] as const;

export default function PartnerMenuEditScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { menuId } = useLocalSearchParams<{ menuId: string }>();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const { documents, getVersion, updateMenuVersion, publishMenu, addDropDraft } = useMenuContext();

  const doc = useMemo(() => documents.find((d) => d.id === menuId), [documents, menuId]);
  const version = doc ? getVersion(doc.currentVersionId) : null;
  const [sections, setSections] = useState<MenuSection[]>(version?.sections ?? []);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(sections[0]?.id ?? null);
  const [publishing, setPublishing] = useState(false);

  React.useEffect(() => {
    if (version?.sections) setSections(version.sections);
  }, [version?.id]);

  if (!menuId || !doc || !version) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Menu</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Menu not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const updateSection = (sectionId: string, upd: Partial<MenuSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, ...upd } : s))
    );
  };

  const updateItem = (sectionId: string, itemId: string, upd: Partial<MenuItem>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...upd } : i)) }
          : s
      )
    );
  };

  const toggleItemTag = (sectionId: string, itemId: string, tag: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            const tags = i.tags ?? [];
            const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
            return { ...i, tags: next.length ? next : undefined };
          }),
        };
      })
    );
  };

  const saveAndBack = () => {
    const updatedVersion = { ...version, sections };
    updateMenuVersion(doc.id, updatedVersion);
    safeHaptics.selectionAsync();
    router.back();
  };

  const handlePublish = () => {
    alertDialog(
      'Publish menu?',
      'This will mark your menu as Verified and make it visible on your partner page.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: () => {
            setPublishing(true);
            const updatedVersion = { ...version, sections };
            updateMenuVersion(doc.id, updatedVersion);
            publishMenu(doc.id, 'You', 'Published from review');
            setPublishing(false);
            safeHaptics.selectionAsync();
            router.replace({ pathname: '/partner/menu', params: { partnerId: doc.partnerId } } as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={saveAndBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Review Menu</Text>
        <TouchableOpacity onPress={handlePublish} style={styles.publishBtn} disabled={publishing}>
          <Text style={[styles.publishText, { color: doc.status === 'PUBLISHED' ? colors.textSecondary : COLORS.success }]}>
            {doc.status === 'PUBLISHED' ? 'Saved' : 'Publish'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {sections.map((section) => (
            <View key={section.id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => { setExpandedSectionId((id) => (id === section.id ? null : section.id)); safeHaptics.selectionAsync(); }}
              >
                <TextInput
                  style={[styles.sectionName, { color: colors.text }]}
                  value={section.name}
                  onChangeText={(t) => updateSection(section.id, { name: capitalizeFirstLetter(t) })}
                  placeholder="Section name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="sentences"
                />
                <Ionicons
                  name={expandedSectionId === section.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSectionId === section.id && (
                <View style={[styles.itemsBlock, { borderTopColor: colors.border }]}>
                  {section.items.map((item) => (
                    <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                      <View style={styles.itemMain}>
                        <TextInput
                          style={[styles.itemName, { color: colors.text }]}
                          value={item.name}
                          onChangeText={(t) => updateItem(section.id, item.id, { name: capitalizeFirstLetter(t) })}
                          placeholder="Item name"
                          placeholderTextColor={colors.textSecondary}
                          autoCapitalize="sentences"
                        />
                        <TextInput
                          style={[styles.itemDesc, { color: colors.textSecondary }]}
                          value={item.description ?? ''}
                          onChangeText={(t) => updateItem(section.id, item.id, { description: capitalizeFirstLetter(t) || undefined })}
                          placeholder="Description (optional)"
                          placeholderTextColor={colors.textSecondary}
                          multiline
                          autoCapitalize="sentences"
                        />
                        <View style={styles.itemMeta}>
                          <TextInput
                            style={[styles.priceInput, { backgroundColor: colors.background, color: colors.text }]}
                            value={item.priceCents != null ? (item.priceCents / 100).toFixed(2) : ''}
                            onChangeText={(t) => {
                              const n = Math.round(parseFloat(t.replace(/[^\d.]/g, '')) * 100);
                              updateItem(section.id, item.id, { priceCents: Number.isNaN(n) ? undefined : n });
                            }}
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="decimal-pad"
                          />
                          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>$</Text>
                        </View>
                        <View style={styles.tagRow}>
                          {ITEM_TAGS.map((tag) => (
                            <TouchableOpacity
                              key={tag}
                              style={[
                                styles.tagChip,
                                { backgroundColor: (item.tags ?? []).includes(tag) ? COLORS.neonBlue[0] + '33' : colors.background, borderColor: colors.border },
                              ]}
                              onPress={() => toggleItemTag(section.id, item.id, tag)}
                            >
                              <Text style={[styles.tagText, { color: (item.tags ?? []).includes(tag) ? COLORS.neonBlue[0] : colors.textSecondary }]}>
                                {tag}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.switchRow}>
                          <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Available</Text>
                          <Switch
                            value={item.available}
                            onValueChange={(v) => updateItem(section.id, item.id, { available: v })}
                            trackColor={{ false: colors.border, true: COLORS.success + '99' }}
                            thumbColor={item.available ? COLORS.success : colors.textSecondary}
                          />
                        </View>
                        {flags.partnerMenusTonightPicks && (
                          <View style={styles.switchRow}>
                            <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Tonight Pick</Text>
                            <Switch
                              value={item.featuredTonight}
                              onValueChange={(v) => updateItem(section.id, item.id, { featuredTonight: v })}
                              trackColor={{ false: colors.border, true: themeGold + '99' }}
                              thumbColor={item.featuredTonight ? themeGold : colors.textSecondary}
                            />
                          </View>
                        )}
                        {flags.partnerMenusDropSuggestions && (
                          <>
                            <View style={styles.switchRow}>
                              <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Drop suggestion</Text>
                              <Switch
                                value={item.dropSuggestionEnabled}
                                onValueChange={(v) => updateItem(section.id, item.id, { dropSuggestionEnabled: v })}
                                trackColor={{ false: colors.border, true: COLORS.neonBlue[0] + '99' }}
                                thumbColor={item.dropSuggestionEnabled ? COLORS.neonBlue[0] : colors.textSecondary}
                              />
                            </View>
                            <TouchableOpacity
                              style={[styles.dropFromItemBtn, { borderColor: colors.border }]}
                              onPress={() => {
                                safeHaptics.selectionAsync();
                                addDropDraft({
                                  partnerId: doc.partnerId,
                                  menuId: doc.id,
                                  versionId: version.id,
                                  itemId: item.id,
                                  itemName: item.name,
                                  itemDescription: item.description,
                                  priceCents: item.priceCents,
                                });
                                alertDialog(
                                  'Drop draft saved',
                                  'Your draft is ready. We\'ll notify you when you can publish it as a Drop. You can also manage Drops from Pulse.',
                                  [{ text: 'OK' }, { text: 'Open Pulse', onPress: () => router.push('/pulse' as any) }]
                                );
                              }}
                            >
                              <Ionicons name="gift-outline" size={16} color={COLORS.neonBlue[0]} />
                              <Text style={[styles.dropFromItemText, { color: COLORS.neonBlue[0] }]}>Create Drop from item</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '800' },
  publishBtn: { padding: 8 },
  publishText: { fontSize: 16, fontWeight: '700' },
  keyboard: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  sectionName: { fontSize: 16, fontWeight: '700', flex: 1 },
  itemsBlock: { borderTopWidth: 1, padding: 12 },
  itemRow: { paddingVertical: 12, borderTopWidth: 1 },
  itemMain: { gap: 8 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemDesc: { fontSize: 13, minHeight: 36 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceInput: { width: 80, padding: 8, borderRadius: 8 },
  priceLabel: { fontSize: 14 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 13 },
  dropFromItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  dropFromItemText: { fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16 },
});
