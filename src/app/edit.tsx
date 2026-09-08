import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function EditProductScreen() {
  const params = useLocalSearchParams();
  
  const [name, setName] = useState(params.name?.toString() || '');
  const [category, setCategory] = useState(params.category?.toString() || '');
  const [stock, setStock] = useState(params.stock?.toString() || '0');
  const [image, setImage] = useState(params.image_url?.toString() || ''); // 💡 ดึง URL รูปเก่ามาโชว์

  const handleUpdateProduct = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') window.alert('กรุณากรอกชื่อสินค้า');
      else Alert.alert('Error', 'กรุณากรอกชื่อสินค้า');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, stock: parseInt(stock) || 0, image }), // 💡 ส่งค่า image ไปอัปเดตด้วย
      });

      if (response.ok) {
        if (Platform.OS === 'web') window.alert('อัปเดตข้อมูลเรียบร้อย!');
        else Alert.alert('Success', 'อัปเดตข้อมูลเรียบร้อย!');
        router.push('/');
      } else {
        const errorData = await response.json();
        if (Platform.OS === 'web') window.alert(errorData.error);
        else Alert.alert('Error', errorData.error);
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      else Alert.alert('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>❮ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT GAME</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Game Title *</Text>
            <TextInput style={styles.input} value={name} placeholderTextColor="#4c5b6a" onChangeText={setName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={category} placeholderTextColor="#4c5b6a" onChangeText={setCategory} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput style={styles.input} value={stock} placeholderTextColor="#4c5b6a" onChangeText={setStock} keyboardType="numeric" />
          </View>

          {/* 💡 ช่องสำหรับแก้ไข Image URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput style={styles.input} value={image} placeholder="https://..." placeholderTextColor="#4c5b6a" onChangeText={setImage} />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.push('/')}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProduct}>
              <Text style={styles.saveText}>Update Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e141b' },
  header: { padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#0f1722', borderBottomWidth: 1, borderBottomColor: '#1e2d3e', flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  backBtnText: { fontSize: 16, color: '#4c5b6a', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#17202d', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#2a475e' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#66c0f4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#0f1722', borderWidth: 1, borderColor: '#1e2d3e', color: '#ffffff', padding: 14, borderRadius: 10, fontSize: 15, outlineStyle: 'none' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 15 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#4c5b6a', alignItems: 'center' },
  cancelText: { fontWeight: 'bold', color: '#c7d5e0', fontSize: 14 },
  saveBtn: { flex: 1, padding: 15, backgroundColor: '#66c0f4', borderRadius: 10, alignItems: 'center', shadowColor: '#66c0f4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  saveText: { fontWeight: 'bold', color: '#000000', fontSize: 14, letterSpacing: 1 },
});