import React, {
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

const API_URL =
  'http://119.59.102.161:3100/api';

type Order = {
  id: number;
  user_id: number;
  username?: string;
  total_amount: number;
  shipping_address?: string;
  status?: string;
  tracking_number?: string;
  shipping_date?: string;
  estimated_delivery?: string;
  created_at?: string;
};

export default function AdminShipping() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [status, setStatus] =
    useState('preparing');

  const [trackingNumber, setTrackingNumber] =
    useState('');

  const [shippingDate, setShippingDate] =
    useState('');

  const [estimatedDelivery, setEstimatedDelivery] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [adminId, setAdminId] =
    useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const goHome = () => {
    router.replace('/');
  };

  const checkAdmin = async () => {
    try {
      if (Platform.OS !== 'web') {
        setLoading(false);
        return;
      }

      const role =
        window.localStorage.getItem('role');

      const id =
        window.localStorage.getItem('userId');

      if (
        role?.trim().toLowerCase() !==
          'admin' ||
        !id
      ) {
        Alert.alert(
          'ไม่มีสิทธิ์',
          'หน้านี้สำหรับ Admin เท่านั้น',
          [
            {
              text: 'ตกลง',
              onPress: goHome,
            },
          ]
        );

        return;
      }

      setAdminId(id);

      await loadOrders(id);
    } catch (error) {
      console.log(
        'checkAdmin error:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถตรวจสอบสิทธิ์ได้'
      );
    }
  };

  const loadOrders = async (
    id: string
  ) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/shipping?admin_id=${encodeURIComponent(
          id
        )}`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'ไม่สามารถโหลดข้อมูล Shipping ได้'
        );
      }

      setOrders(
        Array.isArray(data)
          ? data
          : data.orders || []
      );
    } catch (error: any) {
      console.log(
        'loadOrders error:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถโหลดข้อมูล Shipping ได้'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (
    value?: string
  ) => {
    if (!value) return '';

    const text =
      String(value).substring(0, 10);

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(text)
    ) {
      const parts = text.split('-');

      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return text;
  };

  const formatDateForDatabase = (
    value: string
  ) => {
    const text = value.trim();

    if (!text) return null;

    const match = text.match(
      /^(\d{2})-(\d{2})-(\d{4})$/
    );

    if (!match) return null;

    const day = match[1];
    const month = match[2];
    const year = match[3];

    return `${year}-${month}-${day}`;
  };

  const openEdit = (order: Order) => {
    setSelectedOrder(order);

    setStatus(
      order.status || 'preparing'
    );

    setTrackingNumber(
      order.tracking_number
        ? String(
            order.tracking_number
          )
        : ''
    );

    setShippingDate(
      formatDateForInput(
        order.shipping_date
      )
    );

    setEstimatedDelivery(
      formatDateForInput(
        order.estimated_delivery
      )
    );
  };

  const saveShipping = async () => {
    if (!selectedOrder || !adminId) {
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่พบข้อมูล Admin หรือ Order'
      );

      return;
    }

    if (
      shippingDate &&
      !/^\d{2}-\d{2}-\d{4}$/.test(
        shippingDate.trim()
      )
    ) {
      Alert.alert(
        'รูปแบบวันที่ไม่ถูกต้อง',
        'กรุณาใส่วันที่แบบ วัน-เดือน-ปี\nตัวอย่าง: 30-09-2026'
      );

      return;
    }

    if (
      estimatedDelivery &&
      !/^\d{2}-\d{2}-\d{4}$/.test(
        estimatedDelivery.trim()
      )
    ) {
      Alert.alert(
        'รูปแบบวันที่ไม่ถูกต้อง',
        'กรุณาใส่วันที่แบบ วัน-เดือน-ปี\nตัวอย่าง: 02-10-2026'
      );

      return;
    }

    const dbShippingDate =
      formatDateForDatabase(
        shippingDate
      );

    const dbEstimatedDelivery =
      formatDateForDatabase(
        estimatedDelivery
      );

    try {
      setSaving(true);

      const body = {
        admin_id: Number(adminId),

        status,

        tracking_number:
          trackingNumber.trim() ||
          null,

        shipping_date:
          dbShippingDate,

        estimated_delivery:
          dbEstimatedDelivery,
      };

      console.log(
        'Updating shipping:',
        body
      );

      const response = await fetch(
        `${API_URL}/orders/${selectedOrder.id}/shipping`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(body),
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          error:
            text ||
            'Server ไม่ส่งข้อมูลกลับมา',
        };
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'ไม่สามารถอัปเดตข้อมูลได้'
        );
      }

      Alert.alert(
        'สำเร็จ',
        'อัปเดตข้อมูลการจัดส่งเรียบร้อยแล้ว'
      );

      setSelectedOrder(null);

      await loadOrders(adminId);
    } catch (error: any) {
      console.log(
        'saveShipping error:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาดในการอัปเดตข้อมูล',
        error?.message ||
          'ไม่สามารถเชื่อมต่อกับ Server ได้'
      );
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (
    value?: string
  ) => {
    switch (value) {
      case 'preparing':
        return 'กำลังเตรียมสินค้า';

      case 'shipping':
        return 'กำลังจัดส่ง';

      case 'delivered':
        return 'จัดส่งสำเร็จ';

      default:
        return value || '-';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          กำลังโหลดข้อมูล...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goHome}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>
              Shipping Admin
            </Text>

            <Text style={styles.subtitle}>
              จัดการสถานะและข้อมูลการจัดส่ง
            </Text>
          </View>
        </View>

        {!selectedOrder ? (
          <>
            <View
              style={styles.summaryBox}
            >
              <Text
                style={styles.summaryTitle}
              >
                รายการคำสั่งซื้อ
              </Text>

              <Text
                style={styles.summaryText}
              >
                ทั้งหมด {orders.length}{' '}
                รายการ
              </Text>
            </View>

            {orders.length === 0 ? (
              <View
                style={styles.emptyBox}
              >
                <Text
                  style={styles.emptyIcon}
                >
                  📦
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  ยังไม่มีคำสั่งซื้อ
                </Text>
              </View>
            ) : (
              orders.map((order) => (
                <View
                  key={order.id}
                  style={styles.orderCard}
                >
                  <View
                    style={
                      styles.orderHeader
                    }
                  >
                    <View>
                      <Text
                        style={styles.orderId}
                      >
                        Order #{order.id}
                      </Text>

                      <Text
                        style={
                          styles.username
                        }
                      >
                        ลูกค้า:{' '}
                        {order.username ||
                          '-'}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.statusBadge
                      }
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {statusLabel(
                          order.status
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.infoRow}
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      ยอดรวม
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      ฿
                      {Number(
                        order.total_amount ||
                          0
                      ).toLocaleString()}
                    </Text>
                  </View>

                  <View
                    style={styles.infoRow}
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Tracking
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {order.tracking_number ||
                        '-'}
                    </Text>
                  </View>

                  <View
                    style={styles.infoRow}
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      วันจัดส่ง
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {formatDateForInput(
                        order.shipping_date
                      ) || '-'}
                    </Text>
                  </View>

                  <View
                    style={styles.infoRow}
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      คาดว่าจะถึง
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {formatDateForInput(
                        order.estimated_delivery
                      ) || '-'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.editButton
                    }
                    onPress={() =>
                      openEdit(order)
                    }
                  >
                    <Text
                      style={
                        styles.editButtonText
                      }
                    >
                      แก้ไขข้อมูลการจัดส่ง
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <View
            style={styles.editCard}
          >
            <Text
              style={styles.editTitle}
            >
              แก้ไข Order #
              {selectedOrder.id}
            </Text>

            <Text
              style={styles.sectionLabel}
            >
              สถานะการจัดส่ง
            </Text>

            <View
              style={styles.statusButtons}
            >
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'preparing' &&
                    styles.statusButtonActive,
                ]}
                onPress={() =>
                  setStatus('preparing')
                }
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status ===
                      'preparing' &&
                      styles.statusButtonTextActive,
                  ]}
                >
                  📦 กำลังเตรียมสินค้า
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'shipping' &&
                    styles.statusButtonActive,
                ]}
                onPress={() =>
                  setStatus('shipping')
                }
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === 'shipping' &&
                      styles.statusButtonTextActive,
                  ]}
                >
                  🚚 กำลังจัดส่ง
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'delivered' &&
                    styles.statusButtonActive,
                ]}
                onPress={() =>
                  setStatus('delivered')
                }
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === 'delivered' &&
                      styles.statusButtonTextActive,
                  ]}
                >
                  ✅ จัดส่งสำเร็จ
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={styles.sectionLabel}
            >
              Tracking Number
            </Text>

            <TextInput
              style={styles.input}
              value={trackingNumber}
              onChangeText={
                setTrackingNumber
              }
              placeholder="เช่น TH123456789"
              placeholderTextColor="#9CA3AF"
            />

            <Text
              style={styles.sectionLabel}
            >
              วันที่จัดส่ง
            </Text>

            <TextInput
              style={styles.input}
              value={shippingDate}
              onChangeText={
                setShippingDate
              }
              placeholder="DD-MM-YYYY เช่น 30-09-2026"
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />

            <Text
              style={styles.dateHint}
            >
              รูปแบบ วัน-เดือน-ปี เช่น
              30-09-2026
            </Text>

            <Text
              style={styles.sectionLabel}
            >
              วันที่คาดว่าจะถึง
            </Text>

            <TextInput
              style={styles.input}
              value={estimatedDelivery}
              onChangeText={
                setEstimatedDelivery
              }
              placeholder="DD-MM-YYYY เช่น 02-10-2026"
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />

            <Text
              style={styles.dateHint}
            >
              รูปแบบ วัน-เดือน-ปี เช่น
              02-10-2026
            </Text>

            <Text
              style={styles.sectionLabel}
            >
              ที่อยู่จัดส่ง
            </Text>

            <View
              style={styles.addressBox}
            >
              <Text
                style={styles.addressText}
              >
                {selectedOrder.shipping_address ||
                  '-'}
              </Text>
            </View>

            <View
              style={styles.buttonRow}
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setSelectedOrder(null)
                }
                disabled={saving}
              >
                <Text
                  style={styles.cancelText}
                >
                  ยกเลิก
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving &&
                    styles.disabledButton,
                ]}
                onPress={saveShipping}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={styles.saveText}
                  >
                    บันทึกข้อมูล
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  backText: {
    fontSize: 32,
    lineHeight: 34,
    color: '#2563EB',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748B',
  },

  summaryBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3A8A',
  },

  summaryText: {
    marginTop: 4,
    fontSize: 14,
    color: '#3B82F6',
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 50,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  orderId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  username: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },

  statusBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },

  infoValue: {
    maxWidth: '65%',
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
  },

  editButton: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  editTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 15,
    marginBottom: 8,
  },

  statusButtons: {
    gap: 8,
  },

  statusButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  statusButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },

  statusButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },

  statusButtonTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },

  dateHint: {
    marginTop: 5,
    fontSize: 11,
    color: '#94A3B8',
  },

  addressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  addressText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 25,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },
});