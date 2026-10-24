import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export type LegalTabType = 'privacy' | 'terms' | 'delete';

interface LegalNavbarProps {
  activeTab: LegalTabType;
}

export default function LegalNavbar({ activeTab }: LegalNavbarProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  const navItems = [
    {
      id: 'privacy',
      title: 'นโยบายความเป็นส่วนตัว',
      route: '/privacy-policy',
    },
    {
      id: 'terms',
      title: 'ข้อกำหนดการใช้งาน',
      route: '/terms-of-use',
    },
    {
      id: 'delete',
      title: 'คำขอลบบัญชีผู้ใช้',
      route: '/delete-account',
    },
  ];

  return (
    <View style={styles.navContainer}>
      <View style={[styles.navInner, isDesktop && styles.navInnerDesktop]}>
        {/* Brand / Logo + Back Button */}
        <View style={styles.brandRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
            hitSlop={12}
            accessibilityLabel="ย้อนกลับ"
          >
            <ArrowLeft size={22} color="#1A1A1A" />
          </Pressable>

          <Pressable
            onPress={() => router.replace('/' as any)}
            style={styles.brandInfo}
          >
            {/* Real App Mascot / Logo Image */}
            <Image
              source={require('@/assets/images/kin-rai-dee-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>KIN RAI DEE</Text>
          </Pressable>
        </View>

        {/* Desktop Navbar Tabs */}
        {isDesktop ? (
          <View style={styles.desktopTabContainer}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [
                    styles.tabItem,
                    isActive && styles.tabItemActive,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.tabTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Mobile Horizontal Tab Bar */}
      {!isDesktop ? (
        <View style={styles.mobileTabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mobileTabScroll}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [
                    styles.mobileTabPill,
                    isActive && styles.mobileTabPillActive,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.mobileTabText,
                      isActive && styles.mobileTabTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
      },
    }),
  },
  navInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  navInnerDesktop: {
    maxWidth: 960,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    marginLeft: -4,
  },
  btnPressed: {
    opacity: 0.7,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A7392A',
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      android: 'PlusJakartaSans_700Bold',
      default: 'PlusJakartaSans_700Bold, NotoSansThai_700Bold, sans-serif',
    }),
  },
  desktopTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#FFF0EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636366',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_600SemiBold',
      default: 'NotoSansThai_600SemiBold, sans-serif',
    }),
  },
  tabTextActive: {
    color: '#A7392A',
    fontWeight: '700',
  },
  mobileTabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    paddingVertical: 8,
  },
  mobileTabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  mobileTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F7F7F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  mobileTabPillActive: {
    backgroundColor: '#FFF0EB',
    borderColor: '#A7392A',
  },
  mobileTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636366',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_600SemiBold',
      default: 'NotoSansThai_600SemiBold, sans-serif',
    }),
  },
  mobileTabTextActive: {
    color: '#A7392A',
    fontWeight: '700',
  },
});
