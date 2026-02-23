import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { SignalCard } from '../components/SignalCard';
import { sendLocalSignalNotification } from '../hooks/useNotifications';
import { fetchSignals } from '../services/apiService';
import { Signal } from '../types';
import { colors } from '../theme/colors';

export const SignalsScreen = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());

  const load = async () => {
    setRefreshing(true);
    const next = await fetchSignals();
    for (const signal of next) {
      if (signal.status === 'NEW' && !knownIds.current.has(signal.id)) {
        knownIds.current.add(signal.id);
        await sendLocalSignalNotification(`New ${signal.pair} ${signal.direction}`, `${signal.killzone} KZ confidence ${signal.confidence}%`);
      }
    }
    setSignals(next);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      <Text style={styles.title}>Intraday Signals</Text>
      {signals.map((s) => <SignalCard key={s.id} signal={s} />)}
      {!signals.length && <Text style={styles.empty}>No active setups currently.</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 10 },
  empty: { color: colors.muted, marginTop: 20 }
});
