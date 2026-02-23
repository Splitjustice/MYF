import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export const AuthScreen = () => {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('trader@killzone.app');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Killzone Trader');

  const submit = async () => {
    try {
      if (isRegister) await signUp(email, password, name);
      else await signIn(email, password);
    } catch (error) {
      Alert.alert('Auth failed', 'Please verify credentials and backend status.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Killzone Edge</Text>
      {isRegister && <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.muted} />}
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" placeholderTextColor={colors.muted} />
      <TextInput style={styles.input} value={password} secureTextEntry onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} />
      <TouchableOpacity style={styles.button} onPress={submit}><Text style={styles.buttonText}>{isRegister ? 'Create account' : 'Sign in'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}><Text style={styles.switch}>{isRegister ? 'Already have an account? Sign in' : 'No account? Register'}</Text></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { color: colors.text, fontWeight: '700', fontSize: 28, marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 12, borderRadius: 10, marginBottom: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, marginTop: 8 },
  buttonText: { textAlign: 'center', fontWeight: '700', color: '#001018' },
  switch: { color: colors.muted, textAlign: 'center', marginTop: 14 }
});
