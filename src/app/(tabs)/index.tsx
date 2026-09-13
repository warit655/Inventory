import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

interface Product {
  id: string | number;
  name: string;
  stock: number;
  category: string;
  image_url: string;
  brand: string;
  vram: string;
  serial_number: string;
  cost_price: number;
  selling_price: number;
}

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function HomeScreen() {
  const [userRole, setUserRole] = useState<string>('user');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>('Staff');
  // 💡 เพิ่ม State เก็บรูปโปรไฟล์
  const [avatarUrl, setAvatarUrl] = useState<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '', message: '', type: 'info', onConfirm: () => {},
  });

  const showModal = (title: string, message: string, type: string = 'info', onConfirm: any = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      showModal('CONNECTION ERROR', (err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'web') {
      const loggedIn = window.localStorage.getItem('isLoggedIn');
      if (!loggedIn) {
        router.replace('/login');
        return;
      }
      const savedName = window.localStorage.getItem('username');
      if (savedName) {
        setCurrentUsername(savedName);
        // 💡 ดึงรูปโปรไฟล์จาก API ทันทีที่โหลดหน้าแรก
        fetch(`${API_BASE_URL}/users/${savedName}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data && data.avatar_url) setAvatarUrl(data.avatar_url); })
          .catch(console.error);
      }
      
      const savedRole = window.localStorage.getItem('role');
      if (savedRole) setUserRole(savedRole);
    }
    fetchProducts();
  }, []));

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem('isLoggedIn');
      window.localStorage.removeItem('username');
      window.localStorage.removeItem('role');
      window.localStorage.removeItem('userId');
    }
    setShowProfileMenu(false);
    router.replace('/login');
  };

  const handleDeleteProduct = (product: Product) => {
    showModal(
      'Delete Item',
      `Are you sure you want to remove "${product.name}"?`,
      'confirm',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/products/${product.id}`, { method: 'DELETE' });
          if (response.ok) {
            fetchProducts(); 
            showModal('Success', 'Item removed successfully.', 'success');
          } else {
            showModal('Error', 'Failed to delete product.', 'error');
          }
        } catch (err) {
          showModal('Error', 'Cannot connect to server.', 'error');
        }
      }
    );
  };
  
  const handleAddToCart = async (product: Product) => {
    try {
      const userId = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;

      if (!userId) {
        showModal('Error', 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า', 'error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          product_id: product.id,
          quantity: 1
        })
      });

      if (response.ok) {
        showModal('Success', `เพิ่ม ${product.name} ลงตะกร้าแล้ว!`, 'success');
      } else {
        const errData = await response.json();
        showModal('Error Backend', errData.error || 'พังแบบไม่มีสาเหตุ', 'error');
      }
    } catch (err) {
      showModal('Network Error', (err as Error).message, 'error');
    }
  };

  const totalItems = products.length;
  const inStockItems = products.filter(p => p.stock > 0).length;
  const outOfStockItems = totalItems - inStockItems;
  
  const displayedProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.serial_number && p.serial_number.toLowerCase().includes(query))
    );
  });

  const renderItem = ({ item }: { item: Product }) => {
    const inStock = item.stock > 0;
    return (
      <View style={styles.productCard}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.image_url || 'https://via.placeholder.com/80' }} style={styles.productImage} resizeMode="cover" />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.detailText}>{item.brand || 'N/A'} • {item.vram || 'N/A'}</Text>
            <Text style={styles.snText}>S/N: {item.serial_number || '-'}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>฿{item.selling_price ? Number(item.selling_price).toLocaleString() : '0'}</Text>
            <View style={[styles.stockBadge, { backgroundColor: inStock ? '#E0F2FE' : '#FEE2E2' }]}>
              <Text style={[styles.stockBadgeText, { color: inStock ? '#0284C7' : '#EF4444' }]}>
                {inStock ? `${item.stock} in stock` : 'Out of Stock'}
              </Text>
            </View>
          </View>
        </View>

        {userRole === 'admin' ? (
          <View style={styles.productActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/edit', params: { ...item } })}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productActions}>
            <TouchableOpacity 
              style={[styles.editBtn, { backgroundColor: inStock ? '#3B82F6' : '#F3F4F6', flex: 1 }]} 
              onPress={() => handleAddToCart(item)}
              disabled={!inStock}
            >
              <Text style={[styles.editBtnText, { color: inStock ? '#FFFFFF' : '#9CA3AF', textAlign: 'center' }]}>
                {inStock ? '🛒 Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => setShowProfileMenu(false)}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F6F9" />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Inventory</Text>
            <Text style={styles.headerSubtitle}>GPU Management</Text>
          </View>
          <View style={{ zIndex: 10 }}>
            {/* 💡 เปลี่ยนปุ่มเป็นรูปภาพ Avatar */}
            <TouchableOpacity style={styles.profileButton} onPress={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}>
              <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
            </TouchableOpacity>
            {showProfileMenu && (
              <View style={styles.profileDropdown}>
                {/* 💡 แสดงรูป Avatar ใน Dropdown ด้วย */}
                <Image source={{ uri: avatarUrl }} style={styles.dropdownAvatar} />
                <Text style={styles.dropdownUser}>{currentUsername}</Text>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, brand, or S/N..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery} 
            />
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.aiBtn} onPress={() => router.push('/ai')}>
            <Text style={styles.aiBtnText}>✨ AI Pricing</Text>
          </TouchableOpacity>
          {userRole === 'admin' && (
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add')}>
              <Text style={styles.addBtnText}>+ Add New</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#059669' }]}>{inStockItems}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{outOfStockItems}</Text>
            <Text style={styles.statLabel}>Empty</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>
          ) : displayedProducts.length === 0 ? (
            <View style={styles.centerContainer}><Text style={styles.emptyText}>No items found.</Text></View>
          ) : (
            <FlatList
              data={displayedProducts}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListPadding}
            />
          )}
        </View>

        {modalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
              <Text style={styles.modalMessage}>{modalConfig.message}</Text>
              <View style={styles.modalActions}>
                {modalConfig.type === 'confirm' ? (
                  <>
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => { setModalVisible(false); modalConfig.onConfirm(); }}>
                      <Text style={styles.modalConfirmText}>Confirm</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.modalOkBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalOkText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 100 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  
  // 💡 อัปเดต Style สำหรับรูป Profile ใหม่
  profileButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5E7EB' },
  profileDropdown: { position: 'absolute', top: 55, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, minWidth: 160, borderWidth: 1, borderColor: '#E5E7EB' },
  dropdownAvatar: { width: 50, height: 50, borderRadius: 25, alignSelf: 'center', marginBottom: 10, backgroundColor: '#E5E7EB' },
  
  dropdownUser: { color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  dropdownDivider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },
  logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  
  searchSection: { padding: 20, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 45 },
  searchIcon: { fontSize: 14, color: '#9CA3AF', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', outlineStyle: 'none' },
  
  actionSection: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, gap: 10, backgroundColor: '#FFFFFF' },
  aiBtn: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 10, height: 45, justifyContent: 'center', alignItems: 'center' },
  aiBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  addBtn: { flex: 1, backgroundColor: '#3B82F6', borderRadius: 10, height: 45, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  
  statsContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 4 },
  
  listContainer: { flex: 1 },
  flatListPadding: { padding: 20, paddingBottom: 40, gap: 15 },
  productCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row' },
  productImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#F3F4F6' },
  productInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  detailText: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  snText: { fontSize: 12, color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  priceContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockBadgeText: { fontSize: 11, fontWeight: '700' },
  
  productActions: { flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 10 },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  editBtnText: { fontSize: 13, color: '#4B5563', fontWeight: '700' },
  deleteBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center' },
  deleteBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '700' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280', fontSize: 15 },
  
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalCard: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 350, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10 },
  modalMessage: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  modalCancelText: { color: '#4B5563', fontWeight: '700' },
  modalConfirmBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '700' },
  modalOkBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#3B82F6', alignItems: 'center' },
  modalOkText: { color: '#FFFFFF', fontWeight: '700' }
});ไ