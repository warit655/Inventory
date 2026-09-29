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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3100/api';

type ClaimableItem = {
  order_item_id: number;
  product_name: string;
  quantity: number;
  order_id: number;
  created_at: string;
};

type Claim = {
  id: number;
  product_name: string;
  reason: string;
  stage_name: string;
  stage_order: number;
  created_at: string;
};

type ClaimDetail = Claim & {
  description: string;
  allStages: {
    id: number;
    name: string;
    step_order: number;
  }[];
  currentStage: {
    step_order: number;
  };
};

const REASONS = [
  'จอไม่แสดงผล / ไม่ติด',
  'พัดลมมีเสียงดัง',
  'เครื่องรีสตาร์ทเอง',
  'อื่นๆ',
];

export default function ClaimScreen() {
  const [view, setView] = useState<'list' | 'form'>('list');

  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimableItems, setClaimableItems] = useState<
    ClaimableItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] =
    useState<ClaimableItem | null>(null);

  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selectedDetail, setSelectedDetail] =
    useState<ClaimDetail | null>(null);

  const userId =
    Platform.OS === 'web'
      ? window.localStorage.getItem('userId')
      : null;

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchAll = async () => {
    if (!userId) {
      router.replace('/login');
      return;
    }

    try {
      setLoading(true);

      const [claimsRes, itemsRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/claims/${userId}`),
          fetch(
            `${API_BASE_URL}/orders/${userId}/claimable`
          ),
        ]);

      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setClaimableItems(itemsData);
      }
    } catch (err) {
      console.error('Claim fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  // =====================================================
  // OPEN CLAIM DETAIL
  // =====================================================

  const openDetail = async (claimId: number) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/claims/detail/${claimId}`
      );

      if (res.ok) {
        const data = await res.json();
        setSelectedDetail(data);
      }
    } catch (err) {
      console.error('Claim detail error:', err);
    }
  };

  // =====================================================
  // SUBMIT CLAIM
  // =====================================================

  const handleSubmitClaim = async () => {
    if (!selectedItem || !userId) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/claims`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_item_id:
              selectedItem.order_item_id,
            user_id: userId,
            reason,
            description,
          }),
        }
      );

      if (res.ok) {
        setView('list');
        setSelectedItem(null);
        setDescription('');
        setReason(REASONS[0]);

        await fetchAll();
      }
    } catch (err) {
      console.error('Submit claim error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            กำลังโหลดข้อมูลการเคลม...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // CLAIM FORM
  // =====================================================

  if (view === 'form') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setView('list');
              setSelectedItem(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>
              ←
            </Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              🛠️ แจ้งเคลมสินค้า
            </Text>

            <Text style={styles.headerSubtitle}>
              ส่งคำขอเคลมสินค้า
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.formPadding}
          showsVerticalScrollIndicator={false}
        >
          {!selectedItem ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  เลือกสินค้าที่ต้องการเคลม
                </Text>

                <Text style={styles.sectionSubtitle}>
                  เลือกสินค้าจากรายการที่เคยสั่งซื้อ
                </Text>
              </View>

              {claimableItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>
                    📦
                  </Text>

                  <Text style={styles.emptyTitle}>
                    ไม่มีสินค้าที่สามารถเคลมได้
                  </Text>

                  <Text style={styles.emptyText}>
                    คุณยังไม่มีสินค้าที่ซื้อไว้สำหรับการเคลม
                  </Text>
                </View>
              ) : (
                claimableItems.map(item => (
                  <TouchableOpacity
                    key={item.order_item_id}
                    style={styles.itemPickCard}
                    onPress={() =>
                      setSelectedItem(item)
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={styles.itemPickHeader}
                    >
                      <View style={styles.productIcon}>
                        <Text>
                          📦
                        </Text>
                      </View>

                      <View
                        style={styles.itemPickInfo}
                      >
                        <Text
                          style={styles.itemPickName}
                          numberOfLines={2}
                        >
                          {item.product_name}
                        </Text>

                        <Text
                          style={styles.itemPickMeta}
                        >
                          Order #{item.order_id}
                        </Text>

                        <Text
                          style={styles.itemPickMeta}
                        >
                          จำนวน {item.quantity} ชิ้น
                        </Text>
                      </View>

                      <Text style={styles.arrow}>
                        ›
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : (
            <>
              {/* SELECTED PRODUCT */}
              <View style={styles.selectedItemCard}>
                <View style={styles.selectedItemHeader}>
                  <View style={styles.productIconBlue}>
                    <Text>
                      📦
                    </Text>
                  </View>

                  <View style={styles.itemPickInfo}>
                    <Text
                      style={styles.itemPickNameDark}
                      numberOfLines={2}
                    >
                      {selectedItem.product_name}
                    </Text>

                    <Text style={styles.itemPickMetaDark}>
                      Order #{selectedItem.order_id}
                    </Text>

                    <Text style={styles.itemPickMetaDark}>
                      จำนวน {selectedItem.quantity} ชิ้น
                    </Text>
                  </View>
                </View>
              </View>

              {/* REASON */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  เหตุผลในการเคลม
                </Text>

                <Text style={styles.sectionSubtitle}>
                  เลือกอาการที่พบ
                </Text>
              </View>

              <View style={styles.reasonGroup}>
                {REASONS.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.reasonChip,
                      reason === r &&
                        styles.reasonChipActive,
                    ]}
                    onPress={() => setReason(r)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.reasonChipText,
                        reason === r &&
                          styles.reasonChipTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* DESCRIPTION */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  รายละเอียดเพิ่มเติม
                </Text>

                <Text style={styles.sectionSubtitle}>
                  อธิบายอาการหรือปัญหาที่พบ
                </Text>
              </View>

              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                value={description}
                onChangeText={setDescription}
                placeholder="อธิบายอาการที่พบเพิ่มเติม..."
                placeholderTextColor="#94A3B8"
              />

              {/* SUBMIT */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submitting &&
                    styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitClaim}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>
                  {submitting
                    ? 'กำลังส่งเรื่อง...'
                    : 'ส่งเรื่องเคลม'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // CLAIM LIST
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              🛠️ การเคลม
            </Text>

            <Text style={styles.headerSubtitle}>
              ติดตามสถานะการเคลมสินค้าของคุณ
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newClaimBtn}
            onPress={() => setView('form')}
            activeOpacity={0.8}
          >
            <Text style={styles.newClaimIcon}>
              +
            </Text>

            <Text style={styles.newClaimBtnText}>
              เคลมใหม่
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CLAIM LIST */}
      <ScrollView
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      >
        {claims.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              🛡️
            </Text>

            <Text style={styles.emptyTitle}>
              ยังไม่มีประวัติการเคลม
            </Text>

            <Text style={styles.emptyText}>
              เมื่อคุณส่งเรื่องเคลม
              ข้อมูลจะแสดงที่นี่
            </Text>

            <TouchableOpacity
              style={styles.emptyClaimBtn}
              onPress={() => setView('form')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyClaimBtnText}>
                + แจ้งเคลมสินค้า
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          claims.map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.claimCard}
              onPress={() => openDetail(c.id)}
              activeOpacity={0.85}
            >
              {/* CARD HEADER */}
              <View style={styles.claimCardHeader}>
                <View style={styles.claimHeaderLeft}>
                  <Text style={styles.claimId}>
                    Claim #{c.id}
                  </Text>

                  <Text style={styles.claimDate}>
                    {new Date(
                      c.created_at
                    ).toLocaleDateString('th-TH')}
                  </Text>
                </View>

                <View style={styles.stageBadge}>
                  <Text style={styles.stageBadgeIcon}>
                    🔵
                  </Text>

                  <Text style={styles.stageBadgeText}>
                    {c.stage_name}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* PRODUCT */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  สินค้า
                </Text>

                <Text
                  style={styles.infoValue}
                  numberOfLines={2}
                >
                  {c.product_name}
                </Text>
              </View>

              {/* REASON */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  เหตุผล
                </Text>

                <Text
                  style={styles.infoValue}
                  numberOfLines={2}
                >
                  {c.reason}
                </Text>
              </View>

              {/* DETAIL BOX */}
              <View style={styles.detailBox}>
                <Text style={styles.detailTitle}>
                  📝 รายละเอียดการเคลม
                </Text>

                <Text style={styles.detailText}>
                  กดเพื่อดูรายละเอียดและสถานะการดำเนินการ
                </Text>
              </View>

              {/* FOOTER */}
              <View style={styles.cardFooter}>
                <Text style={styles.viewDetailText}>
                  ดูรายละเอียด
                </Text>

                <Text style={styles.viewDetailArrow}>
                  →
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* =================================================
          CLAIM DETAIL MODAL
      ================================================= */}

      {selectedDetail && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              {/* MODAL HEADER */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleArea}>
                  <Text style={styles.modalClaimId}>
                    Claim #{selectedDetail.id}
                  </Text>

                  <Text
                    style={styles.modalTitle}
                    numberOfLines={2}
                  >
                    {selectedDetail.product_name}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setSelectedDetail(null)
                  }
                  style={styles.closeButton}
                >
                  <Text style={styles.closeBtn}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* STATUS */}
              <View style={styles.modalStatus}>
                <Text style={styles.modalStatusIcon}>
                  🔵
                </Text>

                <Text style={styles.modalStatusText}>
                  {selectedDetail.stage_name}
                </Text>
              </View>

              {/* REASON */}
              <View style={styles.modalInfoBox}>
                <Text style={styles.modalInfoLabel}>
                  เหตุผลในการเคลม
                </Text>

                <Text style={styles.modalInfoValue}>
                  {selectedDetail.reason}
                </Text>
              </View>

              {/* DESCRIPTION */}
              {!!selectedDetail.description && (
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoLabel}>
                    รายละเอียด
                  </Text>

                  <Text style={styles.modalDescription}>
                    {selectedDetail.description}
                  </Text>
                </View>
              )}

              {/* TIMELINE */}
              <Text style={styles.timelineTitle}>
                สถานะการดำเนินการ
              </Text>

              <View style={styles.timeline}>
                {selectedDetail.allStages.map(
                  (stage, index) => {
                    const isDone =
                      stage.step_order <=
                      selectedDetail
                        .currentStage.step_order;

                    const isCurrent =
                      stage.step_order ===
                      selectedDetail
                        .currentStage.step_order;

                    return (
                      <View
                        key={stage.id}
                        style={styles.timelineRow}
                      >
                        <View
                          style={
                            styles.timelineDotCol
                          }
                        >
                          <View
                            style={[
                              styles.timelineDot,
                              isDone &&
                                styles.timelineDotDone,
                              isCurrent &&
                                styles.timelineDotCurrent,
                            ]}
                          >
                            {isDone && (
                              <Text
                                style={
                                  styles.timelineCheck
                                }
                              >
                                ✓
                              </Text>
                            )}
                          </View>

                          {index <
                            selectedDetail
                              .allStages.length -
                              1 && (
                            <View
                              style={[
                                styles.timelineLine,
                                isDone &&
                                  styles.timelineLineDone,
                              ]}
                            />
                          )}
                        </View>

                        <View
                          style={
                            styles.timelineContent
                          }
                        >
                          <Text
                            style={[
                              styles.timelineLabel,
                              isCurrent &&
                                styles.timelineLabelCurrent,
                            ]}
                          >
                            {stage.name}
                          </Text>

                          {isCurrent && (
                            <Text
                              style={
                                styles.currentText
                              }
                            >
                              กำลังดำเนินการ
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  }
                )}
              </View>

              {/* CLOSE */}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() =>
                  setSelectedDetail(null)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={styles.modalCloseButtonText}
                >
                  ปิด
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// =======================================================
// STYLES
// =======================================================

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

  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },

  // =====================================================
  // HEADER
  // =====================================================

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

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  backButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },

  // =====================================================
  // NEW CLAIM BUTTON
  // =====================================================

  newClaimBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },

  newClaimIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  newClaimBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // =====================================================
  // LIST
  // =====================================================

  listPadding: {
    padding: 20,
    paddingBottom: 40,
  },

  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  claimCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  claimHeaderLeft: {
    flex: 1,
  },

  claimId: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  claimDate: {
    marginTop: 5,
    fontSize: 12,
    color: '#94A3B8',
  },

  stageBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    maxWidth: 150,
  },

  stageBadgeIcon: {
    fontSize: 12,
  },

  stageBadgeText: {
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

  detailBox: {
    marginTop: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 13,
  },

  detailTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },

  detailText: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 15,
  },

  viewDetailText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },

  viewDetailArrow: {
    marginLeft: 5,
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '800',
  },

  // =====================================================
  // EMPTY
  // =====================================================

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },

  emptyClaimBtn: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  emptyClaimBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // =====================================================
  // FORM
  // =====================================================

  formPadding: {
    padding: 20,
    paddingBottom: 40,
  },

  sectionHeader: {
    marginBottom: 12,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  sectionSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
  },

  itemPickCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },

  itemPickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  productIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  productIconBlue: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  itemPickInfo: {
    flex: 1,
  },

  itemPickName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  itemPickMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },

  arrow: {
    color: '#94A3B8',
    fontSize: 25,
    marginLeft: 8,
  },

  selectedItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },

  selectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemPickNameDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  itemPickMetaDark: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },

  reasonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  reasonChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },

  reasonChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  reasonChipText: {
    fontSize: 12,
    color: '#475569',
  },

  reasonChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 13,
    color: '#0F172A',
    fontSize: 13,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  submitBtn: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  submitBtnDisabled: {
    opacity: 0.6,
  },

  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  // =====================================================
  // MODAL
  // =====================================================

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 430,
    maxHeight: '88%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  modalTitleArea: {
    flex: 1,
  },

  modalClaimId: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '800',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  closeBtn: {
    fontSize: 16,
    color: '#64748B',
  },

  modalStatus: {
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalStatusIcon: {
    fontSize: 15,
    marginRight: 7,
  },

  modalStatusText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },

  modalInfoBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 13,
  },

  modalInfoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },

  modalInfoValue: {
    marginTop: 5,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },

  modalDescription: {
    marginTop: 5,
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
  },

  timelineTitle: {
    marginTop: 20,
    marginBottom: 14,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },

  timeline: {
    paddingBottom: 5,
  },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  timelineDotCol: {
    alignItems: 'center',
    width: 28,
  },

  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  timelineDotDone: {
    backgroundColor: '#22C55E',
  },

  timelineDotCurrent: {
    backgroundColor: '#2563EB',
  },

  timelineCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 38,
    backgroundColor: '#E2E8F0',
  },

  timelineLineDone: {
    backgroundColor: '#22C55E',
  },

  timelineContent: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 22,
  },

  timelineLabel: {
    fontSize: 13,
    color: '#94A3B8',
    paddingTop: 1,
  },

  timelineLabelCurrent: {
    color: '#2563EB',
    fontWeight: '800',
  },

  currentText: {
    marginTop: 3,
    fontSize: 11,
    color: '#64748B',
  },

  modalCloseButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  modalCloseButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
});