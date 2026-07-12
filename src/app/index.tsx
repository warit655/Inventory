import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ข้อมูลสินค้าจำลอง (คงเดิมตามโจทย์)
const products = [
  {
    id: '1',
    name: 'PUBG: BATTLEGROUNDS',
    stock: 999, 
    category: 'แอ็คชัน, ผจญภัย, ผู้เล่นหลายคนจำนวนมาก, เล่นฟรี',
    location: 'KRAFTON, Inc.', 
    status: 'Installed', // สถานะเช่น ติดตั้งแล้ว, กำลังลดราคา, หรืออยู่ในคลัง
    imageUrl: 'https://tse1.mm.bing.net/th/id/OIP.Gytgjw17v3l6XITcr7fsQAHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
  },
  {
    id: '2',
    name: 'Apex Legends™',
    stock: 999,
    category: 'แอ็คชัน, ผจญภัย, เล่นฟรี',
    location: 'Respawn',
    status: 'In Library',
    imageUrl: 'https://th.bing.com/th?id=OIF.6Xj6Y%2fsfsf4BP480Mi7ybA&r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
  },
  {
    id: '3',
    name: 'Overwatch®',
    stock: 999,
    category: 'แอ็คชัน, เล่นฟรี',
    location: 'Blizzard Entertainment, Inc.',
    status: 'On Sale',
    imageUrl: 'https://tse1.mm.bing.net/th/id/OIF.ZKH8zatq1mtUSRnbwqsTIg?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
  }
];

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      {/* เปลี่ยนสี Status Bar ให้เข้ากับธีมมืด */}
      <StatusBar barStyle="light-content" backgroundColor="#171a21" />
      
      {/* Top Menu / Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STORE</Text>
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

      {/* Products List Section */}
      <ScrollView style={styles.productsList} showsVerticalScrollIndicator={false}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <View style={styles.productDetails}>
                <Text style={styles.stockText}>Stock: {product.stock} in stock</Text>
                <Text style={styles.categoryText}>Category: {product.category}</Text>
                <Text style={styles.locationText}>Location: {product.location}</Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity style={styles.statusButton}>
                  <Text style={styles.statusText}>{product.status}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                  <Text style={styles.moreIcon}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
          </View>
        ))}
      </ScrollView>

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
// CSS สไตล์ธีม Steam (เน้นสี #1b2838, #171a21, #66c0f4)
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
  productsList: { flex: 1, padding: 20 },
  productCard: {
    backgroundColor: '#171a21', borderRadius: 8, padding: 15, marginBottom: 15,
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
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#171a21', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#000000',
  },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  navIcon: { fontSize: 18, marginBottom: 4 },
  navText: { fontSize: 12, color: '#8f98a0' }
});