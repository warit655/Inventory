import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function EditScreen() {
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    name: params.name?.toString() || '', brand: params.brand?.toString() || '', vram: params.vram?.toString() || '',
    serial_number: params.serial_number?.toString() || '', cost_price: params.cost_price?.toString() || '',
    selling_price: params.selling_price?.toString() || '', stock: params.stock?.toString() || '', category: params.category?.toString() || '', image: params.image_url?.toString() || ''
  });
  const [loading, setLoading] = useState(false);

  // Custom Popup State
  const [alertInfo, setAlertInfo] = useState<{ visible: boolean; title: string; message: string; onSuccess?: () => void }>({
    visible: false, title: '', message: ''
  });
  const showAlert = (title: string, message: string, onSuccess?: () => void) => setAlertInfo({ visible: true, title, message, onSuccess });

  const handleUpdate = async () => {
    if (!formData.name) { showAlert('แจ้งเตือน', 'กรุณากรอกชื่อสินค้า'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        showAlert('อัปเดตข้อมูลสำเร็จ', `แก้ไขข้อมูลของ ${formData.name} เรียบร้อยแล้ว`, () => router.back());
      } else {
        showAlert('ข้อผิดพลาด', 'อัปเดตไม่สำเร็จ');
      }
    } catch (err) {
      showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backText}>← ย้อนกลับ</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขข้อมูลสินค้า</Text>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.label}>ชื่อสินค้า</Text>
            <TextInput style={styles.input} placeholderTextColor="#9CA3AF" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />

            <View style={styles.row}>
              <View style={styles.half}><Text style={styles.label}>แบรนด์</Text><TextInput style={styles.input} placeholderTextColor="#9CA3AF" value={formData.brand} onChangeText={t => setFormData({...formData, brand: t})} /></View>
              <View style={styles.half}><Text style={styles.label}>หน่วยความจำ (VRAM)</Text><TextInput style={styles.input} placeholderTextColor="#9CA3AF" value={formData.vram} onChangeText={t => setFormData({...formData, vram: t})} /></View>
            </View>

            <Text style={styles.label}>ซีเรียลนัมเบอร์ (S/N)</Text>
            <TextInput style={styles.input} placeholderTextColor="#9CA3AF" value={formData.serial_number} onChangeText={t => setFormData({...formData, serial_number: t})} />

            <View style={styles.row}>
              <View style={styles.half}><Text style={styles.label}>ราคาต้นทุน</Text><TextInput style={styles.input} placeholderTextColor="#9CA3AF" keyboardType="numeric" value={formData.cost_price} onChangeText={t => setFormData({...formData, cost_price: t})} /></View>
              <View style={styles.half}><Text style={styles.label}>ราคาขาย</Text><TextInput style={styles.input} placeholderTextColor="#9CA3AF" keyboardType="numeric" value={formData.selling_price} onChangeText={t => setFormData({...formData, selling_price: t})} /></View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}><Text style={styles.label}>จำนวน (สต็อก)</Text><TextInput style={styles.input} placeholderTextColor="#9CA3AF" keyboardType="numeric" value={formData.stock} onChangeText={t => setFormData({...formData, stock: t})} /></View>
              <View style={styles.half}><Text style={styles.label}>หมวดหมู่</Text><TextInput style={styles.input} placeholderTextColor="#9CA3AF" value={formData.category} onChangeText={t => setFormData({...formData, category: t})} /></View>
            </View>

            <Text style={styles.label}>ลิงก์รูปภาพ (URL)</Text>
            <TextInput style={styles.input} placeholderTextColor="#9CA3AF" value={formData.image} onChangeText={t => setFormData({...formData, image: t})} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Popup Modal */}
      {alertInfo.visible && (
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalCard}>
            <Text style={styles.customModalTitle}>{alertInfo.title}</Text>
            <Text style={styles.customModalMessage}>{alertInfo.message}</Text>
            <TouchableOpacity 
              style={styles.customModalBtn} 
              onPress={() => {
                const cb = alertInfo.onSuccess;
                setAlertInfo({ ...alertInfo, visible: false });
                if (cb) cb();
              }}
            >
              <Text style={styles.customModalBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { paddingVertical: 8, paddingRight: 15 },
  backText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  label: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', padding: 14, fontSize: 15, color: '#111827', outlineStyle: 'none', borderRadius: 10 },
  row: { flexDirection: 'row', gap: 16 },
  half: { flex: 1 },
  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saveBtn: { backgroundColor: '#3B82F6', padding: 16, alignItems: 'center', borderRadius: 12, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Custom Modal Styles
  customModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  customModalCard: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 320, padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' },
  customModalMessage: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  customModalBtn: { backgroundColor: '#3B82F6', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  customModalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});