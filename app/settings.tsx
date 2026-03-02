import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Platform, Linking, Modal, NativeModules, Alert, Image, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { doc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { GuidedTutorialOverlay } from '../components/GuidedTutorialOverlay';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTutorial } from '../context/TutorialContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { useTheme } from '../hooks/useTheme';
import { usePreferences } from '../hooks/usePreferences';
import { useWebTitle } from '../hooks/useWebTitle';
import { useFlags } from '../components/FlagContext';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { useFriends } from '../hooks/useFriends';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { alert as showAlert, confirm as confirmAlert } from '../utils/alert';
import { clearBiometricCreds, isBiometricEnabled, setBiometricEnabled } from '../services/authStorage';
import { APP_STORE_URL, PLAY_STORE_URL } from '../constants/AppConfig';
import { ShareToSocialSheet } from '../components/ShareToSocialSheet';
import { buildAppSharePayload } from '../utils/shareToSocial';
import {
  DEFAULT_PUBLIC_PROFILE_VISIBILITY,
  mergeVisibility,
  type PublicProfileVisibility,
} from '../constants/PublicProfileVisibility';
import { useI18n } from '../context/I18nContext';
import type { SupportedLocale } from '../utils/i18n';
import { uploadDisplayPhoto, moderateDisplayPhoto } from '../services/uploadDisplayPhoto';
import { KitAccordion } from '../components/ui/KitAccordion';
type SettingsTab = 'general' | 'appearance' | 'notifications' | 'publicProfile' | 'account' | 'support';

export default function SettingsScreen() {
  useWebTitle('Settings');
  const router = useRouter();
  const { user } = useAuth();
  const { setMyProfile } = useFriends();
  const { displayName: profileDisplayName } = useCurrentUserProfile();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { prefs, togglePref, setShareMessage, setThemePreference, setContentMode } = usePreferences();
  const { isPartner } = useEffectiveTier();
  const { flags, setFlag } = useFlags();
  const themePreference = prefs.themePreference ?? 'system';
  const [tab, setTab] = useState<SettingsTab>('general');
  const [editingMsg, setEditingMsg] = useState(false);
  const [msgText, setMsgText] = useState(prefs.shareMessage);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricLoaded, setBiometricLoaded] = useState(false);
  const [showSettingsTutorial, setShowSettingsTutorial] = useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [publicProfileVisibility, setPublicProfileVisibility] = useState<PublicProfileVisibility>(
    DEFAULT_PUBLIC_PROFILE_VISIBILITY
  );
  const [publicProfileLoaded, setPublicProfileLoaded] = useState(false);
  const [displayPhotoURL, setDisplayPhotoURL] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<{ twitter?: string; instagram?: string; website?: string }>({});
  const [showSpheresOnProfile, setShowSpheresOnProfile] = useState(true);
  const [socialLinksModalVisible, setSocialLinksModalVisible] = useState(false);
  const [socialLinksEdit, setSocialLinksEdit] = useState({ twitter: '', instagram: '', website: '' });
  const [displayPhotoUploading, setDisplayPhotoUploading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [rtlRestartModalVisible, setRtlRestartModalVisible] = useState(false);
  const [accordion, setAccordion] = useState<Record<string, boolean>>({
    gen_lang: true, gen_content: false, gen_virality: false, gen_identity: false,
    app_theme: true, notif: true, pub_profile: true,
    account_acc: true, account_sec: false, account_int: false, account_tut: false,
    support_about: true, support_links: false, support_data: false, support_legal: false,
  });
  const toggleAccordion = (key: string) => setAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  const { t, setLanguage, storedLanguage, localeDisplayNames, supportedLocales } = useI18n();
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();

  useEffect(() => {
    isBiometricEnabled().then(setBiometricOn).finally(() => setBiometricLoaded(true));
  }, []);
  useEffect(() => {
    if (shouldShowTutorial('settings')) setShowSettingsTutorial(true);
  }, [shouldShowTutorial]);

  // Load public profile settings from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        const d = snap.data();
        if (d) {
          setDiscoverable(d.discoverable !== false);
          setPublicProfileVisibility(
            mergeVisibility(d.publicProfileVisibility as Partial<PublicProfileVisibility> | undefined, undefined)
          );
          setDisplayPhotoURL(d.displayPhotoURL ?? null);
          setSocialLinks((d.socialLinks as { twitter?: string; instagram?: string; website?: string }) ?? {});
          setShowSpheresOnProfile(d.showSpheresOnProfile !== false);
        }
        setPublicProfileLoaded(true);
      })
      .catch(() => setPublicProfileLoaded(true));
  }, [user?.uid]);

  const setVisibility = (key: keyof PublicProfileVisibility, value: boolean) => {
    safeHaptics.selectionAsync();
    const next = { ...publicProfileVisibility, [key]: value };
    setPublicProfileVisibility(next);
    setMyProfile({ publicProfileVisibility: next });
  };

  const setDiscoverableAndSave = (value: boolean) => {
    safeHaptics.selectionAsync();
    setDiscoverable(value);
    setMyProfile({ discoverable: value });
  };

  const setShowSpheresAndSave = (value: boolean) => {
    safeHaptics.selectionAsync();
    setShowSpheresOnProfile(value);
    setMyProfile({ showSpheresOnProfile: value });
  };

  const handleDisplayPhotoPick = async () => {
    if (!user?.uid) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('settings.photoPermissionTitle') ?? 'Photo access', t('settings.photoPermissionMessage') ?? 'Allow photo access to set a display photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    setDisplayPhotoUploading(true);
    try {
      const mod = await moderateDisplayPhoto(uri);
      if (!mod.allowed) {
        Alert.alert(t('settings.photoModerationRejected') ?? 'Photo not allowed', mod.reason ?? 'This image could not be used.');
        return;
      }
      const url = await uploadDisplayPhoto(uri, user.uid);
      setDisplayPhotoURL(url);
      await setMyProfile({ displayPhotoURL: url });
    } catch (e) {
      Alert.alert(t('settings.uploadFailed') ?? 'Upload failed', String(e));
    } finally {
      setDisplayPhotoUploading(false);
    }
  };

  const removeDisplayPhoto = () => {
    safeHaptics.selectionAsync();
    setDisplayPhotoURL(null);
    setMyProfile({ displayPhotoURL: null });
  };

  const openSocialLinksModal = () => {
    setSocialLinksEdit({
      twitter: socialLinks.twitter ?? '',
      instagram: socialLinks.instagram ?? '',
      website: socialLinks.website ?? '',
    });
    setSocialLinksModalVisible(true);
  };

  const saveSocialLinks = () => {
    const links = {
      twitter: socialLinksEdit.twitter.trim() || undefined,
      instagram: socialLinksEdit.instagram.trim() || undefined,
      website: socialLinksEdit.website.trim() || undefined,
    };
    setSocialLinks(links);
    setMyProfile({ socialLinks: links });
    setSocialLinksModalVisible(false);
  };

  const handleLanguageSelect = async (lang: 'system' | SupportedLocale) => {
    safeHaptics.selectionAsync();
    setLanguageModalVisible(false);
    const rtlChanged = await setLanguage(lang);
    if (rtlChanged) {
      setRtlRestartModalVisible(true);
    } else {
      Alert.alert(
        t('settings.languageUpdatedTitle'),
        t('settings.languageUpdatedMessage'),
        [
          { text: t('settings.later'), style: 'cancel' },
          {
            text: t('settings.restartNow'),
            onPress: () => {
              if (Platform.OS !== 'web' && NativeModules.DevSettings?.reload) {
                NativeModules.DevSettings.reload();
              }
            },
          },
        ]
      );
    }
  };

  const handleRTLRestart = () => {
    setRtlRestartModalVisible(false);
    if (Platform.OS !== 'web' && NativeModules.DevSettings?.reload) {
      NativeModules.DevSettings.reload();
    }
  };

  const handleNav = (route: string) => {
    safeHaptics.selectionAsync();
    router.push(route as any);
  };

  const handleLogout = async () => {
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const ok = await confirmAlert('Logout?', 'Return to entry grid?', { confirmText: 'Logout', cancelText: 'Cancel' });
    if (ok) {
      await clearBiometricCreds();
      await signOut(auth);
      router.replace('/auth/login');
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    safeHaptics.selectionAsync();
    if (!value) await clearBiometricCreds();
    else await setBiometricEnabled(true);
    setBiometricOn(value);
  };

  const saveMsg = () => {
      setShareMessage(msgText);
      setEditingMsg(false);
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteAccountPress = async () => {
    safeHaptics.selectionAsync();
    const ok = await confirmAlert(
      'Why do you want to delete your account?',
      'Your feedback helps us improve. This will not delete your account yet.',
      { confirmText: 'Continue', cancelText: 'Cancel' }
    );
    if (ok) await confirmDeleteAccount();
  };

  const confirmDeleteAccount = async () => {
    const ok = await confirmAlert(
      'Delete your account?',
      'This action cannot be undone. All your data, points, and history will be permanently deleted.',
      { confirmText: 'Yes, delete my account', cancelText: 'Cancel' }
    );
    if (ok) handleNav('/data/delete');
  };

  const handleRateApp = () => {
    safeHaptics.selectionAsync();
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(storeUrl).catch(() => {});
  };

  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; title?: string } | null>(null);

  const handleShareApp = () => {
    safeHaptics.selectionAsync();
    setSharePayload(buildAppSharePayload(prefs.shareMessage, 'OrbTap'));
    setShareSheetVisible(true);
  };

  const renderRow = ({ icon, title, value, isSwitch, switchKey, onPress, isDestructive, isLink }: any) => (
    <TouchableOpacity 
      activeOpacity={isSwitch ? 1 : 0.7}
      onPress={isSwitch ? () => { safeHaptics.selectionAsync(); togglePref(switchKey); } : onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
        <View style={[styles.iconBox, { backgroundColor: isDestructive ? 'rgba(248, 113, 113, 0.1)' : colors.surfaceHighlight }]}>
            <Ionicons name={icon} size={18} color={isDestructive ? COLORS.danger : colors.text} />
        </View>
        <View style={styles.rowContent}>
            <Text style={[styles.rowTitle, { color: isDestructive ? COLORS.danger : colors.text }]}>{title}</Text>
            {value && <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{value}</Text>}
        </View>
        {isSwitch && (
            <Switch 
                value={(prefs as any)[switchKey]} 
                onValueChange={() => { safeHaptics.selectionAsync(); togglePref(switchKey); }} 
                trackColor={{ false: colors.border, true: colors.primary }}
            />
        )}
        {(!isSwitch && !isLink) && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
        {isLink && <Ionicons name="open-outline" size={16} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  const TABS: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'general', label: t('settings.general'), icon: 'options' },
    { key: 'appearance', label: t('settings.appearance'), icon: 'color-palette' },
    { key: 'notifications', label: t('settings.notifications'), icon: 'notifications' },
    { key: 'publicProfile', label: t('settings.publicProfile'), icon: 'person-circle' },
    { key: 'account', label: t('settings.account'), icon: 'key' },
    { key: 'support', label: t('settings.support'), icon: 'help-buoy' },
  ];

  return (
    <ScreenWrapper
      title={t('settings.settings').toUpperCase()}
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      }
    >
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => { safeHaptics.selectionAsync(); setTab(t.key); }}
            >
              <Ionicons name={t.icon as any} size={18} color={tab === t.key ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabLabel, { color: tab === t.key ? colors.text : colors.textSecondary }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {(tab === 'general' || tab === 'publicProfile') && tab === 'publicProfile' && (
          <>
            <KitAccordion title="Public profile" subtitle="Visibility and display" expanded={accordion.pub_profile} onToggle={() => toggleAccordion('pub_profile')} style={styles.accordionCard}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                  <Ionicons name="globe" size={18} color={colors.text} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Public profile</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Show on leaderboards, search & shared links. Off = private (minimal public page).
                  </Text>
                </View>
                <Switch
                  value={discoverable}
                  onValueChange={setDiscoverableAndSave}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              {publicProfileLoaded && (
                <>
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '22' }]}>
                      <Ionicons name="medal" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Show achievements</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Badges on your public profile</Text>
                    </View>
                    <Switch
                      value={publicProfileVisibility.showBadges}
                      onValueChange={(v) => setVisibility('showBadges', v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '22' }]}>
                      <Ionicons name="stats-chart" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Show stats</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Streak, missions, check-ins</Text>
                    </View>
                    <Switch
                      value={publicProfileVisibility.showStats}
                      onValueChange={(v) => setVisibility('showStats', v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="flame" size={18} color={colors.text} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Show streak</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Current & best streak</Text>
                    </View>
                    <Switch
                      value={publicProfileVisibility.showStreak}
                      onValueChange={(v) => setVisibility('showStreak', v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="document-text" size={18} color={colors.text} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Show bio</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>About section on public profile</Text>
                    </View>
                    <Switch
                      value={publicProfileVisibility.showBio}
                      onValueChange={(v) => setVisibility('showBio', v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="pricetag" size={18} color={colors.text} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Show tagline</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Short tagline under your name</Text>
                    </View>
                    <Switch
                      value={publicProfileVisibility.showTagline}
                      onValueChange={(v) => setVisibility('showTagline', v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  {/* Display photo for public profile */}
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="image" size={18} color={colors.text} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Display photo</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>One photo shown at top of your public profile</Text>
                      {displayPhotoURL ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <Image source={{ uri: displayPhotoURL }} style={{ width: 48, height: 27, borderRadius: 4 }} />
                          <TouchableOpacity onPress={removeDisplayPhoto} style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: colors.surfaceHighlight, borderRadius: 8 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                    {displayPhotoUploading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <TouchableOpacity onPress={handleDisplayPhotoPick} style={[styles.iconBox, { backgroundColor: colors.primary + '22' }]}>
                        <Ionicons name="add" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Social links */}
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="share-social" size={18} color={colors.text} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Social links</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Twitter, Instagram, website on your public profile</Text>
                    </View>
                    <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); openSocialLinksModal(); }}>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {/* Show spheres on profile */}
                  <View style={[styles.row, { borderBottomWidth: 0 }]}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="planet" size={18} color={colors.text} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Show spheres on profile</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Display spheres & leaderboard wins (visible by default)</Text>
                    </View>
                    <Switch
                      value={showSpheresOnProfile}
                      onValueChange={setShowSpheresAndSave}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                </>
              )}
            </View>
            </KitAccordion>
            <View style={{ height: 24 }} />
          </>
        )}

        {tab === 'general' && (
          <>
        <KitAccordion title={t('settings.language')} expanded={accordion.gen_lang} onToggle={() => toggleAccordion('gen_lang')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => { safeHaptics.selectionAsync(); setLanguageModalVisible(true); }}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
                <Ionicons name="language" size={18} color={colors.text} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{t('settings.language')}</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {storedLanguage === 'system' ? t('settings.systemDefault') : localeDisplayNames[storedLanguage]}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </KitAccordion>

        <KitAccordion title="Content mode" expanded={accordion.gen_content} onToggle={() => toggleAccordion('gen_content')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Feed content</Text>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.comingSoonBadgeText, { color: colors.textSecondary }]}>coming soon</Text>
            </View>
          </View>
          <View style={{ opacity: 0.45 }} pointerEvents="none">
          <Text style={[styles.rowSub, { color: colors.textSecondary, marginBottom: 12 }]}>
            Moderated blocks profanity & inappropriate content. Free Speech blocks only illegal content and turns off moderation for your own posts.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {(['moderated', 'freeSpeech'] as const).map((mode) => (
              <View
                key={mode}
                style={[
                  styles.pill,
                  {
                    backgroundColor: prefs.contentMode === mode ? colors.primary : colors.surfaceHighlight,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: prefs.contentMode === mode ? colors.background : colors.text,
                  }}
                >
                  {mode === 'moderated' ? 'Moderated' : 'Free Speech'}
                </Text>
              </View>
            ))}
          </View>
          </View>
        </View>
        </KitAccordion>

        <KitAccordion title="Virality protocols" expanded={accordion.gen_virality} onToggle={() => toggleAccordion('gen_virality')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 8}}>
                <Text style={{fontWeight:'bold', color: colors.text}}>Custom Share Message</Text>
                <TouchableOpacity onPress={editingMsg ? saveMsg : () => setEditingMsg(true)}>
                    <Text style={{color: colors.primary, fontWeight:'bold'}}>{editingMsg ? "SAVE" : "EDIT"}</Text>
                </TouchableOpacity>
            </View>
            {editingMsg ? (
                <TextInput 
                    style={{borderWidth:1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text}}
                    value={msgText}
                    onChangeText={setMsgText}
                    placeholder="Enter your flex message..."
                />
            ) : (
                <Text style={{color: colors.textSecondary, fontStyle: 'italic'}}>"{prefs.shareMessage}"</Text>
            )}
          </View>
        </KitAccordion>
        <KitAccordion title="Identity" expanded={accordion.gen_identity} onToggle={() => toggleAccordion('gen_identity')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "person", title: "Public Profile", value: profileDisplayName ?? user?.displayName ?? undefined, onPress: () => router.push('/(tabs)/profile') })}
          </View>
        </KitAccordion>
          </>
        )}

        {tab === 'appearance' && (
          <>
        <KitAccordion title="Appearance" subtitle="Theme" expanded={accordion.app_theme} onToggle={() => toggleAccordion('app_theme')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
            <Text style={[styles.rowTitle, { color: colors.text, marginBottom: 12 }]}>Theme</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: themePreference === mode ? colors.primary : colors.surfaceHighlight,
                    },
                  ]}
                  onPress={() => {
                    safeHaptics.selectionAsync();
                    setThemePreference(mode);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: themePreference === mode ? colors.background : colors.text,
                    }}
                  >
                    {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </KitAccordion>
          </>
        )}

        {tab === 'notifications' && (
          <>
        <KitAccordion title="Notifications" expanded={accordion.notif} onToggle={() => toggleAccordion('notif')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "mail-open", title: "Notification center", value: "Inbox, trash & history", isLink: true, onPress: () => handleNav("/notifications") })}
            {renderRow({ icon: "notifications", title: "Push notifications", value: "On by default · polls, missions, drops & more", isLink: true, onPress: () => handleNav("/notification-settings") })}
            {renderRow({ icon: "mail", title: "Email updates", value: "News and partner offers", isSwitch: true, switchKey: 'emailEnabled' })}
          </View>
        </KitAccordion>
          </>
        )}

        {tab === 'account' && (
          <>
        <KitAccordion title="Account" expanded={accordion.account_acc} onToggle={() => toggleAccordion('account_acc')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "key", title: "Change password", value: "Reset via email link", isLink: true, onPress: () => handleNav("/auth/login") })}
            {isPartner && renderRow({ icon: "storefront", title: "Partner dashboard", value: "Manage your venue", isLink: true, onPress: () => handleNav("/partner/dashboard") })}
          </View>
        </KitAccordion>
        <KitAccordion title="Security" expanded={accordion.account_sec} onToggle={() => toggleAccordion('account_sec')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => biometricLoaded && handleBiometricToggle(!biometricOn)}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceHighlight }]}>
              <Ionicons name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print'} size={18} color={colors.text} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Use {Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'} to sign in</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Quick sign-in on next visit</Text>
            </View>
            <Switch
              value={biometricOn}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </TouchableOpacity>
          </View>
        </KitAccordion>
        <KitAccordion title="Interface" expanded={accordion.account_int} onToggle={() => toggleAccordion('account_int')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {isPartner && renderRow({ icon: "briefcase", title: "Partner Mode", isSwitch: true, switchKey: 'partnerMode' })}
            {renderRow({ icon: "sparkles", title: "OrbScope: Daily Vibe", isSwitch: true, switchKey: 'orbScopeEnabled' })}
            {renderRow({ icon: "phone-portrait", title: "Haptic Feedback", isSwitch: true, switchKey: 'haptics' })}
          </View>
        </KitAccordion>
        <KitAccordion title="Tutorials" expanded={accordion.account_tut} onToggle={() => toggleAccordion('account_tut')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "school", title: "Tutorials", value: "Replay guided tutorials for any feature", onPress: () => handleNav("/tutorials") })}
          </View>
        </KitAccordion>
          </>
        )}

        {tab === 'support' && (
          <>
        <KitAccordion title="About" expanded={accordion.support_about} onToggle={() => toggleAccordion('support_about')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "phone-portrait", title: "App version", value: "1.0.0", onPress: async () => { await Clipboard.setStringAsync('1.0.0'); safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success); showAlert('Copied', 'Version copied to clipboard.'); } })}
            {renderRow({ icon: "star", title: "Rate OrbTap", value: "Leave a review", isLink: true, onPress: handleRateApp })}
            {renderRow({ icon: "share-social", title: "Share OrbTap", value: "Invite friends", isLink: true, onPress: handleShareApp })}
          </View>
        </KitAccordion>
        <KitAccordion title="Quick links" expanded={accordion.support_links} onToggle={() => toggleAccordion('support_links')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderRow({ icon: "bookmark", title: "Bookmarks", value: "Saved places", isLink: true, onPress: () => handleNav("/bookmarks") })}
          {renderRow({ icon: "bulb", title: "Knowledge base", value: "Facts & learn", isLink: true, onPress: () => handleNav("/knowledge") })}
          {renderRow({ icon: "git-compare", title: "Compare plans", value: "Free vs Premium", isLink: true, onPress: () => handleNav("/compare-accounts") })}
          {renderRow({ icon: "diamond", title: "Premium", value: "Unlock more", isLink: true, onPress: () => handleNav("/premium") })}
          {renderRow({ icon: "business", title: "Partners", value: "Browse & perks", isLink: true, onPress: () => handleNav("/partners") })}
          {renderRow({ icon: "pulse", title: "OrbPulse", value: "Live drops & deals", isLink: true, onPress: () => handleNav("/pulse") })}
            {renderRow({ icon: "stats-chart", title: "Stats", value: "Your impact", isLink: true, onPress: () => handleNav("/stats") })}
          </View>
        </KitAccordion>
        <KitAccordion title="Data & privacy" expanded={accordion.support_data} onToggle={() => toggleAccordion('support_data')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "download", title: "Request my data", value: "Export your data", isLink: true, onPress: () => handleNav("/support") })}
            {renderRow({ icon: "location", title: "Location access", value: "Used for map and nearby", isSwitch: true, switchKey: 'location' })}
          </View>
        </KitAccordion>
        {__DEV__ && (
          <>
            <Text style={[styles.sectionTitleLight, { color: themeGold }]}>ADMIN OVERRIDE (DEV)</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: themeGold }]}>
              <View style={styles.row}>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Map Provider</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                    {['mapbox', 'native', 'none'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.pill, { backgroundColor: flags.mapProvider === p ? colors.primary : colors.surfaceHighlight }]}
                        onPress={() => setFlag('mapProvider', p as 'mapbox' | 'native' | 'none')}
                      >
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: flags.mapProvider === p ? '#fff' : colors.text }}>{p.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
        <KitAccordion title="Support & legal" expanded={accordion.support_legal} onToggle={() => toggleAccordion('support_legal')} style={styles.accordionCard}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "help-buoy", title: "Help Center", isLink: true, onPress: () => handleNav("/legal/help") })}
            {renderRow({ icon: "folder-open", title: "Legal & policies", value: "Terms, Privacy, Guidelines", isLink: true, onPress: () => handleNav("/legal") })}
            {renderRow({ icon: "document-text", title: "Terms of Service", isLink: true, onPress: () => handleNav("/legal/terms") })}
            {renderRow({ icon: "lock-closed", title: "Privacy Policy", isLink: true, onPress: () => handleNav("/legal/privacy") })}
          </View>
        </KitAccordion>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 20 }]}>
            {renderRow({ icon: "power", title: "Logout", isDestructive: true, onPress: handleLogout })}
        </View>

        {/* Delete account: bottom, low visibility */}
        <TouchableOpacity
          style={[styles.deleteAccountRow, { borderColor: colors.border }]}
          onPress={handleDeleteAccountPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.deleteAccountText, { color: colors.textSecondary }]}>Delete my account</Text>
        </TouchableOpacity>
          </>
        )}
        <View style={{ height: 48 }} />
      </ScrollView>
      <GuidedTutorialOverlay
        visible={showSettingsTutorial}
        tutorialId="settings"
        onClose={() => { markCompleted('settings'); setShowSettingsTutorial(false); }}
        onSkipAll={() => { setSkipAllTutorials(); setShowSettingsTutorial(false); }}
      />
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share OrbTap"
        />
      )}

      <Modal visible={languageModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setLanguageModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.language')}</Text>
            <TouchableOpacity
              style={[styles.languageOption, { borderBottomColor: colors.border }]}
              onPress={() => handleLanguageSelect('system')}
            >
              <Text style={[styles.languageOptionText, { color: colors.text }]}>{t('settings.systemDefault')}</Text>
            </TouchableOpacity>
            {supportedLocales.map((code) => (
              <TouchableOpacity
                key={code}
                style={[styles.languageOption, { borderBottomColor: colors.border }]}
                onPress={() => handleLanguageSelect(code)}
              >
                <Text style={[styles.languageOptionText, { color: colors.text }]}>{localeDisplayNames[code]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLanguageModalVisible(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={rtlRestartModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.restartForRTL')}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.pill, { flex: 1, backgroundColor: colors.primary, paddingVertical: 12 }]}
                onPress={handleRTLRestart}
              >
                <Text style={{ color: '#000', fontWeight: '800', textAlign: 'center' }}>{t('settings.restartNow')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, { flex: 1, backgroundColor: colors.surfaceHighlight, paddingVertical: 12 }]}
                onPress={() => setRtlRestartModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('settings.later')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={socialLinksModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, maxWidth: 400 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Social links</Text>
            <Text style={[styles.rowSub, { color: colors.textSecondary, marginBottom: 12 }]}>Shown on your public profile. Leave blank to hide.</Text>
            <TextInput
              placeholder="Twitter / X username (e.g. myhandle)"
              placeholderTextColor={colors.textSecondary}
              value={socialLinksEdit.twitter}
              onChangeText={(t) => setSocialLinksEdit((s) => ({ ...s, twitter: t }))}
              style={[styles.modalInput, { backgroundColor: colors.surfaceHighlight, color: colors.text, borderColor: colors.border }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              placeholder="Instagram username"
              placeholderTextColor={colors.textSecondary}
              value={socialLinksEdit.instagram}
              onChangeText={(t) => setSocialLinksEdit((s) => ({ ...s, instagram: t }))}
              style={[styles.modalInput, { backgroundColor: colors.surfaceHighlight, color: colors.text, borderColor: colors.border }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              placeholder="Website URL"
              placeholderTextColor={colors.textSecondary}
              value={socialLinksEdit.website}
              onChangeText={(t) => setSocialLinksEdit((s) => ({ ...s, website: t }))}
              style={[styles.modalInput, { backgroundColor: colors.surfaceHighlight, color: colors.text, borderColor: colors.border }]}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={[styles.pill, { flex: 1, backgroundColor: colors.primary, paddingVertical: 12 }]} onPress={saveSocialLinks}>
                <Text style={{ color: '#000', fontWeight: '800', textAlign: 'center' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pill, { flex: 1, backgroundColor: colors.surfaceHighlight, paddingVertical: 12 }]} onPress={() => setSocialLinksModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerLogo: { width: 36, height: 30 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  tabRow: { borderBottomWidth: 1 },
  tabScroll: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, marginRight: 4 },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  accordionCard: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  sectionTitleLight: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginTop: 16, marginLeft: 4, color: '#888' },
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  dangerCard: { backgroundColor: '#111', borderColor: '#EF4444', borderWidth: 2, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: 'bold' },
  rowSub: { fontSize: 11, marginTop: 2 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  comingSoonBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  comingSoonBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  deleteAccountRow: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  deleteAccountText: { fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 16, borderWidth: 1, padding: 20, maxWidth: 360, width: '100%', alignSelf: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 10 },
  languageOption: { paddingVertical: 14, borderBottomWidth: 1 },
  languageOptionText: { fontSize: 16, fontWeight: '600' },
  modalCancelBtn: { marginTop: 16, paddingVertical: 10, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
});
