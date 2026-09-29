import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function ForgotPasswordScreen() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleReset = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword }),
      });
      const data = await response.json();

      if (response.ok) {
        if (Platform.OS === 'web') window.alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!');
        else Alert.alert('Success', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!');
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
        <Text style={styles.title}>ACCOUNT RECOVERY</Text>
        <Text style={styles.subtitle}>SET YOUR NEW PASSWORD</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Username</Text>
          <TextInput style={styles.input} placeholderTextColor="#4c5b6a" onChangeText={setUsername} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} placeholderTextColor="#4c5b6a" secureTextEntry onChangeText={setNewPassword} />
        </View>
        
        <TouchableOpacity style={styles.mainBtn} onPress={handleReset}>
          <Text style={styles.mainBtnText}>Confirm Change</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/login')}>
          <Text style={styles.backBtnText}>Wait, I remember it! Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e141b', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#17202d', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#2a475e', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  title: { fontSize: 22, fontWeight: '900', color: '#ffffff', textAlign: 'center', letterSpacing: 1 },
  subtitle: { fontSize: 12, color: '#f43f5e', textAlign: 'center', marginBottom: 30, letterSpacing: 1, fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#4c5b6a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#0f1722', color: '#ffffff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1e2d3e', fontSize: 15, outlineStyle: 'none' },
  mainBtn: { backgroundColor: '#f43f5e', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  mainBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  backBtn: { marginTop: 25, alignItems: 'center' },
  backBtnText: { color: '#c7d5e0', fontSize: 13, fontWeight: '600' }
});