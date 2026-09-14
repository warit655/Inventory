import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
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

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const id = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;
      setUserId(id);
      if (!id) { setLoading(false); return; }
      
      const response = await fetch(`${API_BASE_URL}/cart/${id}`);
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

  useFocusEffect(useCallback(() => { fetchCart(); }, []));

  const updateQuantity = async (cartId: number, currentQty: number, delta: number) => {
    const newQty = Math.max(1, currentQty + delta);
    try {
      await fetch(`${API_BASE_URL}/cart/${cartId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: newQty })
      });
      fetchCart();
    } catch (err) {}
  };

  const removeItem = async (cartId: number) => {
    try { await fetch(`${API_BASE_URL}/cart/${cartId}`, { method: 'DELETE' }); fetchCart(); } catch (err) {}
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + ((item.selling_price || 0) * item.quantity), 0);
  };

  const handleOpenCheckout = async () => {
    if (!userId || cartItems.length === 0) return;
    setCheckoutVisible(true);
    setIsAddingAddress(false);
    
    try {
      const res = await fetch(`${API_BASE_URL}/addresses/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) {
          const defaultAddr = data.find((a: any) => a.is_default);
          setSelectedAddress(defaultAddr ? defaultAddr.address_text : data[0].address_text);
        }
      }
    } catch (err) {}
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressText.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, address_text: newAddressText, is_default: addresses.length === 0 })
      });
      if (res.ok) {
        setSelectedAddress(newAddressText);
        setNewAddressText('');
        setIsAddingAddress(false);
        const refreshRes = await fetch(`${API_BASE_URL}/addresses/${userId}`);
        if (refreshRes.ok) setAddresses(await refreshRes.json());
      }
    } catch (err) { alert('UPLOAD FAILED'); }
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddress) { alert('ERROR: DROP ZONE REQUIRED'); return; }
    setProcessingOrder(true);
    try {
      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, address_text: selectedAddress, total_price: calculateTotal() })
      });
      if (res.ok) {
        alert('✅ TRANSACTION SECURED. ITEMS DEPLOYED.');
        setCheckoutVisible(false);
        fetchCart(); 
      } else {
        alert('TRANSACTION FAILED');
      }
    } catch (err) {
      alert('NETWORK OFFLINE');
    } finally {
      setProcessingOrder(false);
    }
  };

  // 💡 ฟังก์ชันตรวจสอบรูปภาพอัจฉริยะ (ถ้าไม่มีรูป จะโชว์รูปสำรองธีม ROG)
  const resolveImage = (item: any) => {
    const url = item.image_url || item.image;
    if (url && typeof url === 'string' && url.trim() !== '') return url;
    return 'https://placehold.co/150x150/05050A/FF003C.png?text=ROG+ASSET';
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartCard}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: resolveImage(item) }} style={styles.productImage} resizeMode="cover" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.brandText}>// {item.brand || 'UNKNOWN'} // VRAM: {item.vram || 'N/A'}</Text>
        <Text style={styles.priceText}>฿{Number(item.selling_price || 0).toLocaleString()}</Text>
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.cart_id)}>
          <Text style={styles.deleteText}>[ X ]</Text>
        </TouchableOpacity>
        <View style={styles.qtyContainer}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.cart_id, item.quantity, -1)}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.cart_id, item.quantity, 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05050A" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ACTIVE <Text style={{ color: '#FFFFFF' }}>LOADOUT</Text></Text>
        <View style={styles.badgeCount}><Text style={styles.itemCount}>{cartItems.length} EQPT</Text></View>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}><ActivityIndicator size="large" color="#FF003C" /></View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>[ LOADOUT SLOT EMPTY ]</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
            <Text style={styles.shopBtnText}>BROWSE ARMORY</Text>
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
              <Text style={styles.totalLabel}>ESTIMATED RESOURCE COST</Text>
              <Text style={styles.totalValue}>฿{calculateTotal().toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleOpenCheckout}>
              <Text style={styles.checkoutBtnText}>INITIALIZE CHECKOUT SEQUENCE</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {checkoutVisible && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>DEPLOYMENT <Text style={{color: '#FFFFFF'}}>PROTOCOL</Text></Text>
              <Text style={styles.modalSubtitle}>// VERIFY DROP ZONE COORDINATES</Text>

              {!isAddingAddress ? (
                <>
                  <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
                    {addresses.length === 0 ? (
                      <Text style={styles.noAddressText}>NO DROP ZONES DETECTED IN DATABASE.</Text>
                    ) : (
                      addresses.map((addr) => {
                        const isSelected = selectedAddress === addr.address_text;
                        return (
                          <TouchableOpacity 
                            key={addr.id} 
                            style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                            onPress={() => setSelectedAddress(addr.address_text)}
                          >
                            <View style={styles.radioCircle}>
                              {isSelected && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.addressItemText, isSelected && { color: '#00F0FF' }]}>{addr.address_text}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>

                  <TouchableOpacity style={styles.addAddressInlineBtn} onPress={() => setIsAddingAddress(true)}>
                    <Text style={styles.addAddressInlineText}>+ REGISTER NEW DROP ZONE</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.addAddressView}>
                  <Text style={styles.label}>[ STR ] ENTER NEW COORDINATES</Text>
                  <TextInput
                    style={styles.inputArea}
                    multiline
                    placeholder="Enter full shipping address..."
                    placeholderTextColor="#4A4A5A"
                    value={newAddressText}
                    onChangeText={setNewAddressText}
                  />
                  <View style={styles.addAddressActions}>
                    <TouchableOpacity style={styles.cancelAddBtn} onPress={() => { setIsAddingAddress(false); setNewAddressText(''); }}>
                      <Text style={styles.cancelAddText}>ABORT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveAddBtn} onPress={handleSaveNewAddress}>
                      <Text style={styles.saveAddText}>SYNC COORD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.modalSummary}>
                <Text style={styles.summaryLabel}>TOTAL COST:</Text>
                <Text style={styles.summaryValue}>฿{calculateTotal().toLocaleString()}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCheckoutVisible(false)} disabled={processingOrder}>
                  <Text style={styles.modalCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalConfirmBtn, (!selectedAddress || isAddingAddress) && { opacity: 0.5 }]} 
                  onPress={handleConfirmOrder}
                  disabled={!selectedAddress || isAddingAddress || processingOrder}
                >
                  <Text style={styles.modalConfirmText}>{processingOrder ? 'AUTHORIZING...' : 'AUTHORIZE PURCHASE'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05050A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#0A0A10', borderBottomWidth: 1, borderBottomColor: '#FF003C', elevation: 10, shadowColor: '#FF003C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FF003C', letterSpacing: 2, fontStyle: 'italic', textShadowColor: 'rgba(255,0,60,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  badgeCount: { backgroundColor: 'rgba(255,0,60,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#FF003C' },
  itemCount: { fontSize: 10, color: '#FF003C', fontWeight: '900', letterSpacing: 2 },
  listPadding: { padding: 20, paddingBottom: 20, gap: 15 },
  cartCard: { flexDirection: 'row', backgroundColor: '#0A0A10', padding: 14, borderWidth: 1, borderColor: '#1E1E28', borderLeftWidth: 4, borderLeftColor: '#FF003C', borderRadius: 6 },
  imageWrapper: { borderWidth: 1, borderColor: '#2A2A35', padding: 3, backgroundColor: '#05050A' },
  productImage: { width: 75, height: 75, opacity: 0.9 },
  productInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  brandText: { fontSize: 9, color: '#00F0FF', marginBottom: 8, fontWeight: '800', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  priceText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  actionColumn: { justifyContent: 'space-between', alignItems: 'flex-end' },
  deleteBtn: { paddingHorizontal: 5, paddingVertical: 5 },
  deleteText: { fontSize: 12, color: '#4A4A5A', fontWeight: '900', letterSpacing: 1 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#05050A', borderWidth: 1, borderColor: '#2A2A35', borderRadius: 4 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#12121A' },
  qtyBtnText: { fontSize: 14, fontWeight: '900', color: '#00F0FF' },
  qtyText: { width: 40, textAlign: 'center', fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  checkoutSection: { backgroundColor: '#0A0A10', padding: 24, borderTopWidth: 1, borderTopColor: '#FF003C', paddingBottom: Platform.OS === 'ios' ? 35 : 24, shadowColor: '#FF003C', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  totalLabel: { fontSize: 10, color: '#8A8A9E', fontWeight: '900', letterSpacing: 2 },
  totalValue: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  checkoutBtn: { backgroundColor: 'rgba(255,0,60,0.1)', padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#FF003C', borderRadius: 4, shadowColor: '#FF003C', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  checkoutBtnText: { color: '#FF003C', fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#05050A' },
  emptyText: { fontSize: 12, fontWeight: '900', color: '#4A4A5A', marginBottom: 25, letterSpacing: 3 },
  shopBtn: { backgroundColor: 'transparent', paddingHorizontal: 30, paddingVertical: 15, borderWidth: 1, borderColor: '#00F0FF', borderRadius: 4 },
  shopBtnText: { color: '#00F0FF', fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,10,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContainer: { width: '90%', maxWidth: 450, maxHeight: '85%' },
  modalCard: { backgroundColor: '#0A0A10', padding: 24, borderWidth: 1, borderColor: '#00F0FF', shadowColor: '#00F0FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 15 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#00F0FF', letterSpacing: 2, fontStyle: 'italic' },
  modalSubtitle: { fontSize: 10, color: '#8A8A9E', fontWeight: '800', marginTop: 4, marginBottom: 20, letterSpacing: 2 },
  addressList: { maxHeight: 200, marginBottom: 15 },
  noAddressText: { color: '#4A4A5A', fontSize: 11, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginVertical: 20 },
  addressItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 15, backgroundColor: '#05050A', borderWidth: 1, borderColor: '#1E1E28', marginBottom: 10, borderRadius: 4 },
  addressItemSelected: { borderColor: '#00F0FF', backgroundColor: 'rgba(0,240,255,0.05)' },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#4A4A5A', marginRight: 12, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00F0FF' },
  addressItemText: { flex: 1, color: '#8A8A9E', fontSize: 12, lineHeight: 20, fontWeight: '600' },
  addAddressInlineBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A35', backgroundColor: '#12121A', borderStyle: 'dashed', marginBottom: 20 },
  addAddressInlineText: { color: '#00F0FF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  addAddressView: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '900', color: '#00F0FF', marginBottom: 8, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  inputArea: { backgroundColor: '#05050A', borderWidth: 1, borderColor: '#2A2A35', padding: 14, fontSize: 12, color: '#FFFFFF', outlineStyle: 'none', fontWeight: '600', height: 80, textAlignVertical: 'top', marginBottom: 10 },
  addAddressActions: { flexDirection: 'row', gap: 10 },
  cancelAddBtn: { flex: 1, padding: 12, backgroundColor: '#12121A', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A35' },
  cancelAddText: { color: '#8A8A9E', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  saveAddBtn: { flex: 1, padding: 12, backgroundColor: 'rgba(0,240,255,0.1)', alignItems: 'center', borderWidth: 1, borderColor: '#00F0FF' },
  saveAddText: { color: '#00F0FF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  modalSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#2A2A35', borderBottomWidth: 1, borderBottomColor: '#2A2A35', marginBottom: 20 },
  summaryLabel: { fontSize: 11, color: '#FFFFFF', fontWeight: '900', letterSpacing: 2 },
  summaryValue: { fontSize: 20, fontWeight: '900', color: '#00F0FF', textShadowColor: 'rgba(0,240,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 14, backgroundColor: '#12121A', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A35' },
  modalCancelText: { color: '#8A8A9E', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  modalConfirmBtn: { flex: 2, padding: 14, backgroundColor: 'rgba(255,0,60,0.15)', alignItems: 'center', borderWidth: 1, borderColor: '#FF003C' },
  modalConfirmText: { color: '#FF003C', fontSize: 12, fontWeight: '900', letterSpacing: 2 }
});