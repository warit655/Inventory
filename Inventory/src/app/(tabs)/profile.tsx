import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function ProfileScreen() {
  const [username, setUsername] = useState('User');
  const [role, setRole] = useState('user');
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'avatar' | 'address' | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Custom Popup State
  const [alertInfo, setAlertInfo] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: ''
  });
  const showAlert = (title: string, message: string) => setAlertInfo({ visible: true, title, message });

  const fetchData = async () => {
    try {
      setLoading(true);
      const savedName = Platform.OS === 'web' ? window.localStorage.getItem('username') : null;
      const savedId = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;
      if (!savedName || !savedId) { router.replace('/login'); return; }

      setUsername(savedName); setUserId(savedId);

      const userRes = await fetch(`${API_BASE_URL}/users/${savedName}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setRole(userData.role);
        if (userData.avatar_url) setAvatarUrl(userData.avatar_url);
      }

      const addressRes = await fetch(`${API_BASE_URL}/addresses/${savedId}`);
      if (addressRes.ok) setAddresses(await addressRes.json());
    } catch (err) {} finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleSaveModal = async () => {
    if (!inputValue.trim()) { setModalType(null); return; }
    try {
      if (modalType === 'avatar') {
        const res = await fetch(`${API_BASE_URL}/users/${username}/avatar`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: inputValue }) });
        if (res.ok) { setAvatarUrl(inputValue); showAlert('อัปเดตโปรไฟล์', 'เปลี่ยนรูปโปรไฟล์สำเร็จแล้ว'); }
      } else if (modalType === 'address' && userId) {
        const res = await fetch(`${API_BASE_URL}/addresses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, address_text: inputValue, is_default: addresses.length === 0 }) });
        if (res.ok) { fetchData(); showAlert('เพิ่มที่อยู่สำเร็จ', 'ข้อมูลที่อยู่ของคุณถูกบันทึกแล้ว'); }
      }
    } catch (err) {} finally { setModalType(null); setInputValue(''); }
  };

  const handleLogout = () => { if (Platform.OS === 'web') window.localStorage.clear(); router.replace('/login'); };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ข้อมูลส่วนตัว</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: role === 'admin' ? '#FEF2F2' : '#EFF6FF' }]}>
              <Text style={[styles.roleText, { color: role === 'admin' ? '#EF4444' : '#3B82F6' }]}>{role === 'admin' ? 'ผู้ดูแลระบบ' : 'ลูกค้าสมาชิก'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => { setInputValue(avatarUrl); setModalType('avatar'); }}><Text style={styles.editProfileText}>แก้ไขรูป</Text></TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ที่อยู่จัดส่ง</Text>
            <TouchableOpacity onPress={() => { setInputValue(''); setModalType('address'); }}><Text style={styles.addAddressText}>+ เพิ่มที่อยู่</Text></TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyAddress}><Text style={styles.emptyAddressText}>ยังไม่มีข้อมูลที่อยู่</Text></View>
          ) : (
            addresses.map(addr => (
              <View key={addr.id} style={styles.addressCard}>
                <Text style={styles.addressText}>{addr.address_text}</Text>
                {addr.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>ค่าเริ่มต้น</Text></View>}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutBtnText}>ออกจากระบบ</Text></TouchableOpacity>

      {modalType && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalType === 'avatar' ? 'อัปเดตอวตาร' : 'เพิ่มที่อยู่ใหม่'}</Text>
            <TextInput style={[styles.modalInput, modalType === 'address' && { height: 100, textAlignVertical: 'top' }]} value={inputValue} onChangeText={setInputValue} placeholder={modalType === 'avatar' ? 'วางลิงก์รูปภาพ...' : 'กรอกรายละเอียดที่อยู่...'} placeholderTextColor="#9CA3AF" multiline={modalType === 'address'} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setModalType(null); setInputValue(''); }}><Text style={styles.modalCancelText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveModal}><Text style={styles.modalConfirmText}>บันทึก</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Custom Popup Modal */}
      {alertInfo.visible && (
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalCard}>
            <Text style={styles.customModalTitle}>{alertInfo.title}</Text>
            <Text style={styles.customModalMessage}>{alertInfo.message}</Text>
            <TouchableOpacity style={styles.customModalBtn} onPress={() => setAlertInfo({ ...alertInfo, visible: false })}>
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  profileSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, marginTop: 20, marginHorizontal: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F3F4F6' },
  userInfo: { flex: 1, marginLeft: 20 },
  username: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  roleText: { fontSize: 12, fontWeight: '700' },
  editProfileBtn: { padding: 10 },
  editProfileText: { fontSize: 14, color: '#3B82F6', fontWeight: '700' },
  section: { marginTop: 30, marginHorizontal: 20, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  addAddressText: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
  emptyAddress: { backgroundColor: '#FFFFFF', padding: 24, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  emptyAddressText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  addressCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  addressText: { color: '#4B5563', fontSize: 14, lineHeight: 24, marginBottom: 12 },
  defaultBadge: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  defaultBadgeText: { color: '#3B82F6', fontSize: 12, fontWeight: '700' },
  logoutBtn: { margin: 20, padding: 16, alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12 },
  logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalCard: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 350, padding: 24, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', padding: 16, fontSize: 14, color: '#111827', marginBottom: 20, outlineStyle: 'none', borderRadius: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 14, backgroundColor: '#F3F4F6', borderRadius: 10, alignItems: 'center' },
  modalCancelText: { color: '#4B5563', fontWeight: '700' },
  modalConfirmBtn: { flex: 1, padding: 14, backgroundColor: '#3B82F6', borderRadius: 10, alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '700' },

  // Custom Modal Styles
  customModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  customModalCard: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 320, padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' },
  customModalMessage: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  customModalBtn: { backgroundColor: '#3B82F6', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  customModalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});