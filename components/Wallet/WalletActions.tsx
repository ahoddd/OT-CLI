import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { useWallet } from '../../hooks/useWallet';

type ActionType = 'send' | 'receive' | 'swap' | 'redeem' | null;

interface WalletActionsProps {
  action: ActionType;
  onClose: () => void;
  balance: number;
}

export const WalletActions = ({ action, onClose, balance }: WalletActionsProps) => {
  const { isDark, colors } = useTheme();
  const { addTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  // ORBINOMICS: 2% Burn Fee (Min 1, Max 25)
  const transferAmount = parseInt(amount) || 0;
  const burnFee = Math.min(Math.max(Math.round(transferAmount * 0.02), 1), 25);
  const totalCost = transferAmount + burnFee;
  const canAfford = totalCost <= balance && transferAmount > 0;

  const handleSend = async () => {
    if (!canAfford) {
      Alert.alert("Insufficient Funds", `Total required: ${totalCost} PTS (includes ${burnFee} PTS network fee)`);
      return;
    }
    
    Alert.alert(
      "Confirm Transfer",
      `Send: ${transferAmount} PTS\nFee: ${burnFee} PTS\nTo: ${recipient}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            await addTransaction(-totalCost, `Transfer to ${recipient} (Fee: ${burnFee})`);
            onClose();
            Alert.alert("Sent", "Transaction complete.");
          }
        }
      ]
    );
  };

  if (!action) return null;

  return (
    <Modal transparent animationType="fade" visible={!!action}>
      <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: COLORS.gold[0] }]}>{action.toUpperCase()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* RECEIVE UI */}
          {action === 'receive' && (
            <View style={styles.centerContent}>
              <View style={styles.qrContainer}>
                 <Ionicons name="qr-code" size={120} color="#000" />
              </View>
              <Text style={[styles.walletAddress, { color: colors.text }]}>0x71C...9A2F</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Scan to transfer Points instantly.</Text>
            </View>
          )}

          {/* SEND UI (With Burn Logic) */}
          {action === 'send' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>RECIPIENT (USERNAME OR EMAIL)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Explorer name..." 
                placeholderTextColor={colors.textSecondary}
                value={recipient}
                onChangeText={setRecipient}
              />
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>AMOUNT (MAX: {balance})</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="0" 
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              
              <View style={styles.feeRow}>
                 <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Network Fee (2% Burn):</Text>
                 <Text style={[styles.feeValue, { color: COLORS.danger }]}>{burnFee} PTS</Text>
              </View>

              <TouchableOpacity 
                style={[styles.actionBtn, { opacity: canAfford ? 1 : 0.5 }]} 
                onPress={handleSend}
                disabled={!canAfford}
              >
                <Text style={styles.btnText}>CONFIRM TRANSFER</Text>
              </TouchableOpacity>
            </View>
          )}

           {/* SWAP UI */}
           {action === 'swap' && (
            <View style={styles.centerContent}>
              <Ionicons name="construct-outline" size={48} color={COLORS.gold[0]} />
              <Text style={[styles.wipText, { color: colors.text }]}>DEX Integration Coming Soon</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Swap Points for Partner Tokens in V2.</Text>
            </View>
          )}

          {/* REDEEM UI */}
          {action === 'redeem' && (
             <View style={styles.centerContent}>
               <Ionicons name="gift-outline" size={48} color={COLORS.success} />
               <Text style={[styles.wipText, { color: colors.text }]}>Scan at Partner Location</Text>
               <Text style={[styles.hint, { color: colors.textSecondary }]}>Use the Scanner tab to redeem perks.</Text>
             </View>
          )}

        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: '85%', borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  closeBtn: { padding: 4 },
  
  centerContent: { alignItems: 'center', paddingVertical: 20 },
  qrContainer: { padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 16 },
  walletAddress: { fontFamily: 'monospace', fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  hint: { textAlign: 'center', fontSize: 12 },

  form: { gap: 16 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  actionBtn: { backgroundColor: COLORS.neonBlue[0], padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { fontWeight: 'bold', fontSize: 14, color: '#fff' },
  
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  feeLabel: { fontSize: 12 },
  feeValue: { fontSize: 12, fontWeight: 'bold' },

  wipText: { fontWeight: 'bold', marginTop: 16, marginBottom: 4 }
});
