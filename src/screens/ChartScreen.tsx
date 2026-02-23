import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CandleChart } from '../components/CandleChart';
import { fetchSignals } from '../services/apiService';
import { Signal } from '../types';
import { colors } from '../theme/colors';

const mockCandles = Array.from({ length: 30 }).map((_, i) => {
  const base = 1.08 + i * 0.0002;
  const open = base + (Math.random() - 0.5) * 0.0006;
  const close = base + (Math.random() - 0.5) * 0.0006;
  return { open, close, high: Math.max(open, close) + 0.0004, low: Math.min(open, close) - 0.0004 };
});

export const ChartScreen = () => {
  const [signal, setSignal] = useState<Signal | null>(null);
  useEffect(() => { fetchSignals().then((s) => setSignal(s[0] || null)); }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.title}>Chart</Text>
      {signal ? (
        <>
          <Text style={styles.meta}>{signal.pair} • {signal.killzone} • {signal.direction}</Text>
          <CandleChart candles={mockCandles} entry={signal.entry} sl={signal.stopLoss} tp={signal.takeProfit} />
          <View style={styles.legend}><Text style={styles.muted}>Asian Range, FVG and OB overlays are reflected in signal reasoning and backend calculations.</Text></View>
        </>
      ) : <Text style={styles.muted}>No active signal for charting.</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  meta: { color: colors.muted, marginBottom: 12 },
  legend: { marginTop: 8, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 10 },
  muted: { color: colors.muted }
});
