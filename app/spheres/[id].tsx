import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../hooks/useSocial';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useSphereChat } from '../../hooks/useSphereChat';
import { OTPointsBadge } from '../../components/OTPointsBadge';
import { SphereXpBar } from '../../components/SphereXpBar';
import * as Haptics from 'expo-haptics';
import type { SpherePost } from '../../hooks/useSocial';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_IMAGE_WIDTH = SCREEN_WIDTH - 40;
const FEED_IMAGE_HEIGHT = Math.min(FEED_IMAGE_WIDTH * 1.1, 360);

const TAB_KEYS = ['feed', 'chat', 'members', 'pool'] as const;
type TabKey = typeof TAB_KEYS[number];

const HOLO_BORDER = 2;
const SHINE_OPACITY = 0.4;

async function shareInvite(code: string, name: string) {
  try {
    await Share.share({
      title: 'Join my Sphere on OrbTap',
      message: `Join my OrbTap Sphere "${name}" — use invite code: ${code}. Pool OT Points, share experiences.`,
      url: undefined,
    });
  } catch {}
}

export default function SphereDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCircle, addPost, togglePostLike, contributeToPool } = useSocial();
  const { points: balance, purchaseUpgrade, blockUser, isBlocked } = useGame();
  const [tab, setTab] = useState<TabKey>('feed');
  const [postText, setPostText] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [splitTarget, setSplitTarget] = useState<'perks' | 'missions' | 'shop' | null>(null);

  const circle = id ? getCircle(typeof id === 'string' ? id : id[0]) : undefined;
  const visibleMembers = circle ? circle.members.filter((m) => !isBlocked(m)) : [];
  const sphereId = circle?.id;
  const inviteCode = circle?.inviteCode ?? '';
  const { user } = useAuth();
  const { messages, loading: chatLoading, sending, error: chatError, sendMessage } = useSphereChat(sphereId, inviteCode);
  const [chatDraft, setChatDraft] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (messages.length > 0) chatScrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const showMemberActions = (memberName: string) => {
    Alert.alert(memberName, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'View profile', onPress: () => {} },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          blockUser(memberName);
          Alert.alert('Blocked', 'You will no longer see this user.');
        },
      },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to share images in your sphere.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPostImageUri(result.assets[0].uri);
      Haptics.selectionAsync();
    }
  };

  const handleAddPost = () => {
    if (!circle || (!postText.trim() && !postImageUri)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addPost(circle.id, 'You', postText.trim() || undefined, postImageUri || undefined);
    setPostText('');
    setPostImageUri(null);
  };

  const handleLikePost = (post: SpherePost) => {
    if (!circle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePostLike(circle.id, post.id, 'You');
  };

  const handleSharePost = (post: SpherePost) => {
    Haptics.selectionAsync();
    const message = post.text
      ? `${post.author}: ${post.text.slice(0, 100)}${post.text.length > 100 ? '…' : ''} — OrbTap Sphere`
      : `${post.author} shared a photo — OrbTap Sphere`;
    Share.share({ message, title: 'OrbTap' }).catch(() => {});
  };

  const handleContribute = () => {
    if (!circle) return;
    const amount = parseInt(contributeAmount, 10);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      Alert.alert('Invalid amount', 'Enter a valid amount within your balance.');
      return;
    }
    const ok = purchaseUpgrade(amount, 0);
    if (!ok) return;
    contributeToPool(circle.id, amount);
    setContributeAmount('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Contributed', `${amount} OT Points added to sphere pool.`);
  };

  const handleSplitIntent = (target: 'perks' | 'missions' | 'shop') => {
    Haptics.selectionAsync();
    setSplitTarget(target);
    Alert.alert(
      'Split pool',
      `Use pool for ${target === 'perks' ? 'perks' : target === 'missions' ? 'missions' : 'OrbTap shop'}? This will be available when we enable pool spending.`,
      [{ text: 'OK', onPress: () => setSplitTarget(null) }]
    );
  };

  if (!circle) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.notFound}>Sphere not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  const accent = circle.type === 'couple' ? '#EC4899' : circle.type === 'fami' ? '#F59E0B' : '#8B5CF6';

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0f0f12', '#1a1a20', '#0a0a0d']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.hero, { borderBottomColor: accent + '30' }]}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareInviteBtn}
              onPress={() => {
                Haptics.selectionAsync();
                shareInvite(circle.inviteCode, circle.name);
              }}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareInviteText}>Invite</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.heroIconWrap, { backgroundColor: accent + '25' }]}>
            <Ionicons
              name={circle.type === 'couple' ? 'heart' : circle.type === 'fami' ? 'home' : 'people'}
              size={44}
              color={accent}
            />
          </View>
          <Text style={styles.heroName}>{circle.name}</Text>
          <View style={styles.heroSphereXp}>
            <SphereXpBar sphereXp={circle.sphereXp ?? 0} showPerk />
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{circle.verifiedVisitsCount ?? 0}</Text>
              <Text style={styles.heroStatLabel}>Verified</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{circle.missionsCompletedCount ?? 0}</Text>
              <Text style={styles.heroStatLabel}>Missions</Text>
            </View>
            <View style={styles.heroStat}>
              <OTPointsBadge amount={circle.totalPoints} size={20} label="pts" compact textColor="#F59E0B" />
              <Text style={styles.heroStatLabel}>Total OT</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{circle.poolBalance}</Text>
              <Text style={styles.heroStatLabel}>Pool</Text>
            </View>
          </View>
          <Text style={styles.inviteCode}>Invite: {circle.inviteCode}</Text>
          <TouchableOpacity style={styles.leaderboardCta} onPress={() => router.push('/leaderboard' as any)} activeOpacity={0.9}>
            <Ionicons name="trophy" size={18} color="#F59E0B" />
            <Text style={styles.leaderboardCtaText}>See sphere leaderboard</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {TAB_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setTab(key); }}
            >
              <Ionicons
                name={
                  key === 'feed' ? 'images' : key === 'chat' ? 'chatbubbles' : key === 'members' ? 'people' : 'wallet'
                }
                size={20}
                color={tab === key ? accent : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabLabel, tab === key && { color: accent }]}>
                {key === 'feed' ? 'Feed' : key === 'chat' ? 'Chat' : key === 'members' ? 'Members' : 'Pool'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'feed' && (
            <>
              <View style={styles.postComposer}>
                <View style={styles.composerRow}>
                  <TextInput
                    style={styles.postInput}
                    value={postText}
                    onChangeText={setPostText}
                    placeholder="Share an experience, a check-in, or a moment..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: accent }]} onPress={pickImage}>
                    <Ionicons name="image" size={24} color={accent} />
                    <Text style={[styles.addPhotoText, { color: accent }]}>Photo</Text>
                  </TouchableOpacity>
                </View>
                {postImageUri ? (
                  <View style={styles.composerPreviewWrap}>
                    <Image source={{ uri: postImageUri }} style={styles.composerPreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.removePreviewBtn} onPress={() => setPostImageUri(null)}>
                      <Ionicons name="close-circle" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.postBtn, (!postText.trim() && !postImageUri) && styles.postBtnDisabled]}
                  onPress={handleAddPost}
                  disabled={!postText.trim() && !postImageUri}
                >
                  <LinearGradient colors={[accent, accent + 'dd']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.postBtnText}>Post</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionLabel}>Recent</Text>
              {(!circle.posts || circle.posts.length === 0) ? (
                <View style={styles.emptyFeed}>
                  <Ionicons name="images-outline" size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyFeedText}>No posts yet. Share a photo or experience — your sphere will see it first.</Text>
                </View>
              ) : (
                circle.posts.map((post) => {
                  const likeCount = post.likeCount ?? (post.likedBy?.length ?? 0);
                  const isLiked = (post.likedBy ?? []).includes('You');
                  return (
                    <View key={post.id} style={styles.feedCard}>
                      <View style={styles.feedCardTop}>
                        <View style={[styles.feedAvatar, { backgroundColor: accent + '40' }]}>
                          <Text style={styles.feedAvatarText}>{post.author[0]}</Text>
                        </View>
                        <View style={styles.feedCardMeta}>
                          <Text style={styles.feedAuthor}>{post.author}</Text>
                          <Text style={styles.feedTime}>
                            {new Date(post.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                      {post.imageUri ? (
                        <Image source={{ uri: post.imageUri }} style={styles.feedImageHero} resizeMode="cover" />
                      ) : null}
                      {post.text ? <Text style={styles.feedText}>{post.text}</Text> : null}
                      <View style={styles.feedActions}>
                        <TouchableOpacity style={styles.feedActionBtn} onPress={() => handleLikePost(post)}>
                          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? '#f43f5e' : 'rgba(255,255,255,0.6)'} />
                          <Text style={styles.feedActionText}>{likeCount > 0 ? likeCount : 'Like'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedActionBtn} onPress={() => handleSharePost(post)}>
                          <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.6)" />
                          <Text style={styles.feedActionText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {tab === 'chat' && (
            <View style={styles.chatWrap}>
              {!user ? (
                <View style={styles.placeholder}>
                  <View style={[styles.placeholderIcon, { backgroundColor: accent + '20' }]}>
                    <Ionicons name="lock-closed" size={48} color={accent} />
                  </View>
                  <Text style={styles.placeholderTitle}>Sign in to chat</Text>
                  <Text style={styles.placeholderSub}>Group chat is encrypted. Sign in to send and read messages.</Text>
                  <TouchableOpacity style={[styles.chatSignInBtn, { backgroundColor: accent }]} onPress={() => router.push('/auth/login' as any)}>
                    <Text style={styles.chatSignInBtnText}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {chatError ? <Text style={styles.chatError}>{chatError}</Text> : null}
                  {chatLoading ? (
                    <View style={styles.chatLoading}>
                      <ActivityIndicator size="small" color={accent} />
                      <Text style={styles.chatLoadingText}>Loading messages…</Text>
                    </View>
                  ) : (
                    <ScrollView
                      ref={chatScrollRef}
                      style={styles.chatScroll}
                      contentContainerStyle={styles.chatScrollContent}
                      onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
                      keyboardShouldPersistTaps="handled"
                    >
                      {messages.length === 0 ? (
                        <Text style={styles.chatEmpty}>No messages yet. Say hi — only sphere members can read (encrypted).</Text>
                      ) : (
                        messages.map((msg) => (
                          <View key={msg.id} style={[styles.chatBubble, msg.isFromMe ? styles.chatBubbleMe : styles.chatBubbleThem, msg.isFromMe && { backgroundColor: accent + '40', alignSelf: 'flex-end' }]}>
                            {!msg.isFromMe && <Text style={styles.chatBubbleSender}>{msg.senderDisplayName}</Text>}
                            <Text style={styles.chatBubbleText}>{msg.plaintext || '(encrypted)'}</Text>
                            <Text style={styles.chatBubbleTime}>{new Date(msg.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  )}
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.chatInputRow}>
                    <TextInput
                      style={styles.chatInput}
                      value={chatDraft}
                      onChangeText={setChatDraft}
                      placeholder="Message (encrypted)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      multiline
                      maxLength={2000}
                      editable={!sending}
                    />
                    <TouchableOpacity
                      style={[styles.chatSendBtn, { backgroundColor: accent }]}
                      onPress={() => {
                        if (!chatDraft.trim() || sending) return;
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        sendMessage(chatDraft.trim());
                        setChatDraft('');
                      }}
                      disabled={sending || !chatDraft.trim()}
                    >
                      {sending ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="send" size={20} color="#000" />}
                    </TouchableOpacity>
                  </KeyboardAvoidingView>
                </>
              )}
            </View>
          )}

          {tab === 'members' && (
            <>
              <Text style={styles.sectionLabel}>{visibleMembers.length} members</Text>
              {visibleMembers.map((m, idx) => (
                <TouchableOpacity
                  key={`${m}-${idx}`}
                  style={styles.memberRow}
                  onPress={() => showMemberActions(m)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: accent + '30' }]}>
                    <Text style={styles.memberAvatarText}>{m[0]}</Text>
                  </View>
                  <Text style={styles.memberName}>{m}</Text>
                  <Text style={styles.memberRank}>#{idx + 1}</Text>
                  <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              ))}
              <View style={styles.inviteRow}>
                <Ionicons name="key" size={20} color={accent} />
                <Text style={styles.inviteLabel}>Invite code</Text>
                <Text style={styles.inviteCodeValue}>{circle.inviteCode}</Text>
                <TouchableOpacity
                  style={styles.copyInviteBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    shareInvite(circle.inviteCode, circle.name);
                  }}
                >
                  <Text style={styles.copyInviteText}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {tab === 'pool' && (
            <>
              <View style={[styles.poolCard, { borderColor: accent + '40' }]}>
                <LinearGradient
                  colors={[accent + '20', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.poolLabel}>Pool balance</Text>
                <OTPointsBadge amount={circle.poolBalance} size={28} label="pts" compact textColor="#F59E0B" />
                <Text style={styles.poolSub}>Use for perks, missions, or future OrbTap shop.</Text>
              </View>
              <Text style={styles.sectionLabel}>Contribute OT Points</Text>
              <View style={styles.contributeRow}>
                <TextInput
                  style={styles.contributeInput}
                  value={contributeAmount}
                  onChangeText={setContributeAmount}
                  placeholder="Amount"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.contributeBtn} onPress={handleContribute} activeOpacity={0.9}>
                  <Text style={styles.contributeBtnText}>Add to pool</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionLabel}>Split pool for</Text>
              <View style={styles.splitRow}>
                <TouchableOpacity
                  style={[styles.splitOption, splitTarget === 'perks' && { borderColor: accent }]}
                  onPress={() => handleSplitIntent('perks')}
                >
                  <Ionicons name="gift" size={24} color={accent} />
                  <Text style={styles.splitOptionText}>Perks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.splitOption, splitTarget === 'missions' && { borderColor: accent }]}
                  onPress={() => handleSplitIntent('missions')}
                >
                  <Ionicons name="flag" size={24} color={accent} />
                  <Text style={styles.splitOptionText}>Missions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.splitOption, splitTarget === 'shop' && { borderColor: accent }]}
                  onPress={() => handleSplitIntent('shop')}
                >
                  <Ionicons name="cart" size={24} color={accent} />
                  <Text style={styles.splitOptionText}>Shop</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.poolDisclaimer}>Pool spending will be enabled for perks, missions, and OrbTap shop in a future update.</Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0d' },
  safe: { flex: 1 },
  backBtn: { padding: 8 },
  notFound: { color: '#fff', fontSize: 16, padding: 20 },
  hero: { paddingBottom: 20, borderBottomWidth: 1 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  headerBack: { padding: 8 },
  shareInviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  shareInviteText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  heroIconWrap: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 8 },
  heroSphereXp: { width: '100%', paddingHorizontal: 20, marginBottom: 16 },
  heroStats: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 12 },
  heroStat: { alignItems: 'center' },
  heroStatVal: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteCode: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 12 },
  leaderboardCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  leaderboardCtaText: { fontSize: 13, fontWeight: '800', color: '#F59E0B' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#8B5CF6' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 12 },
  postComposer: { marginBottom: 20 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 12 },
  postInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, fontSize: 15, color: '#FFF', minHeight: 72, textAlignVertical: 'top' },
  addPhotoBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  addPhotoText: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  composerPreviewWrap: { position: 'relative', marginBottom: 12, borderRadius: 14, overflow: 'hidden' },
  composerPreview: { width: FEED_IMAGE_WIDTH - 20, height: 160, borderRadius: 14 },
  removePreviewBtn: { position: 'absolute', top: 8, right: 8 },
  postBtn: { paddingVertical: 14, borderRadius: 14, overflow: 'hidden', alignItems: 'center' },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  emptyFeed: { alignItems: 'center', paddingVertical: 48 },
  emptyFeedIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyFeedTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptyFeedText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  feedCard: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 0, borderWidth: 1, overflow: 'hidden', borderColor: 'rgba(255,255,255,0.06)' },
  feedCardTop: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 },
  feedAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  feedAvatarText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  feedCardMeta: { flex: 1 },
  feedAuthor: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  feedTime: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  feedImageHero: { width: '100%', height: FEED_IMAGE_HEIGHT, backgroundColor: 'rgba(0,0,0,0.2)' },
  feedText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 24, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  feedActions: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  feedActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedActionText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  placeholder: { alignItems: 'center', paddingVertical: 48 },
  placeholderIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  memberName: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1 },
  memberRank: { fontSize: 14, fontWeight: '700', color: '#8B5CF6', marginRight: 8 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 16, backgroundColor: 'rgba(139,92,246,0.12)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  inviteLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  inviteCodeValue: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 2 },
  copyInviteBtn: { marginLeft: 'auto', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#8B5CF6' },
  copyInviteText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  poolCard: { padding: 24, borderRadius: 18, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  poolLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 8 },
  poolSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 12 },
  contributeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  contributeInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFF' },
  contributeBtn: { paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', backgroundColor: '#8B5CF6' },
  contributeBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  splitRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  splitOption: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 2, borderColor: 'transparent' },
  splitOptionText: { fontSize: 13, fontWeight: '700', color: '#FFF', marginTop: 8 },
  poolDisclaimer: { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },
  chatWrap: { flex: 1, minHeight: 280 },
  chatSignInBtn: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignSelf: 'center' },
  chatSignInBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },
  chatError: { fontSize: 12, color: '#ef4444', paddingHorizontal: 16, marginBottom: 8 },
  chatLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  chatLoadingText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  chatScroll: { flex: 1, maxHeight: 320 },
  chatScrollContent: { paddingVertical: 12, paddingBottom: 24 },
  chatEmpty: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  chatBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginHorizontal: 16, marginBottom: 8 },
  chatBubbleMe: { alignSelf: 'flex-end' },
  chatBubbleThem: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)' },
  chatBubbleSender: { fontSize: 11, fontWeight: '700', color: '#8B5CF6', marginBottom: 4 },
  chatBubbleText: { fontSize: 15, color: '#FFF', lineHeight: 22 },
  chatBubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#FFF', maxHeight: 100 },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
