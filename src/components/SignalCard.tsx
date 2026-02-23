import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Signal, SignalStatus } from '../types';
import { colors } from '../theme/colors';

const statusColors: Record<SignalStatus, string> = {
  NEW: colors.primary,
  ACTIVE: colors.warning,
  EXPIRED: colors.muted,
  HIT_TP: colors.success,
  HIT_SL: colors.danger
};

export const SignalCard = ({ signal }: { signal: Signal }) => {
  const directionColor = signal.direction === 'LONG' ? colors.success : signal.direction === 'SHORT' ? colors.danger : colors.warning;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.pair}>{signal.pair}</Text>
        <View style={styles.rightRow}>
          <View style={[styles.badge, { borderColor: statusColors[signal.status] }]}><Text style={[styles.badgeText, { color: statusColors[signal.status] }]}>{signal.status}</Text></View>
          <Text style={[styles.direction, { color: directionColor }]}>{signal.direction}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{signal.killzone} Killzone • Confidence {signal.confidence}%</Text>
      <Text style={styles.values}>Entry {signal.entry.toFixed(5)} | SL {signal.stopLoss.toFixed(5)} | TP {signal.takeProfit.toFixed(5)} | RR {signal.rr.toFixed(2)}</Text>
      <Text style={styles.reason}>{signal.reasoning}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightRow: { flexDirection: 'row', alignItems: 'center' },
  pair: { color: colors.text, fontWeight: '700', fontSize: 18 },
  direction: { fontWeight: '700', marginLeft: 8 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { color: colors.muted, marginTop: 6 },
  values: { color: colors.text, marginTop: 6 },
  reason: { color: colors.muted, marginTop: 8, fontSize: 12 }
});
