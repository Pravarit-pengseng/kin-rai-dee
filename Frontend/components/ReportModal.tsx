import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { DEFAULT_REPORT_REASONS, ReportReason, submitReport } from '@/services/safetyService';

export interface ReportModalProps {
  visible: boolean;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  targetTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
  useNativeModal?: boolean;
}

export default function ReportModal({
  visible,
  targetType,
  targetId,
  targetTitle,
  onClose,
  onSuccess,
  useNativeModal = true,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('INAPPROPRIATE');
  const [loading, setLoading] = useState<boolean>(false);

  const getTargetTypeTitle = () => {
    switch (targetType) {
      case 'post':
        return 'รายงานโพสต์';
      case 'comment':
        return 'รายงานความคิดเห็น';
      case 'user':
        return 'รายงานผู้ใช้งาน';
      default:
        return 'รายงานเนื้อหา';
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกเหตุผลในการรายงาน');
      return;
    }

    setLoading(true);
    try {
      const res = await submitReport({
        target_type: targetType,
        target_id: targetId,
        reason_code: selectedReason,
      });

      setLoading(false);
      if (res.success) {
        Alert.alert(
          'ส่งรายงานเรียบร้อยแล้ว',
          'ขอบคุณที่ช่วยแจ้งให้เราทราบ ทีมผู้ดูแลระบบจะเร่งดำเนินการตรวจสอบตามแนวทางปฏิบัติของชุมชน',
          [
            {
              text: 'ตกลง',
              onPress: () => {
                onClose();
                if (onSuccess) onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('เกิดข้อผิดพลาด', res.message || 'ไม่สามารถส่งรายงานได้');
      }
    } catch {
      setLoading(false);
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  const modalContent = (
    <View style={[styles.overlay, !useNativeModal && styles.overlayAbsolute]}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <AlertTriangle size={18} color="#A7392A" />
            </View>
            <Text style={styles.headerTitle}>{getTargetTypeTitle()}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <X size={20} color="#57423E" />
          </Pressable>
        </View>

        {targetTitle ? (
          <View style={styles.targetInfo}>
            <Text style={styles.targetInfoLabel}>รายการที่รายงาน:</Text>
            <Text style={styles.targetInfoText} numberOfLines={2}>
              "{targetTitle}"
            </Text>
          </View>
        ) : null}

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>โปรดเลือกเหตุผลในการรายงาน:</Text>
          
          {DEFAULT_REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason.code;
            return (
              <Pressable
                key={reason.code}
                onPress={() => setSelectedReason(reason.code)}
                style={[
                  styles.reasonItem,
                  isSelected && styles.reasonItemSelected,
                ]}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.reasonTextCol}>
                  <Text style={[styles.reasonName, isSelected && styles.reasonNameSelected]}>
                    {reason.name}
                  </Text>
                  <Text style={styles.reasonDesc}>{reason.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>ยกเลิก</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>ส่งรายงาน</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (!useNativeModal) {
    if (!visible) return null;
    return modalContent;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE4',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#57423E',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, sans-serif',
    }),
  },
  closeBtn: {
    padding: 4,
  },
  targetInfo: {
    backgroundColor: '#FFF8ED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE4',
  },
  targetInfoLabel: {
    fontSize: 12,
    color: '#8A7B77',
    fontWeight: '500',
  },
  targetInfoText: {
    fontSize: 13,
    color: '#A7392A',
    fontWeight: '600',
    marginTop: 2,
  },
  body: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#57423E',
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F0E2D8',
    marginBottom: 10,
    backgroundColor: '#FAFAF8',
  },
  reasonItemSelected: {
    borderColor: '#A7392A',
    backgroundColor: '#FFF8F6',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9E9693',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#A7392A',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A7392A',
  },
  reasonTextCol: {
    flex: 1,
  },
  reasonName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#332421',
  },
  reasonNameSelected: {
    color: '#A7392A',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#7A6B67',
    marginTop: 2,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE4',
    backgroundColor: '#FFFFFF',
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5ECE4',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57423E',
  },
  submitBtn: {
    backgroundColor: '#A7392A',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
