import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

const API_URL = 'http://119.59.102.161:3100/api';

type Stage = {
  id: number;
  name: string;
  step_order: number;
};

type Claim = {
  id: number;
  username?: string;
  product_name: string;
  reason: string;
  description?: string;
  stage_name: string;
  stage_order: number;
  created_at: string;
  current_stage_id: number;
};

export default function ClaimAdmin() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClaim, setSelectedClaim] =
    useState<Claim | null>(null);

  const [selectedStage, setSelectedStage] =
    useState<number | null>(null);

  const [newStageName, setNewStageName] =
    useState('');

  const [saving, setSaving] = useState(false);
  const [adminId, setAdminId] =
    useState<string | null>(null);

  const [page, setPage] = useState<
    'claims' | 'stages'
  >('claims');

  useEffect(() => {
    checkAdmin();
  }, []);

  const goHome = () => {
    router.replace('/');
  };

  // =========================
  // CHECK ADMIN
  // =========================

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

      if (role !== 'admin' || !id) {
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

      await loadData();
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

  // =========================
  // LOAD DATA
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        claimsResponse,
        stagesResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/claims`),
        fetch(`${API_URL}/claim-stages`),
      ]);

      const claimsData =
        await claimsResponse.json();

      const stagesData =
        await stagesResponse.json();

      if (!claimsResponse.ok) {
        throw new Error(
          claimsData.error ||
            'ไม่สามารถโหลดข้อมูล Claim ได้'
        );
      }

      if (!stagesResponse.ok) {
        throw new Error(
          stagesData.error ||
            'ไม่สามารถโหลดข้อมูลขั้นตอน Claim ได้'
        );
      }

      const claimList = Array.isArray(
        claimsData
      )
        ? claimsData
        : claimsData.claims || [];

      const stageList = Array.isArray(
        stagesData
      )
        ? stagesData
        : stagesData.stages || [];

      setClaims(
        claimList.map((claim: any) => ({
          ...claim,
          id: Number(claim.id),
          current_stage_id: Number(
            claim.current_stage_id
          ),
          stage_order: Number(
            claim.stage_order || 0
          ),
          description:
            claim.description || '',
        }))
      );

      setStages(
        stageList.map((stage: any) => ({
          ...stage,
          id: Number(stage.id),
          step_order: Number(
            stage.step_order
          ),
        }))
      );
    } catch (error: any) {
      console.log(
        'loadData error:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถโหลดข้อมูล Claim ได้'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OPEN CLAIM
  // =========================

  const openClaim = (claim: Claim) => {
    console.log(
      'Opening claim:',
      claim.id
    );

    setSelectedClaim(claim);

    setSelectedStage(
      Number(claim.current_stage_id)
    );
  };

  // =========================
  // CLOSE EDIT
  // =========================

  const closeEdit = () => {
    if (saving) {
      return;
    }

    setSelectedClaim(null);
    setSelectedStage(null);
  };

  // =========================
  // SAVE CLAIM STAGE
  // =========================

  const saveClaim = async () => {
    if (!selectedClaim) {
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่พบข้อมูล Claim'
      );

      return;
    }

    if (selectedStage === null) {
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'กรุณาเลือกสถานะการเคลม'
      );

      return;
    }

    if (!adminId) {
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่พบข้อมูล Admin'
      );

      return;
    }

    try {
      setSaving(true);

      const stageId = Number(
        selectedStage
      );

      console.log(
        'Updating Claim:',
        selectedClaim.id,
        'stage:',
        stageId
      );

      const response = await fetch(
        `${API_URL}/claims/${selectedClaim.id}/stage`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            stage_id: stageId,
          }),
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
        'อัปเดตสถานะการเคลมเรียบร้อยแล้ว'
      );

      setSelectedClaim(null);
      setSelectedStage(null);

      await loadData();
    } catch (error: any) {
      console.log(
        'saveClaim error:',
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

  // =========================
  // ADD STAGE
  // =========================

  const addStage = async () => {
    const name =
      newStageName.trim();

    if (!name) {
      Alert.alert(
        'กรุณากรอกข้อมูล',
        'กรุณาระบุชื่อขั้นตอน'
      );

      return;
    }

    const nextOrder =
      stages.length > 0
        ? Math.max(
            ...stages.map(
              stage =>
                Number(
                  stage.step_order
                )
            )
          ) + 1
        : 1;

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/claim-stages`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name,
            step_order: nextOrder,
          }),
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
            'ไม่สามารถเพิ่มขั้นตอนได้'
        );
      }

      Alert.alert(
        'สำเร็จ',
        'เพิ่มขั้นตอนเรียบร้อยแล้ว'
      );

      setNewStageName('');

      await loadData();
    } catch (error: any) {
      console.log(
        'addStage error:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error?.message ||
          'ไม่สามารถเพิ่มขั้นตอนได้'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE STAGE
  // =========================

  const deleteStage = async (
    id: number
  ) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบขั้นตอนนี้หรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              const response =
                await fetch(
                  `${API_URL}/claim-stages/${id}`,
                  {
                    method: 'DELETE',
                  }
                );

              const text =
                await response.text();

              let data: any = {};

              try {
                data =
                  JSON.parse(text);
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
                    'ไม่สามารถลบขั้นตอนได้'
                );
              }

              Alert.alert(
                'สำเร็จ',
                'ลบขั้นตอนเรียบร้อยแล้ว'
              );

              await loadData();
            } catch (error: any) {
              console.log(
                'deleteStage error:',
                error
              );

              Alert.alert(
                'เกิดข้อผิดพลาด',
                error?.message ||
                  'ไม่สามารถลบขั้นตอนได้'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // =========================
  // LOADING
  // =========================

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

  // =========================
  // MAIN
  // =========================

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
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
              Claim Admin
            </Text>

            <Text
              style={styles.subtitle}
            >
              จัดการสถานะและข้อมูลการเคลม
            </Text>
          </View>
        </View>

        {/* TAB */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              page === 'claims' &&
                styles.tabButtonActive,
            ]}
            onPress={() =>
              setPage('claims')
            }
          >
            <Text
              style={[
                styles.tabText,
                page === 'claims' &&
                  styles.tabTextActive,
              ]}
            >
              รายการเคลม
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              page === 'stages' &&
                styles.tabButtonActive,
            ]}
            onPress={() =>
              setPage('stages')
            }
          >
            <Text
              style={[
                styles.tabText,
                page === 'stages' &&
                  styles.tabTextActive,
              ]}
            >
              ขั้นตอนการเคลม
            </Text>
          </TouchableOpacity>
        </View>

        {/* CLAIM LIST */}

        {page === 'claims' ? (
          <>
            <View
              style={styles.summaryBox}
            >
              <Text
                style={styles.summaryTitle}
              >
                รายการเคลม
              </Text>

              <Text
                style={styles.summaryText}
              >
                ทั้งหมด {claims.length}{' '}
                รายการ
              </Text>
            </View>

            {claims.length === 0 ? (
              <View
                style={styles.emptyBox}
              >
                <Text
                  style={styles.emptyIcon}
                >
                  🛡️
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  ยังไม่มีรายการเคลม
                </Text>
              </View>
            ) : (
              claims.map(claim => (
                <View
                  key={claim.id}
                  style={styles.claimCard}
                >
                  <View
                    style={styles.claimHeader}
                  >
                    <View
                      style={
                        styles.claimHeaderLeft
                      }
                    >
                      <Text
                        style={
                          styles.claimId
                        }
                      >
                        Claim #{claim.id}
                      </Text>

                      <Text
                        style={
                          styles.productName
                        }
                        numberOfLines={1}
                      >
                        {claim.product_name}
                      </Text>

                      <Text
                        style={
                          styles.username
                        }
                      >
                        ลูกค้า:{' '}
                        {claim.username ||
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
                        {claim.stage_name}
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
                      สาเหตุ
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {claim.reason}
                    </Text>
                  </View>

                  {/* DETAIL FOR OTHER REASON */}
                  {claim.reason === 'อื่นๆ' && (
                    <View
                      style={
                        styles.descriptionBox
                      }
                    >
                      <Text
                        style={
                          styles.descriptionLabel
                        }
                      >
                        รายละเอียดเพิ่มเติม
                      </Text>

                      <Text
                        style={
                          styles.descriptionText
                        }
                      >
                        {claim.description?.trim()
                          ? claim.description
                          : '-'}
                      </Text>
                    </View>
                  )}

                  <View
                    style={styles.infoRow}
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      วันที่แจ้ง
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {new Date(
                        claim.created_at
                      ).toLocaleDateString(
                        'th-TH'
                      )}
                    </Text>
                  </View>

                  {/* EDIT BUTTON */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed &&
                        styles.editButtonPressed,
                    ]}
                    onPress={() =>
                      openClaim(claim)
                    }
                  >
                    <Text
                      style={
                        styles.editButtonText
                      }
                    >
                      แก้ไขสถานะการเคลม
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </>
        ) : (
          /* STAGE MANAGEMENT */
          <>
            <View
              style={styles.summaryBox}
            >
              <Text
                style={styles.summaryTitle}
              >
                ขั้นตอนการเคลม
              </Text>

              <Text
                style={styles.summaryText}
              >
                ทั้งหมด {stages.length}{' '}
                ขั้นตอน
              </Text>
            </View>

            <View
              style={styles.addStageCard}
            >
              <Text
                style={styles.sectionTitle}
              >
                เพิ่มขั้นตอนใหม่
              </Text>

              <View
                style={styles.addStageRow}
              >
                <TextInput
                  style={
                    styles.addStageInput
                  }
                  value={newStageName}
                  onChangeText={
                    setNewStageName
                  }
                  placeholder="เช่น รอตรวจสอบสินค้า"
                  placeholderTextColor="#9CA3AF"
                />

                <TouchableOpacity
                  style={
                    styles.addStageButton
                  }
                  onPress={addStage}
                  disabled={saving}
                >
                  <Text
                    style={
                      styles.addStageButtonText
                    }
                  >
                    + เพิ่ม
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {stages.map(
              (stage, index) => (
                <View
                  key={stage.id}
                  style={styles.stageCard}
                >
                  <View
                    style={
                      styles.stageNumber
                    }
                  >
                    <Text
                      style={
                        styles.stageNumberText
                      }
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.stageInfo
                    }
                  >
                    <Text
                      style={
                        styles.stageName
                      }
                    >
                      {stage.name}
                    </Text>

                    <Text
                      style={
                        styles.stageOrder
                      }
                    >
                      ขั้นตอนที่{' '}
                      {stage.step_order}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.deleteButton
                    }
                    onPress={() =>
                      deleteStage(
                        stage.id
                      )
                    }
                    disabled={saving}
                  >
                    <Text
                      style={
                        styles.deleteText
                      }
                    >
                      ลบ
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            )}

            <View
              style={styles.hintBox}
            >
              <Text
                style={styles.hintText}
              >
                💡 ลำดับขั้นตอนจะเรียงตาม
                step_order
                ที่กำหนดไว้ในระบบ
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* EDIT CLAIM MODAL */}

      {selectedClaim && (
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.editCard}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.editScrollContent
              }
            >
              {/* EDIT HEADER */}

              <View
                style={styles.editHeader}
              >
                <View
                  style={styles.editHeaderInfo}
                >
                  <Text
                    style={styles.editTitle}
                  >
                    แก้ไข Claim #
                    {selectedClaim.id}
                  </Text>

                  <Text
                    style={styles.editProduct}
                    numberOfLines={2}
                  >
                    {selectedClaim.product_name}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={closeEdit}
                  disabled={saving}
                  style={
                    styles.closeButton
                  }
                >
                  <Text
                    style={styles.closeText}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CURRENT STATUS */}

              <View
                style={styles.currentStatusBox}
              >
                <Text
                  style={
                    styles.currentStatusLabel
                  }
                >
                  สถานะปัจจุบัน
                </Text>

                <Text
                  style={
                    styles.currentStatusText
                  }
                >
                  {selectedClaim.stage_name ||
                    '-'}
                </Text>
              </View>

              {/* STATUS */}

              <Text
                style={styles.sectionLabel}
              >
                เลือกสถานะการเคลม
              </Text>

              {stages.length === 0 ? (
                <View
                  style={styles.noStageBox}
                >
                  <Text
                    style={
                      styles.noStageText
                    }
                  >
                    ยังไม่มีขั้นตอนการเคลม
                  </Text>
                </View>
              ) : (
                <View
                  style={styles.statusButtons}
                >
                  {stages.map(stage => {
                    const stageId =
                      Number(stage.id);

                    const isSelected =
                      selectedStage ===
                      stageId;

                    return (
                      <Pressable
                        key={stage.id}
                        style={({ pressed }) => [
                          styles.statusButton,
                          isSelected &&
                            styles.statusButtonActive,
                          pressed &&
                            styles.statusButtonPressed,
                        ]}
                        onPress={() => {
                          console.log(
                            'Selected stage:',
                            stageId
                          );

                          setSelectedStage(
                            stageId
                          );
                        }}
                        disabled={saving}
                      >
                        <View
                          style={
                            styles.statusButtonContent
                          }
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected &&
                                styles.radioCircleActive,
                            ]}
                          >
                            {isSelected && (
                              <View
                                style={
                                  styles.radioDot
                                }
                              />
                            )}
                          </View>

                          <Text
                            style={[
                              styles.statusButtonText,
                              isSelected &&
                                styles.statusButtonTextActive,
                            ]}
                          >
                            {stage.step_order}.{' '}
                            {stage.name}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* REASON */}

              <Text
                style={styles.sectionLabel}
              >
                สาเหตุการเคลม
              </Text>

              <View
                style={styles.reasonBox}
              >
                <Text
                  style={styles.reasonText}
                >
                  {selectedClaim.reason}
                </Text>
              </View>

              {/* OTHER DETAIL */}

              {selectedClaim.reason ===
                'อื่นๆ' && (
                <>
                  <Text
                    style={styles.sectionLabel}
                  >
                    รายละเอียดเพิ่มเติม
                  </Text>

                  <View
                    style={
                      styles.descriptionBox
                    }
                  >
                    <Text
                      style={
                        styles.descriptionText
                      }
                    >
                      {selectedClaim.description?.trim()
                        ? selectedClaim.description
                        : 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </Text>
                  </View>
                </>
              )}

              {/* CUSTOMER */}

              <Text
                style={styles.sectionLabel}
              >
                ลูกค้า
              </Text>

              <View
                style={styles.reasonBox}
              >
                <Text
                  style={styles.reasonText}
                >
                  {selectedClaim.username ||
                    '-'}
                </Text>
              </View>

              {/* BUTTON */}

              <View
                style={styles.buttonRow}
              >
                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={closeEdit}
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
                  onPress={saveClaim}
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
            </ScrollView>
          </View>
        </View>
      )}
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

  // HEADER

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

  // TAB

  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  tabButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },

  tabTextActive: {
    color: '#2563EB',
  },

  // SUMMARY

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

  // EMPTY

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },

  // CLAIM CARD

  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  claimHeaderLeft: {
    flex: 1,
  },

  claimId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 3,
  },

  productName: {
    fontSize: 17,
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
    maxWidth: 130,
  },

  statusText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
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

  // DESCRIPTION

  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  descriptionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
  },

  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
  },

  editButton: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ADD STAGE

  addStageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },

  addStageRow: {
    flexDirection: 'row',
    gap: 8,
  },

  addStageInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#0F172A',
    fontSize: 14,
  },

  addStageButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },

  addStageButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // STAGE CARD

  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  stageNumber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  stageNumberText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
  },

  stageInfo: {
    flex: 1,
  },

  stageName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  stageOrder: {
    marginTop: 3,
    fontSize: 11,
    color: '#94A3B8',
  },

  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },

  deleteText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },

  hintBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 13,
    marginTop: 5,
  },

  hintText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 17,
  },

  // MODAL

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
    elevation: 100,
  },

  // EDIT CARD

  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  editScrollContent: {
    padding: 20,
    paddingBottom: 30,
  },

  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  editHeaderInfo: {
    flex: 1,
    paddingRight: 10,
  },

  editTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
  },

  editProduct: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },

  // CURRENT STATUS

  currentStatusBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 5,
  },

  currentStatusLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  currentStatusText: {
    marginTop: 4,
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '800',
  },

  // STATUS

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
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  statusButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2,
  },

  statusButtonPressed: {
    opacity: 0.7,
  },

  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioCircleActive: {
    borderColor: '#2563EB',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },

  statusButtonText: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },

  statusButtonTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },

  noStageBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
  },

  noStageText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // REASON

  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  reasonText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },

  // BUTTON

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