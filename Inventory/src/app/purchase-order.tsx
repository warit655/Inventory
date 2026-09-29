import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

type Supplier = { id: number; name: string; contact: string };
type Product = { id: number; name: string; brand: string; cost_price: string };
type POItem = { product_id: number; product_name: string; quantity: number; cost_price: number };
type PO = {
  id: number; supplier_name: string; status: string; eta_minutes: number;
  created_at: string; remaining_seconds: number;
  items: { id: number; product_name: string; quantity: number; cost_price: string }[];
};

const ETA_OPTIONS = [1, 5, 15, 30, 60];

export default function PurchaseOrderScreen() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟอร์มสร้าง PO ใหม่
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [etaMinutes, setEtaMinutes] = useState(5);
  const [cart, setCart] = useState<POItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef<any>(null);

  const fetchAll = async () => {
    const role = Platform.OS === 'web' ? window.localStorage.getItem('role') : null;
    if (role !== 'admin') { router.replace('/'); return; }

    try {
      const [posRes, supRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/purchase-orders`),
        fetch(`${API_BASE_URL}/suppliers`),
        fetch(`${API_BASE_URL}/products`),
      ]);
      if (posRes.ok) setPos(await posRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  // Poll ทุก 3 วิ เพื่ออัปเดตนับถอยหลัง และเรียก receive อัตโนมัติเมื่อเวลาหมด
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const res = await fetch(`${API_BASE_URL}/purchase-orders`);
      if (!res.ok) return;
      const data: PO[] = await res.json();
      setPos(data);

      // ถ้า PO ไหนเวลาหมดแล้วแต่ยังเป็น pending อยู่ ให้เรียก receive ให้อัตโนมัติ
      for (const po of data) {
        if (po.status === 'pending' && po.remaining_seconds <= 0) {
          await fetch(`${API_BASE_URL}/purchase-orders/${po.id}/receive`, { method: 'POST' });
        }
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const addToCart = (p: Product) => {
    if (cart.find(c => c.product_id === p.id)) return;
    setCart([...cart, { product_id: p.id, product_name: p.name, quantity: 1, cost_price: Number(p.cost_price) || 0 }]);
  };

  const updateCartQty = (productId: number, qty: number) => {
    setCart(cart.map(c => c.product_id === productId ? { ...c, quantity: Math.max(1, qty) } : c));
  };

  const removeFromCart = (productId: number) => setCart(cart.filter(c => c.product_id !== productId));

  const handleCreatePO = async () => {
    if (!selectedSupplier || cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_id: selectedSupplier.id, eta_minutes: etaMinutes, items: cart }),
      });
      if (res.ok) {
        setView('list');
        setCart([]);
        setSelectedSupplier(null);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const forceReceive = async (poId: number) => {
    await fetch(`${API_BASE_URL}/purchase-orders/${poId}/receive`, { method: 'POST' });
    fetchAll();
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.centerContainer}><ActivityIndicator size="large" color="#66c0f4" /></View></SafeAreaView>;
  }

  // ---------- ฟอร์มสร้าง PO ----------
  if (view === 'form') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1722" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('list')}><Text style={styles.backText}>{'< ย้อนกลับ'}</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>New Purchase Order</Text>
        </View>

        <ScrollView contentContainerStyle={styles.formPadding}>
          <Text style={styles.sectionLabel}>เลือกซัพพลายเออร์</Text>
          <View style={styles.chipRow}>
            {suppliers.map(s => (
              <TouchableOpacity key={s.id} style={[styles.chip, selectedSupplier?.id === s.id && styles.chipActive]} onPress={() => setSelectedSupplier(s)}>
                <Text style={[styles.chipText, selectedSupplier?.id === s.id && styles.chipTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>อีกกี่นาทีจะมาส่ง (จำลอง)</Text>
          <View style={styles.chipRow}>
            {ETA_OPTIONS.map(m => (
              <TouchableOpacity key={m} style={[styles.chip, etaMinutes === m && styles.chipActive]} onPress={() => setEtaMinutes(m)}>
                <Text style={[styles.chipText, etaMinutes === m && styles.chipTextActive]}>{m} นาที</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>เลือกสินค้าที่จะสั่งเข้าคลัง</Text>
          {products.map(p => {
            const inCart = cart.find(c => c.product_id === p.id);
            return (
              <View key={p.id} style={styles.productRow}>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                {inCart ? (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(p.id, inCart.quantity - 1)}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
                    <Text style={styles.qtyText}>{inCart.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(p.id, inCart.quantity + 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => removeFromCart(p.id)}><Text style={styles.removeText}>ลบ</Text></TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(p)}><Text style={styles.addBtnText}>+ เพิ่ม</Text></TouchableOpacity>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.submitBtn, (!selectedSupplier || cart.length === 0 || submitting) && { opacity: 0.5 }]}
            onPress={handleCreatePO}
            disabled={!selectedSupplier || cart.length === 0 || submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'กำลังสั่ง...' : `สั่งซื้อ (${cart.length} รายการ)`}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- ลิสต์ PO ----------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1722" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Purchase Orders</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setView('form')}>
          <Text style={styles.newBtnText}>+ New PO</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listPadding}>
        {pos.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีใบสั่งซื้อ</Text>
        ) : pos.map(po => (
          <View key={po.id} style={styles.poCard}>
            <View style={styles.poCardHeader}>
              <Text style={styles.poTitle}>PO-{String(po.id).padStart(4, '0')} · {po.supplier_name}</Text>
              {po.status === 'arrived' ? (
                <View style={[styles.statusBadge, { backgroundColor: '#C0DD97' }]}><Text style={[styles.statusText, { color: '#173404' }]}>รับของแล้ว</Text></View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#FAC775' }]}><Text style={[styles.statusText, { color: '#412402' }]}>รอส่งของ</Text></View>
              )}
            </View>

            {po.items.map(it => (
              <Text key={it.id} style={styles.poItemText}>{it.product_name} x{it.quantity}</Text>
            ))}

            {po.status === 'pending' ? (
              <View style={styles.countdownRow}>
                <Text style={styles.countdownText}>⏱ อีก {formatCountdown(po.remaining_seconds)}</Text>
                <TouchableOpacity style={styles.forceBtn} onPress={() => forceReceive(po.id)}>
                  <Text style={styles.forceBtnText}>รับเลยตอนนี้</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.receivedText}>รับเมื่อ {new Date(po.created_at).toLocaleTimeString('th-TH')}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e141b' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 30 : 20, backgroundColor: '#0f1722', borderBottomWidth: 1, borderBottomColor: '#1e2d3e' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  backText: { color: '#66c0f4', fontSize: 14, fontWeight: '700' },

  newBtn: { backgroundColor: '#66c0f4', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  newBtnText: { color: '#0e141b', fontSize: 13, fontWeight: '800' },

  listPadding: { padding: 16 },
  emptyText: { fontSize: 13, color: '#4c5b6a', textAlign: 'center', marginTop: 30 },

  poCard: { backgroundColor: '#17202d', borderWidth: 1, borderColor: '#2a475e', borderRadius: 12, padding: 14, marginBottom: 10 },
  poCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  poTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  poItemText: { fontSize: 12, color: '#c7d5e0', marginBottom: 2 },

  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e2d3e' },
  countdownText: { fontSize: 13, color: '#66c0f4', fontWeight: '700' },
  forceBtn: { backgroundColor: '#0f1722', borderWidth: 1, borderColor: '#2a475e', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  forceBtnText: { fontSize: 11, color: '#a4d007', fontWeight: '700' },
  receivedText: { fontSize: 11, color: '#4c5b6a', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e2d3e' },

  formPadding: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#4c5b6a', textTransform: 'uppercase', marginBottom: 10, marginTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#2a475e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#66c0f4', borderColor: '#66c0f4' },
  chipText: { fontSize: 12, color: '#c7d5e0' },
  chipTextActive: { color: '#0e141b', fontWeight: '700' },

  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e2d3e' },
  productName: { fontSize: 13, color: '#c7d5e0', flex: 1, marginRight: 10 },
  addBtn: { backgroundColor: '#17202d', borderWidth: 1, borderColor: '#2a475e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { fontSize: 12, color: '#66c0f4', fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#17202d', borderWidth: 1, borderColor: '#2a475e', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#c7d5e0', fontWeight: '700' },
  qtyText: { fontSize: 13, color: '#ffffff', fontWeight: '700', minWidth: 20, textAlign: 'center' },
  removeText: { fontSize: 11, color: '#f43f5e', fontWeight: '700', marginLeft: 4 },

  submitBtn: { backgroundColor: '#66c0f4', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitBtnText: { color: '#0e141b', fontWeight: '800', fontSize: 15 },
});
