import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  // Custom Popup State
  const [alertInfo, setAlertInfo] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: ''
  });
  const showAlert = (title: string, message: string) => setAlertInfo({ visible: true, title, message });

  const fetchCart = async () => {
    try {
      setLoading(true);
      const id = Platform.OS === 'web' ? window.localStorage.getItem('userId') : null;
      setUserId(id);
      if (!id) return;
      const response = await fetch(`${API_BASE_URL}/cart/${id}`);
      if (response.ok) setCartItems(await response.json());
    } catch (err) {} finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchCart(); }, []));

  const updateQuantity = async (cartId: number, currentQty: number, delta: number) => {
    const newQty = Math.max(1, currentQty + delta);
    try { await fetch(`${API_BASE_URL}/cart/${cartId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: newQty }) }); fetchCart(); } catch (err) {}
  };

  const removeItem = async (cartId: number) => {
    try { await fetch(`${API_BASE_URL}/cart/${cartId}`, { method: 'DELETE' }); fetchCart(); } catch (err) {}
  };

  const calculateTotal = () => cartItems.reduce((sum, item) => sum + ((item.selling_price || 0) * item.quantity), 0);

  const handleOpenCheckout = async () => {
    if (!userId || cartItems.length === 0) return;
    setCheckoutVisible(true); setIsAddingAddress(false);
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
      const res = await fetch(`${API_BASE_URL}/addresses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, address_text: newAddressText, is_default: addresses.length === 0 }) });
      if (res.ok) {
        setSelectedAddress(newAddressText); setNewAddressText(''); setIsAddingAddress(false);
        const refreshRes = await fetch(`${API_BASE_URL}/addresses/${userId}`);
        if (refreshRes.ok) setAddresses(await refreshRes.json());
      }
    } catch (err) {}
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddress) { showAlert('แจ้งเตือน', 'กรุณาเลือกที่อยู่จัดส่ง'); return; }
    setProcessingOrder(true);
    try {
      const res = await fetch(`${API_BASE_URL}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, address_text: selectedAddress, total_price: calculateTotal() }) });
      if (res.ok) {
        setCheckoutVisible(false);
        fetchCart(); 
        showAlert('สั่งซื้อสำเร็จ! 🎉', 'ระบบได้รับคำสั่งซื้อของคุณแล้ว ขอบคุณที่ใช้บริการครับ');
      }
    } catch (err) {} finally { setProcessingOrder(false); }
  };

  const resolveImage = (item: any) => {
    const url = item.image_url || item.image;
    return (url && typeof url === 'string' && url.trim() !== '') ? url : 'https://placehold.co/150x150/F3F4F6/9CA3AF.png?text=No+Image';
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartCard}>
      <Image source={{ uri: resolveImage(item) }} style={styles.productImage} resizeMode="cover" />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.brandText}>{item.brand || 'N/A'}</Text>
        <Text style={styles.priceText}>฿{Number(item.selling_price || 0).toLocaleString()}</Text>
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.cart_id)}><Text style={styles.deleteText}>✕</Text></TouchableOpacity>
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
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตะกร้าสินค้า</Text>
        <View style={styles.badgeCount}><Text style={styles.itemCount}>{cartItems.length} ชิ้น</Text></View>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ไม่มีสินค้าในตะกร้า</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}><Text style={styles.shopBtnText}>เลือกซื้อสินค้า</Text></TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList data={cartItems} keyExtractor={item => String(item.cart_id)} renderItem={renderItem} contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false} />
          <View style={styles.checkoutSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ยอดรวมทั้งหมด</Text>
              <Text style={styles.totalValue}>฿{calculateTotal().toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleOpenCheckout}><Text style={styles.checkoutBtnText}>ชำระเงิน</Text></TouchableOpacity>
          </View>
        </>
      )}

      {checkoutVisible && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>ยืนยันการสั่งซื้อ</Text>
              {!isAddingAddress ? (
                <>
                  <Text style={styles.modalSubtitle}>เลือกที่อยู่จัดส่ง</Text>
                  <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
                    {addresses.length === 0 ? (
                      <Text style={styles.noAddressText}>ยังไม่มีที่อยู่จัดส่ง</Text>
                    ) : (
                      addresses.map((addr) => {
                        const isSelected = selectedAddress === addr.address_text;
                        return (
                          <TouchableOpacity key={addr.id} style={[styles.addressItem, isSelected && styles.addressItemSelected]} onPress={() => setSelectedAddress(addr.address_text)}>
                            <View style={styles.radioCircle}>{isSelected && <View style={styles.radioInner} />}</View>
                            <Text style={[styles.addressItemText, isSelected && { color: '#3B82F6', fontWeight: '700' }]}>{addr.address_text}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                  <TouchableOpacity style={styles.addAddressInlineBtn} onPress={() => setIsAddingAddress(true)}><Text style={styles.addAddressInlineText}>+ เพิ่มที่อยู่ใหม่</Text></TouchableOpacity>
                </>
              ) : (
                <View style={styles.addAddressView}>
                  <Text style={styles.modalSubtitle}>เพิ่มที่อยู่ใหม่</Text>
                  <TextInput style={styles.inputArea} multiline placeholder="กรอกที่อยู่จัดส่งแบบเต็ม..." placeholderTextColor="#9CA3AF" value={newAddressText} onChangeText={setNewAddressText} />
                  <View style={styles.addAddressActions}>
                    <TouchableOpacity style={styles.cancelAddBtn} onPress={() => { setIsAddingAddress(false); setNewAddressText(''); }}><Text style={styles.cancelAddText}>ยกเลิก</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.saveAddBtn} onPress={handleSaveNewAddress}><Text style={styles.saveAddText}>บันทึกที่อยู่</Text></TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.modalSummary}>
                <Text style={styles.summaryLabel}>ยอดที่ต้องชำระ:</Text>
                <Text style={styles.summaryValue}>฿{calculateTotal().toLocaleString()}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCheckoutVisible(false)} disabled={processingOrder}><Text style={styles.modalCancelText}>ปิด</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalConfirmBtn, (!selectedAddress || isAddingAddress) && { opacity: 0.5 }]} onPress={handleConfirmOrder} disabled={!selectedAddress || isAddingAddress || processingOrder}>
                  <Text style={styles.modalConfirmText}>{processingOrder ? 'กำลังดำเนินการ...' : 'ยืนยันสั่งซื้อ'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Custom Popup Modal */}
      {alertInfo.visible && (
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalCard}>
            <Text style={styles.customModalTitle}>{alertInfo.title}</Text>
            <Text style={styles.customModalMessage}>{alertInfo.message}</Text>
            <TouchableOpacity style={styles.customModalBtn} onPress={() => setAlertInfo({ ...alertInfo, visible: false })}>
              <Text style={styles.customModalBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  badgeCount: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  itemCount: { fontSize: 12, color: '#3B82F6', fontWeight: '700' },
  listPadding: { padding: 20, paddingBottom: 20, gap: 16 },
  cartCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F9FAFB' },
  productInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  productName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  brandText: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  priceText: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
  actionColumn: { justifyContent: 'space-between', alignItems: 'flex-end' },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 14, color: '#9CA3AF', fontWeight: '700' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#4B5563' },
  qtyText: { width: 32, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#111827' },
  checkoutSection: { backgroundColor: '#FFFFFF', padding: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingBottom: Platform.OS === 'ios' ? 35 : 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  checkoutBtn: { backgroundColor: '#3B82F6', padding: 16, alignItems: 'center', borderRadius: 12, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginBottom: 20, fontWeight: '600' },
  shopBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  shopBtnText: { color: '#4B5563', fontWeight: '700', fontSize: 14 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modalContainer: { width: '90%', maxWidth: 450, maxHeight: '85%' },
  modalCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 15 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 15 },
  addressList: { maxHeight: 200, marginBottom: 15 },
  noAddressText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginVertical: 20 },
  addressItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10, borderRadius: 12 },
  addressItemSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' },
  addressItemText: { flex: 1, color: '#4B5563', fontSize: 14, lineHeight: 22 },
  addAddressInlineBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, marginBottom: 20 },
  addAddressInlineText: { color: '#4B5563', fontSize: 14, fontWeight: '700' },
  addAddressView: { marginBottom: 20 },
  inputArea: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', padding: 16, fontSize: 14, color: '#111827', outlineStyle: 'none', borderRadius: 12, height: 100, textAlignVertical: 'top', marginBottom: 15 },
  addAddressActions: { flexDirection: 'row', gap: 12 },
  cancelAddBtn: { flex: 1, padding: 14, backgroundColor: '#F3F4F6', alignItems: 'center', borderRadius: 10 },
  cancelAddText: { color: '#4B5563', fontSize: 14, fontWeight: '700' },
  saveAddBtn: { flex: 1, padding: 14, backgroundColor: '#3B82F6', alignItems: 'center', borderRadius: 10 },
  saveAddText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  modalSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginBottom: 20 },
  summaryLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#3B82F6' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', alignItems: 'center', borderRadius: 12 },
  modalCancelText: { color: '#4B5563', fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 2, padding: 16, backgroundColor: '#3B82F6', alignItems: 'center', borderRadius: 12 },
  modalConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  
  // Custom Modal Styles
  customModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  customModalCard: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 320, padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  customModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' },
  customModalMessage: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  customModalBtn: { backgroundColor: '#3B82F6', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  customModalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});