import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { DEFAULT_FLAGS, type FlagKey, type MapProvider } from '../../constants/Flags';

/** All flag keys for "turn all on/off". Excludes mapProvider (special) and isMaintenanceModeEnabled (only turn on via Maintenance section). */
const FLAG_KEYS_ALL = (Object.keys(DEFAULT_FLAGS) as FlagKey[]).filter(
  (k) => k !== 'mapProvider' && k !== 'isMaintenanceModeEnabled'
);
import {
  FLAG_CATEGORIES,
  FLAG_LABELS,
  TAB_IDS,
  TAB_LABELS,
  TAB_ICONS,
  DEFAULT_DIRECTORY_ORDER,
  DEFAULT_TAB_ORDER,
  DEFAULT_QUICK_ACTIONS,
  MAX_NAVBAR_TABS,
  MAX_QUICK_ACTIONS,
  QUICK_ACTION_KEYS,
  QUICK_ACTION_CONFIG,
  DIRECTORY_LABELS_DEFAULT,
  DISPLAY_NAME_ENTRIES,
  type TabId,
  type QuickActionId,
  type TestAccountType,
} from '../../constants/AdminConfig';
import { useAdminLayout } from '../../context/AdminLayoutContext';
import { useAuth } from '../../context/AuthContext';
import { isAdminEmail } from '../../constants/Admin';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { usePreferences } from '../../hooks/usePreferences';
import { SPACE, RADIUS, ELEVATION } from '../../constants/DesignTokens';
import { KitCard } from '../../components/ui/KitCard';
import { KitSectionHeader } from '../../components/ui/KitSectionHeader';
import { KitButton } from '../../components/ui/KitButton';
import { KitListRow } from '../../components/ui/KitListRow';
import { useUIConfig } from '../../context/UIConfigContext';
import { COLORS } from '../../constants/Colors';
import { createGlobalAnnouncement, listGlobalAnnouncementsHistory, type TargetAudience, type DisplayType, type GlobalAnnouncement } from '../../services/globalAnnouncements';
import { uploadBroadcastImage } from '../../services/uploadBroadcastImage';
import { useOrbinomics } from '../../context/OrbinomicsContext';
import { useI18n } from '../../context/I18nContext';
import { DEFAULT_ORBINOMICS, type OrbinomicsConfig } from '../../constants/Orbinomics';
import { useIntegrity } from '../../hooks/useIntegrity';
import { getNeedsReviewList, geocodeAddress, type GeocodeNeedsReview } from '../../services/mapboxGeocode';
import { createPartner } from '../../services/partnersAdmin';
import { useOrbVoteConfig } from '../../hooks/useOrbVoteConfig';
import { useDemoDataEnabled } from '../../hooks/useDemoDataEnabled';
import { useShowDemoPolls } from '../../hooks/useShowDemoPolls';
import { useMissionsConfig } from '../../hooks/useMissionsConfig';
import { DEFAULT_ORBVOTE_QUOTAS } from '../../constants/OrbVoteConfig';
import { DEFAULT_MISSIONS_CONFIG } from '../../constants/MissionsConfig';
import { useTutorialConfig } from '../../context/TutorialConfigContext';
import { TUTORIALS } from '../../constants/Tutorials';
import { useOnboardingConfig } from '../../hooks/useOnboardingConfig';
import { ONBOARDING_ICON_OPTIONS, type OnboardingAudience, type OnboardingSlide } from '../../constants/OnboardingConfig';
import { useMenuContext } from '../../context/MenuContext';
import { usePartners } from '../../context/PartnersContext';
import { useDailyRitualConfig } from '../../hooks/useDailyRitualConfig';
import { DEFAULT_DAILY_RITUAL_CONFIG } from '../../constants/DailyRitualConfig';
import { getPushConfig, setPushConfig, sendTestPush, runStampCardsReminders, type PushConfig } from '../../services/pushConfig';
import { createInviteLink, type InviteRole } from '../../services/adminInvite';
import { deletePartner, deletePost } from '../../services/adminDelete';
import { getFeaturedPartnersConfig, setFeaturedPartnersConfig, type FeaturedSlotConfig } from '../../services/featuredPartners';
import { uploadFeaturedImage } from '../../services/uploadFeaturedImage';
import { listUsersForAdmin, removeUserByAdmin, setAllUsersDiscoverable, suspendUserByAdmin, unsuspendUserByAdmin, type AdminUserRow } from '../../services/adminUsers';
import { listAllForecastsAdmin, deleteForecastAdmin, type OrbSignalForecast } from '../../services/orbsignalForecasts';
import { sendNotificationAdmin } from '../../services/userNotifications';
import {
  createBadgeDefinition,
  listBadgeDefinitionsAdmin,
  BADGE_ICON_OPTIONS,
  BADGE_COLOR_OPTIONS,
  BADGE_CATEGORY_OPTIONS,
  VERIFIED_ACTION_TYPES,
  type BadgeRequirementType,
} from '../../services/badgeDefinitions';
import { saveDailyRitualConfigToServer } from '../../services/ritualConfigApi';
import { getOrbPostsForAdmin } from '../../services/orbPosts';
import * as Clipboard from 'expo-clipboard';
import { usePremiumPricing } from '../../hooks/usePremiumPricing';
import { useTierBenefits } from '../../hooks/useTierBenefits';
import { DEFAULT_PREMIUM_PRICING } from '../../constants/PremiumPricing';
import {
  DEFAULT_TIER_BENEFITS,
  type TierBenefitsConfig,
  type TierBenefitItem,
} from '../../constants/TierBenefits';
import { bountyListAdmin, bountyDeleteBounty } from '../../services/orbBounty';
import type { BountyDoc } from '../../constants/orbBounty';
import { adminOrbIntentMetrics, adminOrbIntentUpdateConfig } from '../../services/orbIntent';
import { adminOrbPassMetrics, adminOrbPassUpdateConfig, adminOrbPassSettlementRunMonth, adminOrbPassEmergencyKill } from '../../services/orbPass';
import {
  getSponsoredAdsConfig,
  setSponsoredAdsConfig,
  adminListSponsoredAds,
  createSponsoredAd,
  updateSponsoredAd,
  deleteSponsoredAd,
} from '../../services/sponsoredAds';
import {
  PLACEMENT_LABELS,
  DEFAULT_SPONSORED_ADS_CONFIG,
  MIN_CAROUSEL_SLOTS,
  MAX_CAROUSEL_SLOTS,
  MIN_CAROUSEL_TRANSITION_SEC,
  MAX_CAROUSEL_TRANSITION_SEC,
  type SponsoredAdDoc,
  type SponsoredAdsConfig,
  type SponsoredAdPlacement,
} from '../../constants/sponsoredAds';
import { listPartnerApplicationsAdmin, updatePartnerApplicationStatus, createPartnerFromApplication, type PartnerApplicationRow } from '../../services/partnerApplicationsAdmin';
const APP_VERSION = '1.0.0';
const EXPO_SDK_VERSION = Constants.expoConfig?.sdkVersion ?? '52';
const MAP_PROVIDER_OPTIONS: MapProvider[] = ['mapbox', 'native', 'none'];

const SECTION_COLORS: Record<string, string> = {
  flags: '#22c55e',
  uiversion: '#0ea5e9',
  layout: '#8b5cf6',
  names: '#3b82f6',
  tutorials: '#a78bfa',
  onboarding: '#ec4899',
  partners: '#0ea5e9',
  featured: '#f59e0b',
  users: '#06b6d4',
  invite: '#10b981',
  content: '#ef4444',
  broadcast: '#f59e0b',
  push: '#06b6d4',
  system: '#6b7280',
  orbsignal: '#ef4444',
  badges: '#8B5CF6',
  orbbounty: '#f59e0b',
  orbintent: '#8b5cf6',
  orbpass: '#22c55e',
  stampcards: '#0d9488',
  sponsoredads: '#0ea5e9',
  partnerapps: '#10b981',
  maintenance: '#dc2626',
  appinfo: '#64748b',
  orbpilot: '#7c3aed',
};

function getTestAccountTypeLabel(t: TestAccountType): string {
  if (t === 'off') return 'Real account';
  if (t === 'free') return 'Free member';
  if (t === 'premium') return 'Premium member';
  if (t === 'pro') return 'Pro member';
  if (t === 'partner_silver') return 'Partner Silver';
  if (t === 'partner_gold') return 'Partner Gold';
  return 'Partner Platinum';
}

const INVITE_ROLES: { value: InviteRole; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'partner', label: 'Partner' },
  { value: 'admin', label: 'Admin' },
];

/** Grouped sections: control center layout. */
const SECTION_GROUPS: { label: string; sections: Section[] }[] = [
  { label: 'Product', sections: ['flags', 'uiversion', 'layout', 'names', 'tutorials', 'onboarding'] },
  { label: 'Content & people', sections: ['partners', 'featured', 'sponsoredads', 'partnerapps', 'users', 'invite', 'content', 'orbsignal', 'badges'] },
  { label: 'Monetization & deals', sections: ['orbbounty', 'orbintent', 'orbpass', 'stampcards', 'orbpilot'] },
  { label: 'Comms', sections: ['broadcast', 'push'] },
  { label: 'System & app', sections: ['system', 'maintenance', 'appinfo'] },
];

function getSectionLabel(s: Section): string {
  const map: Record<Section, string> = {
    flags: 'Flags', uiversion: 'UI Version', layout: 'Layout', names: 'Names', tutorials: 'Tutorials', onboarding: 'Onboarding',
    partners: 'Partners', featured: 'Featured', sponsoredads: 'Sponsored ads', partnerapps: 'Partner apps', users: 'Users', invite: 'Invite', content: 'Content', orbsignal: 'Orb Signal', badges: 'Badges',
    broadcast: 'Broadcast', push: 'Push', system: 'Orbinomics & map', orbbounty: 'OrbBounty', orbintent: 'Deal Match', orbpass: 'OrbPass', stampcards: 'Stamp Cards',
    maintenance: 'Maintenance', appinfo: 'App info', orbpilot: 'OrbPilot',
  };
  return map[s] ?? s;
}

type Section = 'flags' | 'uiversion' | 'layout' | 'names' | 'tutorials' | 'onboarding' | 'partners' | 'featured' | 'sponsoredads' | 'partnerapps' | 'users' | 'invite' | 'content' | 'orbsignal' | 'badges' | 'broadcast' | 'push' | 'system' | 'orbbounty' | 'orbintent' | 'orbpass' | 'stampcards' | 'maintenance' | 'appinfo' | 'orbpilot';

function formatAuditTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminHub() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { prefs, setThemePreference } = usePreferences();
  const { flags, setFlag, resetFlags, auditLog } = useFlags();
  const { uiVersion, setUiVersion, auditLog: uiConfigAudit } = useUIConfig();
  const { config: orbinomicsConfig, setConfig: setOrbinomicsConfig, resetConfig: resetOrbinomicsConfig } = useOrbinomics();
  const layout = useAdminLayout();
  const { events: integrityEvents, refresh: refreshIntegrity } = useIntegrity();

  const [section, setSection] = useState<Section>('flags');
  const [testAccountMessage, setTestAccountMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [flagSearch, setFlagSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [nameCategoryFilter, setNameCategoryFilter] = useState<'' | 'directory' | 'tab' | 'quick_action' | 'screen'>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [navGroupIndex, setNavGroupIndex] = useState(0);
  const [burnRate, setBurnRate] = useState(String(orbinomicsConfig.burnRateOnSpend));
  const [feeRate, setFeeRate] = useState(String(orbinomicsConfig.feeRateOnEarn));
  const [appreciation, setAppreciation] = useState(String(orbinomicsConfig.appreciationFactor));
  const [minThreshold, setMinThreshold] = useState(String(orbinomicsConfig.minPointsThreshold));
  const [geocodeNeedsReview, setGeocodeNeedsReview] = useState<GeocodeNeedsReview[]>([]);
  const [replaceSlotIndex, setReplaceSlotIndex] = useState<number | null>(null);
  const [replaceQuickActionIndex, setReplaceQuickActionIndex] = useState<number | null>(null);

  const { config: orbVoteQuotas, saveConfig: saveOrbVoteQuotas, resetToDefaults: resetOrbVoteQuotas } = useOrbVoteConfig();
  const { demoDataEnabled, setDemoDataEnabled } = useDemoDataEnabled();
  const { showDemoPolls, setShowDemoPolls } = useShowDemoPolls();
  const { config: missionsConfig, saveConfig: saveMissionsConfig } = useMissionsConfig();
  const { documents: menuDocuments, reports: menuReports } = useMenuContext();
  const { partners, getPartner, getPerksForPartner, refresh: refreshPartners } = usePartners();
  const { config: ritualConfig, saveConfig: saveRitualConfig, resetToDefaults: resetRitualConfig } = useDailyRitualConfig();
  const tutorialConfig = useTutorialConfig();
  const onboardingConfig = useOnboardingConfig();
  const [onboardingAudience, setOnboardingAudience] = useState<OnboardingAudience>('member');
  const [onboardingTitle, setOnboardingTitle] = useState('');
  const [onboardingSubtitle, setOnboardingSubtitle] = useState('');
  const [onboardingImageUrl, setOnboardingImageUrl] = useState('');
  const [onboardingIcon, setOnboardingIcon] = useState<string>(ONBOARDING_ICON_OPTIONS[0]);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [orbVoteFree, setOrbVoteFree] = useState(String(orbVoteQuotas.businessFreeTierPollsPerMonth));
  const [orbVotePremium, setOrbVotePremium] = useState(String(orbVoteQuotas.businessPremiumTierPollsPerMonth));
  const [missionsRewardPoints, setMissionsRewardPoints] = useState(String(missionsConfig.rewardPointsPerMission));
  const [missionsSphereXp, setMissionsSphereXp] = useState(String(missionsConfig.rewardSphereXpPerMission));
  const [missionsPartnerIds, setMissionsPartnerIds] = useState(missionsConfig.missionPartnerIds.join(', '));
  const [missionsDeadlineEndOfDay, setMissionsDeadlineEndOfDay] = useState(missionsConfig.deadlineEndOfDay);
  const [missionsDeadlineHours, setMissionsDeadlineHours] = useState(String(missionsConfig.deadlineHoursFromNow));
  const [missionsDailyBonus, setMissionsDailyBonus] = useState(String(missionsConfig.dailyFullCompletionBonusPoints));
  const [missionsMaxSteps, setMissionsMaxSteps] = useState(String(missionsConfig.maxStepsPerMission));
  const [missionsMaxPerDay, setMissionsMaxPerDay] = useState(String(missionsConfig.maxMissionsPerDay));
  const [missionsEnabled, setMissionsEnabled] = useState(missionsConfig.missionsEnabled);
  const [missionsMinMinutesSamePartner, setMissionsMinMinutesSamePartner] = useState(String(missionsConfig.minMinutesBetweenSamePartnerCheckIn));
  const [missionsRequireProof, setMissionsRequireProof] = useState(missionsConfig.requireProofToComplete);

  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isSuperAdmin = isAdminEmail(user?.email);

  React.useEffect(() => {
    if (user !== undefined && !isSuperAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [user, isSuperAdmin, router]);

  React.useEffect(() => {
    if (section !== 'broadcast' || !isSuperAdmin) return;
    let cancelled = false;
    setBroadcastHistoryLoading(true);
    listGlobalAnnouncementsHistory()
      .then((items) => { if (!cancelled) setBroadcastHistory(items); })
      .catch(() => { if (!cancelled) setBroadcastHistory([]); })
      .finally(() => { if (!cancelled) setBroadcastHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [section, isSuperAdmin]);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<TargetAudience>('all');
  const [broadcastDisplayType, setBroadcastDisplayType] = useState<DisplayType>('bulletin');
  const [broadcastImageUrl, setBroadcastImageUrl] = useState('');
  const [broadcastTaggedPartners, setBroadcastTaggedPartners] = useState('');
  const [broadcastTaggedUsers, setBroadcastTaggedUsers] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastImageUploading, setBroadcastImageUploading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [broadcastHistory, setBroadcastHistory] = useState<GlobalAnnouncement[] | null>(null);
  const [broadcastHistoryLoading, setBroadcastHistoryLoading] = useState(false);
  const [broadcastHistoryCollapsed, setBroadcastHistoryCollapsed] = useState(true);
  const [broadcastBulletinPage, setBroadcastBulletinPage] = useState(0);
  const [broadcastBannerPage, setBroadcastBannerPage] = useState(0);

  const [pushConfig, setPushConfigState] = useState<PushConfig | null>(null);
  const [pushConfigLoading, setPushConfigLoading] = useState(false);
  const [pushConfigSaving, setPushConfigSaving] = useState(false);
  const [pushTestSending, setPushTestSending] = useState(false);
  const [pushTestResult, setPushTestResult] = useState<string | null>(null);
  const [stampRemindersRunning, setStampRemindersRunning] = useState(false);
  const [stampRemindersResult, setStampRemindersResult] = useState<string | null>(null);

  const [inviteRole, setInviteRole] = useState<InviteRole>('user');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [adminPosts, setAdminPosts] = useState<Array<{ id: string; title: string; partnerName: string }>>([]);
  const [adminPostsLoading, setAdminPostsLoading] = useState(false);
  const [forecasts, setForecasts] = useState<OrbSignalForecast[]>([]);
  const [forecastsLoading, setForecastsLoading] = useState(false);
  const [forecastDeleteReason, setForecastDeleteReason] = useState('');
  const [adminBounties, setAdminBounties] = useState<BountyDoc[]>([]);
  const [adminBountiesLoading, setAdminBountiesLoading] = useState(false);
  const [orbIntentMetrics, setOrbIntentMetrics] = useState<{ intents?: { open: number; locked: number; fulfilled: number; total: number }; emergencyKill?: Record<string, boolean> } | null>(null);
  const [orbIntentMetricsLoading, setOrbIntentMetricsLoading] = useState(false);
  const [orbPassMetrics, setOrbPassMetrics] = useState<{ redemptions?: { initiated: number; verified: number; completed: number; total: number }; emergencyKill?: Record<string, boolean> } | null>(null);
  const [orbPassMetricsLoading, setOrbPassMetricsLoading] = useState(false);
  const [orbPassSettlementMonth, setOrbPassSettlementMonth] = useState('');
  const [orbPassSettlementRunning, setOrbPassSettlementRunning] = useState(false);
  const [orbIntentMinScore, setOrbIntentMinScore] = useState('');
  const [orbIntentConfigSaving, setOrbIntentConfigSaving] = useState(false);
  const [notifTargetUserIds, setNotifTargetUserIds] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifAlsoPush, setNotifAlsoPush] = useState(false);
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState<string | null>(null);
  const [badgeName, setBadgeName] = useState('');
  const [badgeDesc, setBadgeDesc] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('ribbon');
  const [badgeColor, setBadgeColor] = useState('#8B5CF6');
  const [badgeCategory, setBadgeCategory] = useState('one_time');
  const [badgeOrder, setBadgeOrder] = useState('100');
  const { config: premiumPricing, saveConfig: savePremiumPricing } = usePremiumPricing();
  const [premiumUserMonthly, setPremiumUserMonthly] = useState(String(DEFAULT_PREMIUM_PRICING.userMonthlyDollars));
  const [premiumUserYearly, setPremiumUserYearly] = useState(String(DEFAULT_PREMIUM_PRICING.userYearlyDollars));
  const [premiumUserProMonthly, setPremiumUserProMonthly] = useState(String(DEFAULT_PREMIUM_PRICING.userProMonthlyDollars));
  const [premiumUserProYearly, setPremiumUserProYearly] = useState(String(DEFAULT_PREMIUM_PRICING.userProYearlyDollars));
  const [premiumPartnerMonthly, setPremiumPartnerMonthly] = useState(String(DEFAULT_PREMIUM_PRICING.partnerMonthlyDollars));
  const [premiumPartnerYearly, setPremiumPartnerYearly] = useState(String(DEFAULT_PREMIUM_PRICING.partnerYearlyDollars));
  const [premiumPartnerProMonthly, setPremiumPartnerProMonthly] = useState(String(DEFAULT_PREMIUM_PRICING.partnerProMonthlyDollars));
  const [premiumPartnerProYearly, setPremiumPartnerProYearly] = useState(String(DEFAULT_PREMIUM_PRICING.partnerProYearlyDollars));
  const [premiumPricingSaving, setPremiumPricingSaving] = useState(false);
  const { config: tierBenefitsConfig, saveConfig: saveTierBenefits, resetToDefaults: resetTierBenefitsToDefaults } = useTierBenefits();
  const [tierBenefitsWorking, setTierBenefitsWorking] = useState<TierBenefitsConfig>(DEFAULT_TIER_BENEFITS);
  const [benefitsSaving, setBenefitsSaving] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<{ key: keyof TierBenefitsConfig; index: number } | null>(null);
  const [newBenefitTitle, setNewBenefitTitle] = useState('');
  const [newBenefitSub, setNewBenefitSub] = useState('');
  React.useEffect(() => {
    setTierBenefitsWorking(tierBenefitsConfig);
  }, [tierBenefitsConfig]);
  React.useEffect(() => {
    setPremiumUserMonthly(String(premiumPricing.userMonthlyDollars));
    setPremiumUserYearly(String(premiumPricing.userYearlyDollars));
    setPremiumUserProMonthly(String(premiumPricing.userProMonthlyDollars));
    setPremiumUserProYearly(String(premiumPricing.userProYearlyDollars));
    setPremiumPartnerMonthly(String(premiumPricing.partnerMonthlyDollars));
    setPremiumPartnerYearly(String(premiumPricing.partnerYearlyDollars));
    setPremiumPartnerProMonthly(String(premiumPricing.partnerProMonthlyDollars));
    setPremiumPartnerProYearly(String(premiumPricing.partnerProYearlyDollars));
  }, [premiumPricing.userMonthlyDollars, premiumPricing.userYearlyDollars, premiumPricing.userProMonthlyDollars, premiumPricing.userProYearlyDollars, premiumPricing.partnerMonthlyDollars, premiumPricing.partnerYearlyDollars, premiumPricing.partnerProMonthlyDollars, premiumPricing.partnerProYearlyDollars]);
  const [badgeReqType, setBadgeReqType] = useState<BadgeRequirementType>('manual');
  const [badgeActionTypes, setBadgeActionTypes] = useState('');
  const [badgeCount, setBadgeCount] = useState('');
  const [badgeMinLevel, setBadgeMinLevel] = useState('');
  const [badgeMinOtSpent, setBadgeMinOtSpent] = useState('');
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [badgeList, setBadgeList] = useState<Array<{ id: string; name: string }>>([]);
  const [badgeListLoading, setBadgeListLoading] = useState(false);
  const [addMapPartnerName, setAddMapPartnerName] = useState('');
  const [addMapPartnerAddress, setAddMapPartnerAddress] = useState('');
  const [addMapPartnerCategory, setAddMapPartnerCategory] = useState('Other');
  const [addMapPartnerTier, setAddMapPartnerTier] = useState<'silver' | 'gold' | 'platinum'>('silver');
  const [addMapPartnerAdding, setAddMapPartnerAdding] = useState(false);
  const [addMapPartnerResult, setAddMapPartnerResult] = useState<{ success: boolean; message: string } | null>(null);

  const [featuredEntries, setFeaturedEntries] = useState<FeaturedSlotConfig[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredSaving, setFeaturedSaving] = useState(false);
  const [featuredSlotImageUploading, setFeaturedSlotImageUploading] = useState<number | null>(null);
  const [sponsoredAdsConfig, setSponsoredAdsConfigState] = useState<SponsoredAdsConfig | null>(null);
  const [sponsoredAdsList, setSponsoredAdsList] = useState<SponsoredAdDoc[]>([]);
  const [sponsoredAdsLoading, setSponsoredAdsLoading] = useState(false);
  const [sponsoredAdsConfigSaving, setSponsoredAdsConfigSaving] = useState(false);
  const [newAdPlacement, setNewAdPlacement] = useState<SponsoredAdPlacement>('orb_carousel');
  const [newAdType, setNewAdType] = useState<'image' | 'video'>('image');
  const [newAdMediaUrl, setNewAdMediaUrl] = useState('');
  const [newAdSponsorName, setNewAdSponsorName] = useState('');
  const [newAdOrder, setNewAdOrder] = useState('0');
  const [newAdActive, setNewAdActive] = useState(true);
  const [newAdCtaLabel, setNewAdCtaLabel] = useState('');
  const [newAdCtaUrl, setNewAdCtaUrl] = useState('');
  const [newAdStartDate, setNewAdStartDate] = useState('');
  const [newAdEndDate, setNewAdEndDate] = useState('');
  const [newAdSaving, setNewAdSaving] = useState(false);
  const [partnerApplicationsList, setPartnerApplicationsList] = useState<PartnerApplicationRow[]>([]);
  const [partnerApplicationsLoading, setPartnerApplicationsLoading] = useState(false);
  const [partnerApplicationsFilter, setPartnerApplicationsFilter] = useState<'pending' | 'all'>('pending');
  const [adminUsersList, setAdminUsersList] = useState<AdminUserRow[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersRemoveUid, setAdminUsersRemoveUid] = useState<string | null>(null);
  const [adminUsersActionUid, setAdminUsersActionUid] = useState<string | null>(null);
  const [adminUsersDiscoverableResult, setAdminUsersDiscoverableResult] = useState<string | null>(null);
  const [adminUsersSearchQuery, setAdminUsersSearchQuery] = useState('');

  const lastFive = auditLog.slice(-5).reverse();
  const lastIntegrity = integrityEvents.slice(0, 10);
  const orbOpsIntegrity = integrityEvents.filter((ev) => ev.type.startsWith('WORK_ORDER')).slice(0, 10);

  React.useEffect(() => {
    if (section === 'push' && isSuperAdmin && !pushConfig && !pushConfigLoading) {
      setPushConfigLoading(true);
      getPushConfig().then((res) => {
        if (res.success && res.config) setPushConfigState(res.config);
      }).finally(() => setPushConfigLoading(false));
    }
  }, [section, isSuperAdmin]);

  React.useEffect(() => {
    if (section === 'content' && isSuperAdmin) {
      setAdminPostsLoading(true);
      getOrbPostsForAdmin(80).then((posts) => {
        setAdminPosts(posts.map((p) => ({ id: p.id, title: p.title, partnerName: p.partnerName })));
      }).finally(() => setAdminPostsLoading(false));
    }
  }, [section, isSuperAdmin]);

  React.useEffect(() => {
    if (section === 'featured' && isSuperAdmin) {
      setFeaturedLoading(true);
      getFeaturedPartnersConfig().then((res) => {
        if (res.success) {
          const e = res.entries;
          setFeaturedEntries([
            e[0] ?? { partnerId: '', customImageUrl: null, order: 0 },
            e[1] ?? { partnerId: '', customImageUrl: null, order: 1 },
            e[2] ?? { partnerId: '', customImageUrl: null, order: 2 },
          ]);
        }
      }).finally(() => setFeaturedLoading(false));
    }
  }, [section, isSuperAdmin]);

  React.useEffect(() => {
    if (section === 'partnerapps' && isSuperAdmin) {
      setPartnerApplicationsLoading(true);
      listPartnerApplicationsAdmin({ status: partnerApplicationsFilter === 'pending' ? 'pending' : undefined, limit: 80 }).then((res) => {
        if (res.success) setPartnerApplicationsList(res.applications);
      }).finally(() => setPartnerApplicationsLoading(false));
    }
  }, [section, isSuperAdmin, partnerApplicationsFilter]);

  React.useEffect(() => {
    if (section === 'sponsoredads' && isSuperAdmin) {
      setSponsoredAdsLoading(true);
      Promise.all([getSponsoredAdsConfig(), adminListSponsoredAds()]).then(([configRes, listRes]) => {
        setSponsoredAdsConfigState(configRes.success && configRes.config ? configRes.config : DEFAULT_SPONSORED_ADS_CONFIG);
        if (listRes.success && listRes.ads) setSponsoredAdsList(listRes.ads);
      }).finally(() => setSponsoredAdsLoading(false));
    }
  }, [section, isSuperAdmin]);

  React.useEffect(() => {
    if (section === 'users' && isSuperAdmin) {
      setAdminUsersLoading(true);
      setAdminUsersDiscoverableResult(null);
      listUsersForAdmin(200).then((res) => {
        if (res.success) setAdminUsersList(res.users.map((u) => ({ ...u, suspended: u.suspended === true })));
      }).finally(() => setAdminUsersLoading(false));
    }
  }, [section, isSuperAdmin]);

  React.useEffect(() => {
    if (section === 'orbsignal' && isSuperAdmin) {
      setForecastsLoading(true);
      listAllForecastsAdmin().then((list) => {
        setForecasts(list);
      }).finally(() => setForecastsLoading(false));
    }
  }, [section, isSuperAdmin]);

  React.useEffect(() => {
    if (section === 'orbpass' && isSuperAdmin) return;
    if (section === 'orbintent' && isSuperAdmin) return;
    if (section === 'orbbounty' && isSuperAdmin) {
      setAdminBountiesLoading(true);
      bountyListAdmin({ limit: 100 }).then((res) => {
        if (res.success) setAdminBounties((res.bounties ?? []).filter((b) => b.status !== 'cancelled'));
      }).finally(() => setAdminBountiesLoading(false));
    }
    if (section === 'badges' && isSuperAdmin) {
      setBadgeListLoading(true);
      listBadgeDefinitionsAdmin().then((list) => setBadgeList(list.map((b) => ({ id: b.id, name: b.name })))).finally(() => setBadgeListLoading(false));
    }
  }, [section, isSuperAdmin]);

  const searchLower = flagSearch.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!searchLower)
      return FLAG_CATEGORIES.map((cat) => ({
        ...cat,
        keys: cat.keys,
      }));
    return FLAG_CATEGORIES.map((cat) => ({
      ...cat,
      keys: cat.keys.filter(
        (k) =>
          k.toLowerCase().includes(searchLower) ||
          (FLAG_LABELS[k] && FLAG_LABELS[k].toLowerCase().includes(searchLower))
      ),
    })).filter((cat) => cat.keys.length > 0);
  }, [searchLower]);

  const toggleCategory = (id: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyOrbinomics = () => {
    const c: OrbinomicsConfig = {
      ...orbinomicsConfig,
      burnRateOnSpend: Math.max(0, Math.min(1, parseFloat(burnRate) || 0)),
      feeRateOnEarn: Math.max(0, Math.min(1, parseFloat(feeRate) || 0)),
      appreciationFactor: Math.max(0.5, Math.min(3, parseFloat(appreciation) || 1)),
      minPointsThreshold: Math.max(0, Math.floor(parseFloat(minThreshold) || 0)),
    };
    setOrbinomicsConfig(c);
  };

  const handleResetOrbinomics = () => {
    resetOrbinomicsConfig();
    setBurnRate(String(DEFAULT_ORBINOMICS.burnRateOnSpend));
    setFeeRate(String(DEFAULT_ORBINOMICS.feeRateOnEarn));
    setAppreciation(String(DEFAULT_ORBINOMICS.appreciationFactor));
    setMinThreshold(String(DEFAULT_ORBINOMICS.minPointsThreshold));
  };

  React.useEffect(() => {
    setBurnRate(String(orbinomicsConfig.burnRateOnSpend));
    setFeeRate(String(orbinomicsConfig.feeRateOnEarn));
    setAppreciation(String(orbinomicsConfig.appreciationFactor));
    setMinThreshold(String(orbinomicsConfig.minPointsThreshold));
  }, [orbinomicsConfig]);

  React.useEffect(() => {
    setOrbVoteFree(String(orbVoteQuotas.businessFreeTierPollsPerMonth));
    setOrbVotePremium(String(orbVoteQuotas.businessPremiumTierPollsPerMonth));
  }, [orbVoteQuotas.businessFreeTierPollsPerMonth, orbVoteQuotas.businessPremiumTierPollsPerMonth]);

  React.useEffect(() => {
    setMissionsRewardPoints(String(missionsConfig.rewardPointsPerMission));
    setMissionsSphereXp(String(missionsConfig.rewardSphereXpPerMission));
    setMissionsPartnerIds(missionsConfig.missionPartnerIds.join(', '));
    setMissionsDeadlineEndOfDay(missionsConfig.deadlineEndOfDay);
    setMissionsDeadlineHours(String(missionsConfig.deadlineHoursFromNow));
    setMissionsDailyBonus(String(missionsConfig.dailyFullCompletionBonusPoints));
    setMissionsMaxSteps(String(missionsConfig.maxStepsPerMission));
    setMissionsMaxPerDay(String(missionsConfig.maxMissionsPerDay));
    setMissionsEnabled(missionsConfig.missionsEnabled);
    setMissionsMinMinutesSamePartner(String(missionsConfig.minMinutesBetweenSamePartnerCheckIn));
    setMissionsRequireProof(missionsConfig.requireProofToComplete);
  }, [missionsConfig.rewardPointsPerMission, missionsConfig.rewardSphereXpPerMission, missionsConfig.missionPartnerIds, missionsConfig.deadlineEndOfDay, missionsConfig.deadlineHoursFromNow, missionsConfig.dailyFullCompletionBonusPoints, missionsConfig.maxStepsPerMission, missionsConfig.maxMissionsPerDay, missionsConfig.missionsEnabled, missionsConfig.minMinutesBetweenSamePartnerCheckIn, missionsConfig.requireProofToComplete]);

  React.useEffect(() => {
    getNeedsReviewList().then(setGeocodeNeedsReview);
  }, []);

  const directoryOrder = layout.directoryOrder.length > 0 ? layout.directoryOrder : [...DEFAULT_DIRECTORY_ORDER];

  const allSectionsForRole = useMemo(() => {
    const base: Section[] = ['flags', 'uiversion', 'layout', 'names', 'tutorials', 'system', 'appinfo'];
    if (isSuperAdmin) {
      return ['flags', 'uiversion', 'layout', 'names', 'tutorials', 'onboarding', 'partners', 'featured', 'sponsoredads', 'partnerapps', 'users', 'invite', 'content', 'broadcast', 'push', 'system', 'orbsignal', 'badges', 'orbbounty', 'orbintent', 'orbpass', 'stampcards', 'orbpilot', 'maintenance', 'appinfo'];
    }
    return base;
  }, [isSuperAdmin]);

  const currentGroupIdx = SECTION_GROUPS.findIndex((g) => g.sections.includes(section));
  React.useEffect(() => {
    if (currentGroupIdx >= 0 && currentGroupIdx !== navGroupIndex) setNavGroupIndex(currentGroupIdx);
  }, [section]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, styles.headerElevated, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]}>{layout.getDisplayName('screen_admin_hub_title', 'Admin Hub')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Control center · v{APP_VERSION}</Text>
        </View>
        <View style={[styles.versionPill, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.versionPillText, { color: colors.textSecondary }]}>{EXPO_SDK_VERSION}</Text>
        </View>
      </View>

      {/* Single navigation: section groups + section pills for selected group */}
      <View style={[styles.hubDirectory, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <KitSectionHeader label="SECTION" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubDirectoryScroll}>
          {SECTION_GROUPS.map((group, idx) => {
            const sectionsInGroup = group.sections.filter((s) => allSectionsForRole.includes(s));
            if (sectionsInGroup.length === 0) return null;
            const isActive = navGroupIndex === idx;
            return (
              <TouchableOpacity
                key={group.label}
                style={[
                  styles.hubDirGroupTab,
                  { borderColor: isActive ? colors.primary : colors.border, backgroundColor: isActive ? (colors.surfaceHighlight ?? colors.background) : colors.background },
                ]}
                onPress={() => {
                  setNavGroupIndex(idx);
                  if (!sectionsInGroup.includes(section)) setSection(sectionsInGroup[0] as Section);
                }}
              >
                <Text style={[styles.hubDirGroupTabText, { color: isActive ? colors.text : colors.textSecondary }]}>{group.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.hubDirPillsWrap, { borderTopColor: colors.border }]}>
          {SECTION_GROUPS[navGroupIndex]?.sections.filter((s) => allSectionsForRole.includes(s)).map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.hubDirPill,
                { borderColor: section === s ? colors.primary : colors.border, backgroundColor: section === s ? colors.primary + '40' : colors.surfaceHighlight },
                section === s && styles.hubDirPillActive,
              ]}
              onPress={() => setSection(s as Section)}
            >
              <View style={[styles.hubDirDot, { backgroundColor: section === s ? colors.primary : colors.textSecondary }]} />
              <Text style={[styles.hubDirPillText, { color: colors.text }]}>{getSectionLabel(s as Section)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sticky section title (current section) */}
      <View style={[styles.sectionTitleBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.sectionTitleAccent, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitleText, { color: colors.text }]}>{getSectionLabel(section)}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(240, 140 + insets.bottom) }]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {section === 'uiversion' && (
          <KitCard variant="solid" style={{ marginBottom: SPACE.base }}>
            <KitSectionHeader label="UI Version" />
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginBottom: SPACE.base }]}>
              UI: <Text style={{ color: colors.text }}>Classic</Text>
            </Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>Theme</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const themePreference = prefs.themePreference ?? 'system';
                const isSelected = themePreference === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.replaceBtn,
                      {
                        backgroundColor: isSelected ? (SECTION_COLORS.uiversion ?? colors.primary) + '50' : colors.surfaceHighlight,
                        borderColor: isSelected ? (SECTION_COLORS.uiversion ?? colors.primary) : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setThemePreference(mode)}
                  >
                    <Text style={[styles.flagsMasterLabel, { color: colors.text }]}>
                      {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginTop: 4 }]}>
              Current theme: <Text style={{ color: colors.text }}>{prefs.themePreference === 'system' ? 'System' : prefs.themePreference === 'dark' ? 'Dark' : 'Light'}</Text>
            </Text>
            {uiConfigAudit.length > 0 && (
              <>
                <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginTop: 8, marginBottom: 4 }]}>
                  Last updated: {formatAuditTime(uiConfigAudit[uiConfigAudit.length - 1].timestamp)}
                </Text>
                <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>
                  Audit: last change → {uiConfigAudit[uiConfigAudit.length - 1].uiVersion}
                </Text>
              </>
            )}
          </KitCard>
        )}
        {section === 'flags' && (
            <KitCard variant="solid" style={{ marginBottom: SPACE.base }}>
            <KitSectionHeader label="Test as member" />
            <View style={[styles.flagsMasterStrip, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: SPACE.md }]}>
              <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>
                View the app as a Free, Premium, or Pro member. Members never see partner-only screens.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['off', 'free', 'premium', 'pro'] as const).map((t) => {
                  const isSelected = (layout.testAccountType ?? 'off') === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceHighlight,
                          borderColor: colors.border,
                        },
                        isSelected && { borderColor: colors.primary },
                      ]}
                      onPress={() => layout.setTestAccountType(t as TestAccountType)}
                    >
                      <Text style={[styles.pillText, { color: isSelected ? '#000' : colors.textSecondary }]}>
                        {t === 'off' ? 'Off' : t === 'free' ? 'Free' : t === 'premium' ? 'Premium' : 'Pro'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <KitSectionHeader label="Test as partner" />
            <View style={[styles.flagsMasterStrip, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: SPACE.md }]}>
              <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>
                View the app as a Silver, Gold, or Platinum partner. Your demo account OrbTap Universe is used; the tier you select here updates the partner page and all partner UI so you can test each tier.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['off', 'partner_silver', 'partner_gold', 'partner_platinum'] as const).map((t) => {
                  const isSelected = (layout.testAccountType ?? 'off') === t;
                  if (t === 'off') {
                    const offSelected = (layout.testAccountType ?? 'off') === 'off';
                    return (
                      <TouchableOpacity
                        key="off"
                        style={[
                          styles.pill,
                          {
                            backgroundColor: offSelected ? colors.primary : colors.surfaceHighlight,
                            borderColor: offSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => layout.setTestAccountType('off')}
                      >
                        <Text style={[styles.pillText, { color: offSelected ? '#000' : colors.textSecondary }]}>
                          Off (real)
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSelected ? COLORS.gold[0] : colors.surfaceHighlight,
                          borderColor: colors.border,
                        },
                        isSelected && { borderColor: COLORS.gold[0] },
                      ]}
                      onPress={() => layout.setTestAccountType(t as TestAccountType)}
                    >
                      <Text style={[styles.pillText, { color: isSelected ? '#000' : colors.textSecondary }]}>
                        {t === 'partner_silver' ? 'Silver' : t === 'partner_gold' ? 'Gold' : 'Platinum'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.testAccountSaveBtn, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  const current = layout.testAccountType ?? 'off';
                  const result = await layout.saveTestAccountType(current);
                  if (result.ok) {
                    setTestAccountMessage({
                      type: 'success',
                      text:
                        current === 'off'
                          ? 'App now shows your real account.'
                          : `Success. App updated to show ${getTestAccountTypeLabel(current)} experience. Navigate away and back to see the full experience.`,
                    });
                  } else {
                    setTestAccountMessage({
                      type: 'error',
                      text: `Failed to save: ${result.error ?? 'Unknown error'}. Please try again.`,
                    });
                  }
                }}
              >
                <Text style={styles.testAccountSaveBtnText}>Save & apply</Text>
              </TouchableOpacity>
              {testAccountMessage && (
                <View
                  style={[
                    styles.testAccountMessageWrap,
                    {
                      backgroundColor:
                        testAccountMessage.type === 'success' ? (COLORS.success ?? '#22c55e') + '22' : '#ef444422',
                      borderColor: testAccountMessage.type === 'success' ? COLORS.success ?? '#22c55e' : '#ef4444',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.testAccountMessageText,
                      { color: testAccountMessage.type === 'success' ? COLORS.success ?? '#22c55e' : '#ef4444' },
                    ]}
                  >
                    {testAccountMessage.text}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTestAccountMessage(null)}
                    style={styles.testAccountMessageClose}
                  >
                    <Text style={[styles.testAccountMessageCloseText, { color: colors.text }]}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <KitSectionHeader label="Feature flags" />
            <View style={[styles.flagsMasterStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.flagsMasterRow}>
                <KitButton
                  title="All ON"
                  variant="primary"
                  onPress={() => {
                    FLAG_KEYS_ALL.forEach((k) => setFlag(k, true));
                    setFlag('mapProvider', 'mapbox');
                  }}
                />
                <KitButton
                  title="All OFF"
                  variant="secondary"
                  onPress={() => {
                    FLAG_KEYS_ALL.forEach((k) => setFlag(k, false));
                    setFlag('mapProvider', 'none');
                  }}
                />
                <View style={[styles.flagsCountPill, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.flagsCountText, { color: colors.textSecondary }]}>
                    {FLAG_KEYS_ALL.filter((k) => Boolean(flags[k])).length} on · {FLAG_KEYS_ALL.filter((k) => !flags[k]).length} off
                    {flags.isMaintenanceModeEnabled ? ' · Maintenance ON' : ''}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.searchWrap, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { borderWidth: 1, borderColor: colors.border, color: colors.text }]}
                placeholder="Search flags..."
                placeholderTextColor={colors.textSecondary}
                value={flagSearch}
                onChangeText={setFlagSearch}
              />
              {flagSearch.length > 0 && (
                <TouchableOpacity onPress={() => setFlagSearch('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {filteredCategories.map((cat) => (
              <View key={cat.id} style={[styles.categoryBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={collapsedCategories.has(cat.id) ? 'chevron-forward' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.categoryTitleWrap}>
                    <Text style={[styles.categoryTitle, { color: colors.text }]}>{cat.title}</Text>
                    {cat.subtitle ? <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>{cat.subtitle}</Text> : null}
                  </View>
                </TouchableOpacity>
                {!collapsedCategories.has(cat.id) &&
                  cat.keys.map((key) => (
                    <View key={key} style={[styles.flagRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.flagLabel, { color: colors.text }]}>{FLAG_LABELS[key] ?? key}</Text>
              <Switch
                        value={Boolean(flags[key])}
                onValueChange={(val) => setFlag(key, val)}
                        trackColor={{ false: colors.border, true: COLORS.success }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  ))}
              </View>
            ))}
            </KitCard>
        )}

        {section === 'layout' && (
          <>
            <View style={[styles.layoutSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Navbar (Tab Bar)</Text>
              <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Choose up to 5 pages. Each has its own icon. Tap Replace to switch a slot.</Text>
              {layout.loading ? (
                <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
              ) : (
                (() => {
                  const order = layout.tabOrder.slice(0, MAX_NAVBAR_TABS);
                  const padded = order.length < MAX_NAVBAR_TABS ? [...order, ...DEFAULT_TAB_ORDER.filter((t) => !order.includes(t))].slice(0, MAX_NAVBAR_TABS) : order;
                  return padded.map((tabId, index) => (
                    <View key={`${index}-${tabId}`} style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                      <View style={styles.layoutRowLeft}>
                        <View style={[styles.tabIconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                          <Ionicons name={(TAB_ICONS[tabId] ?? 'ellipse') as any} size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.layoutRowBody}>
                          <Text style={[styles.layoutRowLabel, { color: colors.text }, layout.tabHidden.includes(tabId) && styles.layoutRowLabelDim, layout.tabHidden.includes(tabId) && { color: colors.textSecondary }]} numberOfLines={1}>
                            {layout.getDisplayName('tab_' + tabId, TAB_LABELS[tabId])}
                          </Text>
                          {layout.tabHidden.includes(tabId) && <Text style={[styles.hiddenBadge, { color: COLORS.gold[0] }]}>Hidden</Text>}
                        </View>
                      </View>
                      <View style={styles.layoutRowActions}>
                        <TouchableOpacity onPress={() => setReplaceSlotIndex(index)} style={[styles.replaceBtn, { backgroundColor: colors.surfaceHighlight }]}>
                          <Text style={[styles.replaceBtnText, { color: '#8B5CF6' }]}>Replace</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => layout.toggleTabHidden(tabId)} style={styles.iconBtn}>
                          <Ionicons name={layout.tabHidden.includes(tabId) ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => index > 0 && layout.moveTab(index, index - 1)}
                          style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                        >
                          <Ionicons name="chevron-up" size={22} color={index === 0 ? colors.border : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => index < padded.length - 1 && layout.moveTab(index, index + 1)}
                          style={[styles.iconBtn, index === padded.length - 1 && styles.iconBtnDisabled]}
                        >
                          <Ionicons name="chevron-down" size={22} color={index === padded.length - 1 ? colors.border : colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ));
                })()
              )}
              {replaceSlotIndex !== null && (
                <View style={[styles.pickerModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose page for slot {replaceSlotIndex + 1}</Text>
                  <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">
                    {TAB_IDS.map((id) => (
                      <TouchableOpacity
                        key={id}
                        style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          layout.setTabAt(replaceSlotIndex, id);
                          setReplaceSlotIndex(null);
                        }}
                      >
                        <Ionicons name={(TAB_ICONS[id] ?? 'ellipse') as any} size={22} color={colors.textSecondary} style={{ marginRight: 12 }} />
                        <Text style={[styles.pickerRowLabel, { color: colors.text }]}>{layout.getDisplayName('tab_' + id, TAB_LABELS[id])}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity onPress={() => setReplaceSlotIndex(null)} style={styles.resetLayoutBtn}>
                    <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={layout.resetLayout} style={styles.resetLayoutBtn}>
                <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Reset to default tabs</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.layoutSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Master Directory</Text>
              <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Order of items in the directory modal</Text>
              {directoryOrder.map((id, index) => (
                <View key={id} style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                  <View style={styles.layoutRowBody}>
                    <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={1}>{layout.getDisplayName('dir_' + id, DIRECTORY_LABELS_DEFAULT[id] ?? id)}</Text>
                  </View>
                  <View style={styles.layoutRowActions}>
                    <TouchableOpacity
                      onPress={() => index > 0 && layout.moveDirectoryItem(index, index - 1)}
                      style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                      disabled={index === 0}
                    >
                      <Ionicons name="chevron-up" size={22} color={index === 0 ? colors.border : colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => index < directoryOrder.length - 1 && layout.moveDirectoryItem(index, index + 1)}
                      style={[styles.iconBtn, index === directoryOrder.length - 1 && styles.iconBtnDisabled]}
                      disabled={index === directoryOrder.length - 1}
                    >
                      <Ionicons name="chevron-down" size={22} color={index === directoryOrder.length - 1 ? colors.border : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={() => layout.setDirectoryOrder([...DEFAULT_DIRECTORY_ORDER])} style={styles.resetLayoutBtn}>
                <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Reset directory order</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.layoutSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Quick Actions (Orb page)</Text>
              <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Choose which pages appear on the Orb hub. Tap Replace to change a slot. Auto-updates the Orb page.</Text>
              {layout.loading ? (
                <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
              ) : (
                (() => {
                  const qaIds = layout.quickActionIds?.length ? layout.quickActionIds : [...DEFAULT_QUICK_ACTIONS];
                  const padded = qaIds.length < MAX_QUICK_ACTIONS ? [...qaIds, ...DEFAULT_QUICK_ACTIONS.filter((k) => !qaIds.includes(k))].slice(0, MAX_QUICK_ACTIONS) : qaIds.slice(0, MAX_QUICK_ACTIONS);
                  return padded.map((key, index) => {
                    const config = QUICK_ACTION_CONFIG[key];
                    return (
                      <View key={`qa-${index}-${key}`} style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                        <View style={styles.layoutRowLeft}>
                          <View style={[styles.tabIconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                            <Ionicons name={(config?.icon ?? 'ellipse') as any} size={20} color={config?.iconColor ?? colors.textSecondary} />
                          </View>
                          <View style={styles.layoutRowBody}>
                            <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={1}>{layout.getDisplayName('qa_' + key, config?.label ?? key)}</Text>
                            <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{config?.subLabel ?? ''}</Text>
                          </View>
                        </View>
                        <View style={styles.layoutRowActions}>
                          <TouchableOpacity onPress={() => setReplaceQuickActionIndex(index)} style={[styles.replaceBtn, { backgroundColor: colors.surfaceHighlight }]}>
                            <Text style={[styles.replaceBtnText, { color: '#8B5CF6' }]}>Replace</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  });
                })()
              )}
              {replaceQuickActionIndex !== null && (
                <View style={[styles.pickerModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose action for slot {replaceQuickActionIndex + 1}</Text>
                  <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">
                    {QUICK_ACTION_KEYS.map((key) => {
                      const config = QUICK_ACTION_CONFIG[key];
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            layout.setQuickActionAt(replaceQuickActionIndex, key);
                            setReplaceQuickActionIndex(null);
                          }}
                        >
                          <Ionicons name={(config.icon ?? 'ellipse') as any} size={22} color={config.iconColor ?? colors.textSecondary} style={{ marginRight: 12 }} />
                          <Text style={[styles.pickerRowLabel, { color: colors.text }]}>{layout.getDisplayName('qa_' + key, config.label)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity onPress={() => setReplaceQuickActionIndex(null)} style={styles.resetLayoutBtn}>
                    <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={() => layout.setQuickActions([...DEFAULT_QUICK_ACTIONS])} style={styles.resetLayoutBtn}>
                <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Reset quick actions to default</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {section === 'names' && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.names }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Page & feature names</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Rename tabs, directory, and screens. Changes apply app-wide. Leave blank to use default.</Text>
            <View style={[styles.searchWrap, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, marginBottom: 12 }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { borderWidth: 1, borderColor: colors.border, color: colors.text }]}
                placeholder="Search names..."
                placeholderTextColor={colors.textSecondary}
                value={nameSearch}
                onChangeText={setNameSearch}
              />
              {nameSearch.length > 0 && (
                <TouchableOpacity onPress={() => setNameSearch('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.pillRow, { marginBottom: 12 }]}>
              {(['', 'tab', 'directory', 'quick_action', 'screen'] as const).map((cat) => {
                const label = { '': 'All', tab: 'Tabs', directory: 'Directory', quick_action: 'Quick actions', screen: 'Screens' }[cat];
                return (
                  <TouchableOpacity
                    key={cat || 'all'}
                    onPress={() => setNameCategoryFilter(cat)}
                    style={[styles.pill, { backgroundColor: nameCategoryFilter === cat ? SECTION_COLORS.names : colors.surfaceHighlight }]}
                  >
                    <Text style={[styles.pillText, { color: nameCategoryFilter === cat ? '#fff' : colors.textSecondary }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {DISPLAY_NAME_ENTRIES.filter((e) => {
              const matchCat = !nameCategoryFilter || e.category === nameCategoryFilter;
              const matchSearch = !nameSearch.trim() || e.label.toLowerCase().includes(nameSearch.trim().toLowerCase()) || e.key.toLowerCase().includes(nameSearch.trim().toLowerCase());
              return matchCat && matchSearch;
            }).map((entry) => (
              <View key={entry.key} style={[styles.nameRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.nameRowLabel, { color: colors.textSecondary }]} numberOfLines={1}>{entry.label}</Text>
                <TextInput
                  style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceHighlight }]}
                  placeholder={entry.default}
                  placeholderTextColor={colors.textSecondary}
                  value={layout.displayNames?.[entry.key] ?? ''}
                  onChangeText={(t) => layout.setDisplayName(entry.key, t)}
                />
              </View>
            ))}
          </View>
        )}

        {section === 'tutorials' && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.tutorials }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Tutorials</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Turn tutorials on or off per page. When off, the guided overlay will not appear for that page—even on first visit.</Text>
            {tutorialConfig.loaded ? (
              <>
                <View style={[styles.tutorialSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tutorialSectionLabel, { color: colors.textSecondary }]}>CORE PAGES</Text>
                  {TUTORIALS.filter((t) => ['map', 'orb', 'feed', 'pulse', 'people'].includes(t.id)).map((t) => (
                    <View key={t.id} style={[styles.flagRow, { borderTopColor: colors.border }]}>
                      <View style={styles.flagLabelWrap}>
                        <Text style={[styles.flagLabel, { color: colors.text }]}>{t.title}</Text>
                        <Text style={[styles.flagSub, { color: colors.textSecondary }]} numberOfLines={2}>{t.shortDescription}</Text>
                      </View>
                      <Switch
                        value={!tutorialConfig.isTutorialDisabled(t.id)}
                        onValueChange={(v) => tutorialConfig.setTutorialDisabled(t.id, !v)}
                        trackColor={{ false: colors.border, true: COLORS.success }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  ))}
                </View>
                <View style={[styles.tutorialSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tutorialSectionLabel, { color: colors.textSecondary }]}>DISCOVER & COMPETE</Text>
                  {TUTORIALS.filter((t) => ['spheres', 'opportunities'].includes(t.id)).map((t) => (
                    <View key={t.id} style={[styles.flagRow, { borderTopColor: colors.border }]}>
                      <View style={styles.flagLabelWrap}>
                        <Text style={[styles.flagLabel, { color: colors.text }]}>{t.title}</Text>
                        <Text style={[styles.flagSub, { color: colors.textSecondary }]} numberOfLines={2}>{t.shortDescription}</Text>
                      </View>
                      <Switch
                        value={!tutorialConfig.isTutorialDisabled(t.id)}
                        onValueChange={(v) => tutorialConfig.setTutorialDisabled(t.id, !v)}
                        trackColor={{ false: colors.border, true: COLORS.success }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  ))}
                </View>
                <View style={[styles.tutorialSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tutorialSectionLabel, { color: colors.textSecondary }]}>ACCOUNT & UTILITY</Text>
                  {TUTORIALS.filter((t) => ['settings', 'search'].includes(t.id)).map((t) => (
                    <View key={t.id} style={[styles.flagRow, { borderTopColor: colors.border }]}>
                      <View style={styles.flagLabelWrap}>
                        <Text style={[styles.flagLabel, { color: colors.text }]}>{t.title}</Text>
                        <Text style={[styles.flagSub, { color: colors.textSecondary }]} numberOfLines={2}>{t.shortDescription}</Text>
                      </View>
                      <Switch
                        value={!tutorialConfig.isTutorialDisabled(t.id)}
                        onValueChange={(v) => tutorialConfig.setTutorialDisabled(t.id, !v)}
                        trackColor={{ false: colors.border, true: COLORS.success }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  ))}
                </View>
                <TouchableOpacity onPress={() => tutorialConfig.resetToDefaults()} style={styles.resetLayoutBtn}>
                  <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Reset — enable all tutorials</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 24 }} />
            )}
          </View>
        )}

        {section === 'onboarding' && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.onboarding }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Onboarding slides</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Add or edit slides for Member and Partner onboarding. Fill the form and tap "Add slide" to create a new slide. Reorder by dragging; edit or delete from the list. Image URL is optional (demo screenshots).</Text>

            {onboardingConfig.loaded ? (
              <>
                <View style={[styles.tutorialSection, { borderTopColor: colors.border, marginTop: 16 }]}>
                  <Text style={[styles.tutorialSectionLabel, { color: colors.textSecondary }]}>AUDIENCE</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {(['member', 'partner'] as OnboardingAudience[]).map((a) => (
                      <TouchableOpacity
                        key={a}
                        onPress={() => { setOnboardingAudience(a); setEditingSlideId(null); }}
                        style={[styles.pill, { backgroundColor: onboardingAudience === a ? SECTION_COLORS.onboarding : colors.surface }]}
                      >
                        <Text style={[styles.pillText, { color: onboardingAudience === a ? '#fff' : colors.textSecondary }]}>{a === 'member' ? 'Member' : 'Partner'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.tutorialSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tutorialSectionLabel, { color: colors.textSecondary }]}>ADD NEW SLIDE (generator)</Text>
                  <TextInput
                    style={[styles.searchInput, { borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
                    placeholder="Title"
                    value={onboardingTitle}
                    onChangeText={setOnboardingTitle}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.searchInput, { borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
                    placeholder="Subtitle / description"
                    value={onboardingSubtitle}
                    onChangeText={setOnboardingSubtitle}
                    placeholderTextColor={colors.textSecondary}
                    multiline
                  />
                  <TextInput
                    style={[styles.searchInput, { borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
                    placeholder="Image URL (optional — demo screenshot)"
                    value={onboardingImageUrl}
                    onChangeText={setOnboardingImageUrl}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.flagSub, { color: colors.textSecondary, marginBottom: 4 }]}>Icon (when no image)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {ONBOARDING_ICON_OPTIONS.map((ico) => (
                      <TouchableOpacity
                        key={ico}
                        onPress={() => setOnboardingIcon(ico)}
                        style={[styles.pill, { marginRight: 6, backgroundColor: onboardingIcon === ico ? SECTION_COLORS.onboarding : colors.surface }]}
                      >
                        <Text style={[styles.pillText, { color: onboardingIcon === ico ? '#fff' : colors.textSecondary }]}>{ico}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={async () => {
                      if (!onboardingTitle.trim()) return;
                      if (editingSlideId) {
                        await onboardingConfig.updateSlide(onboardingAudience, editingSlideId, {
                          title: onboardingTitle.trim(),
                          subtitle: onboardingSubtitle.trim(),
                          imageUrl: onboardingImageUrl.trim() || undefined,
                          icon: onboardingIcon as OnboardingSlide['icon'],
                        });
                        setEditingSlideId(null);
                      } else {
                        await onboardingConfig.addSlide(onboardingAudience, {
                          audience: onboardingAudience,
                          title: onboardingTitle.trim(),
                          subtitle: onboardingSubtitle.trim(),
                          imageUrl: onboardingImageUrl.trim() || undefined,
                          icon: onboardingIcon as OnboardingSlide['icon'],
                        });
                      }
                      setOnboardingTitle('');
                      setOnboardingSubtitle('');
                      setOnboardingImageUrl('');
                    }}
                    style={[styles.resetLayoutBtn, { backgroundColor: SECTION_COLORS.onboarding }]}
                  >
                    <Text style={[styles.resetLayoutText, { color: '#fff' }]}>{editingSlideId ? 'Update slide' : 'Add slide'}</Text>
                  </TouchableOpacity>
                  {editingSlideId ? (
                    <TouchableOpacity onPress={() => { setEditingSlideId(null); setOnboardingTitle(''); setOnboardingSubtitle(''); setOnboardingImageUrl(''); }} style={styles.resetLayoutBtn}>
                      <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Cancel edit</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={[styles.tutorialSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tutorialSectionLabel, { color: colors.textSecondary }]}>
                    {onboardingAudience === 'member' ? 'MEMBER' : 'PARTNER'} SLIDES ({(onboardingAudience === 'member' ? onboardingConfig.memberSlides : onboardingConfig.partnerSlides).length})
                  </Text>
                  {(onboardingAudience === 'member' ? onboardingConfig.memberSlides : onboardingConfig.partnerSlides).map((s, idx) => (
                    <View key={s.id} style={[styles.flagRow, { borderTopColor: colors.border }]}>
                      <View style={styles.flagLabelWrap}>
                        <Text style={[styles.flagLabel, { color: colors.text }]}>{s.title}</Text>
                        <Text style={[styles.flagSub, { color: colors.textSecondary }]} numberOfLines={2}>{s.subtitle}</Text>
                        {s.imageUrl ? <Text style={[styles.flagSub, { color: colors.textSecondary, fontSize: 11 }]} numberOfLines={1}>{s.imageUrl}</Text> : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={() => { setEditingSlideId(s.id); setOnboardingTitle(s.title); setOnboardingSubtitle(s.subtitle); setOnboardingImageUrl(s.imageUrl ?? ''); setOnboardingIcon(s.icon); }}>
                          <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => alertDialog('Delete slide?', `Remove "${s.title}"?`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onboardingConfig.deleteSlide(onboardingAudience, s.id) }])}>
                          <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {onboardingConfig.hasOverrides && (
                  <TouchableOpacity onPress={() => onboardingConfig.resetToDefaults()} style={styles.resetLayoutBtn}>
                    <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Reset to default slides</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 24 }} />
            )}
          </View>
        )}

        {section === 'partners' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.partners }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Partners &amp; Perks</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Add or edit partners and their perks. Delete removes the partner and all their perks.</Text>

            <Text style={[styles.categorySubtitle, { marginTop: 12, marginBottom: 8, color: colors.textSecondary }]}>Quick add to map (address → geocode → pin)</Text>
            <View style={[styles.quickAddWrap, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
              <TextInput style={[styles.searchInput, { marginBottom: 8, borderColor: colors.border, color: colors.text }]} placeholder="Business name" value={addMapPartnerName} onChangeText={setAddMapPartnerName} placeholderTextColor={colors.textSecondary} />
              <TextInput style={[styles.searchInput, { marginBottom: 8, borderColor: colors.border, color: colors.text }]} placeholder="Full address (for map pin)" value={addMapPartnerAddress} onChangeText={setAddMapPartnerAddress} placeholderTextColor={colors.textSecondary} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {['Dining', 'Cafe', 'Retail', 'Services', 'Nightlife', 'Other'].map((c) => (
                  <TouchableOpacity key={c} onPress={() => setAddMapPartnerCategory(c)} style={[styles.pill, { backgroundColor: addMapPartnerCategory === c ? SECTION_COLORS.partners : colors.surface }]}>
                    <Text style={[styles.pillText, { color: addMapPartnerCategory === c ? '#000' : colors.textSecondary }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(['silver', 'gold', 'platinum'] as const).map((t) => (
                  <TouchableOpacity key={t} onPress={() => setAddMapPartnerTier(t)} style={[styles.pill, { backgroundColor: addMapPartnerTier === t ? SECTION_COLORS.partners : colors.surface }]}>
                    <Text style={[styles.pillText, { color: addMapPartnerTier === t ? '#000' : colors.textSecondary }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {addMapPartnerResult ? <Text style={{ color: addMapPartnerResult.success ? COLORS.success : COLORS.danger, fontSize: 13, marginBottom: 8 }}>{addMapPartnerResult.message}</Text> : null}
              <Pressable
                style={[styles.orbApplyBtn, { backgroundColor: SECTION_COLORS.partners }, addMapPartnerAdding && { opacity: 0.7 }]}
                disabled={!addMapPartnerName.trim() || !addMapPartnerAddress.trim() || addMapPartnerAdding}
                onPress={async () => {
                  setAddMapPartnerAdding(true);
                  setAddMapPartnerResult(null);
                  try {
                    const geo = await geocodeAddress(addMapPartnerAddress.trim());
                    if (!geo) {
                      setAddMapPartnerResult({ success: false, message: 'Could not geocode address. Try a more specific address.' });
                      return;
                    }
                    const newId = `p_${Date.now()}`;
                    const res = await createPartner({
                      id: newId,
                      name: addMapPartnerName.trim(),
                      category: addMapPartnerCategory || 'Other',
                      tier: addMapPartnerTier,
                      location: { lat: geo.lat, lng: geo.lng, address: geo.formattedAddress },
                      description: '',
                      hours: '',
                      verified: true,
                    });
                    setAddMapPartnerAdding(false);
                    if (res.success) {
                      setAddMapPartnerResult({ success: true, message: `Added "${addMapPartnerName.trim()}" to map. Refresh map to see the new pin.` });
                      setAddMapPartnerName('');
                      setAddMapPartnerAddress('');
                      refreshPartners();
                    } else {
                      setAddMapPartnerResult({ success: false, message: res.message ?? 'Failed to add partner.' });
                    }
                  } catch (e: any) {
                    setAddMapPartnerAdding(false);
                    setAddMapPartnerResult({ success: false, message: e?.message ?? 'Failed.' });
                  }
                }}
              >
                {addMapPartnerAdding ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Geocode &amp; add to map</Text>}
              </Pressable>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/admin/partner-form')}
              style={[styles.orbApplyBtn, { marginBottom: 16, backgroundColor: SECTION_COLORS.partners }]}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={[styles.orbApplyText, { color: '#fff' }]}>Add partner (full form)</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {partners.map((p) => (
                <View key={p.id} style={[styles.layoutRow, styles.partnerListRow, { borderTopColor: colors.border }]}>
                  <View style={styles.partnerListRowLeft}>
                    <View style={[styles.tabIconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="business-outline" size={20} color={SECTION_COLORS.partners} />
                    </View>
                    <View style={styles.partnerListRowText}>
                      <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{p.name}</Text>
                      <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{p.category} · {String(p.tier).charAt(0).toUpperCase() + String(p.tier).slice(1)} · {getPerksForPartner(p.id).length} perk(s)</Text>
                    </View>
                  </View>
                  <View style={styles.partnerListRowActions}>
                    <TouchableOpacity onPress={() => router.push(`/admin/perks?partnerId=${encodeURIComponent(p.id)}`)} style={[styles.replaceBtn, { backgroundColor: colors.surfaceHighlight }]}>
                      <Text style={[styles.replaceBtnText, { color: SECTION_COLORS.partners }]}>Perks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push(`/admin/partner-form?id=${encodeURIComponent(p.id)}`)} style={[styles.replaceBtn, { backgroundColor: colors.surfaceHighlight }]}>
                      <Text style={[styles.replaceBtnText, { color: '#8B5CF6' }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        alertDialog('Delete partner?', `Remove "${p.name}" and all their perks? This cannot be undone.`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: async () => {
                            const res = await deletePartner(p.id);
                            if (res.success) {
                              refreshPartners();
                              alertDialog('Partner deleted', 'Partner and all associated perks have been removed.', [{ text: 'OK' }]);
                            } else {
                              showErrorAlert('Request didn’t complete', res.message ?? 'Delete failed. Please try again.');
                            }
                          } },
                        ]);
                      }}
                      style={[styles.replaceBtn, { backgroundColor: COLORS.danger + '20' }]}
                    >
                      <Text style={[styles.replaceBtnText, { color: COLORS.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            {partners.length === 0 && (
              <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginTop: 12 }]}>No partners yet. Tap &quot;Add partner&quot; to add one (e.g. when onboarding a new business in person).</Text>
            )}
          </View>
        )}

        {section === 'featured' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.featured }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Featured spot (Orb hub)</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Up to 3 paid slots shown in the carousel; 4th slot is always a free &quot;Wildcard&quot; (random Silver-tier partner). Upload an image per slot for a premium look.</Text>
            {featuredLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : (
              <>
                {[0, 1, 2].map((slotIndex) => {
                  const entry = featuredEntries[slotIndex];
                  const partnerId = entry?.partnerId ?? '';
                  const customImageUrl = entry?.customImageUrl ?? '';
                  const partner = getPartner(partnerId);
                  return (
                    <View key={slotIndex} style={[styles.layoutRow, { borderTopColor: colors.border, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                      <Text style={[styles.tutorialSectionLabel, { color: colors.textSecondary }]}>Slot {slotIndex + 1}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <View style={{ flex: 1, minWidth: 120 }}>
                          <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginBottom: 4 }]}>Partner ID</Text>
                          <TextInput
                            style={[styles.searchInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, paddingVertical: 8 }]}
                            placeholder="e.g. p3"
                            placeholderTextColor={colors.textSecondary}
                            value={partnerId}
                            onChangeText={(text) => {
                              const next = [...featuredEntries];
                              while (next.length <= slotIndex) next.push({ partnerId: '', customImageUrl: null, order: next.length });
                              next[slotIndex] = { ...next[slotIndex], partnerId: text.trim(), customImageUrl: next[slotIndex]?.customImageUrl ?? null };
                              setFeaturedEntries(next);
                            }}
                          />
                        </View>
                        {partner ? <Text style={[styles.categorySubtitle, { color: colors.text }]}>{partner.name}</Text> : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={[styles.replaceBtn, { backgroundColor: SECTION_COLORS.featured }]}
                          disabled={featuredSlotImageUploading !== null}
                          onPress={async () => {
                            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9] });
                            if (result.canceled || !result.assets[0]?.uri) return;
                            setFeaturedSlotImageUploading(slotIndex);
                            try {
                              const url = await uploadFeaturedImage(result.assets[0].uri);
                              const next = [...featuredEntries];
                              while (next.length <= slotIndex) next.push({ partnerId: '', customImageUrl: null, order: next.length });
                              next[slotIndex] = { ...next[slotIndex], partnerId: next[slotIndex]?.partnerId ?? '', customImageUrl: url };
                              setFeaturedEntries(next);
                            } finally {
                              setFeaturedSlotImageUploading(null);
                            }
                          }}
                        >
                          {featuredSlotImageUploading === slotIndex ? <ActivityIndicator color="#000" size="small" /> : <Text style={[styles.replaceBtnText, { color: '#000' }]}>Upload image</Text>}
                        </TouchableOpacity>
                        {customImageUrl ? (
                          <TouchableOpacity
                            style={[styles.replaceBtn, { backgroundColor: COLORS.danger + '20' }]}
                            onPress={() => {
                              const next = [...featuredEntries];
                              while (next.length <= slotIndex) next.push({ partnerId: '', customImageUrl: null, order: next.length });
                              next[slotIndex] = { ...next[slotIndex], partnerId: next[slotIndex]?.partnerId ?? '', customImageUrl: null };
                              setFeaturedEntries(next);
                            }}
                          >
                            <Text style={[styles.replaceBtnText, { color: COLORS.danger }]}>Clear image</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      {customImageUrl ? <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Image set</Text> : null}
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.orbApplyBtn, { backgroundColor: SECTION_COLORS.featured, flex: 1 }]}
                    disabled={featuredSaving}
                    onPress={async () => {
                      setFeaturedSaving(true);
                      const toSave = featuredEntries.slice(0, 3).filter((e) => e.partnerId?.trim());
                      const res = await setFeaturedPartnersConfig(toSave.map((e, i) => ({ partnerId: e.partnerId.trim(), customImageUrl: e.customImageUrl || null, order: i })));
                      setFeaturedSaving(false);
                      if (res.success) alertDialog('Saved', 'Featured slots updated.', [{ text: 'OK' }]);
                      else showErrorAlert('Request didn’t complete', res.message ?? 'Save failed. Please try again.');
                    }}
                  >
                    {featuredSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Save featured slots</Text>}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginTop: 12 }]}>Slot 4 is always the Wildcard (random free-tier partner). No config needed.</Text>
              </>
            )}
          </View>
        )}

        {section === 'sponsoredads' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.sponsoredads }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Sponsored ads</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Orb page carousel (below Featured) and daily ritual reward ad. Add/edit/remove ads; set carousel timing and slots (1–3).</Text>
            {sponsoredAdsLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : (
              <>
                <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>Global config</Text>
                {(() => {
                  const safeConfig = sponsoredAdsConfig ?? DEFAULT_SPONSORED_ADS_CONFIG;
                  return (
                    <>
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.text }]}>Carousel transition (sec)</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    placeholder={`${DEFAULT_SPONSORED_ADS_CONFIG.carouselTransitionSeconds}`}
                    placeholderTextColor={colors.textSecondary}
                    value={String(safeConfig.carouselTransitionSeconds)}
                    onChangeText={(t) => setSponsoredAdsConfigState((c) => ({ ...(c ?? DEFAULT_SPONSORED_ADS_CONFIG), carouselTransitionSeconds: Math.min(MAX_CAROUSEL_TRANSITION_SEC, Math.max(MIN_CAROUSEL_TRANSITION_SEC, parseInt(t, 10) || DEFAULT_SPONSORED_ADS_CONFIG.carouselTransitionSeconds)) }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.text }]}>Max carousel slots (1–3)</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    placeholder="3"
                    placeholderTextColor={colors.textSecondary}
                    value={String(safeConfig.maxCarouselSlots)}
                    onChangeText={(t) => setSponsoredAdsConfigState((c) => ({ ...(c ?? DEFAULT_SPONSORED_ADS_CONFIG), maxCarouselSlots: Math.min(MAX_CAROUSEL_SLOTS, Math.max(MIN_CAROUSEL_SLOTS, parseInt(t, 10) || 1)) }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.text }]}>Daily ritual reward ad enabled</Text>
                  <Switch
                    value={safeConfig.dailyRitualRewardAdEnabled}
                    onValueChange={(v) => setSponsoredAdsConfigState((c) => ({ ...(c ?? DEFAULT_SPONSORED_ADS_CONFIG), dailyRitualRewardAdEnabled: v }))}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.refreshBtn, { backgroundColor: SECTION_COLORS.sponsoredads + '30', borderWidth: 1, borderColor: SECTION_COLORS.sponsoredads }]}
                  disabled={sponsoredAdsConfigSaving}
                  onPress={async () => {
                    const toSave = sponsoredAdsConfig ?? DEFAULT_SPONSORED_ADS_CONFIG;
                    setSponsoredAdsConfigSaving(true);
                    const res = await setSponsoredAdsConfig(toSave);
                    setSponsoredAdsConfigSaving(false);
                    if (res.success) { setSponsoredAdsConfigState(toSave); alertDialog('Saved', 'Sponsored ads config updated.', [{ text: 'OK' }]); }
                    else showErrorAlert('Request didn’t complete', res.message ?? 'Save failed. Please try again.');
                  }}
                >
                  <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.sponsoredads }]}>{sponsoredAdsConfigSaving ? 'Saving…' : 'Save config'}</Text>
                </TouchableOpacity>
                    </>
                  );
                })()}
                <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>Ads ({sponsoredAdsList.length})</Text>
                <TouchableOpacity
                  style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight }]}
                  onPress={() => {
                    setSponsoredAdsLoading(true);
                    Promise.all([getSponsoredAdsConfig(), adminListSponsoredAds()]).then(([configRes, listRes]) => {
                      if (configRes.success) setSponsoredAdsConfigState(configRes.config ?? { ...DEFAULT_SPONSORED_ADS_CONFIG });
                      if (listRes.success && listRes.ads) setSponsoredAdsList(listRes.ads);
                    }).finally(() => setSponsoredAdsLoading(false));
                  }}
                >
                  <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.sponsoredads }]}>Refresh list</Text>
                </TouchableOpacity>
                {sponsoredAdsList.length === 0 ? (
                  <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>No ads yet. Create one below (placement, media URL, CTAs).</Text>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {sponsoredAdsList.map((ad) => (
                      <View key={ad.id} style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                        <View style={styles.layoutRowLeft}>
                          <View style={[styles.tabIconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                            <Ionicons name={ad.type === 'video' ? 'videocam' : 'image'} size={18} color={SECTION_COLORS.sponsoredads} />
                          </View>
                          <View style={styles.layoutRowBody}>
                            <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={1}>{ad.sponsorName || PLACEMENT_LABELS[ad.placement]} · {ad.type}</Text>
                            <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{ad.ctas?.length ?? 0} CTA(s) · order {ad.order} · {ad.active ? 'Active' : 'Inactive'}{(ad.startAt != null || ad.endAt != null) ? ` · ${ad.startAt != null ? new Date(ad.startAt).toISOString().slice(0, 10) : '—'} → ${ad.endAt != null ? new Date(ad.endAt).toISOString().slice(0, 10) : '—'}` : ''}</Text>
                          </View>
                        </View>
                        <View style={styles.layoutRowActions}>
                        <TouchableOpacity
                          style={[styles.replaceBtn, { backgroundColor: COLORS.danger + '20' }]}
                          onPress={() => {
                            alertDialog('Delete ad?', 'This cannot be undone.', [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: async () => {
                                const res = await deleteSponsoredAd(ad.id);
                                if (res.success) setSponsoredAdsList((prev) => prev.filter((x) => x.id !== ad.id));
                                else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
                              } },
                            ]);
                          }}
                        >
                          <Text style={[styles.replaceBtnText, { color: COLORS.danger }]}>Delete</Text>
                        </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>Add ad</Text>
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.text }]}>Placement</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['orb_carousel', 'daily_ritual_reward'] as SponsoredAdPlacement[]).map((p) => (
                      <TouchableOpacity key={p} onPress={() => setNewAdPlacement(p)} style={[styles.pill, { backgroundColor: newAdPlacement === p ? SECTION_COLORS.sponsoredads + '30' : colors.surfaceHighlight }]}>
                        <Text style={[styles.pillText, { color: newAdPlacement === p ? SECTION_COLORS.sponsoredads : colors.textSecondary }]}>{p === 'orb_carousel' ? 'Orb carousel' : 'Daily ritual'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.text }]}>Type</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setNewAdType('image')} style={[styles.pill, { backgroundColor: newAdType === 'image' ? SECTION_COLORS.sponsoredads + '30' : colors.surfaceHighlight }]}>
                      <Text style={[styles.pillText, { color: newAdType === 'image' ? SECTION_COLORS.sponsoredads : colors.textSecondary }]}>Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setNewAdType('video')} style={[styles.pill, { backgroundColor: newAdType === 'video' ? SECTION_COLORS.sponsoredads + '30' : colors.surfaceHighlight }]}>
                      <Text style={[styles.pillText, { color: newAdType === 'video' ? SECTION_COLORS.sponsoredads : colors.textSecondary }]}>Video</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Media URL (image or video; upload to Storage first)</Text>
                <TextInput
                  style={[styles.searchInput, { marginBottom: 10, borderColor: colors.border, color: colors.text }]}
                  placeholder="https://..."
                  placeholderTextColor={colors.textSecondary}
                  value={newAdMediaUrl}
                  onChangeText={setNewAdMediaUrl}
                  autoCapitalize="none"
                />
                <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Sponsor name (optional)</Text>
                <TextInput
                  style={[styles.searchInput, { marginBottom: 10, borderColor: colors.border, color: colors.text }]}
                  placeholder="Brand name"
                  placeholderTextColor={colors.textSecondary}
                  value={newAdSponsorName}
                  onChangeText={setNewAdSponsorName}
                />
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.text }]}>Order</Text>
                  <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={newAdOrder} onChangeText={setNewAdOrder} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textSecondary} />
                </View>
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.text }]}>Active</Text>
                  <Switch value={newAdActive} onValueChange={setNewAdActive} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
                </View>
                <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Schedule (optional — when ad is shown)</Text>
                <TextInput style={[styles.searchInput, { marginBottom: 6, borderColor: colors.border, color: colors.text }]} placeholder="Start YYYY-MM-DD" value={newAdStartDate} onChangeText={setNewAdStartDate} placeholderTextColor={colors.textSecondary} />
                <TextInput style={[styles.searchInput, { marginBottom: 12, borderColor: colors.border, color: colors.text }]} placeholder="End YYYY-MM-DD" value={newAdEndDate} onChangeText={setNewAdEndDate} placeholderTextColor={colors.textSecondary} />
                <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>CTA (button on ad)</Text>
                <TextInput style={[styles.searchInput, { marginBottom: 6, borderColor: colors.border, color: colors.text }]} placeholder="Label e.g. Learn more" value={newAdCtaLabel} onChangeText={setNewAdCtaLabel} placeholderTextColor={colors.textSecondary} />
                <TextInput style={[styles.searchInput, { marginBottom: 12, borderColor: colors.border, color: colors.text }]} placeholder="https://..." value={newAdCtaUrl} onChangeText={setNewAdCtaUrl} placeholderTextColor={colors.textSecondary} autoCapitalize="none" keyboardType="url" />
                <TouchableOpacity
                  style={[styles.orbApplyBtn, { backgroundColor: SECTION_COLORS.sponsoredads }]}
                  disabled={newAdSaving || !newAdMediaUrl.trim()}
                  onPress={async () => {
                    setNewAdSaving(true);
                    const ctas = newAdCtaLabel.trim() && newAdCtaUrl.trim() ? [{ label: newAdCtaLabel.trim(), url: newAdCtaUrl.trim() }] : [];
                    const startAt = newAdStartDate.trim() ? (() => { const t = new Date(newAdStartDate.trim() + 'T00:00:00Z').getTime(); return Number.isNaN(t) ? undefined : t; })() : undefined;
                    const endAt = newAdEndDate.trim() ? (() => { const t = new Date(newAdEndDate.trim() + 'T23:59:59.999Z').getTime(); return Number.isNaN(t) ? undefined : t; })() : undefined;
                    const res = await createSponsoredAd({
                      placement: newAdPlacement,
                      type: newAdType,
                      mediaUrl: newAdMediaUrl.trim(),
                      ctas,
                      order: parseInt(newAdOrder, 10) || 0,
                      active: newAdActive,
                      sponsorName: newAdSponsorName.trim() || undefined,
                      ...(startAt != null && { startAt }),
                      ...(endAt != null && { endAt }),
                    });
                    setNewAdSaving(false);
                    if (res.success && res.ad) {
                      setSponsoredAdsList((prev) => [...prev, res.ad!]);
                      setNewAdMediaUrl(''); setNewAdSponsorName(''); setNewAdOrder('0'); setNewAdCtaLabel(''); setNewAdCtaUrl(''); setNewAdStartDate(''); setNewAdEndDate('');
                      alertDialog('Ad created', 'The ad has been added. Refresh the list to see it.', [{ text: 'OK' }]);
                    } else {
                      showErrorAlert('Request didn’t complete', ('message' in res ? res.message : 'Create failed. Please try again.') ?? 'Create failed. Please try again.');
                    }
                  }}
                >
                  {newAdSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Create ad</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {section === 'partnerapps' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.partnerapps }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Partner applications</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Partners apply in-app (Featured & Sponsored). View, approve, or reject. Approved ad applicants: create their ad in Sponsored ads after approval.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity style={[styles.pill, { backgroundColor: partnerApplicationsFilter === 'pending' ? SECTION_COLORS.partnerapps + '30' : colors.surfaceHighlight }]} onPress={() => setPartnerApplicationsFilter('pending')}>
                <Text style={[styles.pillText, { color: partnerApplicationsFilter === 'pending' ? SECTION_COLORS.partnerapps : colors.textSecondary }]}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pill, { backgroundColor: partnerApplicationsFilter === 'all' ? SECTION_COLORS.partnerapps + '30' : colors.surfaceHighlight }]} onPress={() => setPartnerApplicationsFilter('all')}>
                <Text style={[styles.pillText, { color: partnerApplicationsFilter === 'all' ? SECTION_COLORS.partnerapps : colors.textSecondary }]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight }]} onPress={() => { setPartnerApplicationsLoading(true); listPartnerApplicationsAdmin({ status: partnerApplicationsFilter === 'pending' ? 'pending' : undefined, limit: 80 }).then((res) => { if (res.success) setPartnerApplicationsList(res.applications); }).finally(() => setPartnerApplicationsLoading(false)); }}>
                <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.partnerapps }]}>Refresh</Text>
              </TouchableOpacity>
            </View>
            {partnerApplicationsLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : partnerApplicationsList.length === 0 ? (
              <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>No applications found.</Text>
            ) : (
              <View style={{ gap: 12 }}>
                {partnerApplicationsList.map((app) => (
                  <View key={app.id} style={[styles.layoutRow, { borderTopColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={[styles.layoutRowLeft, { marginBottom: 0 }]}>
                      <View style={[styles.tabIconWrap, { backgroundColor: SECTION_COLORS.partnerapps + '25' }]}>
                        <Ionicons name="business" size={18} color={SECTION_COLORS.partnerapps} />
                      </View>
                      <View style={styles.layoutRowBody}>
                        <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={2}>{app.businessName}</Text>
                        <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>{app.contactName} · {app.contactEmail}</Text>
                        <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>{app.placementInterest} · {app.status}</Text>
                        {(app.placementInterest === 'sponsored' || app.placementInterest === 'both') && (app.adPlacementPreference || app.adCtaUrl) ? (
                          <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>Ad: {app.adPlacementPreference ?? '—'} · CTA: {app.adCtaUrl ? 'yes' : '—'}</Text>
                        ) : null}
                      </View>
                    </View>
                    {app.description ? <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={2}>{app.description}</Text> : null}
                    {app.status === 'pending' && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                        <TouchableOpacity style={[styles.replaceBtn, { backgroundColor: COLORS.success }]} onPress={async () => {
                          const res = await createPartnerFromApplication(app.id);
                          if (res.success) {
                            setPartnerApplicationsList((prev) => (partnerApplicationsFilter === 'pending' ? prev.filter((a) => a.id !== app.id) : prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' as const } : a))));
                            alertDialog('Partner on map', res.message ?? 'Partner created. They can now add perks from the dashboard.', [{ text: 'OK' }]);
                          } else {
                            showErrorAlert('Request did not complete', res.message ?? 'Please try again.');
                          }
                        }}>
                          <Text style={[styles.replaceBtnText, { color: '#000' }]}>Approve & add to map</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.replaceBtn, { backgroundColor: COLORS.success + '25' }]} onPress={async () => { const res = await updatePartnerApplicationStatus(app.id, 'approved'); if (res.success) { setPartnerApplicationsList((prev) => (partnerApplicationsFilter === 'pending' ? prev.filter((a) => a.id !== app.id) : prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' as const } : a)))); alertDialog('Approved', 'Application approved. Create the ad in Sponsored Ads when ready.', [{ text: 'OK' }]); } else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.'); }}>
                          <Text style={[styles.replaceBtnText, { color: COLORS.success }]}>Approve only</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.replaceBtn, { backgroundColor: COLORS.danger + '20' }]} onPress={() => { alertDialog('Reject application?', 'The partner will see their status as rejected. You can add an admin note in Firestore if needed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reject', style: 'destructive', onPress: async () => { const res = await updatePartnerApplicationStatus(app.id, 'rejected'); if (res.success) { setPartnerApplicationsList((prev) => (partnerApplicationsFilter === 'pending' ? prev.filter((a) => a.id !== app.id) : prev.map((a) => (a.id === app.id ? { ...a, status: 'rejected' as const } : a)))); alertDialog('Rejected', 'Application has been rejected.', [{ text: 'OK' }]); } else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.'); } }]); }}>
                          <Text style={[styles.replaceBtnText, { color: COLORS.danger }]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {section === 'users' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.users }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Users</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Search by name, email, username, or UID. Suspend blocks sign-in. Remove deletes account and data. Full admin control.</Text>
            <View style={[styles.searchWrap, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, marginBottom: 10 }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text, borderWidth: 1, borderColor: colors.border }]}
                placeholder="Search users..."
                placeholderTextColor={colors.textSecondary}
                value={adminUsersSearchQuery}
                onChangeText={setAdminUsersSearchQuery}
              />
              {adminUsersSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setAdminUsersSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <TouchableOpacity onPress={() => { setAdminUsersLoading(true); setAdminUsersDiscoverableResult(null); listUsersForAdmin(200).then((res) => { if (res.success) setAdminUsersList(res.users.map((u) => ({ ...u, suspended: u.suspended === true }))); }).finally(() => setAdminUsersLoading(false)); }} style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.users }]}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.replaceBtn, { backgroundColor: SECTION_COLORS.users }]}
                onPress={async () => {
                  const res = await setAllUsersDiscoverable();
                  if (res.success) setAdminUsersDiscoverableResult(`Set ${res.count} users discoverable.`);
                  else setAdminUsersDiscoverableResult(res.message ?? 'Failed');
                }}
              >
                <Text style={[styles.replaceBtnText, { color: '#000' }]}>Set all discoverable</Text>
              </TouchableOpacity>
            </View>
            {adminUsersDiscoverableResult ? <Text style={[styles.layoutSectionSubtitle, { color: colors.text, marginBottom: 6 }]}>{adminUsersDiscoverableResult}</Text> : null}
            {adminUsersLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 12 }} />
            ) : adminUsersList.length === 0 ? (
              <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>No users loaded. Tap Refresh.</Text>
            ) : (() => {
              const q = adminUsersSearchQuery.trim().toLowerCase();
              const filtered = q
                ? adminUsersList.filter((u) => {
                    const name = (u.displayName ?? '').toLowerCase();
                    const email = (u.email ?? '').toLowerCase();
                    const username = (u.username ?? '').toLowerCase();
                    const uid = (u.uid ?? '').toLowerCase();
                    return name.includes(q) || email.includes(q) || username.includes(q) || uid.includes(q);
                  })
                : adminUsersList;
              return (
                <>
                  <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}{q ? ` matching "${adminUsersSearchQuery}"` : ''}</Text>
                  <ScrollView style={{ maxHeight: 520 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {filtered.map((u) => (
                      <View key={u.uid} style={[styles.userCardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.userCardCompactTop}>
                          <View style={[styles.userCardIconCompact, { backgroundColor: SECTION_COLORS.users + '25' }]}>
                            <Ionicons name="person-outline" size={18} color={SECTION_COLORS.users} />
                          </View>
                          <View style={styles.userCardInfoCompact}>
                            <Text style={[styles.userCardNameCompact, { color: colors.text }]} numberOfLines={1}>{u.displayName || u.email || u.uid}</Text>
                            <Text style={[styles.userCardEmailCompact, { color: colors.textSecondary }]} numberOfLines={1}>{u.email ?? '—'}{u.username ? ` · @${u.username}` : ''}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                              <View style={[styles.userCardBadgeCompact, { backgroundColor: u.discoverable ? COLORS.success + '22' : colors.surfaceHighlight }]}>
                                <Text style={[styles.userCardBadgeTextCompact, { color: u.discoverable ? COLORS.success : colors.textSecondary }]}>{u.discoverable ? 'Discoverable' : 'Hidden'}</Text>
                              </View>
                              {u.suspended && (
                                <View style={[styles.userCardBadgeCompact, { backgroundColor: COLORS.danger + '22' }]}>
                                  <Text style={[styles.userCardBadgeTextCompact, { color: COLORS.danger }]}>Suspended</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                        <View style={[styles.userCardActionsCompact, { borderTopColor: colors.border }]}>
                          {u.suspended ? (
                            <TouchableOpacity
                              style={[styles.userCardActionBtnCompact, { backgroundColor: COLORS.success + '22' }]}
                              disabled={adminUsersActionUid !== null}
                              onPress={async () => {
                                setAdminUsersActionUid(u.uid);
                                const res = await unsuspendUserByAdmin(u.uid);
                                setAdminUsersActionUid(null);
                                if (res.success) setAdminUsersList((prev) => prev.map((x) => x.uid === u.uid ? { ...x, suspended: false } : x));
                                else showErrorAlert('Request didn’t complete', res.message ?? 'Unsuspend failed. Please try again.');
                              }}
                            >
                              {adminUsersActionUid === u.uid ? <ActivityIndicator color={COLORS.success} size="small" /> : <Text style={[styles.userCardActionTextCompact, { color: COLORS.success }]}>Unsuspend</Text>}
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={[styles.userCardActionBtnCompact, { backgroundColor: '#f59e0b22' }]}
                              disabled={adminUsersActionUid !== null}
                              onPress={() => {
                                alertDialog('Suspend user?', `${u.displayName || u.email || u.uid} will be blocked from signing in. Continue?`, [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Suspend', onPress: async () => {
                                    setAdminUsersActionUid(u.uid);
                                    const res = await suspendUserByAdmin(u.uid);
                                    setAdminUsersActionUid(null);
                                    if (res.success) setAdminUsersList((prev) => prev.map((x) => x.uid === u.uid ? { ...x, suspended: true } : x));
                                    else showErrorAlert('Request didn’t complete', res.message ?? 'Suspend failed. Please try again.');
                                  } },
                                ]);
                              }}
                            >
                              {adminUsersActionUid === u.uid ? <ActivityIndicator color="#f59e0b" size="small" /> : <Text style={[styles.userCardActionTextCompact, { color: '#f59e0b' }]}>Suspend</Text>}
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.userCardActionBtnCompact, { backgroundColor: COLORS.danger + '22' }]}
                            disabled={adminUsersRemoveUid !== null}
                            onPress={() => {
                              alertDialog('Remove user?', `Permanently delete ${u.displayName || u.email || u.uid}? This removes their account and all data.`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Remove', style: 'destructive', onPress: async () => {
                                  setAdminUsersRemoveUid(u.uid);
                                  const res = await removeUserByAdmin(u.uid);
                                  setAdminUsersRemoveUid(null);
                                  if (res.success) setAdminUsersList((prev) => prev.filter((x) => x.uid !== u.uid));
                                  else showErrorAlert('Request didn’t complete', res.message ?? 'Remove failed. Please try again.');
                                } },
                              ]);
                            }}
                          >
                            {adminUsersRemoveUid === u.uid ? <ActivityIndicator color={COLORS.danger} size="small" /> : <Text style={[styles.userCardActionTextCompact, { color: COLORS.danger }]}>Remove</Text>}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </>
              );
            })()}
          </View>
        )}

        {section === 'invite' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.invite }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Invite with role</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Generate a signup link. Anyone who signs up via this link gets the role you choose (User, Partner, or Admin). One-time use per link.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {INVITE_ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.pill, { backgroundColor: colors.surfaceHighlight }, inviteRole === r.value && { backgroundColor: SECTION_COLORS.invite }]}
                  onPress={() => { setInviteRole(r.value); setInviteUrl(null); setInviteError(null); }}
                >
                  <Text style={[styles.pillText, { color: colors.textSecondary }, inviteRole === r.value && styles.pillTextActive, inviteRole === r.value && { color: '#000' }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.orbApplyBtn, { marginBottom: 12, backgroundColor: SECTION_COLORS.invite }]}
              disabled={inviteLoading}
              onPress={async () => {
                setInviteLoading(true);
                setInviteError(null);
                setInviteUrl(null);
                const res = await createInviteLink(inviteRole);
                setInviteLoading(false);
                if (res.success && res.url) {
                  setInviteUrl(res.url);
                } else {
                  setInviteError(!res.success ? res.message : 'Failed to create link');
                }
              }}
            >
              {inviteLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Generate invite link</Text>}
            </TouchableOpacity>
            {inviteError ? <Text style={{ color: COLORS.danger, marginBottom: 8, fontSize: 14 }}>{inviteError}</Text> : null}
            {inviteUrl ? (
              <View style={[styles.searchWrap, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Text style={[styles.flagLabel, { color: colors.text, flex: 1 }]} numberOfLines={2}>{inviteUrl}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    await Clipboard.setStringAsync(inviteUrl);
                    alertDialog('Copied', 'Invite link copied to clipboard.', [{ text: 'OK' }]);
                  }}
                  style={[styles.replaceBtn, { backgroundColor: SECTION_COLORS.invite }]}
                >
                  <Text style={[styles.replaceBtnText, { color: '#000', fontWeight: '700' }]}>Copy</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {section === 'content' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.content }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>OrbFeed posts</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Delete any post (demo or real). Deletion is permanent.</Text>
            <TouchableOpacity onPress={() => { setAdminPostsLoading(true); getOrbPostsForAdmin(80).then((posts) => { setAdminPosts(posts.map((p) => ({ id: p.id, title: p.title, partnerName: p.partnerName }))); }).finally(() => setAdminPostsLoading(false)); }} style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight, marginBottom: 12 }]}>
              <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.content }]}>Refresh list</Text>
            </TouchableOpacity>
            {adminPostsLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : adminPosts.length === 0 ? (
              <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>No posts. Create posts from partner dashboard or feed.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 360 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {adminPosts.map((post) => (
                  <View key={post.id} style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                    <View style={styles.layoutRowLeft}>
                      <View style={[styles.tabIconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                        <Ionicons name="newspaper-outline" size={20} color={SECTION_COLORS.content} />
                      </View>
                      <View style={styles.layoutRowBody}>
                        <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={1}>{post.title}</Text>
                        <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{post.partnerName}</Text>
                      </View>
                    </View>
                    <View style={styles.layoutRowActions}>
                      <TouchableOpacity
                        onPress={() => {
                          alertDialog('Delete post?', `Remove "${post.title}"? This cannot be undone.`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: async () => {
                              const res = await deletePost(post.id);
                              if (res.success) {
                                setAdminPosts((prev) => prev.filter((x) => x.id !== post.id));
                                alertDialog('Post deleted', 'The post has been removed.', [{ text: 'OK' }]);
                              } else {
                                showErrorAlert('Request didn’t complete', res.message ?? 'Delete failed. Please try again.');
                              }
                            } },
                          ]);
                        }}
                        style={[styles.replaceBtn, { backgroundColor: COLORS.danger + '20' }]}
                      >
                        <Text style={[styles.replaceBtnText, { color: COLORS.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {section === 'orbsignal' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.orbsignal }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Orb Signal forecasts</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Delete a forecast to remove it; the owner gets an in-app notification (and optional push). You can enter a reason below.</Text>
            <Text style={[styles.categorySubtitle, { marginBottom: 6, color: colors.textSecondary }]}>Reason for deletion (optional, shown to user)</Text>
            <TextInput
              style={[styles.searchInput, { marginBottom: 12, paddingVertical: 10, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Duplicate / policy"
              placeholderTextColor={colors.textSecondary}
              value={forecastDeleteReason}
              onChangeText={setForecastDeleteReason}
            />
            <TouchableOpacity
              onPress={() => {
                setForecastsLoading(true);
                listAllForecastsAdmin().then(setForecasts).finally(() => setForecastsLoading(false));
              }}
              style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight, marginBottom: 12 }]}
            >
              <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.orbsignal }]}>Refresh list</Text>
            </TouchableOpacity>
            {forecastsLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : forecasts.length === 0 ? (
              <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>No forecasts yet. Users place forecasts from Orb Signal.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {forecasts.map((f) => (
                  <View key={f.id} style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                    <View style={styles.layoutRowLeft}>
                      <View style={[styles.tabIconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                        <Ionicons name="radio-outline" size={18} color={SECTION_COLORS.orbsignal} />
                      </View>
                      <View style={styles.layoutRowBody}>
                        <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={2}>{f.marketQuestion || f.marketId}</Text>
                        <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{f.userId.slice(0, 8)}… · {f.outcomeLabel} · {formatAuditTime(f.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.layoutRowActions}>
                      <TouchableOpacity
                        onPress={() => {
                          alertDialog(
                            'Delete forecast?',
                            'The user will be notified (in-app + push if enabled).',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  const res = await deleteForecastAdmin(f.id, forecastDeleteReason.trim() || undefined);
                                  if (res.success) {
                                    setForecasts((prev) => prev.filter((x) => x.id !== f.id));
                                    alertDialog('Forecast deleted', 'The forecast has been removed and the user has been notified.', [{ text: 'OK' }]);
                                  } else {
                                    showErrorAlert('Request didn’t complete', res.message ?? 'Delete failed. Please try again.');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        style={[styles.replaceBtn, { backgroundColor: COLORS.danger + '20' }]}
                      >
                        <Text style={[styles.replaceBtnText, { color: COLORS.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {section === 'badges' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.badges }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Add badge (template)</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Create a new badge. Choose who can earn it: by verified actions, min level, min OT spent, or manual (admin awards later).</Text>
            <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Name</Text>
            <TextInput style={[styles.searchInput, { marginBottom: 8, borderColor: colors.border, color: colors.text }]} placeholder="e.g. Check-in King" value={badgeName} onChangeText={setBadgeName} placeholderTextColor={colors.textSecondary} />
            <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Description</Text>
            <TextInput style={[styles.searchInput, { marginBottom: 8, minHeight: 60, textAlignVertical: 'top', borderColor: colors.border, color: colors.text }]} placeholder="How to earn this badge" value={badgeDesc} onChangeText={setBadgeDesc} placeholderTextColor={colors.textSecondary} multiline />
            <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {BADGE_ICON_OPTIONS.slice(0, 16).map((icon) => (
                  <TouchableOpacity key={icon} onPress={() => setBadgeIcon(icon)} style={[styles.pill, { backgroundColor: badgeIcon === icon ? SECTION_COLORS.badges : colors.surfaceHighlight }]}>
                    <Ionicons name={icon as any} size={20} color={badgeIcon === icon ? '#000' : colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {BADGE_COLOR_OPTIONS.map((c) => (
                <TouchableOpacity key={c} onPress={() => setBadgeColor(c)} style={[styles.pill, { backgroundColor: c + '40', borderWidth: 2, borderColor: badgeColor === c ? c : 'transparent' }]}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c }} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {BADGE_CATEGORY_OPTIONS.map(({ value, label }) => (
                <TouchableOpacity key={value} onPress={() => setBadgeCategory(value)} style={[styles.pill, { backgroundColor: badgeCategory === value ? SECTION_COLORS.badges : colors.surfaceHighlight }]}>
                  <Text style={[styles.pillText, { color: badgeCategory === value ? '#000' : colors.textSecondary }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Order (display)</Text>
            <TextInput style={[styles.searchInput, { marginBottom: 12, borderColor: colors.border, color: colors.text }]} placeholder="100" value={badgeOrder} onChangeText={setBadgeOrder} keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
            <Text style={[styles.categorySubtitle, { marginBottom: 6, color: colors.textSecondary }]}>How to earn</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {(['manual', 'verified_actions', 'min_level', 'min_ot_spent'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setBadgeReqType(t)} style={[styles.pill, { backgroundColor: badgeReqType === t ? SECTION_COLORS.badges : colors.surfaceHighlight }]}>
                  <Text style={[styles.pillText, { color: badgeReqType === t ? '#000' : colors.textSecondary }]}>{t === 'manual' ? 'Manual' : t === 'verified_actions' ? 'Verified actions' : t === 'min_level' ? 'Min level' : 'Min OT spent'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {badgeReqType === 'verified_actions' && (
              <>
                <Text style={[styles.categorySubtitle, { marginBottom: 6, color: colors.textSecondary }]}>Action types (tap to toggle; empty = any verified action)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {VERIFIED_ACTION_TYPES.map((actionType) => {
                    const selected = badgeActionTypes.split(/[\s,]+/).filter(Boolean).includes(actionType);
                    return (
                      <TouchableOpacity
                        key={actionType}
                        onPress={() => {
                          const list = badgeActionTypes.split(/[\s,]+/).filter(Boolean);
                          if (selected) setBadgeActionTypes(list.filter((x) => x !== actionType).join(', '));
                          else setBadgeActionTypes([...list, actionType].join(', '));
                        }}
                        style={[styles.pill, { backgroundColor: selected ? SECTION_COLORS.badges : colors.surfaceHighlight }]}
                      >
                        <Text style={[styles.pillText, { color: selected ? '#000' : colors.textSecondary, fontSize: 11 }]} numberOfLines={1}>{actionType.replace(/^EMIT_/, '')}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Required count</Text>
                <TextInput style={[styles.searchInput, { marginBottom: 12, borderColor: colors.border, color: colors.text }]} placeholder="10" value={badgeCount} onChangeText={setBadgeCount} keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
              </>
            )}
            {badgeReqType === 'min_level' && (
              <>
                <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Minimum level</Text>
                <TextInput style={[styles.searchInput, { marginBottom: 12, borderColor: colors.border, color: colors.text }]} placeholder="5" value={badgeMinLevel} onChangeText={setBadgeMinLevel} keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
              </>
            )}
            {badgeReqType === 'min_ot_spent' && (
              <>
                <Text style={[styles.categorySubtitle, { marginBottom: 4, color: colors.textSecondary }]}>Minimum OT ever spent</Text>
                <TextInput style={[styles.searchInput, { marginBottom: 12, borderColor: colors.border, color: colors.text }]} placeholder="500" value={badgeMinOtSpent} onChangeText={setBadgeMinOtSpent} keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
              </>
            )}
            <Pressable
              style={[styles.orbApplyBtn, { backgroundColor: SECTION_COLORS.badges }, badgeSaving && { opacity: 0.7 }]}
              disabled={!badgeName.trim() || badgeSaving}
              onPress={async () => {
                setBadgeSaving(true);
                const reqConfig = badgeReqType === 'verified_actions' ? { actionTypes: badgeActionTypes.split(/[\s,]+/).filter(Boolean), count: parseInt(badgeCount, 10) || 1 } : badgeReqType === 'min_level' ? { minLevel: parseInt(badgeMinLevel, 10) || 0 } : badgeReqType === 'min_ot_spent' ? { minOtSpent: parseInt(badgeMinOtSpent, 10) || 0 } : undefined;
                const res = await createBadgeDefinition({
                  name: badgeName.trim(),
                  description: badgeDesc.trim(),
                  icon: badgeIcon,
                  color: badgeColor,
                  category: badgeCategory,
                  order: parseInt(badgeOrder, 10) || 100,
                  requirementType: badgeReqType,
                  requirementConfig: reqConfig,
                });
                setBadgeSaving(false);
                if (res.success) {
                  setBadgeList((prev) => [...prev, { id: res.id!, name: badgeName.trim() }]);
                  setBadgeName(''); setBadgeDesc(''); setBadgeOrder('100');
                  alertDialog('Badge created', `"${badgeName.trim()}" has been added. Users will see it in Achievements.`, [{ text: 'OK' }]);
                } else {
                  showErrorAlert('Request didn’t complete', res.message ?? 'Failed to create badge. Please try again.');
                }
              }}
            >
              {badgeSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Add badge</Text>}
            </Pressable>
            <Text style={[styles.categorySubtitle, { marginTop: 16, color: colors.textSecondary }]}>Existing custom badges</Text>
            {badgeListLoading ? <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 8 }} /> : badgeList.length === 0 ? <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>None yet.</Text> : <View style={{ marginTop: 8 }}>{badgeList.map((b) => <Text key={b.id} style={[styles.infoValue, { color: colors.text }]}>{b.name} ({b.id})</Text>)}</View>}
          </View>
        )}

        {section === 'orbbounty' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.orbbounty }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>OrbBounty™</Text>
            <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.orbLabel, { color: colors.text, marginLeft: 0 }]}>Feature enabled</Text>
              <Switch
                value={!!flags.isOrbBountyEnabled}
                onValueChange={(v) => setFlag('isOrbBountyEnabled', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginBottom: 12 }]}>When enabled, Bounty tab and Deal Bounty flow are visible. Create bounties from the app or below; list and delete (cancel) any bounty here.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/bounty/create' as any)}
                style={[styles.refreshBtn, { backgroundColor: SECTION_COLORS.orbbounty + '30', borderWidth: 1, borderColor: SECTION_COLORS.orbbounty }]}
              >
                <Ionicons name="add" size={18} color={SECTION_COLORS.orbbounty} />
                <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.orbbounty }]}>Create bounty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setAdminBountiesLoading(true);
                  bountyListAdmin({ limit: 100 }).then((res) => {
                    if (res.success) setAdminBounties((res.bounties ?? []).filter((b) => b.status !== 'cancelled'));
                  }).finally(() => setAdminBountiesLoading(false));
                }}
                style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight }]}
              >
                <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.orbbounty }]}>Refresh list</Text>
              </TouchableOpacity>
            </View>
            {adminBountiesLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : adminBounties.length === 0 ? (
              <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>No bounties. Users create bounties from the Bounty tab.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {adminBounties.map((b) => (
                  <View key={b.id} style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                    <View style={styles.layoutRowLeft}>
                      <View style={[styles.tabIconWrap, { backgroundColor: colors.surfaceHighlight }]}>
                        <Ionicons name="pricetag-outline" size={18} color={SECTION_COLORS.orbbounty} />
                      </View>
                      <View style={styles.layoutRowBody}>
                        <Text style={[styles.layoutRowLabel, { color: colors.text }]} numberOfLines={2}>{b.title}</Text>
                        <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{b.status} · {b.category} · {formatAuditTime(b.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.layoutRowActions}>
                      <TouchableOpacity
                        onPress={() => {
                          alertDialog(
                            'Delete bounty?',
                            'This will remove the bounty. Only do this for moderation.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  const res = await bountyDeleteBounty(b.id);
                                  if (res.success) {
                                    setAdminBounties((prev) => prev.filter((x) => x.id !== b.id));
                                    alertDialog('Bounty deleted', 'The bounty has been removed.', [{ text: 'OK' }]);
                                  } else {
                                    showErrorAlert('Request didn’t complete', res.message ?? 'Delete failed. Please try again.');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        style={[styles.replaceBtn, { backgroundColor: COLORS.danger + '20' }]}
                      >
                        <Text style={[styles.replaceBtnText, { color: COLORS.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {section === 'orbintent' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.orbintent }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Deal Match Control Center</Text>
            <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.orbLabel, { color: colors.text, marginLeft: 0 }]}>Feature enabled</Text>
              <Switch
                value={!!flags.isOrbIntentEnabled}
                onValueChange={(v) => setFlag('isOrbIntentEnabled', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginBottom: 12 }]}>When enabled, Deal Match tab and flows (create intent, offers, rules, Deal Done Card) are visible. Config is stored in orbtapConfig/orbIntent.</Text>
            <TouchableOpacity
              onPress={() => {
                setOrbIntentMetricsLoading(true);
                adminOrbIntentMetrics().then((res) => {
                  if (res.success && res.metrics) setOrbIntentMetrics(res.metrics as any);
                }).finally(() => setOrbIntentMetricsLoading(false));
              }}
              style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight, marginBottom: 12 }]}
            >
              <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.orbintent }]}>Refresh metrics</Text>
            </TouchableOpacity>
            {orbIntentMetricsLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : orbIntentMetrics?.intents ? (
              <View style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.layoutRowLabel, { color: colors.text }]}>Intents (open / locked / fulfilled / total)</Text>
                <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>{orbIntentMetrics.intents.open} / {orbIntentMetrics.intents.locked} / {orbIntentMetrics.intents.fulfilled} / {orbIntentMetrics.intents.total}</Text>
              </View>
            ) : null}
            {orbIntentMetrics?.emergencyKill && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Emergency kill (orbtapConfig/orbIntent.emergencyKill)</Text>
                <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>disableRouting: {String(orbIntentMetrics.emergencyKill.disableRouting)} · disableOffers: {String(orbIntentMetrics.emergencyKill.disableOffers)} · disableAutoAccept: {String(orbIntentMetrics.emergencyKill.disableAutoAccept)}</Text>
              </View>
            )}
            <Text style={[styles.orbLabel, { color: colors.textSecondary, marginTop: 16 }]}>Min score to route to partners</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <TextInput
                style={[styles.orbInput, { flex: 1, backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. 50"
                placeholderTextColor={colors.textSecondary}
                value={orbIntentMinScore}
                onChangeText={setOrbIntentMinScore}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                onPress={async () => {
                  const n = Math.min(100, Math.max(0, Number(orbIntentMinScore) || 50));
                  setOrbIntentConfigSaving(true);
                  const res = await adminOrbIntentUpdateConfig({ gatingRules: { minScoreToRouteToPartners: n } });
                  setOrbIntentConfigSaving(false);
                  if (res.success) alertDialog('Saved', `Min score set to ${n}.`, [{ text: 'OK' }]);
                  else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
                }}
                style={[styles.refreshBtn, { marginBottom: 0 }]}
                disabled={orbIntentConfigSaving}
              >
                <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.orbintent }]}>{orbIntentConfigSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginTop: 16 }]}>Full thresholds, quotas, and partner controls: edit orbtapConfig/orbIntent in Firestore or add more Admin UI here.</Text>
          </View>
        )}

        {section === 'orbpass' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.orbpass }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>OrbPass™ Control Center</Text>
            <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.orbLabel, { color: colors.text, marginLeft: 0 }]}>Feature enabled</Text>
              <Switch
                value={!!flags.isOrbPassEnabled}
                onValueChange={(v) => setFlag('isOrbPassEnabled', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginBottom: 12 }]}>When enabled, OrbPass tab is visible. Eligibility from tier (free/premium/pro). Config: orbtapConfig/orbPass.</Text>
            <TouchableOpacity
              onPress={() => {
                setOrbPassMetricsLoading(true);
                adminOrbPassMetrics().then((res) => {
                  if (res.success && res.redemptions != null) setOrbPassMetrics(res as any);
                }).finally(() => setOrbPassMetricsLoading(false));
              }}
              style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight, marginBottom: 12 }]}
            >
              <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.orbpass }]}>Refresh metrics</Text>
            </TouchableOpacity>
            {orbPassMetricsLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : orbPassMetrics?.redemptions ? (
              <View style={[styles.layoutRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.layoutRowLabel, { color: colors.text }]}>Redemptions (initiated / verified / completed / total)</Text>
                <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>{orbPassMetrics.redemptions.initiated} / {orbPassMetrics.redemptions.verified} / {orbPassMetrics.redemptions.completed} / {orbPassMetrics.redemptions.total}</Text>
              </View>
            ) : null}
            <Text style={[styles.orbLabel, { color: colors.textSecondary, marginTop: 16 }]}>Settlement (run for month, idempotent)</Text>
            <TextInput
              style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
              placeholder="e.g. 2026-02"
              placeholderTextColor={colors.textSecondary}
              value={orbPassSettlementMonth}
              onChangeText={setOrbPassSettlementMonth}
            />
            <TouchableOpacity
              onPress={async () => {
                setOrbPassSettlementRunning(true);
                const res = await adminOrbPassSettlementRunMonth(orbPassSettlementMonth || undefined);
                setOrbPassSettlementRunning(false);
                if (res.success) alertDialog('Done', res.message ?? 'Settlement complete.', [{ text: 'OK' }]);
                else showErrorAlert('Request didn’t complete', res.message ?? 'Please try again.');
              }}
              style={[styles.refreshBtn, { marginTop: 8 }]}
              disabled={orbPassSettlementRunning}
            >
              <Text style={[styles.refreshBtnText, { color: SECTION_COLORS.orbpass }]}>{orbPassSettlementRunning ? 'Running…' : 'Run settlement'}</Text>
            </TouchableOpacity>
            <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginTop: 16 }]}>Caps, tiers, and emergency kill: edit orbtapConfig/orbPass in Firestore or add more Admin UI.</Text>
          </View>
        )}

        {section === 'stampcards' && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.stampcards }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Stamp Cards™</Text>
            <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.orbLabel, { color: colors.text, marginLeft: 0 }]}>Module enabled</Text>
              <Switch
                value={!!flags.moduleStampCards}
                onValueChange={(v) => setFlag('moduleStampCards', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>When enabled, Stamp Cards appear in Wallet, Scan, and Partner Dashboard. Config: docs/BUILD/STAMP_CARDS_CONFIG.md. Tier limits: constants/StampCardsTierConfig.ts.</Text>
          </View>
        )}

        {section === 'orbpilot' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.orbpilot }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>OrbPilot™</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Outcome-first verified-visit autopilot. Partners set budgets/schedules, engine releases time-windowed slots, users claim → scan → verify → OT Points.</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {[
                { label: 'Control Panel & Kill Switches', route: '/admin/orbpilot/control', icon: 'power' },
                { label: 'System Health', route: '/admin/orbpilot/health', icon: 'pulse' },
                { label: 'Visit Audit Explorer', route: '/admin/orbpilot/audit', icon: 'search' },
                { label: 'Disputes Queue', route: '/admin/orbpilot/disputes-queue', icon: 'flag' },
                { label: 'Abuse Monitor', route: '/admin/orbpilot/abuse', icon: 'eye' },
                { label: 'Trust Tier Manager', route: '/admin/orbpilot/trust', icon: 'shield-checkmark' },
                { label: 'Partner Risk Manager', route: '/admin/orbpilot/risk', icon: 'warning' },
                { label: 'Rules & Thresholds', route: '/admin/orbpilot/rules', icon: 'settings' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight, gap: 10 }]}
                  onPress={() => router.push(item.route as any)}
                >
                  <Ionicons name={item.icon as any} size={16} color={SECTION_COLORS.orbpilot} />
                  <Text style={[styles.orbLabel, { color: colors.text, flex: 1, marginLeft: 0 }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {section === 'broadcast' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Global message</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Banner = strip at top (X to dismiss). Bulletin = pop-up on app load (X to dismiss). Users see it once until they dismiss.</Text>
            <TextInput
              style={[styles.searchInput, { marginBottom: 12, paddingVertical: 12, borderColor: colors.border, color: colors.text }]}
              placeholder="Title (e.g. New feature live)"
              placeholderTextColor={colors.textSecondary}
              value={broadcastTitle}
              onChangeText={(t) => { setBroadcastTitle(t); setBroadcastResult(null); }}
            />
            <TextInput
              style={[styles.searchInput, { marginBottom: 12, paddingVertical: 12, minHeight: 80, textAlignVertical: 'top', borderColor: colors.border, color: colors.text }]}
              placeholder="Message body"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={broadcastBody}
              onChangeText={(t) => { setBroadcastBody(t); setBroadcastResult(null); }}
            />
            <Text style={[styles.categorySubtitle, { marginBottom: 6, color: colors.textSecondary }]}>Show as</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['bulletin', 'banner'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, { backgroundColor: colors.surfaceHighlight }, broadcastDisplayType === t && styles.pillActive, broadcastDisplayType === t && { backgroundColor: COLORS.success }]}
                  onPress={() => setBroadcastDisplayType(t)}
                >
                  <Text style={[styles.pillText, { color: colors.textSecondary }, broadcastDisplayType === t && styles.pillTextActive, broadcastDisplayType === t && { color: '#000' }]}>{t === 'banner' ? 'Banner' : 'Bulletin'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.categorySubtitle, { marginBottom: 6, color: colors.textSecondary }]}>Image (optional)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <TextInput
                style={[styles.searchInput, { flex: 1, paddingVertical: 10, fontSize: 13, borderColor: colors.border, color: colors.text }]}
                placeholder="Paste image URL or upload below"
                placeholderTextColor={colors.textSecondary}
                value={broadcastImageUrl}
                onChangeText={(t) => { setBroadcastImageUrl(t); setBroadcastResult(null); }}
              />
              <Pressable
                style={[styles.broadcastUploadBtn, { backgroundColor: colors.surfaceHighlight }]}
                onPress={async () => {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    showErrorAlert('Photo access needed', 'Allow photo library access in Settings to upload an image.');
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [16, 9],
                    quality: 0.8,
                  });
                  if (result.canceled || !result.assets?.[0]?.uri) return;
                  setBroadcastImageUploading(true);
                  setBroadcastResult(null);
                  try {
                    const url = await uploadBroadcastImage(result.assets[0].uri);
                    setBroadcastImageUrl(url);
                    setBroadcastResult('Image uploaded. You can send the message.');
                  } catch (e: any) {
                    setBroadcastResult(e?.message ?? 'Image upload failed.');
                  } finally {
                    setBroadcastImageUploading(false);
                  }
                }}
                disabled={broadcastImageUploading}
              >
                {broadcastImageUploading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={[styles.broadcastUploadBtnText, { color: colors.text }]}>Upload</Text>
                )}
              </Pressable>
            </View>
            <TextInput
              style={[styles.searchInput, { marginBottom: 12, paddingVertical: 10, fontSize: 13, borderColor: colors.border, color: colors.text }]}
              placeholder="Tagged partner IDs (comma-separated, e.g. p1, p2)"
              placeholderTextColor={colors.textSecondary}
              value={broadcastTaggedPartners}
              onChangeText={(t) => { setBroadcastTaggedPartners(t); setBroadcastResult(null); }}
            />
            <TextInput
              style={[styles.searchInput, { marginBottom: 16, paddingVertical: 10, fontSize: 13, borderColor: colors.border, color: colors.text }]}
              placeholder="Tagged user IDs (comma-separated, Firebase UIDs)"
              placeholderTextColor={colors.textSecondary}
              value={broadcastTaggedUsers}
              onChangeText={(t) => { setBroadcastTaggedUsers(t); setBroadcastResult(null); }}
            />
            <Text style={[styles.orbHint, { color: colors.textSecondary, marginBottom: 8 }]}>Target: Everyone = all users. Members = non-partners only. Partners = partner accounts. Specific = only the user IDs listed above.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(['all', 'members', 'partners', 'specific'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, { backgroundColor: colors.surfaceHighlight }, broadcastTarget === t && styles.pillActive, broadcastTarget === t && { backgroundColor: COLORS.success }]}
                  onPress={() => setBroadcastTarget(t)}
                >
                  <Text style={[styles.pillText, { color: colors.textSecondary }, broadcastTarget === t && styles.pillTextActive, broadcastTarget === t && { color: '#000' }]}>{t === 'all' ? 'Everyone' : t === 'members' ? 'Members' : t === 'partners' ? 'Partners' : 'Specific users'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {broadcastResult ? (
              <Text style={{ color: broadcastResult.startsWith('Sent') ? COLORS.success : COLORS.gold[0], marginBottom: 12, fontSize: 14 }}>{broadcastResult}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.orbApplyBtn, broadcastSending && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
              disabled={!broadcastTitle.trim() || broadcastSending || (broadcastTarget === 'specific' && !broadcastTaggedUsers.trim())}
              onPress={async () => {
                setBroadcastSending(true);
                setBroadcastResult(null);
                try {
                  const taggedPartnerIds = broadcastTaggedPartners.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
                  const taggedUserIds = broadcastTaggedUsers.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
                  const r = await createGlobalAnnouncement({
                    title: broadcastTitle.trim(),
                    body: broadcastBody.trim(),
                    targetAudience: broadcastTarget,
                    displayType: broadcastDisplayType,
                    imageUrl: broadcastImageUrl.trim() || undefined,
                    taggedPartnerIds: taggedPartnerIds.length ? taggedPartnerIds : undefined,
                    taggedUserIds: taggedUserIds.length ? taggedUserIds : undefined,
                  });
                  if (r.success) {
                    setBroadcastResult('Sent. Users will see it next time they open the app.');
                    setBroadcastTitle('');
                    setBroadcastBody('');
                    setBroadcastImageUrl('');
                    setBroadcastTaggedPartners('');
                    setBroadcastTaggedUsers('');
                    listGlobalAnnouncementsHistory().then(setBroadcastHistory).catch(() => {});
                    alertDialog('Broadcast sent', 'Users will see this message next time they open the app.', [{ text: 'OK' }]);
                  } else {
                    const msg = r.message ?? 'Failed to send.';
                    setBroadcastResult(msg);
                    showErrorAlert('Broadcast didn’t send', msg);
                  }
                } catch (e: any) {
                  const msg = e?.message ?? 'Failed to send. Check your connection and that you are signed in as Super Admin.';
                  setBroadcastResult(msg);
                  showErrorAlert('Broadcast didn’t send', msg);
                } finally {
                  setBroadcastSending(false);
                }
              }}
            >
              {broadcastSending ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Send to {broadcastTarget === 'all' ? 'everyone' : broadcastTarget === 'specific' ? 'tagged users only' : broadcastTarget}</Text>}
            </Pressable>

            {/* Broadcast history — last 90 days, collapsed by default */}
            <Text style={[styles.layoutSectionTitle, { color: colors.text, marginTop: 24, marginBottom: 8 }]}>History (last 90 days)</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
              onPress={() => setBroadcastHistoryCollapsed((c) => !c)}
            >
              <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>
                {broadcastHistoryCollapsed ? 'Show 5 per list' : 'Show 10 per list'} · tap to expand/collapse
              </Text>
              <Ionicons name={broadcastHistoryCollapsed ? 'chevron-down' : 'chevron-up'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {broadcastHistoryLoading ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : broadcastHistory ? (() => {
              const bulletins = broadcastHistory.filter((a) => a.displayType === 'bulletin');
              const banners = broadcastHistory.filter((a) => a.displayType === 'banner');
              const pageSize = broadcastHistoryCollapsed ? 5 : 10;
              const bulletinPages = Math.max(1, Math.ceil(bulletins.length / pageSize));
              const bannerPages = Math.max(1, Math.ceil(banners.length / pageSize));
              const bulletinSlice = bulletins.slice(broadcastBulletinPage * pageSize, broadcastBulletinPage * pageSize + pageSize);
              const bannerSlice = banners.slice(broadcastBannerPage * pageSize, broadcastBannerPage * pageSize + pageSize);
              function formatHistoryDate(createdAt: { seconds: number }) {
                return new Date(createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' });
              }
              return (
                <View style={{ marginBottom: 24 }}>
                  <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.broadcast, marginTop: 8 }]}>
                    <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>Past bulletins</Text>
                    {bulletins.length === 0 ? <Text style={[styles.infoValue, { color: colors.textSecondary }]}>None in the last 90 days.</Text> : (
                      <>
                        {bulletinSlice.map((a) => (
                          <View key={a.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                            <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{a.title}</Text>
                            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}>{formatHistoryDate(a.createdAt)} · {a.targetAudience}</Text>
                          </View>
                        ))}
                        {bulletinPages > 1 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <TouchableOpacity
                              style={[styles.pill, { backgroundColor: colors.surfaceHighlight }]}
                              onPress={() => setBroadcastBulletinPage((p) => Math.max(0, p - 1))}
                              disabled={broadcastBulletinPage === 0}
                            >
                              <Text style={[styles.pillText, { color: colors.text }]}>Previous</Text>
                            </TouchableOpacity>
                            <Text style={[styles.pillText, { color: colors.textSecondary }]}>{broadcastBulletinPage + 1} of {bulletinPages}</Text>
                            <TouchableOpacity
                              style={[styles.pill, { backgroundColor: colors.surfaceHighlight }]}
                              onPress={() => setBroadcastBulletinPage((p) => Math.min(bulletinPages - 1, p + 1))}
                              disabled={broadcastBulletinPage >= bulletinPages - 1}
                            >
                              <Text style={[styles.pillText, { color: colors.text }]}>Next</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.broadcast, marginTop: 12 }]}>
                    <Text style={[styles.categorySubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>Past banners</Text>
                    {banners.length === 0 ? <Text style={[styles.infoValue, { color: colors.textSecondary }]}>None in the last 90 days.</Text> : (
                      <>
                        {bannerSlice.map((a) => (
                          <View key={a.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                            <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{a.title}</Text>
                            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}>{formatHistoryDate(a.createdAt)} · {a.targetAudience}</Text>
                          </View>
                        ))}
                        {bannerPages > 1 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <TouchableOpacity
                              style={[styles.pill, { backgroundColor: colors.surfaceHighlight }]}
                              onPress={() => setBroadcastBannerPage((p) => Math.max(0, p - 1))}
                              disabled={broadcastBannerPage === 0}
                            >
                              <Text style={[styles.pillText, { color: colors.text }]}>Previous</Text>
                            </TouchableOpacity>
                            <Text style={[styles.pillText, { color: colors.textSecondary }]}>{broadcastBannerPage + 1} of {bannerPages}</Text>
                            <TouchableOpacity
                              style={[styles.pill, { backgroundColor: colors.surfaceHighlight }]}
                              onPress={() => setBroadcastBannerPage((p) => Math.min(bannerPages - 1, p + 1))}
                              disabled={broadcastBannerPage >= bannerPages - 1}
                            >
                              <Text style={[styles.pillText, { color: colors.text }]}>Next</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })() : null}
          </View>
        )}

        {section === 'push' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.push }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Push notifications</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>
              Control what the app sends. Users can still turn off categories in Settings → Notification preferences. Test push sends to this device.
            </Text>
            {pushConfigLoading && !pushConfig ? (
              <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
            ) : (
              <>
                <View style={[styles.flagRow, { borderTopColor: colors.border }]}>
                  <View style={styles.flagLabelWrap}>
                    <Text style={[styles.flagLabel, { color: colors.text }]}>Poll push on new poll</Text>
                    <Text style={[styles.flagSub, { color: colors.textSecondary }]}>When a new OrbVote poll is created, send push to users who have polls enabled</Text>
                  </View>
                  <Switch
                    value={pushConfig?.pollPushEnabled !== false}
                    onValueChange={async (v) => {
                      setPushConfigSaving(true);
                      const res = await setPushConfig({ pollPushEnabled: v });
                      setPushConfigSaving(false);
                      if (res.success) setPushConfigState((c) => ({ ...(c ?? { pollPushEnabled: true, deadlineReminderEnabled: true, stampReminderEnabled: true }), pollPushEnabled: v }));
                    }}
                    disabled={pushConfigSaving}
                    trackColor={{ false: colors.border, true: COLORS.success }}
                  />
                </View>
                <View style={[styles.flagRow, { borderTopColor: colors.border }]}>
                  <View style={styles.flagLabelWrap}>
                    <Text style={[styles.flagLabel, { color: colors.text }]}>Deadline reminder</Text>
                    <Text style={[styles.flagSub, { color: colors.textSecondary }]}>Remind users when a poll is about to close (when implemented)</Text>
                  </View>
                  <Switch
                    value={pushConfig?.deadlineReminderEnabled !== false}
                    onValueChange={async (v) => {
                      setPushConfigSaving(true);
                      const res = await setPushConfig({ deadlineReminderEnabled: v });
                      setPushConfigSaving(false);
                      if (res.success) setPushConfigState((c) => ({ ...(c ?? { pollPushEnabled: true, deadlineReminderEnabled: true, stampReminderEnabled: true }), deadlineReminderEnabled: v }));
                    }}
                    disabled={pushConfigSaving}
                    trackColor={{ false: colors.border, true: COLORS.success }}
                  />
                </View>
                <View style={[styles.flagRow, { borderTopColor: colors.border }]}>
                  <View style={styles.flagLabelWrap}>
                    <Text style={[styles.flagLabel, { color: colors.text }]}>Stamp card reminders</Text>
                    <Text style={[styles.flagSub, { color: colors.textSecondary }]}>Daily 10:00 UTC: push when reward expiring in 24h (and callable on demand)</Text>
                  </View>
                  <Switch
                    value={pushConfig?.stampReminderEnabled !== false}
                    onValueChange={async (v) => {
                      setPushConfigSaving(true);
                      const res = await setPushConfig({ stampReminderEnabled: v });
                      setPushConfigSaving(false);
                      if (res.success) setPushConfigState((c) => ({ ...(c ?? { pollPushEnabled: true, deadlineReminderEnabled: true, stampReminderEnabled: true }), stampReminderEnabled: v }));
                    }}
                    disabled={pushConfigSaving}
                    trackColor={{ false: colors.border, true: COLORS.success }}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.resetLayoutBtn, { marginTop: 16 }]}
                  onPress={async () => {
                    setPushConfigLoading(true);
                    setPushTestResult(null);
                    const res = await getPushConfig();
                    setPushConfigLoading(false);
                    if (res.success && res.config) setPushConfigState(res.config);
                  }}
                >
                  <Text style={[styles.resetLayoutText, { color: colors.textSecondary }]}>Refresh config</Text>
                </TouchableOpacity>
                <Pressable
                  style={[styles.orbApplyBtn, { backgroundColor: SECTION_COLORS.push, marginTop: 12 }]}
                  disabled={pushTestSending}
                  onPress={async () => {
                    setPushTestSending(true);
                    setPushTestResult(null);
                    const res = await sendTestPush();
                    setPushTestSending(false);
                    setPushTestResult(res.success ? (res.message ?? 'Sent!') : (res.message ?? 'Failed'));
                  }}
                >
                  {pushTestSending ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Send test push to this device</Text>}
                </Pressable>
                {pushTestResult != null && (
                  <Text style={[styles.layoutSectionSubtitle, { color: colors.text, marginTop: 8 }]}>{pushTestResult}</Text>
                )}

                <Text style={[styles.layoutSectionTitle, { color: colors.text, marginTop: 24 }]}>Stamp card reminders</Text>
                <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Send “reward expiring in 24h” push to eligible users now (otherwise sent daily at 10:00 UTC).</Text>
                <Pressable
                  style={[styles.orbApplyBtn, { backgroundColor: SECTION_COLORS.push, marginTop: 8 }]}
                  disabled={stampRemindersRunning || pushConfig?.stampReminderEnabled === false}
                  onPress={async () => {
                    setStampRemindersRunning(true);
                    setStampRemindersResult(null);
                    const res = await runStampCardsReminders();
                    setStampRemindersRunning(false);
                    setStampRemindersResult(res.success ? (res.sent != null ? `Sent to ${res.sent} user(s).` : res.message ?? 'Done') : (res.message ?? 'Failed'));
                  }}
                >
                  {stampRemindersRunning ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Run stamp reminders now</Text>}
                </Pressable>
                {stampRemindersResult != null && (
                  <Text style={[styles.layoutSectionSubtitle, { color: colors.text, marginTop: 8 }]}>{stampRemindersResult}</Text>
                )}

                <Text style={[styles.layoutSectionTitle, { color: colors.text, marginTop: 24 }]}>Send to notification center</Text>
                <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Deliver an in-app notification to specific users (comma-separated UIDs). Optionally send push too.</Text>
                <TextInput
                  style={[styles.searchInput, { marginBottom: 8, paddingVertical: 10, borderColor: colors.border, color: colors.text }]}
                  placeholder="User IDs (comma-separated)"
                  placeholderTextColor={colors.textSecondary}
                  value={notifTargetUserIds}
                  onChangeText={(t) => { setNotifTargetUserIds(t); setNotifResult(null); }}
                />
                <TextInput
                  style={[styles.searchInput, { marginBottom: 8, paddingVertical: 10, borderColor: colors.border, color: colors.text }]}
                  placeholder="Title"
                  placeholderTextColor={colors.textSecondary}
                  value={notifTitle}
                  onChangeText={(t) => { setNotifTitle(t); setNotifResult(null); }}
                />
                <TextInput
                  style={[styles.searchInput, { marginBottom: 12, paddingVertical: 10, minHeight: 60, textAlignVertical: 'top', borderColor: colors.border, color: colors.text }]}
                  placeholder="Body"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={notifBody}
                  onChangeText={(t) => { setNotifBody(t); setNotifResult(null); }}
                />
                <View style={[styles.flagRow, { borderTopColor: colors.border }]}>
                  <View style={styles.flagLabelWrap}>
                    <Text style={[styles.flagLabel, { color: colors.text }]}>Also send push</Text>
                  </View>
                  <Switch
                    value={notifAlsoPush}
                    onValueChange={setNotifAlsoPush}
                    trackColor={{ false: colors.border, true: COLORS.success }}
                  />
                </View>
                <Pressable
                  style={[styles.orbApplyBtn, { marginTop: 12, backgroundColor: SECTION_COLORS.push }, notifSending && { opacity: 0.7 }]}
                  disabled={!notifTitle.trim() || !notifTargetUserIds.trim() || notifSending}
                  onPress={async () => {
                    setNotifSending(true);
                    setNotifResult(null);
                    const uids = notifTargetUserIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
                    const res = await sendNotificationAdmin({
                      targetUserIds: uids,
                      title: notifTitle.trim(),
                      body: notifBody.trim(),
                      alsoPush: notifAlsoPush,
                    });
                    setNotifSending(false);
                    if (res.success) {
                      setNotifResult(`Sent to ${res.count ?? uids.length} user(s).`);
                    } else {
                      setNotifResult(res.message ?? 'Failed');
                    }
                  }}
                >
                  {notifSending ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Send to notification center</Text>}
                </Pressable>
                {notifResult != null && (
                  <Text style={[styles.layoutSectionSubtitle, { color: colors.text, marginTop: 8 }]}>{notifResult}</Text>
                )}
              </>
            )}
          </View>
        )}

        {section === 'system' && (
          <>
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium & Pro pricing</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 12 }]}>Shown on Compare plans & Premium. Free = $0. Adjust Premium (Gold) and Pro (Platinum) monthly/yearly for members and partners.</Text>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>User Premium mo ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumUserMonthly} onChangeText={setPremiumUserMonthly} keyboardType="decimal-pad" />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>User Premium yr ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumUserYearly} onChangeText={setPremiumUserYearly} keyboardType="decimal-pad" />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>User Pro mo ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumUserProMonthly} onChangeText={setPremiumUserProMonthly} keyboardType="decimal-pad" />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>User Pro yr ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumUserProYearly} onChangeText={setPremiumUserProYearly} keyboardType="decimal-pad" />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Partner Premium mo ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumPartnerMonthly} onChangeText={setPremiumPartnerMonthly} keyboardType="decimal-pad" />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Partner Premium yr ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumPartnerYearly} onChangeText={setPremiumPartnerYearly} keyboardType="decimal-pad" />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Partner Pro mo ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumPartnerProMonthly} onChangeText={setPremiumPartnerProMonthly} keyboardType="decimal-pad" />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Partner Pro yr ($)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={premiumPartnerProYearly} onChangeText={setPremiumPartnerProYearly} keyboardType="decimal-pad" />
              </View>
              <Pressable style={[styles.orbApplyBtn, { marginTop: 12 }, premiumPricingSaving && { opacity: 0.7 }]} onPress={async () => { setPremiumPricingSaving(true); await savePremiumPricing({ userMonthlyDollars: parseFloat(premiumUserMonthly) || 0, userYearlyDollars: parseFloat(premiumUserYearly) || 0, userProMonthlyDollars: parseFloat(premiumUserProMonthly) || 0, userProYearlyDollars: parseFloat(premiumUserProYearly) || 0, partnerMonthlyDollars: parseFloat(premiumPartnerMonthly) || 0, partnerYearlyDollars: parseFloat(premiumPartnerYearly) || 0, partnerProMonthlyDollars: parseFloat(premiumPartnerProMonthly) || 0, partnerProYearlyDollars: parseFloat(premiumPartnerProYearly) || 0 }); setPremiumPricingSaving(false); }}>
                {premiumPricingSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Save pricing</Text>}
              </Pressable>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium & Pro benefits</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 12 }]}>Add, edit, or remove benefits for Premium (Gold) and Pro (Platinum). Shown on Premium / Pro and Compare plans. Pro should have more and better benefits than Premium.</Text>
              {(['premiumUser', 'premiumPartner', 'proUser', 'proPartner'] as const).map((key) => {
                const label = key === 'premiumUser' ? 'Premium (user)' : key === 'premiumPartner' ? 'Premium (partner)' : key === 'proUser' ? 'Pro (user)' : 'Pro (partner)';
                const list = tierBenefitsWorking[key];
                const updateList = (next: TierBenefitItem[]) => setTierBenefitsWorking((c) => ({ ...c, [key]: next }));
                return (
                  <View key={key} style={{ marginBottom: 16 }}>
                    <Text style={[styles.orbLabel, { color: colors.text, marginBottom: 6 }]}>{label}</Text>
                    {list.map((b, i) => {
                      const editing = editingBenefit?.key === key && editingBenefit?.index === i;
                      return (
                        <View key={i} style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight, flexDirection: 'column', alignItems: 'stretch', paddingVertical: 8 }]}>
                          {editing ? (
                            <>
                              <TextInput placeholder="Title" placeholderTextColor={colors.textSecondary} style={[styles.orbInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginBottom: 6 }]} value={(() => { const arr = [...tierBenefitsWorking[key]]; return arr[i]?.title ?? ''; })()} onChangeText={(t) => setTierBenefitsWorking((c) => { const arr = [...c[key]]; if (arr[i]) arr[i] = { ...arr[i], title: t }; return { ...c, [key]: arr }; })} />
                              <TextInput placeholder="Sub / description" placeholderTextColor={colors.textSecondary} style={[styles.orbInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginBottom: 8 }]} value={tierBenefitsWorking[key][i]?.sub ?? ''} onChangeText={(s) => setTierBenefitsWorking((c) => { const arr = [...c[key]]; if (arr[i]) arr[i] = { ...arr[i], sub: s }; return { ...c, [key]: arr }; })} />
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Pressable style={[styles.orbApplyBtn, { flex: 1 }]} onPress={() => setEditingBenefit(null)}><Text style={styles.orbApplyText}>Done</Text></Pressable>
                                <Pressable style={[styles.orbApplyBtn, { flex: 1, backgroundColor: '#999' }]} onPress={() => { updateList(list.filter((_, idx) => idx !== i)); setEditingBenefit(null); }}><Text style={styles.orbApplyText}>Remove</Text></Pressable>
                              </View>
                            </>
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{b.title}</Text>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: 12 }]} numberOfLines={2}>{b.sub || '—'}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                                <TouchableOpacity onPress={() => setEditingBenefit({ key, index: i })} style={{ padding: 6 }}><Ionicons name="pencil" size={18} color={colors.textSecondary} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => updateList(list.filter((_, idx) => idx !== i))} style={{ padding: 6 }}><Ionicons name="trash-outline" size={18} color={colors.textSecondary} /></TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                    <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight, flexDirection: 'column', alignItems: 'stretch' }]}>
                      <TextInput placeholder="New benefit title" placeholderTextColor={colors.textSecondary} style={[styles.orbInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} value={newBenefitTitle} onChangeText={setNewBenefitTitle} />
                      <TextInput placeholder="New benefit description" placeholderTextColor={colors.textSecondary} style={[styles.orbInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, marginTop: 4 }]} value={newBenefitSub} onChangeText={setNewBenefitSub} />
                      <Pressable style={[styles.orbApplyBtn, { marginTop: 6, alignSelf: 'flex-start' }]} onPress={() => { const t = newBenefitTitle.trim(); if (t) { updateList([...list, { title: t, sub: newBenefitSub.trim() }]); setNewBenefitTitle(''); setNewBenefitSub(''); } }}>
                        <Text style={styles.orbApplyText}>Add benefit</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <Pressable style={[styles.orbApplyBtn, { flex: 1, backgroundColor: '#666' }, benefitsSaving && { opacity: 0.7 }]} onPress={async () => { setBenefitsSaving(true); await resetTierBenefitsToDefaults(); setTierBenefitsWorking(DEFAULT_TIER_BENEFITS); setBenefitsSaving(false); }}>
                  {benefitsSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.orbApplyText}>Reset to defaults</Text>}
                </Pressable>
                <Pressable style={[styles.orbApplyBtn, { flex: 1 }, benefitsSaving && { opacity: 0.7 }]} onPress={async () => { setBenefitsSaving(true); await saveTierBenefits(tierBenefitsWorking); setBenefitsSaving(false); }}>
                  {benefitsSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.orbApplyText}>Save benefits</Text>}
                </Pressable>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>System Info</Text>
              <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{APP_VERSION}</Text>
              </View>
              <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Expo SDK</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{EXPO_SDK_VERSION}</Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Demo data</Text>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.text, marginLeft: 0 }]}>Show demo data</Text>
                <Switch
                  value={demoDataEnabled}
                  onValueChange={(value) => {
                    setDemoDataEnabled(value);
                    refreshPartners();
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              <Text style={[styles.orbHint, { color: colors.textSecondary, paddingHorizontal: 12, paddingTop: 4 }]}>
                Off = launch mode: only real partners, map pins, and feed posts. On = full demo (mock partners, demo orbs, mock feed).
              </Text>
            </View>

            {(() => {
              const needsReview = menuDocuments.filter((d) => d.status === 'NEEDS_REVIEW');
              const reportCountByMenu = new Map<string, number>();
              const lastReportByMenu = new Map<string, number>();
              menuReports.filter((r) => r.status === 'OPEN').forEach((r) => {
                reportCountByMenu.set(r.menuId, (reportCountByMenu.get(r.menuId) ?? 0) + 1);
                const cur = lastReportByMenu.get(r.menuId);
                if (cur == null || r.createdAt > cur) lastReportByMenu.set(r.menuId, r.createdAt);
              });
              return needsReview.length > 0 ? (
                <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Menus needing review</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Partners with open reports; partner should review and update menu.</Text>
                  {needsReview.map((d) => {
                    const partnerName = getPartner(d.partnerId)?.name ?? d.partnerId;
                    const count = reportCountByMenu.get(d.id) ?? 0;
                    const lastAt = lastReportByMenu.get(d.id);
                    return (
                      <View key={d.id} style={[styles.infoRow, { borderTopColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.infoLabel, { color: colors.text }]}>{partnerName}</Text>
                          <Text style={[styles.infoValue, { color: colors.textSecondary, fontSize: 12 }]}>
                            {count} open report(s){lastAt ? ` · last ${formatAuditTime(lastAt)}` : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null;
            })()}

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Map Provider</Text>
              <View style={styles.pillRow}>
                {MAP_PROVIDER_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pill, { backgroundColor: colors.surfaceHighlight }, flags.mapProvider === p && styles.pillActive, flags.mapProvider === p && { backgroundColor: COLORS.success }]}
                    onPress={() => setFlag('mapProvider', p)}
                  >
                    <Text style={[styles.pillText, { color: colors.textSecondary }, flags.mapProvider === p && styles.pillTextActive, flags.mapProvider === p && { color: '#000' }]}>{p}</Text>
                  </TouchableOpacity>
          ))}
        </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Orbinomics</Text>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Burn rate</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={burnRate}
                  onChangeText={setBurnRate}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Fee rate</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={feeRate}
                  onChangeText={setFeeRate}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Appreciation</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={appreciation}
                  onChangeText={setAppreciation}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Min threshold</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={minThreshold}
                  onChangeText={setMinThreshold}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.orbActions}>
                <TouchableOpacity onPress={applyOrbinomics} style={styles.orbApplyBtn}>
                  <Text style={styles.orbApplyText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResetOrbinomics} style={[styles.orbResetBtn, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbResetText, { color: '#8B5CF6' }]}>Reset Orbinomics</Text>
                </TouchableOpacity>
              </View>
            </View>

            {flags.ritualAdminConfigEnabled && (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Orb Ritual</Text>
                <Text style={[styles.orbHint, { color: colors.textSecondary }]}>Points min/max, buckets, and badge tier probabilities. Save to push config to server; claim uses Firestore config.</Text>
                <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Points min</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={String(ritualConfig.points.min)}
                    onChangeText={(t) => saveRitualConfig({ ...ritualConfig, points: { ...ritualConfig.points, min: Math.max(0, parseInt(t, 10) || 0) } }, 'admin')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Points max</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={String(ritualConfig.points.max)}
                    onChangeText={(t) => saveRitualConfig({ ...ritualConfig, points: { ...ritualConfig.points, max: Math.max(0, parseInt(t, 10) || 0) } }, 'admin')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Daily max from ritual</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={String(ritualConfig.points.dailyMaxPointsFromRitual)}
                    onChangeText={(t) => saveRitualConfig({ ...ritualConfig, points: { ...ritualConfig.points, dailyMaxPointsFromRitual: Math.max(0, parseInt(t, 10) || 0) } }, 'admin')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Badge: common %</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={String(Math.round(ritualConfig.badges.probabilitiesByTier.common * 100))}
                    onChangeText={(t) => saveRitualConfig({ ...ritualConfig, badges: { ...ritualConfig.badges, probabilitiesByTier: { ...ritualConfig.badges.probabilitiesByTier, common: Math.max(0, Math.min(100, parseInt(t, 10) || 0)) / 100 } } }, 'admin')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Badge: rare %</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={String(Math.round(ritualConfig.badges.probabilitiesByTier.rare * 100))}
                    onChangeText={(t) => saveRitualConfig({ ...ritualConfig, badges: { ...ritualConfig.badges, probabilitiesByTier: { ...ritualConfig.badges.probabilitiesByTier, rare: Math.max(0, Math.min(100, parseInt(t, 10) || 0)) / 100 } } }, 'admin')}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Badge: legendary %</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={String(Math.round(ritualConfig.badges.probabilitiesByTier.legendary * 10000) / 100)}
                    onChangeText={(t) => saveRitualConfig({ ...ritualConfig, badges: { ...ritualConfig.badges, probabilitiesByTier: { ...ritualConfig.badges.probabilitiesByTier, legendary: Math.max(0, Math.min(100, parseFloat(t) || 0)) / 100 } } }, 'admin')}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Badge: apex %</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={String(Math.round(ritualConfig.badges.probabilitiesByTier.apex * 10000) / 100)}
                    onChangeText={(t) => saveRitualConfig({ ...ritualConfig, badges: { ...ritualConfig.badges, probabilitiesByTier: { ...ritualConfig.badges.probabilitiesByTier, apex: Math.max(0, Math.min(100, parseFloat(t) || 0)) / 100 } } }, 'admin')}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.orbActions}>
                  <TouchableOpacity onPress={async () => { await saveRitualConfig(ritualConfig, 'admin'); const res = await saveDailyRitualConfigToServer(ritualConfig, 'admin'); if (res.success) alertDialog('Saved', 'Ritual config saved locally and to server.', [{ text: 'OK' }]); else showErrorAlert('Server save didn’t complete', res.message ?? 'Please try again.'); }} style={styles.orbApplyBtn}>
                    <Text style={styles.orbApplyText}>Save ritual config</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { resetRitualConfig(); alertDialog('Reset', 'Daily ritual config reset to defaults.', [{ text: 'OK' }]); }} style={[styles.orbResetBtn, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.orbResetText, { color: '#8B5CF6' }]}>Reset to defaults</Text>
                  </TouchableOpacity>
                </View>
                {ritualConfig.audit.updatedAt > 0 && (
                  <Text style={[styles.orbHint, { color: colors.textSecondary, marginTop: 8 }]}>
                    Last updated: {formatAuditTime(ritualConfig.audit.updatedAt)} by {ritualConfig.audit.updatedBy || '—'}
                  </Text>
                )}
              </View>
            )}

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>OrbVote — Poll quotas</Text>
              <Text style={[styles.orbHint, { color: colors.textSecondary }]}>Business polls per month. Admin can create unlimited.</Text>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Free tier (per business)</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={orbVoteFree}
                  onChangeText={setOrbVoteFree}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Premium tier (per business)</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={orbVotePremium}
                  onChangeText={setOrbVotePremium}
                  keyboardType="number-pad"
                  placeholder="5"
                />
              </View>
              <View style={styles.orbActions}>
                <TouchableOpacity
                  onPress={() => {
                    const free = Math.max(0, Math.min(100, parseInt(orbVoteFree, 10) || 0));
                    const premium = Math.max(0, Math.min(100, parseInt(orbVotePremium, 10) || 0));
                    saveOrbVoteQuotas({
                      ...orbVoteQuotas,
                      businessFreeTierPollsPerMonth: free,
                      businessPremiumTierPollsPerMonth: premium,
                    });
                    setOrbVoteFree(String(free));
                    setOrbVotePremium(String(premium));
                    alertDialog('Saved', 'OrbVote quotas updated.', [{ text: 'OK' }]);
                  }}
                  style={styles.orbApplyBtn}
                >
                  <Text style={styles.orbApplyText}>Apply quotas</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { resetOrbVoteQuotas(); setOrbVoteFree(String(DEFAULT_ORBVOTE_QUOTAS.businessFreeTierPollsPerMonth)); setOrbVotePremium(String(DEFAULT_ORBVOTE_QUOTAS.businessPremiumTierPollsPerMonth)); }} style={[styles.orbResetBtn, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.orbResetText, { color: '#8B5CF6' }]}>Reset to defaults</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>OrbVote — Admin</Text>
              <TouchableOpacity
                style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => router.push('/admin/polls' as any)}
              >
                <Ionicons name="ellipse-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.orbLabel, { color: colors.text, flex: 1, marginLeft: 10 }]}>Create poll (admin)</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight, borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.text, marginLeft: 0 }]}>Show demo polls when no real polls</Text>
                <Switch
                  value={showDemoPolls}
                  onValueChange={setShowDemoPolls}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              <Text style={[styles.orbHint, { color: colors.textSecondary, paddingHorizontal: 12, paddingTop: 4 }]}>
                Turn off after launch to hide demo polls; only real Firestore polls will show.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Missions (God-tier controls)</Text>
              <Text style={[styles.orbHint, { color: colors.textSecondary }]}>Rewards, partners (1–5), deadlines. Anti-cheat: max steps per mission (1 = one check-in each), max missions/day, cooldown. Users complete by scanning at purchase/register.</Text>
              <View style={[styles.orbRow, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>OT Points per mission</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={missionsRewardPoints}
                  onChangeText={setMissionsRewardPoints}
                  keyboardType="number-pad"
                  placeholder="75"
                />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Sphere XP per mission</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={missionsSphereXp}
                  onChangeText={setMissionsSphereXp}
                  keyboardType="number-pad"
                  placeholder="25"
                />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Partner IDs (1–5, comma-separated)</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text, flex: 1, minWidth: 120 }]}
                  value={missionsPartnerIds}
                  onChangeText={setMissionsPartnerIds}
                  placeholder="p1, p2, p3"
                />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.text }]}>Deadline: end of day</Text>
                <Switch
                  value={missionsDeadlineEndOfDay}
                  onValueChange={setMissionsDeadlineEndOfDay}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              {!missionsDeadlineEndOfDay && (
                <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Deadline (hours from start)</Text>
                  <TextInput
                    style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                    value={missionsDeadlineHours}
                    onChangeText={setMissionsDeadlineHours}
                    keyboardType="number-pad"
                    placeholder="24"
                  />
                </View>
              )}
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Daily full completion bonus (OT)</Text>
                <TextInput
                  style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]}
                  value={missionsDailyBonus}
                  onChangeText={setMissionsDailyBonus}
                  keyboardType="number-pad"
                  placeholder="50"
                />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.text }]}>Missions enabled</Text>
                <Switch value={missionsEnabled} onValueChange={setMissionsEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Max steps per mission (1–3). 1 = one check-in each, doable.</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={missionsMaxSteps} onChangeText={setMissionsMaxSteps} keyboardType="number-pad" placeholder="1" />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Max missions per day (1–3). Anti-abuse.</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={missionsMaxPerDay} onChangeText={setMissionsMaxPerDay} keyboardType="number-pad" placeholder="3" />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>Min minutes between same-partner check-in (anti-gaming)</Text>
                <TextInput style={[styles.orbInput, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, color: colors.text }]} value={missionsMinMinutesSamePartner} onChangeText={setMissionsMinMinutesSamePartner} keyboardType="number-pad" placeholder="5" />
              </View>
              <View style={[styles.orbRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.orbLabel, { color: colors.text }]}>Require proof (scan) to complete</Text>
                <Switch value={missionsRequireProof} onValueChange={setMissionsRequireProof} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
              </View>
              <View style={styles.orbActions}>
                <TouchableOpacity
                  onPress={() => {
                    const points = Math.max(0, parseInt(missionsRewardPoints, 10) || 0);
                    const xp = Math.max(0, parseInt(missionsSphereXp, 10) || 0);
                    const ids = missionsPartnerIds.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5);
                    const hours = Math.max(1, Math.min(168, parseInt(missionsDeadlineHours, 10) || 24));
                    const bonus = Math.max(0, parseInt(missionsDailyBonus, 10) || 0);
                    const partnerIds = ids.length >= 1 ? ids : DEFAULT_MISSIONS_CONFIG.missionPartnerIds;
                    const maxSteps = Math.min(3, Math.max(1, parseInt(missionsMaxSteps, 10) || 1));
                    const maxPerDay = Math.min(3, Math.max(1, parseInt(missionsMaxPerDay, 10) || 3));
                    const minMins = Math.max(0, parseInt(missionsMinMinutesSamePartner, 10) || 5);
                    saveMissionsConfig({
                      rewardPointsPerMission: points,
                      rewardSphereXpPerMission: xp,
                      missionPartnerIds: partnerIds,
                      deadlineEndOfDay: missionsDeadlineEndOfDay,
                      deadlineHoursFromNow: hours,
                      dailyFullCompletionBonusPoints: bonus,
                      maxStepsPerMission: maxSteps,
                      maxMissionsPerDay: maxPerDay,
                      missionsEnabled: missionsEnabled,
                      minMinutesBetweenSamePartnerCheckIn: minMins,
                      requireProofToComplete: missionsRequireProof,
                    });
                    setMissionsRewardPoints(String(points));
                    setMissionsSphereXp(String(xp));
                    setMissionsPartnerIds(partnerIds.join(', '));
                    setMissionsDeadlineHours(String(hours));
                    setMissionsDailyBonus(String(bonus));
                    setMissionsMaxSteps(String(maxSteps));
                    setMissionsMaxPerDay(String(maxPerDay));
                    setMissionsMinMinutesSamePartner(String(minMins));
                    alertDialog('Saved', 'Missions config updated.', [{ text: 'OK' }]);
                  }}
                  style={styles.orbApplyBtn}
                >
                  <Text style={styles.orbApplyText}>Save Missions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    saveMissionsConfig(DEFAULT_MISSIONS_CONFIG);
                    setMissionsRewardPoints(String(DEFAULT_MISSIONS_CONFIG.rewardPointsPerMission));
                    setMissionsSphereXp(String(DEFAULT_MISSIONS_CONFIG.rewardSphereXpPerMission));
                    setMissionsPartnerIds(DEFAULT_MISSIONS_CONFIG.missionPartnerIds.join(', '));
                    setMissionsDeadlineEndOfDay(DEFAULT_MISSIONS_CONFIG.deadlineEndOfDay);
                    setMissionsDeadlineHours(String(DEFAULT_MISSIONS_CONFIG.deadlineHoursFromNow));
                    setMissionsDailyBonus(String(DEFAULT_MISSIONS_CONFIG.dailyFullCompletionBonusPoints));
                    setMissionsMaxSteps(String(DEFAULT_MISSIONS_CONFIG.maxStepsPerMission));
                    setMissionsMaxPerDay(String(DEFAULT_MISSIONS_CONFIG.maxMissionsPerDay));
                    setMissionsEnabled(DEFAULT_MISSIONS_CONFIG.missionsEnabled);
                    setMissionsMinMinutesSamePartner(String(DEFAULT_MISSIONS_CONFIG.minMinutesBetweenSamePartnerCheckIn));
                    setMissionsRequireProof(DEFAULT_MISSIONS_CONFIG.requireProofToComplete);
                    alertDialog('Reset', 'Missions config reset to defaults.', [{ text: 'OK' }]);
                  }}
                  style={[styles.orbResetBtn, { backgroundColor: colors.surfaceHighlight }]}
                >
                  <Text style={[styles.orbResetText, { color: '#8B5CF6' }]}>Reset to defaults</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Audit log (last 5)</Text>
              {lastFive.length === 0 ? (
                <Text style={[styles.auditEmpty, { color: colors.textSecondary }]}>No flag changes yet.</Text>
              ) : (
                lastFive.map((entry, i) => (
                  <View key={`${entry.timestamp}-${i}`} style={[styles.auditRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.auditKey, { color: colors.textSecondary }]}>{FLAG_LABELS[entry.key] ?? entry.key}</Text>
                    <Text style={[styles.auditValue, { color: colors.text }]}>{String(entry.value)}</Text>
                    <Text style={[styles.auditTime, { color: colors.textSecondary }]}>{formatAuditTime(entry.timestamp)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Integrity events</Text>
              <TouchableOpacity onPress={refreshIntegrity} style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.refreshBtnText, { color: '#8B5CF6' }]}>Refresh</Text>
              </TouchableOpacity>
              {lastIntegrity.length === 0 ? (
                <Text style={[styles.auditEmpty, { color: colors.textSecondary }]}>None recorded.</Text>
              ) : (
                lastIntegrity.map((ev) => (
                  <View key={ev.id} style={[styles.auditRow, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.auditKey, { color: colors.textSecondary }]}>{ev.type}</Text>
                    <Text style={[styles.auditValue, { color: colors.text }]}>uid: {ev.uid}</Text>
                    <Text style={[styles.auditTime, { color: colors.textSecondary }]}>{formatAuditTime(ev.createdAt)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>OrbOps integrity</Text>
              {orbOpsIntegrity.length === 0 ? (
                <Text style={[styles.auditEmpty, { color: colors.textSecondary }]}>No work order events.</Text>
              ) : (
                orbOpsIntegrity.map((ev) => (
                  <View key={ev.id} style={[styles.auditRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.auditKey, { color: colors.textSecondary }]}>{ev.type}</Text>
                    <Text style={[styles.auditValue, { color: colors.text }]}>{ev.uid}</Text>
                    <Text style={[styles.auditTime, { color: colors.textSecondary }]}>{formatAuditTime(ev.createdAt)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Map — Geocode needs review</Text>
              <TouchableOpacity onPress={() => getNeedsReviewList().then(setGeocodeNeedsReview)} style={[styles.refreshBtn, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.refreshBtnText, { color: '#8B5CF6' }]}>Refresh</Text>
              </TouchableOpacity>
              {geocodeNeedsReview.length === 0 ? (
                <Text style={[styles.auditEmpty, { color: colors.textSecondary }]}>None.</Text>
              ) : (
                geocodeNeedsReview.slice(0, 5).map((e, i) => (
                  <View key={`${e.placeId}-${i}`} style={[styles.auditRow, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.auditKey, { color: colors.textSecondary }]}>{e.placeId}</Text>
                    <Text style={[styles.auditValue, { color: colors.text }]}>{e.queryHint}</Text>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity onPress={resetFlags} style={[styles.resetButton, { backgroundColor: COLORS.danger }]}>
              <Text style={[styles.resetText, { color: '#fff' }]}>Reset all flags to defaults</Text>
        </TouchableOpacity>
          </>
        )}


        {section === 'maintenance' && isSuperAdmin && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.maintenance }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>Maintenance mode</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>When ON, users see a maintenance screen and most actions are blocked. Use for deployments or incidents.</Text>
            <View style={[styles.flagRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.flagLabel, { color: colors.text }]}>Maintenance mode</Text>
              <Switch
                value={Boolean(flags.isMaintenanceModeEnabled)}
                onValueChange={(val) => setFlag('isMaintenanceModeEnabled', val)}
                trackColor={{ false: colors.border, true: COLORS.danger }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        )}

        {section === 'appinfo' && (
          <View style={[styles.layoutSection, { borderLeftWidth: 4, borderLeftColor: SECTION_COLORS.appinfo }]}>
            <Text style={[styles.layoutSectionTitle, { color: colors.text }]}>App info</Text>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary }]}>Version and build details. Use for support and release tracking.</Text>
            <View style={[styles.infoRow, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App version</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{APP_VERSION}</Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Expo SDK</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{EXPO_SDK_VERSION}</Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Platform</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{Constants.platform?.ios ? 'iOS' : Constants.platform?.android ? 'Android' : 'Other'}</Text>
            </View>
            <Text style={[styles.layoutSectionSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>Force-update min version can be added via remote config when needed.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0b' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1e',
  },
  headerElevated: { paddingVertical: 14 },
  backBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: '#6b7280', fontSize: 12, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  versionPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  versionPillText: { fontSize: 11, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1e',
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1a1e',
    alignItems: 'center',
  },
  segmentedBtnActive: { backgroundColor: '#22c55e' },
  segmentedText: { color: '#9ca3af', fontWeight: '600', fontSize: 14 },
  segmentedTextActive: { color: '#000', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACE.base, paddingBottom: 240 },
  hubDirectory: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderBottomWidth: 1 },
  hubDirectoryScroll: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'center', paddingRight: SPACE.xl },
  hubDirGroupTab: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1 },
  hubDirGroupTabText: { fontSize: 13, fontWeight: '600' },
  hubDirPillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs, paddingTop: SPACE.sm, marginTop: SPACE.sm, borderTopWidth: 1 },
  hubDirPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1 },
  hubDirPillActive: { borderWidth: 2 },
  hubDirDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACE.xs },
  hubDirPillText: { fontSize: 13, fontWeight: '600' },
  sectionTitleBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderBottomWidth: 1 },
  sectionTitleAccent: { width: 4, height: 20, borderRadius: 2, marginRight: SPACE.sm },
  sectionTitleText: { fontSize: 16, fontWeight: '700' },
  nameRow: { paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1 },
  nameRowLabel: { fontSize: 12, marginBottom: 6 },
  nameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  flagsMasterStrip: {
    marginBottom: SPACE.base,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  flagsMasterLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACE.sm },
  flagsMasterRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACE.sm },
  flagsCountPill: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, borderRadius: RADIUS.sm },
  flagsCountText: { fontSize: 12, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3e',
  },
  categoryBlock: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111113',
    borderWidth: 1,
    borderColor: '#1a1a1e',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  categoryTitleWrap: { flex: 1 },
  categoryTitle: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  categorySubtitle: { color: '#6b7280', fontSize: 11, marginTop: 2, lineHeight: 16 },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1e',
  },
  flagLabel: { color: '#e5e7eb', fontSize: 14, flex: 1 },
  flagLabelWrap: { flex: 1, marginRight: 12 },
  flagSub: { fontSize: 12, marginTop: 2, opacity: 0.85 },
  tutorialSection: { marginTop: 16, paddingTop: 12 },
  tutorialSectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginLeft: 14 },
  layoutSection: { marginBottom: SPACE.xl, padding: SPACE.base, borderRadius: RADIUS.base, overflow: 'hidden' },
  quickAddWrap: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  layoutSectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, letterSpacing: 0.3 },
  layoutSectionSubtitle: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  layoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#111113',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1e',
    minWidth: 0,
  },
  partnerListRow: { minHeight: 56 },
  partnerListRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  partnerListRowText: { flex: 1, minWidth: 0 },
  partnerListRowActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 10 },
  layoutRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  layoutRowBody: { flex: 1, minWidth: 0 },
  layoutRowLabel: { color: '#e5e7eb', fontSize: 15, fontWeight: '600' },
  layoutRowLabelDim: { color: '#6b7280' },
  hiddenBadge: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  tabIconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  replaceBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1e', marginRight: 0, flexShrink: 0 },
  replaceBtnText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
  layoutRowActions: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  iconBtn: { padding: 8 },
  userCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  userCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  userCardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userCardInfo: { flex: 1, minWidth: 0 },
  userCardName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  userCardEmail: { fontSize: 13 },
  userCardBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  userCardBadgeText: { fontSize: 11, fontWeight: '700' },
  userCardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1 },
  userCardActionBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  userCardActionText: { fontSize: 13, fontWeight: '700' },
  userCardCompact: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  userCardCompactTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  userCardIconCompact: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  userCardInfoCompact: { flex: 1, minWidth: 0 },
  userCardNameCompact: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
  userCardEmailCompact: { fontSize: 12 },
  userCardBadgeCompact: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  userCardBadgeTextCompact: { fontSize: 10, fontWeight: '700' },
  userCardActionsCompact: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 8, borderTopWidth: 1 },
  userCardActionBtnCompact: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  userCardActionTextCompact: { fontSize: 12, fontWeight: '700' },
  iconBtnDisabled: { opacity: 0.5 },
  pickerModal: { marginTop: 16, padding: 16, backgroundColor: '#111113', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1e' },
  pickerTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  pickerScroll: { maxHeight: 280, marginBottom: 12 },
  pickerScrollContent: { paddingBottom: 32 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1e' },
  pickerRowLabel: { color: '#e5e7eb', fontSize: 15 },
  resetLayoutBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#1a1a1e',
  },
  resetLayoutText: { color: '#9ca3af', fontWeight: '600', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionSubtitle: { fontSize: 12, marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#111113',
    borderRadius: 10,
    marginBottom: 6,
  },
  infoLabel: { color: '#9ca3af', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1a1a1e' },
  pillActive: { backgroundColor: '#22c55e' },
  pillText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#000' },
  testAccountSaveBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  testAccountSaveBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  testAccountMessageWrap: { padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  testAccountMessageText: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  testAccountMessageClose: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12 },
  testAccountMessageCloseText: { fontSize: 14, fontWeight: '700' },
  orbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#111113',
    borderRadius: 10,
    marginBottom: 6,
  },
  orbLabel: { color: '#9ca3af', fontSize: 14, flex: 1 },
  orbHint: { fontSize: 12, marginBottom: 10 },
  orbInput: {
    backgroundColor: '#1a1a1e',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    fontSize: 14,
    borderWidth: 1,
  },
  orbActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  orbApplyBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#22c55e', alignItems: 'center' },
  orbApplyText: { color: '#000', fontWeight: '700' },
  broadcastUploadBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, minWidth: 72, alignItems: 'center', justifyContent: 'center' },
  broadcastUploadBtnText: { fontSize: 13, fontWeight: '600' },
  orbResetBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#1a1a1e', alignItems: 'center' },
  orbResetText: { color: '#a78bfa', fontWeight: '600', fontSize: 13 },
  auditEmpty: { color: '#6b7280', fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  auditRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#111113',
    borderRadius: 8,
    marginBottom: 6,
  },
  auditKey: { color: '#9ca3af', fontSize: 12 },
  auditValue: { color: '#fff', fontSize: 12, marginTop: 2 },
  auditTime: { color: '#6b7280', fontSize: 10, marginTop: 2 },
  refreshBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#1a1a1e', borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10 },
  refreshBtnText: { color: '#a78bfa', fontWeight: '600', fontSize: 13 },
  resetButton: {
    backgroundColor: '#7f1d1d',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetText: { color: '#fca5a5', fontWeight: '700', fontSize: 15 },
});
