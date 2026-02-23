import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MetricCard } from '../components/MetricCard';
import { fetchDashboard } from '../services/apiService';
import { DashboardSummary } from '../types';
import { colors } from '../theme/colors';

export const DashboardScreen = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    setSummary(await fetchDashboard());
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  if (!summary) return <View style={styles.container}><Text style={styles.title}>Loading dashboard...</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      <Text style={styles.title}>Session: {summary.currentSession}</Text>
      <View style={styles.row}>
        <MetricCard label="Active Signals" value={`${summary.activeSignals}`} />
        <MetricCard label="ADR Today" value={`${summary.adrToday.toFixed(1)} pips`} />
      </View>
      <View style={styles.row}><MetricCard label="Rolling Win Rate" value={`${summary.rollingWinRate.toFixed(1)}%`} /></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 12 },
  row: { flexDirection: 'row' },
  title: { color: colors.text, fontSize: 20, marginVertical: 8, fontWeight: '700' }
});
