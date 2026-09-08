import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

interface Product {
  id: string | number;
  name: string;
  stock: number;
  category: string;
  location_text: string;
  image_url: string;
}

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  
  // 💡 State ควบคุมเมนูและข้อมูลผู้ใช้
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>('Gamer');

  // 💡 Feature 2: State สำหรับตัวกรองหมวดหมู่
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // 💡 Feature 3: State สำหรับ Custom Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info', // 'info' | 'confirm' | 'success' | 'error'
    onConfirm: () => {},
  });

  // ฟังก์ชันเรียก Modal แจ้งเตือนสไตล์ Steam
  const showModal = (title: string, message: string, type: string = 'info', onConfirm: any = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  const fetchProducts = async (query = '') => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products?q=${encodeURIComponent(query)}`);
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
      if (savedName) setCurrentUsername(savedName);
    }
    fetchProducts('');
  }, []));

  const handleSearch = () => fetchProducts(searchQuery);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem('isLoggedIn');
      window.localStorage.removeItem('username');
    }
    setShowProfileMenu(false);
    router.replace('/login');
  };

  const handleDeleteProduct = (product: Product) => {
    // 💡 ใช้ Custom Modal แทน window.confirm
    showModal(
      'DELETE GAME',
      `Are you sure you want to remove "${product.name}" from your library? This cannot be undone.`,
      'confirm',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/products/${product.id}`, { method: 'DELETE' });
          if (response.ok) {
            fetchProducts(searchQuery); 
            showModal('SUCCESS', 'Game removed successfully.', 'success');
          } else {
            showModal('ERROR', 'Failed to delete product.', 'error');
          }
        } catch (err) {
          showModal('ERROR', 'Cannot connect to server.', 'error');
        }
      }
    );
  };

  // 💡 Feature 1 & 2: คำนวณสถิติและดึงหมวดหมู่แบบอัตโนมัติ
  const totalGames = products.length;
  const inStockGames = products.filter(p => p.stock > 0).length;
  const outOfStockGames = totalGames - inStockGames;
  
  const categories = useMemo(() => {
    const cats = products.map(p => p.category || 'Game');
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  const displayedProducts = products.filter(p => {
    if (activeCategory === 'All') return true;
    return (p.category || 'Game') === activeCategory;
  });

  const renderItem = ({ item }: { item: Product }) => {
    const inStock = item.stock > 0;
    return (
      <View style={styles.productCard}>
        <Image source={{ uri: item.image_url || 'https://via.placeholder.com/80' }} style={styles.productImage} resizeMode="cover" />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.locationText}>{item.location_text || 'Unknown Developer'}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category || 'Game'}</Text>
            </View>
            <Text style={[styles.stockText, { color: inStock ? '#a4d007' : '#f43f5e' }]}>
              {inStock ? `In Stock: ${item.stock}` : 'Out of Stock'}
            </Text>
          </View>
          
          <View style={styles.productActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => router.push({ pathname: '/edit', params: { ...item } })}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteProduct(item)}>
              <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => setShowProfileMenu(false)}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1722" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>STEAM<Text style={styles.headerTitleLight}> LIBRARY</Text></Text>
          <View style={{ zIndex: 10 }}>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
            {showProfileMenu && (
              <View style={styles.profileDropdown}>
                <Text style={styles.dropdownUser}>Hello, {currentUsername}</Text>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 💡 Feature 1: Dashboard Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Games</Text>
            <Text style={styles.statValueBlue}>{totalGames}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>In Stock</Text>
            <Text style={styles.statValueGreen}>{inStockGames}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Out of Stock</Text>
            <Text style={styles.statValueRed}>{outOfStockGames}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your library..."
              placeholderTextColor="#4c5b6a"
              value={searchQuery}
              onChangeText={setSearchQuery} 
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add')}>
            <Text style={styles.addBtnText}>+ ADD</Text>
          </TouchableOpacity>
        </View>

        {/* 💡 Feature 2: Category Filter Chips */}
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
            {categories.map((cat, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerContainer}><ActivityIndicator size="large" color="#66c0f4" /></View>
          ) : displayedProducts.length === 0 ? (
            <View style={styles.centerContainer}><Text style={styles.emptyText}>No games found.</Text></View>
          ) : (
            <FlatList
              data={displayedProducts}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListPadding}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            />
          )}
        </View>

        {/* 💡 Feature 3: Custom Premium Modal Overlay */}
        {modalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={[
                styles.modalTitle, 
                modalConfig.type === 'error' ? {color: '#f43f5e'} : 
                modalConfig.type === 'success' ? {color: '#a4d007'} : {color: '#66c0f4'}
              ]}>
                {modalConfig.title}
              </Text>
              <Text style={styles.modalMessage}>{modalConfig.message}</Text>
              
              <View style={styles.modalActions}>
                {modalConfig.type === 'confirm' ? (
                  <>
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => {
                      setModalVisible(false);
                      modalConfig.onConfirm();
                    }}>
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
  container: { flex: 1, backgroundColor: '#0e141b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#0f1722', borderBottomWidth: 1, borderBottomColor: '#1e2d3e', zIndex: 100, elevation: 100 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  headerTitleLight: { fontWeight: '300', color: '#66c0f4' },
  profileButton: { width: 40, height: 40, backgroundColor: '#1e2d3e', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2a475e' },
  profileIcon: { fontSize: 18 },
  profileDropdown: { position: 'absolute', top: 55, right: 0, backgroundColor: '#17202d', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2a475e', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8, minWidth: 160 },
  dropdownUser: { color: '#66c0f4', fontSize: 15, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  dropdownDivider: { height: 1, backgroundColor: '#2a475e', marginBottom: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  logoutText: { color: '#f43f5e', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  // 📊 สไตล์ Dashboard Stats
  statsContainer: { flexDirection: 'row', padding: 20, paddingBottom: 0, gap: 15 },
  statBox: { flex: 1, backgroundColor: '#17202d', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1e2d3e', alignItems: 'center' },
  statLabel: { color: '#4c5b6a', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  statValueBlue: { color: '#66c0f4', fontSize: 22, fontWeight: '900' },
  statValueGreen: { color: '#a4d007', fontSize: 22, fontWeight: '900' },
  statValueRed: { color: '#f43f5e', fontSize: 22, fontWeight: '900' },

  searchSection: { flexDirection: 'row', padding: 20, paddingBottom: 10, gap: 12, alignItems: 'center' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#17202d', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#2a475e' },
  searchIcon: { fontSize: 14, color: '#4c5b6a', marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#ffffff', outlineStyle: 'none' },
  addBtn: { backgroundColor: '#a4d007', borderRadius: 12, paddingHorizontal: 20, height: 45, justifyContent: 'center', alignItems: 'center', shadowColor: '#a4d007', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  addBtnText: { color: '#000000', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  
  // 🏷️ สไตล์ Filter Chips
  filterWrapper: { paddingLeft: 20, paddingBottom: 10 },
  filterContainer: { paddingRight: 20, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#2a475e', backgroundColor: 'transparent' },
  chipActive: { backgroundColor: '#66c0f4', borderColor: '#66c0f4' },
  chipText: { color: '#c7d5e0', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#000000', fontWeight: 'bold' },

  listContainer: { flex: 1, backgroundColor: '#0e141b' },
  flatListPadding: { padding: 20, paddingBottom: 40 },
  productCard: { flexDirection: 'row', backgroundColor: '#17202d', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a475e', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  productImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#0f1722' },
  productInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  locationText: { fontSize: 13, color: '#4c5b6a', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { backgroundColor: 'rgba(102, 192, 244, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: 'rgba(102, 192, 244, 0.3)' },
  categoryText: { fontSize: 11, color: '#66c0f4', fontWeight: 'bold', textTransform: 'uppercase' },
  stockText: { fontSize: 12, fontWeight: 'bold' },
  productActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 },
  editBtn: { borderColor: '#4c5b6a', backgroundColor: 'transparent' },
  editBtnText: { fontSize: 13, color: '#c7d5e0', fontWeight: '600' },
  deleteBtn: { borderColor: 'rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(244, 63, 94, 0.1)' },
  deleteBtnText: { fontSize: 13, color: '#f43f5e', fontWeight: '600' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#4c5b6a', fontSize: 16 },

  // 🖼️ สไตล์ Custom Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(14, 20, 27, 0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 999, elevation: 999 },
  modalCard: { backgroundColor: '#17202d', width: '85%', maxWidth: 400, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#2a475e', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 },
  modalTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  modalMessage: { fontSize: 15, color: '#c7d5e0', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 15 },
  modalCancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#4c5b6a', alignItems: 'center' },
  modalCancelText: { color: '#c7d5e0', fontWeight: 'bold', fontSize: 14 },
  modalConfirmBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f43f5e', alignItems: 'center' },
  modalConfirmText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  modalOkBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#66c0f4', alignItems: 'center' },
  modalOkText: { color: '#000000', fontWeight: 'bold', fontSize: 14 }
});