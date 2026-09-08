import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function EditScreen() {
  const params = useLocalSearchParams();
  
  const [name, setName] = useState(params.name?.toString() || '');
  const [category, setCategory] = useState(params.category?.toString() || '');
  const [brand, setBrand] = useState(params.brand?.toString() || '');
  const [vram, setVram] = useState(params.vram?.toString() || '');
  const [serialNumber, setSerialNumber] = useState(params.serial_number?.toString() || '');
  const [stock, setStock] = useState(params.stock?.toString() || '0');
  const [costPrice, setCostPrice] = useState(params.cost_price?.toString() || '0');
  const [sellingPrice, setSellingPrice] = useState(params.selling_price?.toString() || '0');
  const [imageUrl, setImageUrl] = useState(params.image_url?.toString() || '');

  const handleUpdate = async () => {
    if (!name.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, category, brand, vram, 
          serial_number: serialNumber, 
          image: imageUrl,
          stock: parseInt(stock) || 0,
          cost_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice) || 0
        }),
      });

      if (response.ok) {
        router.back();
      } else {
        const data = await response.json();
        Platform.OS === 'web' ? window.alert(data.error) : Alert.alert('Error', data.error);
      }
    } catch (err) {
      Platform.OS === 'web' ? window.alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้') : Alert.alert('Error', 'Connection failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>{'< Back'}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT GPU</Text>
      </View>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. RTX 4070 Ti" placeholderTextColor="#4c5b6a" />
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Brand</Text>
            <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="e.g. ASUS" placeholderTextColor="#4c5b6a" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>VRAM</Text>
            <TextInput style={styles.input} value={vram} onChangeText={setVram} placeholder="e.g. 12GB GDDR6X" placeholderTextColor="#4c5b6a" />
          </View>
        </View>

        <Text style={styles.label}>Serial Number (S/N)</Text>
        <TextInput style={styles.input} value={serialNumber} onChangeText={setSerialNumber} placeholder="Scan or type S/N" placeholderTextColor="#4c5b6a" />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Cost Price (Capital)</Text>
            <TextInput style={styles.input} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#4c5b6a" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Selling Price</Text>
            <TextInput style={styles.input} value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#4c5b6a" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" placeholderTextColor="#4c5b6a" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. GPU" placeholderTextColor="#4c5b6a" />
          </View>
        </View>

        <Text style={styles.label}>Image URL</Text>
        <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor="#4c5b6a" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
          <Text style={styles.saveBtnText}>Update Product</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e141b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#0f1722', borderBottomWidth: 1, borderBottomColor: '#1e2d3e' },
  backBtn: { marginRight: 15 },
  backBtnText: { color: '#66c0f4', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  formContainer: { padding: 20 },
  row: { flexDirection: 'row', gap: 15 },
  halfInput: { flex: 1 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#4c5b6a', marginBottom: 8, marginTop: 15, textTransform: 'uppercase' },
  input: { backgroundColor: '#17202d', color: '#ffffff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2a475e', fontSize: 15, outlineStyle: 'none' },
  saveBtn: { backgroundColor: '#66c0f4', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30, shadowColor: '#66c0f4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  saveBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});