import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchJournal, saveJournalTrade } from '../services/apiService';
import { JournalTrade } from '../types';
import { colors } from '../theme/colors';

export const JournalScreen = () => {
  const [trades, setTrades] = useState<JournalTrade[]>([]);
  const [entry, setEntry] = useState('1.0850');
  const [exit, setExit] = useState('1.0890');

  const load = async () => setTrades(await fetchJournal());
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    if (!trades.length) return { winRate: 0, expectancy: 0 };
    const wins = trades.filter((t) => t.outcome === 'WIN');
    const total = trades.reduce((sum, t) => sum + t.pnl, 0);
    return { winRate: (wins.length / trades.length) * 100, expectancy: total / trades.length };
  }, [trades]);

  const addTrade = async () => {
    const e = Number(entry); const x = Number(exit);
    if (Number.isNaN(e) || Number.isNaN(x)) return Alert.alert('Invalid input');
    await saveJournalTrade({ pair: 'EURUSD', direction: x >= e ? 'LONG' : 'SHORT', entry: e, exit: x, pnl: (x - e) * 10000 });
    await load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal</Text>
      <Text style={styles.sub}>Win rate {stats.winRate.toFixed(1)}% • Expectancy {stats.expectancy.toFixed(1)} pips</Text>
      <View style={styles.formRow}>
        <TextInput style={styles.input} value={entry} onChangeText={setEntry} keyboardType="numeric" placeholder="Entry" placeholderTextColor={colors.muted} />
        <TextInput style={styles.input} value={exit} onChangeText={setExit} keyboardType="numeric" placeholder="Exit" placeholderTextColor={colors.muted} />
        <TouchableOpacity style={styles.button} onPress={addTrade}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
      </View>
      <FlatList data={trades} keyExtractor={(item) => item.id} renderItem={({ item }) => (
        <View style={styles.trade}><Text style={styles.tradeText}>{item.pair} {item.direction} P/L {item.pnl.toFixed(1)} pips</Text></View>
      )} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.muted, marginVertical: 8 },
  formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, color: colors.text, borderRadius: 8, padding: 8, marginRight: 8 },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  btnText: { color: '#001018', fontWeight: '700' },
  trade: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  tradeText: { color: colors.text }
});
