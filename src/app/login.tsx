import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // เช็คว่ากรอกข้อมูลครบไหมก่อนส่งไปเซิร์ฟเวอร์
    if (!username.trim() || !password.trim()) {
      if (Platform.OS === 'web') window.alert('กรุณากรอก Username และ Password');
      else Alert.alert('Error', 'กรุณากรอก Username และ Password');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // 💡 บันทึกสถานะว่า "ล็อกอินแล้ว" และ "จำชื่อผู้ใช้" ลงในเบราว์เซอร์
        if (Platform.OS === 'web') {
          window.localStorage.setItem('isLoggedIn', 'true');
          window.localStorage.setItem('username', username);
          window.alert('เข้าสู่ระบบสำเร็จ!');
        } else {
          Alert.alert('Success', 'เข้าสู่ระบบสำเร็จ!');
        }
        
        // 💡 ใช้ replace เพื่อไม่ให้กดย้อนกลับ (Back) มาหน้า Login ได้อีก
        router.replace('/'); 
      } else {
        if (Platform.OS === 'web') window.alert(data.error);
        else Alert.alert('Error', data.error);
      }
    } catch (err) {
      if (Platform.OS === 'web') window.alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      else Alert.alert('Error', 'Cannot connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>STEAM</Text>
        <Text style={styles.subtitle}>SIGN IN TO YOUR ACCOUNT</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Name</Text>
          <TextInput 
            style={styles.input} 
            placeholderTextColor="#4c5b6a" 
            onChangeText={setUsername} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholderTextColor="#4c5b6a" 
            secureTextEntry 
            onChangeText={setPassword} 
          />
        </View>
        
        <TouchableOpacity style={styles.mainBtn} onPress={handleLogin}>
          <Text style={styles.mainBtnText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={() => router.push('/forgot')}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={[styles.linkText, styles.linkHighlight]}>Create Free Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0e141b', 
    justifyContent: 'center', 
    padding: 20 
  },
  card: { 
    backgroundColor: '#17202d', 
    padding: 30, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#2a475e', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 15, 
    elevation: 8 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#ffffff', 
    textAlign: 'center', 
    letterSpacing: 2 
  },
  subtitle: { 
    fontSize: 12, 
    color: '#66c0f4', 
    textAlign: 'center', 
    marginBottom: 30, 
    letterSpacing: 1, 
    fontWeight: 'bold' 
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#4c5b6a', 
    marginBottom: 8, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  input: { 
    backgroundColor: '#0f1722', 
    color: '#ffffff', 
    padding: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#1e2d3e', 
    fontSize: 15, 
    outlineStyle: 'none' 
  },
  mainBtn: { 
    backgroundColor: '#66c0f4', 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10, 
    shadowColor: '#66c0f4', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6 
  },
  mainBtnText: { 
    color: '#000000', 
    fontWeight: 'bold', 
    fontSize: 15, 
    letterSpacing: 1 
  },
  linkContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 25 
  },
  linkText: { 
    color: '#c7d5e0', 
    fontSize: 13, 
    fontWeight: '600' 
  },
  linkHighlight: { 
    color: '#a4d007' 
  }
});