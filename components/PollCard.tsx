import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet'; // IMPORT WALLET
import { Poll } from '../constants/Polls';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface PollCardProps {
  poll: Poll;
}

export const PollCard = ({ poll }: PollCardProps) => {
  const { colors } = useTheme();
  const { addTransaction } = useWallet(); // GET ACTION
  const [voted, setVoted] = useState<number | null>(null);

  const handleVote = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVoted(index);
    
    // AWARD POINTS FOR VOTING
    addTransaction({ type: 'earn', amount: 5, reason: `Voted: ${poll.partnerName} Poll` });
  };

  const isSponsored = poll.type === 'sponsored';
  const isFeatured = poll.type === 'featured';

  return (
    <View style={[styles.container, { 
        backgroundColor: colors.surface, 
        borderColor: isSponsored ? COLORS.gold[0] : (isFeatured ? COLORS.neonBlue[0] : colors.border),
        borderWidth: isSponsored || isFeatured ? 2 : 1
    }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
            <View style={styles.row}>
                {isSponsored && <Ionicons name="star" size={12} color={COLORS.gold[0]} />}
                {isFeatured && <Ionicons name="flash" size={12} color={COLORS.neonBlue[0]} />}
                <Text style={[styles.partner, { color: isSponsored ? COLORS.gold[0] : (isFeatured ? COLORS.neonBlue[0] : colors.textSecondary) }]}>
                    {poll.partnerName.toUpperCase()}
                </Text>
            </View>
            <Text style={[styles.question, { color: colors.text }]}>{poll.question}</Text>
        </View>
        <Text style={[styles.timer, { color: colors.textSecondary }]}>{poll.timeLeft}</Text>
      </View>

      {/* OPTIONS */}
      <View style={styles.options}>
        {poll.options.map((opt, i) => {
            const percent = Math.round((opt.votes / poll.totalVotes) * 100);
            const isSelected = voted === i;
            
            return (
                <TouchableOpacity 
                    key={i} 
                    style={[styles.optionBtn, { borderColor: isSelected ? COLORS.neonBlue[0] : colors.border }]}
                    onPress={() => handleVote(i)}
                    disabled={voted !== null}
                >
                    {voted !== null && (
                        <View style={[styles.progress, { width: `${percent}%`, backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : colors.surfaceHighlight }]} />
                    )}
                    
                    <View style={styles.optionContent}>
                        <Text style={[styles.optionText, { color: colors.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>{opt.label}</Text>
                        {voted !== null && <Text style={[styles.percent, { color: colors.textSecondary }]}>{percent}%</Text>}
                    </View>
                </TouchableOpacity>
            );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.votes, { color: colors.textSecondary }]}>{poll.totalVotes.toLocaleString()} votes</Text>
        {voted !== null && <Text style={{ color: COLORS.success, fontSize: 10, fontWeight: 'bold' }}>+5 PTS Awarded</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  partner: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  question: { fontSize: 16, fontWeight: 'bold', lineHeight: 22, marginTop: 4 },
  timer: { fontSize: 10, fontWeight: 'bold' },
  options: { gap: 8 },
  optionBtn: { height: 44, borderRadius: 8, borderWidth: 1, justifyContent: 'center', overflow: 'hidden' },
  progress: { position: 'absolute', top: 0, left: 0, bottom: 0 },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  optionText: { fontSize: 12 },
  percent: { fontSize: 12, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  votes: { fontSize: 10, fontWeight: 'bold' }
});
