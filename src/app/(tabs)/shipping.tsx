import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_BASE_URL =
  'http://119.59.102.161:3100/api';

type ShippingOrder = {
  id: number;
  total_amount: string;
  status: string;
  tracking_number: string | null;
  shipping_date: string | null;
  estimated_delivery: string | null;
  shipping_address: string;
  created_at: string;
};

const STATUS_MAP: Record<
  string,
  {
    label: string;
    icon: string;
  }
> = {
  preparing: {
    label: 'กำลังเตรียมสินค้า',
    icon: '📦',
  },

  shipping: {
    label: 'กำลังจัดส่ง',
    icon: '🚚',
  },

  delivered: {
    label: 'จัดส่งสำเร็จ',
    icon: '✅',
  },
};

export default function ShippingScreen() {
  const [orders, setOrders] =
    useState<ShippingOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const fetchShipping = async () => {
    const userId =
      Platform.OS === 'web'
        ? window.localStorage.getItem(
            'userId'
          )
        : null;

    const role =
      Platform.OS === 'web'
        ? window.localStorage.getItem('role')
        : null;

    setIsAdmin(
      role?.trim().toLowerCase() === 'admin'
    );

    if (!userId) {
      router.replace('/login');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/shipping/${userId}`
      );

      if (response.ok) {
        const data =
          await response.json();

        setOrders(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchShipping();
    }, [])
  );

  const getStatus = (status: string) => {
    return (
      STATUS_MAP[status] || {
        label: status,
        icon: '📦',
      }
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#3B82F6"
          />

          <Text style={styles.loadingText}>
            กำลังโหลดข้อมูลการจัดส่ง...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              🚚 การจัดส่ง
            </Text>

            <Text style={styles.headerSubtitle}>
              ติดตามสถานะคำสั่งซื้อของคุณ
            </Text>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() =>
                router.replace(
                  '/admin-shipping'
                )
              }
              activeOpacity={0.8}
            >
              <View
                style={styles.adminIconRow}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={21}
                  color="#2563EB"
                />

                <MaterialCommunityIcons
                  name="truck-outline"
                  size={21}
                  color="#2563EB"
                />
              </View>

              <Text
                style={styles.adminButtonText}
              >
                Shipping Admin
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text style={styles.emptyTitle}>
              ยังไม่มีข้อมูลการจัดส่ง
            </Text>

            <Text style={styles.emptyText}>
              เมื่อคุณสั่งซื้อสินค้า
              ข้อมูลการจัดส่งจะแสดงที่นี่
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const status = getStatus(
              order.status
            );

            return (
              <View
                key={order.id}
                style={styles.card}
              >
                <View
                  style={styles.cardHeader}
                >
                  <View>
                    <Text
                      style={styles.orderId}
                    >
                      Order #{order.id}
                    </Text>

                    <Text
                      style={styles.orderDate}
                    >
                      {new Date(
                        order.created_at
                      ).toLocaleDateString(
                        'th-TH'
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.statusBadge}
                  >
                    <Text
                      style={styles.statusIcon}
                    >
                      {status.icon}
                    </Text>

                    <Text
                      style={styles.statusText}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text
                    style={styles.infoLabel}
                  >
                    Tracking Number
                  </Text>

                  <Text
                    style={styles.infoValue}
                  >
                    {order.tracking_number ||
                      'ยังไม่มี'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text
                    style={styles.infoLabel}
                  >
                    วันที่จัดส่ง
                  </Text>

                  <Text
                    style={styles.infoValue}
                  >
                    {order.shipping_date ||
                      'ยังไม่ระบุ'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text
                    style={styles.infoLabel}
                  >
                    คาดว่าจะได้รับ
                  </Text>

                  <Text
                    style={styles.infoValue}
                  >
                    {order.estimated_delivery ||
                      'ยังไม่ระบุ'}
                  </Text>
                </View>

                <View
                  style={styles.addressBox}
                >
                  <Text
                    style={styles.addressTitle}
                  >
                    📍 ที่อยู่จัดส่ง
                  </Text>

                  <Text
                    style={styles.addressText}
                  >
                    {order.shipping_address ||
                      'ไม่พบข้อมูลที่อยู่'}
                  </Text>
                </View>

                <View
                  style={styles.totalRow}
                >
                  <Text
                    style={styles.totalLabel}
                  >
                    ยอดรวม
                  </Text>

                  <Text
                    style={styles.totalValue}
                  >
                    ฿
                    {Number(
                      order.total_amount || 0
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
  },

  headerSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
  },

  adminButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },

  adminIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  adminButtonText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  orderId: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  orderDate: {
    marginTop: 5,
    fontSize: 12,
    color: '#94A3B8',
  },

  statusBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    maxWidth: 150,
  },

  statusIcon: {
    fontSize: 20,
  },

  statusText: {
    marginTop: 3,
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },

  infoLabel: {
    color: '#64748B',
    fontSize: 13,
  },

  infoValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },

  addressBox: {
    marginTop: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 13,
  },

  addressTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },

  addressText: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  totalLabel: {
    color: '#64748B',
  },

  totalValue: {
    color: '#2563EB',
    fontSize: 17,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 35,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  emptyText: {
    marginTop: 8,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});