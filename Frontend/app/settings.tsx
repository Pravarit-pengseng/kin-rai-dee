import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ChevronRight, ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount, getBlockedUsers } from '@/services/safetyService';

export default function SettingsScreen() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [blockedCount, setBlockedCount] = useState<number>(0);

  useFocusEffect(
    React.useCallback(() => {
      getBlockedUsers().then((list) => {
        setBlockedCount(list.length);
      });
    }, [])
  );

  const handleBack = () => {
    router.back();
  };

  const handleOpenPrivacy = () => {
    router.push('/privacy-policy');
  };

  const handleOpenTerms = () => {
    router.push('/terms-of-use');
  };

  const handleOpenBlockedUsers = () => {
    router.push('/blocked-users');
  };

  const handleDeleteAccountPress = () => {
    if (!isLoggedIn) {
      Alert.alert('เข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนดำเนินการ');
      return;
    }

    Alert.alert(
      'ยืนยันการลบบัญชีผู้ใช้',
      'การลบบัญชีจะมีผลถาวร! ข้อมูลโพสต์ รูปภาพอาหาร ความคิดเห็น รายการโปรด และข้อมูลส่วนตัวทั้งหมดของท่านจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้อีก\n\nท่านแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ลบบัญชีถาวร',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteAccount();
      setIsDeleting(false);

      if (res.success) {
        Alert.alert(
          'ลบบัญชีเรียบร้อยแล้ว',
          'บัญชีผู้ใช้และข้อมูลทั้งหมดของท่านถูกลบออกจากระบบ Kin-Rai-Dee แล้วอย่างถาวร',
          [
            {
              text: 'ตกลง',
              onPress: async () => {
                await logout();
                router.replace('/');
              },
            },
          ]
        );
      } else {
        Alert.alert('เกิดข้อผิดพลาด', res.message || 'ไม่สามารถลบบัญชีได้');
      }
    } catch {
      setIsDeleting(false);
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header matching user's image: "← ตั้งค่า (Settings)" */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
          <ArrowLeft size={22} color="#1C1B1F" />
        </Pressable>
        <Text style={styles.headerTitle}>ตั้งค่า</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuCard}>
          {/* นโยบายความเป็นส่วนตัว */}
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.itemPressed]}
            onPress={handleOpenPrivacy}
          >
            <Text style={styles.menuText}>นโยบายความเป็นส่วนตัว</Text>
            <ChevronRight size={20} color="#79747E" />
          </Pressable>

          <View style={styles.divider} />

          {/* ข้อกำหนดการใช้งาน */}
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.itemPressed]}
            onPress={handleOpenTerms}
          >
            <Text style={styles.menuText}>ข้อกำหนดการใช้งาน</Text>
            <ChevronRight size={20} color="#79747E" />
          </Pressable>

          <View style={styles.divider} />

          {/* ผู้ใช้ที่ถูกบล็อก */}
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.itemPressed]}
            onPress={handleOpenBlockedUsers}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuText}>ผู้ใช้ที่ถูกบล็อก</Text>
              {blockedCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{blockedCount}</Text>
                </View>
              )}
            </View>
            <ChevronRight size={20} color="#79747E" />
          </Pressable>

          <View style={styles.divider} />

          {/* ลบบัญชีผู้ใช้ */}
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.itemPressed]}
            onPress={handleDeleteAccountPress}
            disabled={isDeleting}
          >
            <Text style={[styles.menuText, styles.deleteText]}>ลบบัญชีผู้ใช้</Text>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#A7392A" />
            ) : (
              <ChevronRight size={20} color="#79747E" />
            )}
          </Pressable>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>KIN RAI DEE เวอร์ชัน 1.0.0</Text>
          <Text style={styles.appCopyright}>&copy; 2026 KIN RAI DEE Community</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E0E9',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B1F',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, sans-serif',
    }),
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  itemPressed: {
    backgroundColor: '#F8F6F4',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8D7CD',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7392A',
  },
  menuText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1B1F',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_500Medium',
      default: 'NotoSansThai_500Medium, sans-serif',
    }),
  },
  deleteText: {
    color: '#1C1B1F',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6E0E9',
    marginHorizontal: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  appVersion: {
    fontSize: 13,
    color: '#79747E',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#9E9693',
  },
});
