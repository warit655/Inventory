import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function ProfileScreen() {
  const [username, setUsername] = useState('AGENT');
  const [role, setRole] = useState('user');
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'avatar' | 'address' | null>(null);
  const [inputValue, setInputValue] = useState('');

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
      if (addressRes.ok) {
        const addressData = await addressRes.json();
        setAddresses(addressData);
      }
    } catch (err) {} finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleSaveModal = async () => {
    if (!inputValue.trim()) { setModalType(null); return; }
    try {
      if (modalType === 'avatar') {
        const res = await fetch(`${API_BASE_URL}/users/${username}/avatar`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: inputValue })
        });
        if (res.ok) setAvatarUrl(inputValue); else alert('UPLOAD FAILED');
      } else if (modalType === 'address' && userId) {
        const res = await fetch(`${API_BASE_URL}/addresses`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, address_text: inputValue, is_default: addresses.length === 0 })
        });
        if (res.ok) fetchData(); else alert('UPLOAD FAILED');
      }
    } catch (err) { alert('NETWORK FAILED'); } finally { setModalType(null); setInputValue(''); }
  };

  const handleLogout = () => { if (Platform.OS === 'web') window.localStorage.clear(); router.replace('/login'); };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#00F0FF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05050A" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>AGENT <Text style={{ color: '#FFFFFF' }}>DOSSIER</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <View style={styles.avatarOverlay} />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.roleLabel}>// CLEARANCE LEVEL:</Text>
            <View style={[styles.roleBadge, { borderColor: role === 'admin' ? '#FF003C' : '#00F0FF', backgroundColor: role === 'admin' ? 'rgba(255,0,60,0.1)' : 'rgba(0,240,255,0.1)' }]}>
              <Text style={[styles.roleText, { color: role === 'admin' ? '#FF003C' : '#00F0FF' }]}>
                {role === 'admin' ? 'COMMANDER (ADMIN)' : 'FIELD OPERATIVE'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileBtn} onPress={() => { setInputValue(avatarUrl); setModalType('avatar'); }}>
            <Text style={styles.editProfileText}>[ UPLOAD ]</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>[ REGISTERED DROP ZONES ]</Text>
            <TouchableOpacity onPress={() => { setInputValue(''); setModalType('address'); }}>
              <Text style={styles.addAddressText}>+ SYNC COORD</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyAddress}>
              <Text style={styles.emptyAddressText}>NO DROP ZONES DETECTED IN SECTOR.</Text>
            </View>
          ) : (
            addresses.map(addr => (
              <View key={addr.id} style={styles.addressCard}>
                <Text style={styles.addressText}>{addr.address_text}</Text>
                {addr.is_default ? (
                  <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>PRIMARY ALIGNMENT</Text></View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>DISCONNECT FROM MAINFRAME</Text>
      </TouchableOpacity>

      {modalType && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === 'avatar' ? 'SECURE AVATAR UPLOAD' : 'TRANSMIT COORDINATES'}
            </Text>

            <TextInput
              style={[styles.modalInput, modalType === 'address' && { height: 100, textAlignVertical: 'top' }]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={modalType === 'avatar' ? 'HTTPS://...' : 'ENTER GRID LOCATION...'}
              placeholderTextColor="#4A4A5A"
              multiline={modalType === 'address'}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setModalType(null); setInputValue(''); }}>
                <Text style={styles.modalCancelText}>ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveModal}>
                <Text style={styles.modalConfirmText}>TRANSMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05050A' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#05050A' },
  header: { padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#0A0A10', borderBottomWidth: 1, borderBottomColor: '#00F0FF', shadowColor: '#00F0FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#00F0FF', fontStyle: 'italic', letterSpacing: 2 },
  profileSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A10', padding: 24, marginTop: 24, marginHorizontal: 20, borderWidth: 1, borderColor: '#1E1E28', borderRadius: 4 },
  avatarWrapper: { borderWidth: 2, borderColor: '#00F0FF', padding: 4, position: 'relative' },
  avatar: { width: 70, height: 70, backgroundColor: '#05050A' },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,240,255,0.05)' },
  userInfo: { flex: 1, marginLeft: 20 },
  username: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 2 },
  roleLabel: { fontSize: 8, color: '#6B6B80', fontWeight: '800', marginBottom: 6, letterSpacing: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderRadius: 2 },
  roleText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  editProfileBtn: { padding: 10, alignSelf: 'flex-start' },
  editProfileText: { fontSize: 10, color: '#8A8A9E', fontWeight: '900', letterSpacing: 1 },
  section: { marginTop: 40, marginHorizontal: 20, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  addAddressText: { color: '#00F0FF', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  emptyAddress: { backgroundColor: '#0A0A10', padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1E1E28', borderStyle: 'dashed' },
  emptyAddressText: { color: '#4A4A5A', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  addressCard: { backgroundColor: '#0A0A10', padding: 20, borderWidth: 1, borderColor: '#1E1E28', marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#00F0FF', borderRadius: 4 },
  addressText: { color: '#FFFFFF', fontSize: 13, lineHeight: 24, marginBottom: 15, fontWeight: '600' },
  defaultBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(0, 240, 255, 0.1)', borderWidth: 1, borderColor: '#00F0FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  defaultBadgeText: { color: '#00F0FF', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  logoutBtn: { backgroundColor: 'transparent', margin: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#FF003C', borderRadius: 4 },
  logoutBtnText: { color: '#FF003C', fontWeight: '900', fontSize: 12, letterSpacing: 3 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,10,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalCard: { backgroundColor: '#0A0A10', width: '85%', maxWidth: 380, padding: 24, borderWidth: 1, borderColor: '#00F0FF', shadowColor: '#00F0FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#00F0FF', marginBottom: 25, letterSpacing: 2, textAlign: 'center' },
  modalInput: { backgroundColor: '#05050A', borderWidth: 1, borderColor: '#2A2A35', padding: 16, fontSize: 13, color: '#FFFFFF', marginBottom: 25, outlineStyle: 'none', fontWeight: '800', borderRadius: 4 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 14, backgroundColor: '#12121A', borderWidth: 1, borderColor: '#2A2A35', alignItems: 'center' },
  modalCancelText: { color: '#8A8A9E', fontWeight: '900', letterSpacing: 2 },
  modalConfirmBtn: { flex: 1, padding: 14, backgroundColor: 'rgba(0,240,255,0.1)', borderWidth: 1, borderColor: '#00F0FF', alignItems: 'center' },
  modalConfirmText: { color: '#00F0FF', fontWeight: '900', letterSpacing: 2 }
});