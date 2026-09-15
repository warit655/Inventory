import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

interface Product { id: string | number; name: string; stock: number; category: string; image_url: string; brand: string; vram: string; serial_number: string; cost_price: number; selling_price: number; ai_tier?: number; }
const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function HomeScreen() {
  const [userRole, setUserRole] = useState<string>('user');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>('Staff');
  const [avatarUrl, setAvatarUrl] = useState<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');

  // 💡 Custom Popup State
  const [alertInfo, setAlertInfo] = useState<{ visible: boolean; title: string; message: string; onSuccess?: () => void }>({ visible: false, title: '', message: '' });
  const [confirmInfo, setConfirmInfo] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, onSuccess?: () => void) => setAlertInfo({ visible: true, title, message, onSuccess });
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setConfirmInfo({ visible: true, title, message, onConfirm });

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') console.log('Notification permissions denied');
      }
    })();
  }, []);

  // 💡 แจ้งเตือน: ถ้ารันบนเว็บให้ใช้ Popup สวยๆ ถ้ารันบนมือถือให้เด้ง Notification ด้านบน
  const triggerNotification = async (title: string, body: string) => {
    if (Platform.OS === 'web') {
      showAlert(title, body);
    } else {
      await Notifications.scheduleNotificationAsync({ content: { title, body, sound: true }, trigger: null });
    }
  };

  const assignAIClusters = (data: Product[]) => {
    if (data.length === 0) return data;
    let min = Math.min(...data.map(d => Number(d.selling_price) || 0));
    let max = Math.max(...data.map(d => Number(d.selling_price) || 0));
    let centroids = [min, min + (max - min) / 2, max];
    let currentClusters: number[] = new Array(data.length).fill(0);
    let iterations = 0; let changed = true;
    while (changed && iterations < 10) {
      changed = false; let clusterSums = [0, 0, 0]; let clusterCounts = [0, 0, 0];
      data.forEach((item, index) => {
        let price = Number(item.selling_price) || 0;
        let minDiff = Infinity; let clusterIndex = 0;
        centroids.forEach((c, i) => { let diff = Math.abs(price - c); if (diff < minDiff) { minDiff = diff; clusterIndex = i; } });
        if (currentClusters[index] !== clusterIndex) { changed = true; currentClusters[index] = clusterIndex; }
        clusterSums[clusterIndex] += price; clusterCounts[clusterIndex]++;
      });
      for (let i = 0; i < 3; i++) { if (clusterCounts[i] > 0) centroids[i] = clusterSums[i] / clusterCounts[i]; }
      iterations++;
    }
    let sortedCentroids = [...centroids].map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    let tierMapping: { [key: number]: number } = {};
    sortedCentroids.forEach((c, newIdx) => { tierMapping[c.idx] = newIdx; });
    return data.map((item, index) => ({ ...item, ai_tier: tierMapping[currentClusters[index]] }));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products`);
      if (response.ok) { const data = await response.json(); setProducts(assignAIClusters(data)); }
    } catch (err) { showAlert('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลสินค้าได้'); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => {
    const loggedIn = Platform.OS === 'web' ? window.localStorage.getItem('isLoggedIn') : null;
    if (Platform.OS === 'web' && !loggedIn) { router.replace('/login'); return; }
    if (Platform.OS === 'web') {
      const savedName = window.localStorage.getItem('username');
      if (savedName) {
        setCurrentUsername(savedName);
        fetch(`${API_BASE_URL}/users/${savedName}`).then(res => res.ok ? res.json() : null).then(data => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); }).catch(console.error);
      }
      const savedRole = window.localStorage.getItem('role');
      if (savedRole) setUserRole(savedRole);
    }
    fetchProducts();
  }, []));

  const handleLogout = () => { if (Platform.OS === 'web') window.localStorage.clear(); setShowProfileMenu(false); router.replace('/login'); };

  // 💡 ลบสินค้าด้วย Confirm Popup
  const handleDeleteProduct = (product: Product) => {
    showConfirm('ยืนยันการลบสินค้า', `คุณแน่ใจหรือไม่ว่าต้องการลบ "${product.name}" ออกจากระบบ?`, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${product.id}`, { method: 'DELETE' });
        if (response.ok) { 
          fetchProducts(); 
          triggerNotification('ลบสินค้าสำเร็จ', `ลบรายการ ${product.name} ออกจากคลังแล้ว`); 
        } else {
          showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถลบสินค้าได้');
        }
      } catch (err) { showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว'); }
    });
  };
  
  // 💡 เพิ่มลงตะกร้าด้วย Popup แจ้งเตือน
  const handleAddToCart = async (product: Product) => {
    try {
      const userId = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;
      if (!userId) { showAlert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนทำรายการ'); return; }
      const response = await fetch(`${API_BASE_URL}/cart`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, product_id: product.id, quantity: 1 }) });
      if (response.ok) { 
        triggerNotification('เพิ่มลงตะกร้า', `นำ ${product.name} ใส่ตะกร้าเรียบร้อยแล้ว 🛒`); 
      } else {
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้');
      }
    } catch (err) { showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว'); }
  };

  const displayedProducts = products.filter(p => { const query = searchQuery.toLowerCase(); return ((p.name && p.name.toLowerCase().includes(query)) || (p.brand && p.brand.toLowerCase().includes(query)) || (p.serial_number && p.serial_number.toLowerCase().includes(query))); });
  
  const getAITag = (tier?: number) => {
    if (tier === 0) return { title: 'Budget', color: '#10B981', bg: '#D1FAE5' };
    if (tier === 1) return { title: 'Mainstream', color: '#cc1313', bg: '#DBEAFE' };
    if (tier === 2) return { title: 'High-End', color: '#8B5CF6', bg: '#EDE9FE' };
    return null;
  };

  const renderItem = ({ item }: { item: Product }) => {
    const inStock = item.stock > 0;
    const aiTag = getAITag(item.ai_tier);
    return (
      <View style={styles.productCard}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.image_url || 'https://placehold.co/150x150/F3F4F6/9CA3AF.png?text=No+Image' }} style={styles.productImage} resizeMode="cover" />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.detailText}>{item.brand || 'N/A'} • VRAM: {item.vram || '-'}</Text>
            <Text style={styles.snText}>S/N: {item.serial_number || '-'}</Text>
            {aiTag && (<View style={[styles.aiBadge, { backgroundColor: aiTag.bg }]}><Text style={[styles.aiBadgeText, { color: aiTag.color }]}>:D AI: {aiTag.title}</Text></View>)}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>฿{item.selling_price ? Number(item.selling_price).toLocaleString() : '0'}</Text>
            <View style={[styles.stockBadge, { backgroundColor: inStock ? '#E0F2FE' : '#FEE2E2' }]}><Text style={[styles.stockBadgeText, { color: inStock ? '#0284C7' : '#EF4444' }]}>{inStock ? `พร้อมส่ง: ${item.stock}` : 'สินค้าหมด'}</Text></View>
          </View>
        </View>
        {userRole === 'admin' ? (
          <View style={styles.productActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/edit', params: { ...item } })}><Text style={styles.editBtnText}>แก้ไขข้อมูล</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item)}><Text style={styles.deleteBtnText}>ลบสินค้า</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productActions}>
            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: inStock ? '#3B82F6' : '#F3F4F6' }]} onPress={() => handleAddToCart(item)} disabled={!inStock}><Text style={[styles.buyBtnText, { color: inStock ? '#FFFFFF' : '#9CA3AF' }]}>{inStock ? 'เพิ่มลงตะกร้า' : 'สินค้าหมดชั่วคราว'}</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => setShowProfileMenu(false)}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Inventory<Text style={{color: '#3B82F6'}}>.app</Text></Text>
            <Text style={styles.headerSubtitle}>ระบบจัดการคลังสินค้า</Text>
          </View>
          <View style={{ zIndex: 10 }}>
            <TouchableOpacity style={styles.profileButton} onPress={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}><Image source={{ uri: avatarUrl }} style={styles.headerAvatar} /></TouchableOpacity>
            {showProfileMenu && (
              <View style={styles.profileDropdown}>
                <Image source={{ uri: avatarUrl }} style={styles.dropdownAvatar} />
                <Text style={styles.dropdownUser}>{currentUsername}</Text>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>ออกจากระบบ</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}><Text style={styles.searchIcon}>🔍</Text><TextInput style={styles.searchInput} placeholder="ค้นหาสินค้า แบรนด์ หรือ S/N..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} /></View>
        </View>
        {userRole === 'admin' && (
          <View style={styles.actionSection}><TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add')}><Text style={styles.addBtnText}>+ เพิ่มสินค้าใหม่</Text></TouchableOpacity></View>
        )}
        <View style={styles.listContainer}>
          {loading ? ( <View style={styles.centerContainer}><ActivityIndicator size="large" color="#3B82F6" /></View> ) : displayedProducts.length === 0 ? ( <View style={styles.centerContainer}><Text style={styles.emptyText}>ไม่พบสินค้าในระบบ</Text></View> ) : ( <FlatList data={displayedProducts} keyExtractor={(item) => String(item.id)} renderItem={renderItem} showsVerticalScrollIndicator={false} contentContainerStyle={styles.flatListPadding} /> )}
        </View>

        {/* 💡 Custom Popup Modal (Alert) */}
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

        {/* 💡 Custom Confirm Modal (Delete) */}
        {confirmInfo.visible && (
          <View style={styles.customModalOverlay}>
            <View style={styles.customModalCard}>
              <Text style={styles.customModalTitle}>{confirmInfo.title}</Text>
              <Text style={styles.customModalMessage}>{confirmInfo.message}</Text>
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity 
                  style={[styles.customModalBtn, { flex: 1, backgroundColor: '#F3F4F6' }]} 
                  onPress={() => setConfirmInfo({ ...confirmInfo, visible: false })}
                >
                  <Text style={[styles.customModalBtnText, { color: '#4B5563' }]}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.customModalBtn, { flex: 1, backgroundColor: '#EF4444' }]} 
                  onPress={() => {
                    const cb = confirmInfo.onConfirm;
                    setConfirmInfo({ ...confirmInfo, visible: false });
                    if (cb) cb();
                  }}
                >
                  <Text style={styles.customModalBtnText}>ลบสินค้า</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  profileDropdown: { position: 'absolute', top: 55, right: 0, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, minWidth: 180, borderWidth: 1, borderColor: '#F3F4F6' },
  dropdownAvatar: { width: 60, height: 60, borderRadius: 30, alignSelf: 'center', marginBottom: 12 },
  dropdownUser: { color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  dropdownDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 15 },
  logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  searchSection: { padding: 20, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 50 },
  searchIcon: { fontSize: 16, marginRight: 10, color: '#9CA3AF' },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', outlineStyle: 'none' },
  actionSection: { paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#FFFFFF' },
  addBtn: { backgroundColor: '#3B82F6', height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  listContainer: { flex: 1 },
  flatListPadding: { padding: 20, paddingBottom: 40, gap: 16 },
  productCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row' },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F9FAFB' },
  productInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  detailText: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  snText: { fontSize: 11, color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  aiBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  aiBadgeText: { fontSize: 11, fontWeight: '700' },
  priceContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockBadgeText: { fontSize: 11, fontWeight: '700' },
  productActions: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 12 },
  editBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#F3F4F6', alignItems: 'center', borderRadius: 10 },
  editBtnText: { fontSize: 13, color: '#4B5563', fontWeight: '700' },
  deleteBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#FEF2F2', alignItems: 'center', borderRadius: 10 },
  deleteBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '700' },
  buyBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 10 },
  buyBtnText: { fontSize: 14, fontWeight: '700' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },

  // Custom Modal Styles
  customModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  customModalCard: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 320, padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' },
  customModalMessage: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  customModalBtn: { backgroundColor: '#3B82F6', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  customModalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});