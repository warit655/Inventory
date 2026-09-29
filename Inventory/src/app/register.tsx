import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        if (Platform.OS === 'web') window.alert('สมัครสมาชิกสำเร็จ!');
        else Alert.alert('Success', 'สมัครสมาชิกสำเร็จ!');
        router.push('/login');
      } else {
        if (Platform.OS === 'web') window.alert(data.error);
        else Alert.alert('Error', data.error);
      }
    } catch (err) {
      if (Platform.OS === 'web') window.alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      else Alert.alert('Error', 'Cannot connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>JOIN STEAM</Text>
        <Text style={styles.subtitle}>CREATE YOUR ACCOUNT</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Choose a Username</Text>
          <TextInput style={styles.input} placeholderTextColor="#4c5b6a" onChangeText={setUsername} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Choose a Password</Text>
          <TextInput style={styles.input} placeholderTextColor="#4c5b6a" secureTextEntry onChangeText={setPassword} />
        </View>
        
        <TouchableOpacity style={styles.mainBtn} onPress={handleRegister}>
          <Text style={styles.mainBtnText}>Register Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/login')}>
          <Text style={styles.backBtnText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e141b', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#17202d', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#2a475e', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff', textAlign: 'center', letterSpacing: 2 },
  subtitle: { fontSize: 12, color: '#a4d007', textAlign: 'center', marginBottom: 30, letterSpacing: 1, fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#4c5b6a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#0f1722', color: '#ffffff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1e2d3e', fontSize: 15, outlineStyle: 'none' },
  mainBtn: { backgroundColor: '#a4d007', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, shadowColor: '#a4d007', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  mainBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  backBtn: { marginTop: 25, alignItems: 'center' },
  backBtnText: { color: '#c7d5e0', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }
});