import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { useWallet } from '../../hooks/useWallet';
import { useSocial } from '../../hooks/useSocial';
import { showErrorAlert } from '../../utils/alert';
import { ReceiptTape, type ReceiptLine } from '../ui/ReceiptTape';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';

type ActionType = 'send' | 'receive' | 'split' | 'redeem' | null;

interface WalletActionsProps {
  action: ActionType;
  onClose: () => void;
  balance: number;
  onRedeemOpenScanner?: () => void;
}

export const WalletActions = ({ action, onClose, balance, onRedeemOpenScanner }: WalletActionsProps) => {
  const { isDark, colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { addTransaction } = useWallet();
  const { circles, contributeToPool } = useSocial();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [splitAmount, setSplitAmount] = useState('');
  const [lastReceipt, setLastReceipt] = useState<ReceiptLine[] | null>(null);
  const [receiptTitle, setReceiptTitle] = useState<string>('');

  const snapPoints = useMemo(() => ['50%', '85%'], []);

  const transferAmount = parseInt(amount) || 0;
  const burnFee = Math.min(Math.max(Math.round(transferAmount * 0.02), 1), 25);
  const totalCost = transferAmount + burnFee;
  const canAfford = totalCost <= balance && transferAmount > 0;

  const handleSend = async () => {
    if (!canAfford) {
      showErrorAlert(
        'Insufficient balance',
        `You need ${totalCost} OT Points for this transfer (${transferAmount} + ${burnFee} network fee).`,
      );
      return;
    }
    await addTransaction({ type: 'spend', amount: totalCost, reason: `Transfer to ${recipient} (Fee: ${burnFee})` });
    setLastReceipt([
      { label: 'Amount', value: `${transferAmount} OT` },
      { label: 'Network fee (2%)', value: `${burnFee} OT` },
      { label: 'Total', value: `${totalCost} OT` },
      { label: 'To', value: recipient || '—' },
      { label: 'Date', value: new Date().toLocaleString() },
    ]);
    setReceiptTitle('Transfer complete');
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAmount('');
    setRecipient('');
  };

  const splitAmountNum = parseInt(splitAmount, 10) || 0;
  const canSplit = selectedCircleId && splitAmountNum > 0 && splitAmountNum <= balance;

  const handleSplit = async () => {
    if (!canSplit || !selectedCircleId) return;
    const circle = circles.find((c) => c.id === selectedCircleId);
    if (!circle) return;
    await addTransaction({
      type: 'spend',
      amount: splitAmountNum,
      reason: `Contribute to Sphere: ${circle.name}`,
    });
    contributeToPool(selectedCircleId, splitAmountNum);
    setLastReceipt([
      { label: 'Amount', value: `${splitAmountNum} OT` },
      { label: 'Sphere', value: circle.name },
      { label: 'Date', value: new Date().toLocaleString() },
    ]);
    setReceiptTitle('Contribution complete');
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedCircleId(null);
    setSplitAmount('');
  };

  const handleRedeemOpenScanner = () => {
    onClose();
    onRedeemOpenScanner?.();
  };

  const handleClose = () => {
    setLastReceipt(null);
    onClose();
  };

  if (!action) return null;

  const showReceipt = lastReceipt != null && lastReceipt.length > 0;

  const dismissKeyboard = () => Keyboard.dismiss();

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheetWrap}>
          <BottomSheet
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={handleClose}
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode={Platform.OS === 'android' ? 'adjustResize' : undefined}
            enableDynamicSizing={false}
            backgroundStyle={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
          >
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeGold }]}>{showReceipt ? receiptTitle : action.toUpperCase()}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={dismissKeyboard} style={styles.keyboardDoneBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.keyboardDoneText, { color: colors.textSecondary }]}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {showReceipt ? (
          <View style={styles.receiptWrap}>
            <ReceiptTape title={receiptTitle} lines={lastReceipt!} expanded />
            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: themeGold }]} onPress={handleClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {action === 'receive' && (
              <View style={styles.centerContent}>
                <View style={[styles.qrContainer, { backgroundColor: '#fff' }]}>
                  <Ionicons name="qr-code" size={120} color="#000" />
                </View>
                <Text style={[styles.walletAddress, { color: colors.text }]}>0x71C...9A2F</Text>
                <Text style={[styles.hint, { color: colors.textSecondary }]}>Scan to transfer Points instantly.</Text>
                <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 8 }]}>Tip: Increase screen brightness if the scanner has trouble.</Text>
              </View>
            )}

            {action === 'send' && (
              <View style={styles.form}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>RECIPIENT (USERNAME OR EMAIL)</Text>
                <BottomSheetTextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter name or email..."
                  placeholderTextColor={colors.textSecondary}
                  value={recipient}
                  onChangeText={setRecipient}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[styles.label, { color: colors.textSecondary }]}>AMOUNT (MAX: {balance})</Text>
                <BottomSheetTextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  value={amount}
                  onChangeText={setAmount}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Network fee (2% burn)</Text>
                  <Text style={[styles.feeValue, { color: COLORS.danger }]}>{burnFee} PTS</Text>
                </View>
                <Text style={[styles.feeHint, { color: colors.textSecondary }]}>Fee supports the network. Min 1, max 25 OT.</Text>
                {canAfford && (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: themeGold }]}
                    onPress={() => { Keyboard.dismiss(); handleSend(); }}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.primaryBtnText}>Send</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {action === 'split' && (
              <View style={styles.form}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>CONTRIBUTE TO SPHERE</Text>
                <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: 8 }]}>
                  Add OT to a Sphere pool for perks and rewards.
                </Text>
                {circles.length === 0 ? (
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>Create or join a Sphere first from the Spheres tab.</Text>
                ) : (
                  <>
                    <ScrollView style={styles.sphereList} nestedScrollEnabled>
                      {circles.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.sphereRow,
                            { backgroundColor: colors.background, borderColor: colors.border },
                            selectedCircleId === c.id && styles.sphereRowSelected,
                            selectedCircleId === c.id && { borderColor: themeGold },
                          ]}
                          onPress={() => setSelectedCircleId(c.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.sphereName, { color: colors.text }]}>{c.name}</Text>
                          <Text style={[styles.spherePool, { color: colors.textSecondary }]}>Pool: {c.poolBalance} PTS</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>AMOUNT (MAX: {balance})</Text>
                    <BottomSheetTextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      value={splitAmount}
                      onChangeText={setSplitAmount}
                      returnKeyType="done"
                      blurOnSubmit={true}
                    />
                    {canSplit && (
                      <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: themeGold }]}
                        onPress={() => { Keyboard.dismiss(); handleSplit(); }}
                        activeOpacity={0.88}
                      >
                        <Text style={styles.primaryBtnText}>Contribute</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            {action === 'redeem' && (
              <View style={styles.centerContent}>
                <Ionicons name="gift-outline" size={48} color={COLORS.success} />
                <Text style={[styles.wipText, { color: colors.text }]}>Redeem at a partner</Text>
                <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: 16 }]}>
                  Scan the partner's QR at their location to spend OT and redeem perks.
                </Text>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: themeGold }]} onPress={handleRedeemOpenScanner} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Open Scanner</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </BottomSheetScrollView>
      </TouchableWithoutFeedback>
          </BottomSheet>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrap: { flex: 1, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyboardDoneBtn: { padding: 8 },
  keyboardDoneText: { fontSize: 15, fontWeight: '600' },
  closeBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48 },
  centerContent: { alignItems: 'center', paddingVertical: 20 },
  qrContainer: { padding: 16, borderRadius: 16, marginBottom: 16 },
  walletAddress: { fontFamily: 'monospace', fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  hint: { textAlign: 'center', fontSize: 12 },
  form: { gap: 16 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, minHeight: 48 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  feeLabel: { fontSize: 12 },
  feeValue: { fontSize: 12, fontWeight: 'bold' },
  feeHint: { fontSize: 11, paddingHorizontal: 4 },
  wipText: { fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  sphereList: { maxHeight: 140, marginBottom: 8 },
  sphereRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  sphereRowSelected: { borderWidth: 2 },
  sphereName: { fontWeight: '600', fontSize: 14 },
  spherePool: { fontSize: 12 },
  receiptWrap: { paddingBottom: 24 },
  doneBtn: { marginTop: 24, padding: 16, borderRadius: 12, alignItems: 'center' },
  doneBtnText: { fontWeight: 'bold', fontSize: 16, color: '#fff' },
  primaryBtn: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnText: { fontWeight: '700', fontSize: 16, color: '#fff' },
});
