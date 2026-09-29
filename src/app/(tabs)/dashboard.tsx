import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = 'http://119.59.102.161:3100/api';

type LowStock = {
  id: number;
  name: string;
  brand?: string | null;
  stock: number;
};

type SalesTrend = {
  date: string;
  total: number;
};

type DashboardData = {
  todayOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  monthProfit: number;
  lowStock: LowStock[];
  salesTrend: SalesTrend[];
};

export default function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData>({
    todayOrders: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    monthProfit: 0,
    lowStock: [],
    salesTrend: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = () => {
    if (Platform.OS !== 'web') {
      loadDashboard();
      return;
    }

    const role = window.localStorage.getItem('role');

    if (role?.trim().toLowerCase() !== 'admin') {
      Alert.alert(
        'ไม่มีสิทธิ์',
        'หน้านี้สำหรับ Admin เท่านั้น'
      );

      router.replace('/');
      return;
    }

    loadDashboard();
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/dashboard`
      );

      if (!response.ok) {
        throw new Error('โหลด Dashboard ไม่สำเร็จ');
      }

      const result = await response.json();

      setData({
        todayOrders: Number(result.todayOrders || 0),
        todayRevenue: Number(result.todayRevenue || 0),
        monthRevenue: Number(result.monthRevenue || 0),
        monthProfit: Number(result.monthProfit || 0),
        lowStock: result.lowStock || [],
        salesTrend: result.salesTrend || [],
      });
    } catch (error) {
      console.log('Dashboard Error:', error);

      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถโหลดข้อมูล Dashboard ได้'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: number) => {
    return `฿${Number(value || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    try {
      const d = new Date(date);

      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return date;
    }
  };

  const getMaxSales = () => {
    if (!data.salesTrend.length) {
      return 1;
    }

    return Math.max(
      ...data.salesTrend.map((item) =>
        Number(item.total || 0)
      ),
      1
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>IT</Text>
        </View>

        <ActivityIndicator
          size="small"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>
              Dashboard
            </Text>

            <View style={styles.liveDot} />
          </View>

          <Text style={styles.headerSubtitle}>
            Store overview & performance
          </Text>
        </View>

        <View style={styles.adminBadge}>
          <View style={styles.adminCircle}>
            <Text style={styles.adminIcon}>♛</Text>
          </View>

          <View>
            <Text style={styles.adminLabel}>
              ADMIN
            </Text>

            <Text style={styles.adminStatus}>
              Online
            </Text>
          </View>
        </View>
      </View>

      {/* REFRESH */}
      <View style={styles.actionRow}>
        <Text style={styles.updatedText}>
          Overview of your IT store
        </Text>

        <Pressable
          style={styles.refreshButton}
          onPress={loadDashboard}
        >
          <Text style={styles.refreshIcon}>↻</Text>

          <Text style={styles.refreshText}>
            Refresh
          </Text>
        </Pressable>
      </View>

      {/* KPI CARDS */}
      <View style={styles.kpiGrid}>

        {/* Orders */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <View
              style={[
                styles.iconBox,
                styles.blueIcon,
              ]}
            >
              <Text style={styles.iconText}>▣</Text>
            </View>

            <Text style={styles.kpiPeriod}>
              TODAY
            </Text>
          </View>

          <Text style={styles.kpiTitle}>
            Orders
          </Text>

          <Text style={styles.kpiValue}>
            {data.todayOrders.toLocaleString('th-TH')}
          </Text>

          <Text style={styles.kpiDescription}>
            Total orders today
          </Text>
        </View>

        {/* Today Revenue */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <View
              style={[
                styles.iconBox,
                styles.greenIcon,
              ]}
            >
              <Text style={styles.iconText}>฿</Text>
            </View>

            <Text style={styles.kpiPeriod}>
              TODAY
            </Text>
          </View>

          <Text style={styles.kpiTitle}>
            Revenue
          </Text>

          <Text style={styles.kpiValue}>
            {formatMoney(data.todayRevenue)}
          </Text>

          <Text style={styles.kpiDescription}>
            Sales revenue today
          </Text>
        </View>

        {/* Month Revenue */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <View
              style={[
                styles.iconBox,
                styles.purpleIcon,
              ]}
            >
              <Text style={styles.iconText}>↗</Text>
            </View>

            <Text style={styles.kpiPeriod}>
              MONTH
            </Text>
          </View>

          <Text style={styles.kpiTitle}>
            Revenue
          </Text>

          <Text style={styles.kpiValue}>
            {formatMoney(data.monthRevenue)}
          </Text>

          <Text style={styles.kpiDescription}>
            Revenue this month
          </Text>
        </View>

        {/* Profit */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <View
              style={[
                styles.iconBox,
                styles.goldIcon,
              ]}
            >
              <Text style={styles.iconText}>◆</Text>
            </View>

            <Text style={styles.kpiPeriod}>
              MONTH
            </Text>
          </View>

          <Text style={styles.kpiTitle}>
            Profit
          </Text>

          <Text
            style={[
              styles.kpiValue,
              {
                color:
                  data.monthProfit >= 0
                    ? '#16A34A'
                    : '#DC2626',
              },
            ]}
          >
            {formatMoney(data.monthProfit)}
          </Text>

          <Text style={styles.kpiDescription}>
            Estimated monthly profit
          </Text>
        </View>
      </View>

      {/* MAIN GRID */}
      <View style={styles.mainGrid}>

        {/* SALES CHART */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                Sales Overview
              </Text>

              <Text style={styles.cardSubtitle}>
                Revenue for the last 7 days
              </Text>
            </View>

            <View style={styles.chartBadge}>
              <View style={styles.chartBadgeDot} />

              <Text style={styles.chartBadgeText}>
                Sales
              </Text>
            </View>
          </View>

          {data.salesTrend.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartIcon}>
                —
              </Text>

              <Text style={styles.emptyText}>
                No sales data available
              </Text>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              {/* Y AXIS */}
              <View style={styles.yAxis}>
                <Text style={styles.axisText}>
                  ฿{Math.round(getMaxSales()).toLocaleString('th-TH')}
                </Text>

                <Text style={styles.axisText}>
                  ฿{Math.round(
                    getMaxSales() * 0.66
                  ).toLocaleString('th-TH')}
                </Text>

                <Text style={styles.axisText}>
                  ฿{Math.round(
                    getMaxSales() * 0.33
                  ).toLocaleString('th-TH')}
                </Text>

                <Text style={styles.axisText}>
                  ฿0
                </Text>
              </View>

              <View style={styles.chartArea}>
                {/* GRID */}
                <View
                  style={[
                    styles.gridLine,
                    { top: 0 },
                  ]}
                />

                <View
                  style={[
                    styles.gridLine,
                    { top: '33%' },
                  ]}
                />

                <View
                  style={[
                    styles.gridLine,
                    { top: '66%' },
                  ]}
                />

                <View
                  style={[
                    styles.gridLine,
                    { bottom: 0 },
                  ]}
                />

                {/* BARS */}
                <View style={styles.bars}>
                  {data.salesTrend.map(
                    (item, index) => {
                      const value = Number(
                        item.total || 0
                      );

                      const height =
                        (value / getMaxSales()) *
                        145;

                      return (
                        <View
                          key={`${item.date}-${index}`}
                          style={styles.barColumn}
                        >
                          <Text
                            style={styles.barValue}
                          >
                            {value > 0
                              ? `฿${value.toLocaleString(
                                  'th-TH'
                                )}`
                              : '—'}
                          </Text>

                          <View
                            style={styles.barWrapper}
                          >
                            <View
                              style={[
                                styles.bar,
                                {
                                  height:
                                    Math.max(
                                      height,
                                      5
                                    ),
                                },
                              ]}
                            />
                          </View>

                          <Text
                            style={styles.barDate}
                          >
                            {formatDate(
                              item.date
                            )}
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* STOCK */}
        <View style={styles.stockCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                Stock Alert
              </Text>

              <Text style={styles.cardSubtitle}>
                Products running low
              </Text>
            </View>

            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>
                {data.lowStock.length}
              </Text>
            </View>
          </View>

          {data.lowStock.length === 0 ? (
            <View style={styles.emptyStock}>
              <View style={styles.successCircle}>
                <Text style={styles.successIcon}>
                  ✓
                </Text>
              </View>

              <Text style={styles.emptyStockTitle}>
                Stock is healthy
              </Text>

              <Text style={styles.emptyStockText}>
                No products are running low
              </Text>
            </View>
          ) : (
            <View style={styles.stockList}>
              {data.lowStock
                .slice(0, 6)
                .map((product) => (
                  <View
                    key={product.id}
                    style={styles.stockRow}
                  >
                    <View
                      style={styles.productAvatar}
                    >
                      <Text
                        style={styles.productAvatarText}
                      >
                        {product.name
                          ?.charAt(0)
                          ?.toUpperCase() || 'P'}
                      </Text>
                    </View>

                    <View
                      style={styles.stockInfo}
                    >
                      <Text
                        style={styles.productName}
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>

                      <Text
                        style={styles.productBrand}
                      >
                        {product.brand ||
                          'IT Product'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.stockStatus,
                        {
                          backgroundColor:
                            product.stock <= 0
                              ? '#FEF2F2'
                              : '#FFF7ED',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockNumber,
                          {
                            color:
                              product.stock <=
                              0
                                ? '#DC2626'
                                : '#EA580C',
                          },
                        ]}
                      >
                        {product.stock <= 0
                          ? 'OUT'
                          : product.stock}
                      </Text>

                      {product.stock > 0 && (
                        <Text
                          style={
                            styles.stockUnit
                          }
                        >
                          pcs
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          IT Store Management System
        </Text>

        <Text style={styles.footerDot}>
          •
        </Text>

        <Text style={styles.footerText}>
          Dashboard
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 45,
    maxWidth: 1500,
    width: '100%',
    alignSelf: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  loadingLogo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  loadingLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginLeft: 10,
    marginTop: 3,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    letterSpacing: 0.1,
  },

  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  adminCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  adminIcon: {
    color: '#2563EB',
    fontSize: 19,
  },

  adminLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },

  adminStatus: {
    fontSize: 10,
    color: '#22C55E',
    marginTop: 2,
    fontWeight: '600',
  },

  /* ACTION */

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  updatedText: {
    color: '#94A3B8',
    fontSize: 13,
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  refreshIcon: {
    color: '#2563EB',
    fontSize: 17,
    marginRight: 6,
  },

  refreshText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  /* KPI */

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
  },

  kpiCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  blueIcon: {
    backgroundColor: '#EFF6FF',
  },

  greenIcon: {
    backgroundColor: '#ECFDF5',
  },

  purpleIcon: {
    backgroundColor: '#F5F3FF',
  },

  goldIcon: {
    backgroundColor: '#FFFBEB',
  },

  iconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },

  kpiPeriod: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },

  kpiTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  kpiValue: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 5,
    letterSpacing: -0.6,
  },

  kpiDescription: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 5,
  },

  /* MAIN */

  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },

  chartCard: {
    flex: 2,
    minWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    minHeight: 370,
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  stockCard: {
    flex: 1,
    minWidth: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    minHeight: 370,
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },

  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  chartBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    marginRight: 6,
  },

  chartBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
  },

  /* CHART */

  chartContainer: {
    flexDirection: 'row',
    height: 255,
  },

  yAxis: {
    width: 70,
    justifyContent: 'space-between',
    paddingBottom: 29,
  },

  axisText: {
    color: '#94A3B8',
    fontSize: 9,
    textAlign: 'right',
    paddingRight: 8,
  },

  chartArea: {
    flex: 1,
    height: 220,
    position: 'relative',
  },

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  bars: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },

  barValue: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 5,
  },

  barWrapper: {
    height: 170,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  bar: {
    width: 28,
    backgroundColor: '#2563EB',
    borderRadius: 7,
    minHeight: 5,
  },

  barDate: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 9,
  },

  emptyChart: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyChartIcon: {
    fontSize: 40,
    color: '#CBD5E1',
    marginBottom: 8,
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },

  /* STOCK */

  alertBadge: {
    minWidth: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  alertBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '900',
  },

  stockList: {
    marginTop: -3,
  },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  productAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  productAvatarText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '900',
  },

  stockInfo: {
    flex: 1,
    marginRight: 10,
  },

  productName: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '800',
  },

  productBrand: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 3,
  },

  stockStatus: {
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },

  stockNumber: {
    fontSize: 12,
    fontWeight: '900',
  },

  stockUnit: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 1,
  },

  emptyStock: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 240,
  },

  successCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  successIcon: {
    color: '#16A34A',
    fontSize: 25,
    fontWeight: '900',
  },

  emptyStockTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },

  emptyStockText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },

  /* FOOTER */

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  footerText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },

  footerDot: {
    color: '#CBD5E1',
    marginHorizontal: 7,
  },
});