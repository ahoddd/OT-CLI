import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { usePreferences } from '../hooks/usePreferences';
import { useFlags } from '../components/FlagContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { prefs, togglePref, setShareMessage } = usePreferences();
  const { flags, setMapProvider } = useFlags();
  const [editingMsg, setEditingMsg] = useState(false);
  const [msgText, setMsgText] = useState(prefs.shareMessage);

  const handleNav = (route: string) => {
    Haptics.selectionAsync();
    router.push(route as any);
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Disconnect?", "Return to entry grid?", [
        { text: "Cancel", style: "cancel" },
        { text: "Disconnect", style: "destructive", onPress: async () => { await signOut(auth); router.replace('/auth/login'); } }
    ]);
  };

  const saveMsg = () => {
      setShareMessage(msgText);
      setEditingMsg(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderRow = ({ icon, title, value, isSwitch, switchKey, onPress, isDestructive, isLink }: any) => (
    <TouchableOpacity 
      activeOpacity={isSwitch ? 1 : 0.7}
      onPress={isSwitch ? () => { Haptics.selectionAsync(); togglePref(switchKey); } : onPress}
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
                onValueChange={() => { Haptics.selectionAsync(); togglePref(switchKey); }} 
                trackColor={{ false: '#333', true: COLORS.neonBlue[0] }}
            />
        )}
        {(!isSwitch && !isLink) && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
        {isLink && <Ionicons name="open-outline" size={16} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>SYSTEM CONFIG</Text>
            <View style={{ width: 40 }} /> 
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        
        {/* ADMIN TOOLS (Dev only for now) */}
        <Text style={[styles.sectionTitle, { color: COLORS.gold[0] }]}>ADMIN OVERRIDE (DEV)</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: COLORS.gold[0] }]}>
            <View style={styles.row}>
                <View style={styles.rowContent}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Map Provider</Text>
                    <View style={{flexDirection: 'row', marginTop: 8, gap: 8}}>
                        {['mapbox', 'native', 'none'].map((p) => (
                            <TouchableOpacity 
                                key={p}
                                style={[styles.pill, { backgroundColor: flags.mapProvider === p ? COLORS.neonBlue[0] : colors.surfaceHighlight }]}
                                onPress={() => setMapProvider(p as any)}
                            >
                                <Text style={{fontSize: 10, fontWeight: 'bold', color: flags.mapProvider === p ? '#fff' : colors.text}}>{p.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>

        {/* SHARE CONFIG */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VIRALITY PROTOCOLS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 8}}>
                <Text style={{fontWeight:'bold', color: colors.text}}>Custom Share Message</Text>
                <TouchableOpacity onPress={editingMsg ? saveMsg : () => setEditingMsg(true)}>
                    <Text style={{color: COLORS.neonBlue[0], fontWeight:'bold'}}>{editingMsg ? "SAVE" : "EDIT"}</Text>
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

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>IDENTITY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "person", title: "Public Profile", value: user?.displayName, onPress: () => router.push('/(tabs)/profile') })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INTERFACE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow({ icon: "briefcase", title: "Partner Mode", isSwitch: true, switchKey: 'partnerMode' })}
            {renderRow({ icon: "phone-portrait", title: "Haptic Feedback", isSwitch: true, switchKey: 'haptics' })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT & LEGAL</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
             {renderRow({ icon: "help-buoy", title: "Help Center", isLink: true, onPress: () => handleNav("/legal/help") })}
             {renderRow({ icon: "document-text", title: "Terms of Service", isLink: true, onPress: () => handleNav("/legal/tos") })}
             {renderRow({ icon: "lock-closed", title: "Privacy Policy", isLink: true, onPress: () => handleNav("/legal/privacy") })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 20 }]}>
            {renderRow({ icon: "power", title: "Disconnect", isDestructive: true, onPress: handleLogout })}
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: 'bold' },
  rowSub: { fontSize: 11, marginTop: 2 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }
});
