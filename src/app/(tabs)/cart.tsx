import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const userId = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;
      if (!userId) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/cart/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchCart();
  }, []));

  const updateQuantity = async (cartId: number, currentQty: number, delta: number) => {
    const newQty = Math.max(1, currentQty + delta);
    try {
      await fetch(`${API_BASE_URL}/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (cartId: number) => {
    try {
      await fetch(`${API_BASE_URL}/cart/${cartId}`, { method: 'DELETE' });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotal = () => cartItems.reduce((sum, item) => sum + ((item.selling_price || 0) * item.quantity), 0);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartCard}>
      <Image source={{ uri: item.image_url || 'https://via.placeholder.com/80' }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.brandText}>{item.brand || 'N/A'}</Text>
        <Text style={styles.priceText}>฿{Number(item.selling_price || 0).toLocaleString()}</Text>
      </View>
      
      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.cart_id)}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
        
        <View style={styles.qtyContainer}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.cart_id, item.quantity, -1)}>
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.cart_id, item.quantity, 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.itemCount}>{cartItems.length} items</Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => String(item.cart_id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.checkoutSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>฿{calculateTotal().toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn}>
              <Text style={styles.checkoutBtnText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  itemCount: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  listPadding: { padding: 15, paddingBottom: 20, gap: 15 },
  cartCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F3F4F6' },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  productName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  brandText: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  priceText: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
  actionColumn: { justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 4 },
  deleteBtn: { padding: 4 },
  deleteText: { fontSize: 16 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 6 },
  qtyBtnText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  qtyText: { paddingHorizontal: 12, fontSize: 14, fontWeight: '700', color: '#111827' },
  checkoutSection: { backgroundColor: '#FFFFFF', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  checkoutBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 },
  shopBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  shopBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 }
});