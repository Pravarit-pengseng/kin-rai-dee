import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, UserX, ShieldCheck } from 'lucide-react-native';
import { getBlockedUsers, unblockUser, BlockedUserItem } from '@/services/safetyService';

const DEFAULT_AVATAR = require('@/assets/images/ProfilePicture.png');

export default function BlockedUsersScreen() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadBlockedUsers = async () => {
    try {
      const data = await getBlockedUsers();
      setBlockedUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBlockedUsers();
  }, []);

  const handleUnblock = (item: BlockedUserItem) => {
    const displayName = item.profile?.display_name || item.profile?.username || 'ผู้ใช้นี้';
    Alert.alert(
      'ปลดบล็อกผู้ใช้',
      `ท่านต้องการปลดบล็อก "${displayName}" หรือไม่? เมื่อปลดบล็อกแล้ว โพสต์และความคิดเห็นของบุคคลนี้จะแสดงตามปกติ`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ปลดบล็อก',
          style: 'default',
          onPress: async () => {
            setUnblockingId(item.blocked_user_id);
            const res = await unblockUser(item.blocked_user_id);
            setUnblockingId(null);
            if (res.success) {
              setBlockedUsers(prev => prev.filter(u => u.blocked_user_id !== item.blocked_user_id));
              Alert.alert('สำเร็จ', 'ปลดบล็อกผู้ใช้เรียบร้อยแล้ว');
            } else {
              Alert.alert('เกิดข้อผิดพลาด', res.message || 'ไม่สามารถปลดบล็อกได้');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: BlockedUserItem }) => {
    const prof = item.profile;
    const isUnblocking = unblockingId === item.blocked_user_id;

    return (
      <View style={styles.userCard}>
        <Image
          source={prof?.avatar_url ? { uri: prof.avatar_url } : DEFAULT_AVATAR}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {prof?.display_name || prof?.username || 'ผู้ใช้งาน'}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{prof?.username || 'user'}
          </Text>
        </View>
        <Pressable
          style={[styles.unblockBtn, isUnblocking && styles.disabledBtn]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#A7392A" />
          ) : (
            <Text style={styles.unblockBtnText}>ปลดบล็อก</Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#1C1B1F" />
        </Pressable>
        <Text style={styles.headerTitle}>ผู้ใช้ที่ถูกบล็อก</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A7392A" />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShieldCheck size={40} color="#A7392A" />
          </View>
          <Text style={styles.emptyTitle}>ไม่มีผู้ใช้ที่ถูกบล็อก</Text>
          <Text style={styles.emptySub}>
            เมื่อท่านบล็อกผู้ใช้ที่ไม่พึงประสงค์ รายชื่อจะปรากฏที่นี่ และท่านสามารถปลดบล็อกได้ตลอดเวลา
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={item => String(item.id || item.blocked_user_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#A7392A"
              colors={['#A7392A']}
            />
          }
        />
      )}
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
  backBtn: {
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#332421',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#79747E',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE4',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0E2D8',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1B1F',
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    color: '#79747E',
  },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7392A',
    backgroundColor: '#FFFFFF',
  },
  unblockBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A7392A',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
