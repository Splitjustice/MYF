import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchProfile, getAdminSettings, updateAdminSettings, updateProfile } from '../services/apiService';
import { colors } from '../theme/colors';

export const SettingsScreen = () => {
  const { signOut } = useAuth();
  const [name, setName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [adminVisible, setAdminVisible] = useState(false);
  const [admin, setAdmin] = useState({ adrMin: 80, rrTarget: 2.5, slPipsMax: 30, enabledPairs: ['GBPUSD', 'EURUSD', 'EURGBP'] });

  useEffect(() => {
    fetchProfile().then((u) => { setName(u.name); setNotificationsEnabled(u.notificationsEnabled); });
    getAdminSettings().then((res) => setAdmin(res.settings));
  }, []);

  const save = async () => {
    await updateProfile({ name, notificationsEnabled });
    Alert.alert('Saved', 'Profile updated');
  };

  const saveAdmin = async () => {
    await updateAdminSettings({ settings: admin });
    Alert.alert('Admin settings updated');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <View style={styles.switchRow}><Text style={styles.label}>Notifications</Text><Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} /></View>
      <TouchableOpacity style={styles.button} onPress={save}><Text style={styles.btn}>Save Profile</Text></TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => setAdminVisible((v) => !v)}><Text style={styles.linkText}>Toggle Hidden Admin Panel</Text></TouchableOpacity>
      {adminVisible && (
        <View style={styles.adminPanel}>
          <Text style={styles.label}>ADR Min</Text>
          <TextInput style={styles.input} value={String(admin.adrMin)} onChangeText={(v) => setAdmin({ ...admin, adrMin: Number(v) || 0 })} keyboardType="numeric" />
          <Text style={styles.label}>RR Target</Text>
          <TextInput style={styles.input} value={String(admin.rrTarget)} onChangeText={(v) => setAdmin({ ...admin, rrTarget: Number(v) || 0 })} keyboardType="numeric" />
          <TouchableOpacity style={styles.button} onPress={saveAdmin}><Text style={styles.btn}>Save Admin</Text></TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.danger }]} onPress={signOut}><Text style={styles.btn}>Sign Out</Text></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { color: colors.muted, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 8, color: colors.text, padding: 10, marginBottom: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: 11, marginTop: 8 },
  btn: { textAlign: 'center', fontWeight: '700', color: '#001018' },
  link: { marginTop: 12 },
  linkText: { color: colors.warning },
  adminPanel: { marginTop: 10, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.card, borderRadius: 8, padding: 10 }
});
