import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// 1. ประกาศโครงสร้าง TypeScript Interface เพื่อรองรับข้อมูลจาก JSON ของอาจารย์
interface Product {
  id: string;
  name: string;
  stock: number;
  stock_text: string;
  category: string;
  location_count: number;
  location_text: string;
  badge_status: string;
  image_url: string;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 2. ลิงก์ดึงข้อมูลไฟล์ JSON โดยตรงจาก GitHub (แก้ไขให้เป็นของคุณได้เลยครับ)
  const GITHUB_JSON_URL = 'https://raw.githubusercontent.com/warit655/Inventory/refs/heads/master/sn_product1.json?token=GHSAT0AAAAAAEBLAIRJJKS7XONHHGAB5XJO2SWEQGQ';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(GITHUB_JSON_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // 3. ฟังก์ชันสำหรับเรนเดอร์แต่ละรายการเกม (ดีไซน์ธีม Steam มืด-ฟ้าตามที่คุณออกแบบไว้)
  const renderItem = ({ item }: { item: Product }) => {
    const isLowStock = item.badge_status === 'Low in stock';

    return (
      <View style={styles.productCard}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <View style={styles.productDetails}>
            <Text style={styles.stockText}>Stock: {item.stock_text}</Text>
            <Text style={styles.categoryText}>Category: {item.category}</Text>
            <Text style={styles.locationText}>Developer: {item.location_text}</Text>
          </View>
          <View style={styles.productActions}>
            <TouchableOpacity style={[
              styles.statusButton,
              isLowStock && { borderColor: '#f43f5e' } // กรอบแดงถ้าใกล้หมด
            ]}>
              <Text style={[
                styles.statusText,
                isLowStock && { color: '#f43f5e' } // อักษรแดงถ้าใกล้หมด
              ]}>{item.badge_status}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreIcon}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.productName}>{item.name}</Text>
      </View>
    );
  };

  // 4. แสดง Spinner หมุนระหว่่างที่กำลังดึงข้อมูลจากอินเทอร์เน็ต
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#66c0f4" />
        <Text style={styles.loadingText}>Loading products from GitHub...</Text>
      </View>
    );
  }

  // 5. แสดงกล่องแจ้งเตือนสีแดงหากลิงก์เสียหรือดึงข้อมูลไม่ได้
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 6. ส่วนการแสดงผลหลักหน้าจอหลัก
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171a21" />
      
      {/* Top Menu / Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STEAM STORE</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="search products..."
            placeholderTextColor="#8f98a0"
            editable={false}
          />
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filter ▼</Text>
        </TouchableOpacity>
      </View>

      {/* เปลี่ยนมาใช้ FlatList แทน ScrollView ของเดิมเพื่อประสิทธิภาพที่ดียิ่งขึ้นตามที่อาจารย์แนะนำ */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Bottom Menu */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>➕</Text>
          <Text style={styles.navText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📦</Text>
          <Text style={[styles.navText, { color: '#66c0f4', fontWeight: 'bold' }]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📁</Text>
          <Text style={styles.navText}>Categories</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------
// CSS สไตล์ธีม Steam (คงไว้ทุกสัดส่วนตามดีไซน์ของคุณ)
// ---------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b2838', // พื้นหลังหลักของ Steam
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#171a21', // แถบเมนูด้านบนสีดำเทา
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  menuButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  menuIcon: { fontSize: 18, color: '#c7d5e0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#c7d5e0', letterSpacing: 2 },
  profileButton: {
    width: 30, height: 30, backgroundColor: '#2a475e', borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  profileIcon: { fontSize: 16, color: '#66c0f4' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 15, backgroundColor: '#1b2838', 
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a475e',
    borderRadius: 4, paddingHorizontal: 10, marginRight: 10,
  },
  searchIcon: { fontSize: 14, color: '#66c0f4', marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: '#c7d5e0' },
  addButton: {
    backgroundColor: '#66c0f4', borderRadius: 4, paddingHorizontal: 15,
    paddingVertical: 8, marginRight: 10,
  },
  addButtonText: { color: '#171a21', fontSize: 14, fontWeight: 'bold' },
  filterButton: { paddingHorizontal: 5, paddingVertical: 10 },
  filterText: { color: '#66c0f4', fontSize: 14, fontWeight: '500' },
  productsList: { padding: 20 },
  productCard: {
    backgroundColor: '#171a21', borderRadius: 8, padding: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  productImage: {
    width: 60, height: 60, borderRadius: 4, marginBottom: 10, backgroundColor: '#2a475e',
  },
  productInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  productDetails: { flex: 1 },
  stockText: { fontSize: 12, color: '#8f98a0', marginBottom: 2 },
  categoryText: { fontSize: 12, color: '#8f98a0', marginBottom: 2 },
  locationText: { fontSize: 12, color: '#8f98a0' },
  productActions: { flexDirection: 'row', alignItems: 'center' },
  statusButton: {
    backgroundColor: '#2a475e', borderRadius: 4, paddingHorizontal: 12,
    paddingVertical: 4, marginRight: 10, borderWidth: 1, borderColor: '#66c0f4'
  },
  statusText: { color: '#66c0f4', fontSize: 12, fontWeight: '500' },
  moreButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  moreIcon: { fontSize: 20, color: '#8f98a0' },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#c7d5e0' },
  separator: { height: 16 },
  
  // สไตล์เพิ่มเติมสำหรับระบบแสดงผลตอนโหลด/ขัดข้อง
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1b2838' },
  loadingText: { marginTop: 12, color: '#66c0f4', fontSize: 14, fontWeight: '500' },
  errorText: { color: '#f43f5e', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  retryButton: { backgroundColor: '#66c0f4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 },
  retryText: { color: '#171a21', fontWeight: 'bold' },

  bottomNav: {
    flexDirection: 'row', backgroundColor: '#171a21', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#000000',
  },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  navIcon: { fontSize: 18, marginBottom: 4 },
  navText: { fontSize: 12, color: '#8f98a0' }
});