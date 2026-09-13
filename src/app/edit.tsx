import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function EditScreen() {
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    name: params.name?.toString() || '',
    brand: params.brand?.toString() || '',
    vram: params.vram?.toString() || '',
    serial_number: params.serial_number?.toString() || '',
    cost_price: params.cost_price?.toString() || '',
    selling_price: params.selling_price?.toString() || '',
    stock: params.stock?.toString() || '',
    category: params.category?.toString() || '',
    image: params.image_url?.toString() || ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!formData.name) return alert('กรุณากรอกชื่อสินค้า');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) router.back();
      else alert('อัปเดตไม่สำเร็จ');
    } catch (err) {
      alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit GPU</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. RTX 5090 GAMING OC" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Brand</Text>
                <TextInput style={styles.input} placeholder="e.g. GIGABYTE" value={formData.brand} onChangeText={t => setFormData({...formData, brand: t})} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>VRAM</Text>
                <TextInput style={styles.input} placeholder="e.g. 32GB" value={formData.vram} onChangeText={t => setFormData({...formData, vram: t})} />
              </View>
            </View>

            <Text style={styles.label}>Serial Number (S/N)</Text>
            <TextInput style={styles.input} placeholder="Scan or type S/N" value={formData.serial_number} onChangeText={t => setFormData({...formData, serial_number: t})} />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Cost Price</Text>
                <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={formData.cost_price} onChangeText={t => setFormData({...formData, cost_price: t})} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Selling Price</Text>
                <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={formData.selling_price} onChangeText={t => setFormData({...formData, selling_price: t})} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={formData.stock} onChangeText={t => setFormData({...formData, stock: t})} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Category</Text>
                <TextInput style={styles.input} placeholder="e.g. GPU" value={formData.category} onChangeText={t => setFormData({...formData, category: t})} />
              </View>
            </View>

            <Text style={styles.label}>Image URL</Text>
            <TextInput style={styles.input} placeholder="https://..." value={formData.image} onChangeText={t => setFormData({...formData, image: t})} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'Updating...' : 'Update Product'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ใช้ styles ชุดเดียวกันกับหน้า Add ทุกประการ
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { paddingVertical: 8, paddingRight: 15 },
  backText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 15, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827', outlineStyle: 'none' },
  row: { flexDirection: 'row', gap: 15 },
  half: { flex: 1 },
  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saveBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});