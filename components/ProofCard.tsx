import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TIER_COLORS, Tier } from '../constants/MockData';
import { VerifiedBadge } from './VerifiedBadge';

interface ProofCardProps {
  partnerName: string;
  perkTitle: string;
  tier: Tier;
  date: string;
  amount: number;
}

export const ProofCard = React.forwardRef<View, ProofCardProps>(({ partnerName, perkTitle, tier, date, amount }, ref) => {
  const color = TIER_COLORS[tier];
  
  return (
    <View ref={ref} style={[styles.card, { borderColor: color }]}>
      <View style={[styles.glowBase, { backgroundColor: color }]} />
      
      <View style={styles.header}>
        <Text style={styles.appBrand}>ORBTAP // PROOF</Text>
        <Text style={[styles.tier, { color: color }]}>{tier.toUpperCase()}</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.amount}>+{amount}</Text>
        <Text style={styles.pointsLabel}>OT POINTS</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.partner}>{partnerName}</Text>
        <View style={styles.verifiedRow}>
          <Text style={styles.perk}>{perkTitle}</Text>
          <VerifiedBadge size={14} />
        </View>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.scanLine} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 450,
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  glowBase: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appBrand: {
    color: '#666',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 10,
  },
  tier: {
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  pointsLabel: {
    color: '#888',
    letterSpacing: 4,
    marginTop: 8,
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 16,
  },
  partner: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  perk: {
    color: '#ccc',
    fontSize: 14,
  },
  date: {
    color: '#444',
    fontSize: 10,
  },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  }
});
