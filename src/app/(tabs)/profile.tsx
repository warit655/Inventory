import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function ProfileScreen() {
  const [username, setUsername] = useState('User');
  const [role, setRole] = useState('user');
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับจัดการ Modal
  const [modalType, setModalType] = useState<'avatar' | 'address' | null>(null);
  const [inputValue, setInputValue] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const savedName = Platform.OS === 'web' ? window.localStorage.getItem('username') : null;
      const savedId = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;
      
      if (!savedName || !savedId) {
        router.replace('/login');
        return;
      }
      
      setUsername(savedName);
      setUserId(savedId);

      const userRes = await fetch(`${API_BASE_URL}/users/${savedName}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setRole(userData.role);
        if (userData.avatar_url) setAvatarUrl(userData.avatar_url);
      }

      const addressRes = await fetch(`${API_BASE_URL}/addresses/${savedId}`);
      if (addressRes.ok) {
        const addressData = await addressRes.json();
        setAddresses(addressData);
      }
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const handleSaveModal = async () => {
    if (!inputValue.trim()) {
      setModalType(null);
      return;
    }

    try {
      if (modalType === 'avatar') {
        const res = await fetch(`${API_BASE_URL}/users/${username}/avatar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: inputValue })
        });
        if (res.ok) {
          setAvatarUrl(inputValue);
        } else {
          const errData = await res.json();
          Platform.OS === 'web' ? window.alert('Error: ' + errData.error) : alert('Error: ' + errData.error);
        }
      } 
      else if (modalType === 'address' && userId) {
        const res = await fetch(`${API_BASE_URL}/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            address_text: inputValue,
            is_default: addresses.length === 0
          })
        });
        if (res.ok) {
          fetchData(); 
        } else {
          const errData = await res.json();
          Platform.OS === 'web' ? window.alert('Error: ' + errData.error) : alert('Error: ' + errData.error);
        }
      }
    } catch (err) {
      Platform.OS === 'web' ? window.alert('Network Error') : alert('Network Error');
    } finally {
      setModalType(null);
      setInputValue('');
    }
  };
  const handleLogout = () => {
    if (Platform.OS === 'web') window.localStorage.clear();
    router.replace('/login');
  };

  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ข้อมูลผู้ใช้ */}
        <View style={styles.profileSection}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: role === 'admin' ? '#FEF2F2' : '#F3F4F6' }]}>
              <Text style={[styles.roleText, { color: role === 'admin' ? '#EF4444' : '#4B5563' }]}>
                {role === 'admin' ? 'Administrator' : 'Customer'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editProfileBtn} 
            onPress={() => { setInputValue(avatarUrl); setModalType('avatar'); }}
          >
            <Text style={styles.editProfileText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* ส่วนจัดการที่อยู่ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Addresses</Text>
            <TouchableOpacity onPress={() => { setInputValue(''); setModalType('address'); }}>
              <Text style={styles.addAddressText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
          
          {addresses.length === 0 ? (
            <View style={styles.emptyAddress}>
              <Text style={styles.emptyAddressText}>ยังไม่มีข้อมูลที่อยู่จัดส่ง</Text>
            </View>
          ) : (
            addresses.map((addr) => (
              <View key={addr.id} style={styles.addressCard}>
                <Text style={styles.addressText}>{addr.address_text}</Text>
                {addr.is_default ? (
                  <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ปุ่ม Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>

      {/* Modal สำหรับกรอกข้อมูล */}
      {modalType && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === 'avatar' ? 'Change Avatar' : 'Add New Address'}
            </Text>
            <TextInput
              style={[styles.modalInput, modalType === 'address' && { height: 80, textAlignVertical: 'top' }]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={modalType === 'avatar' ? "Image URL (https://...)" : "กรอกที่อยู่จัดส่งของคุณ..."}
              placeholderTextColor="#9CA3AF"
              multiline={modalType === 'address'}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setModalType(null); setInputValue(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveModal}>
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F9' },
  header: { padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  
  profileSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, marginTop: 15, marginHorizontal: 15, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#E5E7EB' },
  userInfo: { flex: 1, marginLeft: 15 },
  username: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 5 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  editProfileBtn: { padding: 10, backgroundColor: '#F3F4F6', borderRadius: 12 },
  editProfileText: { fontSize: 16 },

  section: { marginTop: 25, marginHorizontal: 15, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addAddressText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  
  emptyAddress: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  emptyAddressText: { color: '#9CA3AF', fontSize: 14 },

  addressCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  addressText: { color: '#4B5563', fontSize: 14, lineHeight: 22, marginBottom: 10 },
  defaultBadge: { alignSelf: 'flex-start', backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  defaultBadgeText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },

  logoutBtn: { backgroundColor: '#FEF2F2', margin: 20, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalCard: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 350, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 15 },
  modalInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', marginBottom: 20, outlineStyle: 'none' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  modalCancelText: { color: '#4B5563', fontWeight: '700' },
  modalConfirmBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#3B82F6', alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '700' },
});