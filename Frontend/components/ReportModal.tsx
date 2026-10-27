import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { DEFAULT_REPORT_REASONS, ReportReason, submitReport } from '@/services/safetyService';
import { Typography } from '@/constants/typography';

export interface ReportModalProps {
  visible: boolean;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  targetTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
  useNativeModal?: boolean;
}

type AlertPopupState = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
};

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
  const [alertPopup, setAlertPopup] = useState<AlertPopupState>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertPopup({ visible: true, title, message, onConfirm });
  };

  const dismissAlert = () => {
    const cb = alertPopup.onConfirm;
    setAlertPopup({ visible: false, title: '', message: '' });
    cb?.();
  };

  const getTargetTypeTitle = () => {
    switch (targetType) {
      case 'post':
        return 'รายงานโพสต์';
      case 'comment':
        return 'รายงานความคิดเห็น';
      case 'user':
        return 'รายงานผู้ใช้';
      default:
        return 'รายงานเนื้อหา';
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      showAlert('แจ้งเตือน', 'กรุณาเลือกเหตุผลในการรายงาน');
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
        showAlert(
          'ส่งรายงานเรียบร้อยแล้ว',
          'ขอบคุณที่ช่วยแจ้งให้เราทราบ ทีมผู้ดูแลระบบจะเร่งดำเนินการตรวจสอบตามแนวทางปฏิบัติของชุมชน',
          () => {
            onClose();
            if (onSuccess) onSuccess();
          }
        );
      } else {
        showAlert('เกิดข้อผิดพลาด', res.message || 'ไม่สามารถส่งรายงานได้');
      }
    } catch {
      setLoading(false);
      showAlert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  const alertPopupNode = alertPopup.visible ? (
    <View style={styles.alertOverlay}>
      <View style={styles.alertPopup}>
        <Text style={styles.alertTitle}>{alertPopup.title}</Text>
        <Text style={styles.alertMessage}>{alertPopup.message}</Text>
        <View style={styles.alertButtonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.alertConfirmButton,
              pressed && styles.alertButtonPressed,
            ]}
            onPress={dismissAlert}
          >
            <Text style={styles.alertConfirmText}>ตกลง</Text>
          </Pressable>
        </View>
      </View>
    </View>
  ) : null;

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

      {/* Alert Popup overlay — แสดงทับ modal card */}
      {alertPopupNode}
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
    color: '#57423E',
    fontFamily: Typography.bold,
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
    fontFamily: Typography.regular,
  },
  targetInfoText: {
    fontSize: 13,
    color: '#A7392A',
    marginTop: 2,
    fontFamily: Typography.semiBold,
  },
  body: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#57423E',
    marginBottom: 12,
    fontFamily: Typography.bold,
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
    color: '#332421',
    fontFamily: Typography.semiBold,
  },
  reasonNameSelected: {
    color: '#A7392A',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#7A6B67',
    marginTop: 2,
    lineHeight: 16,
    fontFamily: Typography.regular,
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
    color: '#57423E',
    fontFamily: Typography.semiBold,
  },
  submitBtn: {
    backgroundColor: '#A7392A',
  },
  submitBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
        fontFamily: Typography.bold,
  },
  disabledBtn: {
    opacity: 0.6,
  },

  // Alert Popup (แทน Alert.alert)
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  alertPopup: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  alertTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: Typography.bold,
    fontWeight: '700',
    color: '#241917',
    marginBottom: 10,
    lineHeight: 26,
  },
  alertMessage: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Typography.regular,
    color: '#57423E',
    lineHeight: 22,
    marginBottom: 20,
  },
  alertButtonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  alertConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF7A6633',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#72120933',
    borderBottomWidth: 3,
    borderBottomColor: '#72120933',
  },
  alertConfirmText: {
    fontSize: 15,
    fontFamily: Typography.bold,
    fontWeight: '700',
    color: '#9B2C24',
    textAlign: 'center',
  },
  alertButtonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
