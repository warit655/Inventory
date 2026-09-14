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
  ai_tier?: number;
}

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function HomeScreen() {
  const [userRole, setUserRole] = useState<string>('user');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>('STAFF');
  const [avatarUrl, setAvatarUrl] = useState<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  });

  const showModal = (title: string, message: string, type: string = 'info', onConfirm: any = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  const assignAIClusters = (data: Product[]) => {
    if (data.length === 0) return data;
    let min = Math.min(...data.map(d => Number(d.selling_price) || 0));
    let max = Math.max(...data.map(d => Number(d.selling_price) || 0));
    let centroids = [min, min + (max - min) / 2, max];
    let currentClusters: number[] = new Array(data.length).fill(0);
    let iterations = 0;
    let changed = true;

    while (changed && iterations < 10) {
      changed = false;
      let clusterSums = [0, 0, 0];
      let clusterCounts = [0, 0, 0];
      data.forEach((item, index) => {
        let price = Number(item.selling_price) || 0;
        let minDiff = Infinity;
        let clusterIndex = 0;
        centroids.forEach((c, i) => {
          let diff = Math.abs(price - c);
          if (diff < minDiff) { minDiff = diff; clusterIndex = i; }
        });
        if (currentClusters[index] !== clusterIndex) {
          changed = true;
          currentClusters[index] = clusterIndex;
        }
        clusterSums[clusterIndex] += price;
        clusterCounts[clusterIndex]++;
      });
      for (let i = 0; i < 3; i++) {
        if (clusterCounts[i] > 0) centroids[i] = clusterSums[i] / clusterCounts[i];
      }
      iterations++;
    }
    let sortedCentroids = [...centroids].map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    let tierMapping: { [key: number]: number } = {};
    sortedCentroids.forEach((c, newIdx) => { tierMapping[c.idx] = newIdx; });
    return data.map((item, index) => ({
      ...item,
      ai_tier: tierMapping[currentClusters[index]]
    }));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) throw new Error('DATA_FETCH_FAILED');
      const data = await response.json();
      setProducts(assignAIClusters(data));
    } catch (err) {
      showModal('SYSTEM ERROR', 'Unable to connect to the central database.', 'error');
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
    if (Platform.OS === 'web') window.localStorage.clear();
    setShowProfileMenu(false);
    router.replace('/login');
  };

  const handleDeleteProduct = (product: Product) => {
    showModal(
      'WARNING: DATA PURGE',
      `You are about to permanently delete [${product.name}]. Proceed?`,
      'confirm',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/products/${product.id}`, { method: 'DELETE' });
          if (response.ok) {
            fetchProducts();
            showModal('SUCCESS', 'Asset purged successfully.', 'success');
          } else {
            showModal('ERROR', 'Purge sequence failed.', 'error');
          }
        } catch (err) {
          showModal('ERROR', 'Network communication offline.', 'error');
        }
      }
    );
  };
  
  const handleAddToCart = async (product: Product) => {
    try {
      const userId = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;
      if (!userId) {
        showModal('AUTH FAILED', 'Please verify identity before proceeding.', 'error');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, product_id: product.id, quantity: 1 })
      });
      if (response.ok) {
        showModal('CART UPDATED', `[${product.name}] added to your loadout.`, 'success');
      } else {
        const errData = await response.json();
        showModal('SERVER REJECTED', errData.error, 'error');
      }
    } catch (err) {
      showModal('NETWORK ERROR', (err as Error).message, 'error');
    }
  };

  const displayedProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.serial_number && p.serial_number.toLowerCase().includes(query))
    );
  });

  const getAITag = (tier?: number) => {
    if (tier === 0) return { title: 'ENTRY CLASS', color: '#00FF66', border: 'rgba(0,255,102,0.3)' };
    if (tier === 1) return { title: 'MID TIER', color: '#00F0FF', border: 'rgba(0,240,255,0.3)' };
    if (tier === 2) return { title: 'HIGH-END', color: '#FF003C', border: 'rgba(255,0,60,0.5)' };
    return null;
  };

  const renderItem = ({ item }: { item: Product }) => {
    const inStock = item.stock > 0;
    const aiTag = getAITag(item.ai_tier);
    
    return (
      <View style={styles.productCard}>
        <View style={styles.cardHeader}>
          <View style={styles.imageWrapper}>
             <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
                style={styles.productImage}
                resizeMode="cover"
             />
             <View style={styles.imageOverlay} />
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.detailText}>{item.brand || 'UNKNOWN'}  |  VRAM: {item.vram || 'N/A'}</Text>
            <Text style={styles.snText}>[S/N]: {item.serial_number || 'UNREGISTERED'}</Text>
            
            {aiTag && (
              <View style={[styles.aiBadge, { borderColor: aiTag.border }]}>
                <Text style={[styles.aiBadgeText, { color: aiTag.color }]}>❖ {aiTag.title}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              ฿{item.selling_price ? Number(item.selling_price).toLocaleString() : '0'}
            </Text>
            <View style={[styles.stockBadge, { borderColor: inStock ? 'rgba(0,255,102,0.2)' : 'rgba(255,0,60,0.2)' }]}>
              <Text style={[styles.stockBadgeText, { color: inStock ? '#00FF66' : '#FF003C' }]}>
                {inStock ? `QTY: ${item.stock}` : 'OFFLINE'}
              </Text>
            </View>
          </View>
        </View>

        {userRole === 'admin' ? (
          <View style={styles.productActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/edit', params: { ...item } })}>
              <Text style={styles.editBtnText}>[ Edit ]</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item)}>
              <Text style={styles.deleteBtnText}>[ Delete ]</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productActions}>
            <TouchableOpacity 
              style={[styles.buyBtn, { backgroundColor: inStock ? 'rgba(255,0,60,0.1)' : '#101015', borderColor: inStock ? '#FF003C' : '#2A2A35' }]} 
              onPress={() => handleAddToCart(item)}
              disabled={!inStock}
            >
              <Text style={[styles.buyBtnText, { color: inStock ? '#FF003C' : '#4A4A5A' }]}>
                {inStock ? 'EQUIP TO LOADOUT' : 'UNAVAILABLE'}
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
        <StatusBar barStyle="light-content" backgroundColor="#05050A" />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>ROG <Text style={styles.headerTitleWhite}>ARMORY</Text></Text>
            <Text style={styles.headerSubtitle}>// SYSTEM SECURE & ONLINE</Text>
          </View>
          
          <View style={{ zIndex: 10 }}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
            >
              <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
            </TouchableOpacity>
            
            {showProfileMenu && (
              <View style={styles.profileDropdown}>
                <Image source={{ uri: avatarUrl }} style={styles.dropdownAvatar} />
                <Text style={styles.dropdownUser}>{currentUsername}</Text>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity onPress={handleLogout} style={styles.logoutWrapper}>
                  <Text style={styles.logoutText}>logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="SCAN DATABASE..."
              placeholderTextColor="#4A4A5A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {userRole === 'admin' && (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add')}>
              <Text style={styles.addBtnText}>+ NEW PRODUCT</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>TOTAL DB</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#00F0FF', textShadowColor: 'rgba(0,240,255,0.5)' }]}>
              {products.filter(p => p.stock > 0).length}
            </Text>
            <Text style={styles.statLabel}>ONLINE</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#FF003C', textShadowColor: 'rgba(255,0,60,0.5)' }]}>
              {products.filter(p => p.stock <= 0).length}
            </Text>
            <Text style={styles.statLabel}>OFFLINE</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#FF003C" />
            </View>
          ) : displayedProducts.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>[ 0 ] RECORDS MATCHING QUERY</Text>
            </View>
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
                      <Text style={styles.modalCancelText}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => { setModalVisible(false); modalConfig.onConfirm(); }}>
                      <Text style={styles.modalConfirmText}>CONFIRM</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.modalOkBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalOkText}>OK sir</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#05050A' // Deepest Abyss Dark
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 30 : 20,
    backgroundColor: '#0A0A10',
    borderBottomWidth: 1,
    borderBottomColor: '#FF003C', // ROG Red border
    elevation: 10,
    shadowColor: '#FF003C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 100
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FF003C',
    fontStyle: 'italic',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,0,60,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  },
  headerTitleWhite: {
    color: '#FFFFFF',
    textShadowColor: 'transparent'
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#00F0FF', // HUD Cyan
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 3
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 8, // HUD Square look
    backgroundColor: '#12121A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 6
  },
  profileDropdown: {
    position: 'absolute',
    top: 55,
    right: 0,
    backgroundColor: 'rgba(10,10,16,0.95)',
    padding: 20,
    borderWidth: 1,
    borderColor: '#FF003C',
    minWidth: 180,
    borderRadius: 4
  },
  dropdownAvatar: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00F0FF'
  },
  dropdownUser: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#2A2A35',
    marginBottom: 15
  },
  logoutWrapper: {
    backgroundColor: 'rgba(255,0,60,0.1)',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FF003C'
  },
  logoutText: {
    color: '#FF003C',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2
  },
  searchSection: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#05050A'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C0C12',
    borderWidth: 1,
    borderColor: '#2A2A35',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 4
  },
  searchIcon: {
    fontSize: 20,
    color: '#FF003C',
    marginRight: 10,
    fontWeight: 'bold'
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    outlineStyle: 'none',
    fontWeight: '800',
    letterSpacing: 1
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#05050A'
  },
  addBtn: {
    backgroundColor: 'rgba(255,0,60,0.15)',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF003C',
    borderRadius: 4
  },
  addBtnText: {
    color: '#FF003C',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,0,60,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0C0C12',
    padding: 15,
    borderWidth: 1,
    borderColor: '#1E1E28',
    alignItems: 'center',
    borderRadius: 4
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  statLabel: {
    fontSize: 9,
    color: '#6B6B80',
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 2
  },
  listContainer: {
    flex: 1
  },
  flatListPadding: {
    padding: 20,
    paddingBottom: 40,
    gap: 20
  },
  productCard: {
    backgroundColor: '#0A0A10',
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E1E28',
    borderLeftWidth: 4,
    borderLeftColor: '#FF003C', // ROG Red edge
    borderRadius: 6
  },
  cardHeader: {
    flexDirection: 'row'
  },
  imageWrapper: {
    borderWidth: 1,
    borderColor: '#2A2A35',
    padding: 3,
    marginRight: 15,
    position: 'relative',
    backgroundColor: '#05050A'
  },
  productImage: {
    width: 75,
    height: 75,
    opacity: 0.9
  },
  imageOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,240,255,0.05)' // Subtle tech tint
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  productName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  detailText: {
    fontSize: 10,
    color: '#8A8A9E',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 1
  },
  snText: {
    fontSize: 10,
    color: '#4A4A5A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 10,
    letterSpacing: 1
  },
  aiBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 2
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  priceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 2
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  productActions: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#1E1E28',
    gap: 12
  },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#0C0C12',
    borderWidth: 1,
    borderColor: '#2A2A35',
    alignItems: 'center',
    borderRadius: 4
  },
  editBtnText: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: '900',
    letterSpacing: 2
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,0,60,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,0,60,0.3)',
    borderRadius: 4
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#FF003C',
    fontWeight: '900',
    letterSpacing: 2
  },
  buyBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4
  },
  buyBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60
  },
  emptyText: {
    color: '#4A4A5A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(5,5,10,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  modalCard: {
    backgroundColor: '#0A0A10',
    width: '85%',
    maxWidth: 380,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FF003C',
    shadowColor: '#FF003C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF003C',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 2
  },
  modalMessage: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 1
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#2A2A35',
    alignItems: 'center'
  },
  modalCancelText: {
    color: '#8A8A9E',
    fontWeight: '900',
    letterSpacing: 1
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255,0,60,0.1)',
    borderWidth: 1,
    borderColor: '#FF003C',
    alignItems: 'center'
  },
  modalConfirmText: {
    color: '#FF003C',
    fontWeight: '900',
    letterSpacing: 2
  },
  modalOkBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255,0,60,0.1)',
    borderWidth: 1,
    borderColor: '#FF003C',
    alignItems: 'center'
  },
  modalOkText: {
    color: '#FF003C',
    fontWeight: '900',
    letterSpacing: 2
  }
});