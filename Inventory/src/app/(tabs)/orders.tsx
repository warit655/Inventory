import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

type Order = {
  id: number;
  total_amount: string;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
};

type OrderDetail = Order & {
  shipping_address: string;
  items: OrderItem[];
};

const STATUS_MAP: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  preparing: {
    label: 'กำลังเตรียมสินค้า',
    bg: '#FEF3C7',
    color: '#92400E',
  },

  shipping: {
    label: 'กำลังจัดส่ง',
    bg: '#DBEAFE',
    color: '#1D4ED8',
  },

  delivered: {
    label: 'จัดส่งสำเร็จ',
    bg: '#DCFCE7',
    color: '#166534',
  },
};

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] =
    useState<OrderDetail | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const userId =
        Platform.OS === 'web'
          ? window.localStorage.getItem('userId')
          : null;

      if (!userId) {
        router.replace('/login');
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/orders/${userId}`
      );

      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const openOrderDetail = async (orderId: number) => {
    setDetailLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/detail/${orderId}`
      );

      if (res.ok) {
        setSelectedOrder(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderOrder = ({
    item,
  }: {
    item: Order;
  }) => {
    const statusInfo =
      STATUS_MAP[item.status] ||
      STATUS_MAP.preparing;

    const dateText = new Date(
      item.created_at
    ).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => openOrderDetail(item.id)}
      >
        <View style={styles.orderCardHeader}>
          <View>
            <Text style={styles.orderId}>
              Order #{item.id}
            </Text>

            <Text style={styles.orderDate}>
              {dateText}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusInfo.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusInfo.color,
                },
              ]}
            >
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderCardFooter}>
          <Text style={styles.totalLabel}>
            ยอดรวม
          </Text>

          <Text style={styles.totalValue}>
            ฿
            {Number(
              item.total_amount
            ).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F1722"
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Order History
        </Text>

        <Text style={styles.headerSubtitle}>
          ประวัติการสั่งซื้อของคุณ
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#3B82F6"
          />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>
            📦
          </Text>

          <Text style={styles.emptyText}>
            ยังไม่มีประวัติการสั่งซื้อ
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderOrder}
          contentContainerStyle={
            styles.listPadding
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {(selectedOrder || detailLoading) && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {detailLoading ? (
              <ActivityIndicator
                size="large"
                color="#3B82F6"
                style={{ padding: 30 }}
              />
            ) : (
              selectedOrder && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Order #{selectedOrder.id}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        setSelectedOrder(null)
                      }
                    >
                      <Text style={styles.closeBtn}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.modalStatus,
                      {
                        backgroundColor:
                          (
                            STATUS_MAP[
                              selectedOrder.status
                            ] ||
                            STATUS_MAP.preparing
                          ).bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalStatusText,
                        {
                          color:
                            (
                              STATUS_MAP[
                                selectedOrder.status
                              ] ||
                              STATUS_MAP.preparing
                            ).color,
                        },
                      ]}
                    >
                      {
                        (
                          STATUS_MAP[
                            selectedOrder.status
                          ] ||
                          STATUS_MAP.preparing
                        ).label
                      }
                    </Text>
                  </View>

                  <ScrollView
                    style={{ maxHeight: 380 }}
                  >
                    <Text style={styles.sectionLabel}>
                      ที่อยู่จัดส่ง
                    </Text>

                    <Text
                      style={styles.addressText}
                    >
                      {
                        selectedOrder.shipping_address
                      }
                    </Text>

                    <Text
                      style={[
                        styles.sectionLabel,
                        { marginTop: 16 },
                      ]}
                    >
                      รายการสินค้า
                    </Text>

                    {selectedOrder.items.map(
                      (it) => (
                        <View
                          key={it.id}
                          style={styles.itemRow}
                        >
                          <View
                            style={{ flex: 1 }}
                          >
                            <Text
                              style={styles.itemName}
                              numberOfLines={2}
                            >
                              {it.product_name}
                            </Text>

                            <Text
                              style={styles.itemQty}
                            >
                              x{it.quantity}
                            </Text>
                          </View>

                          <Text
                            style={styles.itemPrice}
                          >
                            ฿
                            {(
                              Number(
                                it.price_at_purchase
                              ) *
                              it.quantity
                            ).toLocaleString()}
                          </Text>
                        </View>
                      )
                    )}
                  </ScrollView>

                  <View
                    style={styles.modalTotalRow}
                  >
                    <Text
                      style={styles.modalTotalLabel}
                    >
                      ยอดรวมทั้งหมด
                    </Text>

                    <Text
                      style={styles.modalTotalValue}
                    >
                      ฿
                      {Number(
                        selectedOrder.total_amount
                      ).toLocaleString()}
                    </Text>
                  </View>
                </>
              )
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    padding: 20,
    paddingTop:
      Platform.OS === 'web' ? 30 : 20,
    backgroundColor: '#0F1722',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D3E',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },

  listPadding: {
    padding: 16,
    paddingBottom: 30,
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  orderDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },

  totalLabel: {
    fontSize: 12,
    color: '#64748B',
  },

  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  closeBtn: {
    fontSize: 18,
    color: '#64748B',
    padding: 4,
  },

  modalStatus: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },

  modalStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  addressText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  itemName: {
    fontSize: 13,
    color: '#334155',
  },

  itemQty: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 10,
  },

  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  modalTotalLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },

  modalTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
});