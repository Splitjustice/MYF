import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flex: 1,
    margin: 4
  },
  label: { color: colors.muted, fontSize: 12 },
  value: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 }
});
