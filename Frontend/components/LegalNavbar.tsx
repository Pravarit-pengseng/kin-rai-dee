import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  Shield,
  FileText,
  Trash2,
  Home,
} from 'lucide-react-native';

export type LegalTabType = 'privacy' | 'terms' | 'delete';

interface LegalNavbarProps {
  activeTab: LegalTabType;
}

export default function LegalNavbar({ activeTab }: LegalNavbarProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((Platform.OS === 'web' ? '/privacy-policy' : '/') as any);
    }
  };

  const navItems = [
    {
      id: 'privacy',
      title: 'นโยบายความเป็นส่วนตัว',
      subtitle: 'การคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
      route: '/privacy-policy',
      icon: Shield,
    },
    {
      id: 'terms',
      title: 'ข้อกำหนดการใช้งาน',
      subtitle: 'กฎระเบียบชุมชน และความปลอดภัย',
      route: '/terms-of-use',
      icon: FileText,
    },
    {
      id: 'delete',
      title: 'คำขอลบบัญชีผู้ใช้',
      subtitle: 'คำขอลบบัญชีและข้อมูลส่วนตัว',
      route: '/delete-account',
      icon: Trash2,
    },
  ];

  const currentNavItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const ActiveIcon = currentNavItem.icon;
  const isSuperNarrow = width < 340;

  const handleNavigate = (route: string, id: LegalTabType) => {
    if (activeTab === id) return;
    router.push(route as any);
  };

  return (
    <>
      <View style={styles.navContainer}>
        <View
          style={[
            styles.navInner,
            isDesktop && styles.navInnerDesktop,
            isSuperNarrow && styles.navInnerSuperNarrow,
          ]}
        >
          {/* Brand / Logo + Back Button */}
          <View style={[styles.brandRow, isSuperNarrow && { gap: 6 }]}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
              hitSlop={12}
              accessibilityLabel="ย้อนกลับ"
            >
              <ArrowLeft size={isSuperNarrow ? 18 : 22} color="#1A1A1A" />
            </Pressable>

            <Pressable
              onPress={() => router.replace((Platform.OS === 'web' ? '/privacy-policy' : '/') as any)}
              style={[styles.brandInfo, isSuperNarrow && { gap: 6 }]}
            >
              <Image
                source={require('@/assets/images/kin-rai-dee-logo.png')}
                style={isSuperNarrow ? styles.logoImageSmall : styles.logoImage}
                resizeMode="contain"
              />
              <Text style={[styles.brandTitle, isSuperNarrow && styles.brandTitleSmall]}>
                KIN RAI DEE
              </Text>
            </Pressable>
          </View>

          {/* Desktop Navbar Tabs */}
          {isDesktop ? (
            <View style={styles.desktopTabContainer}>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleNavigate(item.route, item.id as LegalTabType)}
                    style={({ pressed }) => [
                      styles.tabItem,
                      isActive && styles.tabItemActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <IconComponent
                      size={16}
                      color={isActive ? '#A7392A' : '#636366'}
                      style={{ marginRight: 6 }}
                    />
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
          ) : (
            /* Mobile Hamburger Menu Button */
            <Pressable
              onPress={() => setIsSidebarOpen(true)}
              style={({ pressed }) => [
                styles.mobileMenuButton,
                isSuperNarrow && { paddingHorizontal: 7, paddingVertical: 4 },
                pressed && styles.btnPressed,
              ]}
              hitSlop={12}
              accessibilityLabel="เปิดแถบเมนูเอกสาร"
            >
              <Menu size={isSuperNarrow ? 18 : 22} color="#1A1A1A" />
              <Text style={[styles.mobileMenuButtonText, isSuperNarrow && { fontSize: 11 }]}>
                เมนู
              </Text>
            </Pressable>
          )}
        </View>

        {/* Mobile Sub-Header: Active Document & Tap to open Sidebar */}
        {!isDesktop && (
          <Pressable
            onPress={() => setIsSidebarOpen(true)}
            style={({ pressed }) => [
              styles.mobileActiveDocBar,
              isSuperNarrow && styles.mobileActiveDocBarNarrow,
              pressed && { backgroundColor: '#F2EFEB' },
            ]}
            hitSlop={6}
          >
            <View style={styles.mobileActiveDocLeft}>
              <View style={[styles.activeDocIconBadge, isSuperNarrow && styles.activeDocIconBadgeNarrow]}>
                <ActiveIcon size={isSuperNarrow ? 13 : 16} color="#A7392A" />
              </View>
              <View style={styles.activeDocTextContainer}>
                <Text style={[styles.activeDocLabel, isSuperNarrow && { fontSize: 9.5 }]}>เอกสารที่กำลังดู</Text>
                <Text style={[styles.activeDocTitle, isSuperNarrow && { fontSize: 11.5 }]} numberOfLines={1}>
                  {currentNavItem.title}
                </Text>
              </View>
            </View>

            <View style={[styles.changeDocBadge, isSuperNarrow && { paddingHorizontal: 6, paddingVertical: 3 }]}>
              <Text style={[styles.changeDocBadgeText, isSuperNarrow && { fontSize: 10.5 }]}>
                {isSuperNarrow ? 'ดูทั้งหมด' : 'ดูทั้งหมด (3)'}
              </Text>
              <ChevronRight size={isSuperNarrow ? 12 : 14} color="#A7392A" />
            </View>
          </Pressable>
        )}
      </View>

      {/* Mobile Sidebar / Drawer (Modal) */}
      <Modal
        visible={isSidebarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop click to dismiss */}
          <Pressable
            style={styles.backdrop}
            onPress={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Drawer Panel */}
          <View style={styles.sidebarPanel}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarBrand}>
                <Image
                  source={require('@/assets/images/kin-rai-dee-logo.png')}
                  style={styles.sidebarLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.sidebarBrandTitle}>KIN RAI DEE</Text>
                  <Text style={styles.sidebarBrandSubtitle}>เอกสารทางกฎหมาย & นโยบาย</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsSidebarOpen(false)}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
                hitSlop={12}
                accessibilityLabel="ปิดเมนู"
              >
                <X size={20} color="#1A1A1A" />
              </Pressable>
            </View>

            <View style={styles.sidebarDivider} />

            {/* Document List */}
            <ScrollView
              style={styles.sidebarScroll}
              contentContainerStyle={styles.sidebarContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sidebarSectionTitle}>เลือกดูเอกสาร</Text>

              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const ItemIcon = item.icon;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setIsSidebarOpen(false);
                      handleNavigate(item.route, item.id as LegalTabType);
                    }}
                    style={({ pressed }) => [
                      styles.sidebarCard,
                      isActive && styles.sidebarCardActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.sidebarCardIconWrap,
                        isActive && styles.sidebarCardIconWrapActive,
                      ]}
                    >
                      <ItemIcon size={20} color={isActive ? '#A7392A' : '#636366'} />
                    </View>

                    <View style={styles.sidebarCardInfo}>
                      <View style={styles.sidebarCardTitleRow}>
                        <Text
                          style={[
                            styles.sidebarCardTitle,
                            isActive && styles.sidebarCardTitleActive,
                          ]}
                        >
                          {item.title}
                        </Text>
                        {isActive && (
                          <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>กำลังดู</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.sidebarCardSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>

                    <ChevronRight size={18} color={isActive ? '#A7392A' : '#C7C7CC'} />
                  </Pressable>
                );
              })}

              {/* Bottom Quick Links */}
              <View style={styles.sidebarBottomSection}>
                <Pressable
                  onPress={() => {
                    setIsSidebarOpen(false);
                    router.replace('/' as any);
                  }}
                  style={({ pressed }) => [styles.homeBtn, pressed && styles.btnPressed]}
                >
                  <Home size={18} color="#A7392A" />
                  <Text style={styles.homeBtnText}>กลับสู่หน้าหลัก กินไรดี</Text>
                </Pressable>

                <Text style={styles.sidebarFooterText}>
                  &copy; 2026 KIN RAI DEE Community{'\n'}สงวนลิขสิทธิ์ทั้งหมดตามกฎหมาย
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  navInnerSuperNarrow: {
    paddingHorizontal: 8,
    paddingVertical: 8,
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
  logoImageSmall: {
    width: 24,
    height: 24,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A7392A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  brandTitleSmall: {
    fontSize: 14,
  },
  desktopTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  tabTextActive: {
    color: '#A7392A',
    fontWeight: '700',
  },
  mobileMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F7F7F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  mobileMenuButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  mobileActiveDocBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0ECE9',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  mobileActiveDocBarNarrow: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mobileActiveDocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  activeDocIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDocIconBadgeNarrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  activeDocTextContainer: {
    flex: 1,
  },
  activeDocLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_500Medium',
      default: 'Inter, sans-serif',
    }),
  },
  activeDocTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#A7392A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  changeDocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8D8CF',
  },
  changeDocBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7392A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  // Modal & Sidebar Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sidebarPanel: {
    width: '84%',
    maxWidth: 340,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarLogo: {
    width: 32,
    height: 32,
  },
  sidebarBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A7392A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  sidebarBrandSubtitle: {
    fontSize: 11.5,
    color: '#8E8E93',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  sidebarSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    paddingHorizontal: 4,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  sidebarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    gap: 12,
  },
  sidebarCardActive: {
    backgroundColor: '#FFF0EB',
    borderColor: '#A7392A',
  },
  sidebarCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sidebarCardIconWrapActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F8D8CF',
  },
  sidebarCardInfo: {
    flex: 1,
  },
  sidebarCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sidebarCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  sidebarCardTitleActive: {
    color: '#A7392A',
    fontWeight: '700',
  },
  activeTag: {
    backgroundColor: '#A7392A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sidebarCardSubtitle: {
    fontSize: 12,
    color: '#636366',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  sidebarBottomSection: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
    gap: 16,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFF0EB',
    borderWidth: 1,
    borderColor: '#F8D8CF',
    width: '100%',
    justifyContent: 'center',
  },
  homeBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#A7392A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  sidebarFooterText: {
    fontSize: 11.5,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
});
