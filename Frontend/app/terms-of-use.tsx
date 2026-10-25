import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import LegalNavbar from '../components/LegalNavbar';

const isWeb = Platform.OS === 'web';

export default function TermsOfUseScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;
  const isSuperNarrow = width < 340;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header: Web uses LegalNavbar, Mobile uses frontend-aey header */}
      {isWeb ? (
        <LegalNavbar activeTab="terms" />
      ) : (
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>ข้อกำหนดการใช้งาน</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && styles.webScrollContent,
          isSmallScreen && styles.mobileScrollContent,
          isSuperNarrow && styles.mobileScrollContentNarrow,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.mainTitle,
            isSmallScreen && styles.mobileMainTitle,
            isSuperNarrow && styles.mobileMainTitleNarrow,
          ]}
        >
          ข้อกำหนดการใช้งาน
        </Text>
        <Text style={styles.updatedDate}>อัปเดตล่าสุด 21 ตุลาคม 2569</Text>

        <Text style={styles.introParagraph}>
          ยินดีต้อนรับสู่แอปพลิเคชัน <Text style={styles.boldText}>กินไรดี (KIN RAI DEE)</Text> การเข้าใช้งานหรือสมัครสมาชิกถือว่าท่านตกลงและยอมรับข้อกำหนดและเงื่อนไขการใช้งานดังต่อไปนี้อย่างครบถ้วน
        </Text>

        <View style={styles.divider} />

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. กฎระเบียบของชุมชน (Community Guidelines)</Text>
          <Text style={styles.paragraph}>
            เพื่อสร้างสังคมที่น่าอยู่และปลอดภัยสำหรับการแบ่งปันเรื่องราวอาหาร ผู้ใช้งานทุกคนต้องปฏิบัติตามแนวทางปฏิบัติดังนี้:
          </Text>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>เนื้อหาไม่เหมาะสมหรือไม่เกี่ยวข้องกับอาหาร: </Text>
              ห้ามโพสต์รูปภาพลามกอนาจาร ความรุนแรง คำหยาบคาย หรือภาพที่ไม่เกี่ยวข้องกับอาหาร
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การคุกคามหรือกลั่นแกล้ง: </Text>
              ห้ามใช้ถ้อยคำดูถูก ข่มขู่ หรือล้อเลียนผู้อื่นให้เกิดความเสียหายหรืออับอาย
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>สแปมหรือสิ่งผิดกฎหมาย: </Text>
              ห้ามโพสต์ข้อความซ้ำซ้อน สแปมลิงก์ โฆษณาเว็บพนัน หรือสิ่งผิดกฎหมายทุกชนิด
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การละเมิดลิขสิทธิ์: </Text>
              ห้ามนำรูปภาพ ข้อความ หรือผลงานของผู้อื่นมาแอบอ้างโดยไม่ได้รับอนุญาต
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ละเมิดความเป็นส่วนตัว: </Text>
              ห้ามเปิดเผยข้อมูลส่วนบุคคล เบอร์โทรศัพท์ หรือภาพบุคคลอื่นโดยไม่ได้รับอนุญาต
            </Text>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. มาตรการดูแลความปลอดภัย (Safety & Moderation)</Text>
          <Text style={styles.paragraph}>
            เพื่อให้เป็นไปตามมาตรฐานความปลอดภัย Kin-Rai-Dee มีเครื่องมือปกป้องผู้ใช้งาน:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ระบบรายงาน (Reporting): </Text>
              คุณสามารถกดรายงานโพสต์ ความคิดเห็น หรือผู้ใช้ที่ไม่เหมาะสมได้ตลอดเวลา ทีมงานจะดำเนินการตรวจสอบและจัดการตามความเหมาะสม
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ระบบบล็อก (Blocking): </Text>
              คุณสามารถกด <Text style={styles.boldText}>"บล็อก"</Text> ผู้ใช้ที่ไม่พึงประสงค์ได้ทันที ระบบจะซ่อนโพสต์และคอมเมนต์ของผู้ใช้นั้นออกจากฟีดของคุณโดยอัตโนมัติ
            </Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. สิทธิ์ในเนื้อหาที่โพสต์ (User Content)</Text>
          <Text style={styles.paragraph}>
            คุณยังคงเป็นเจ้าของลิขสิทธิ์ในรูปภาพและข้อความที่คุณโพสต์ โดยการโพสต์เนื้อหาลงในแอป คุณได้มอบสิทธิ์ให้ Kin-Rai-Dee ในการแสดงผล จัดเก็บ และเผยแพร่เนื้อหาดังกล่าวภายในแอปพลิเคชันเพื่อการให้บริการ
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. การยกเลิกบัญชีและการลบข้อมูล</Text>
          <Text style={styles.paragraph}>
            คุณสามารถขอลบบัญชีผู้ใช้พร้อมข้อมูลส่วนบุคคลทั้งหมดได้ตลอดเวลาที่เมนู <Text style={styles.boldText}>ตั้งค่า &gt; ลบบัญชีผู้ใช้</Text> ทั้งนี้ ทางแอปขอสงวนสิทธิ์ในการระงับบัญชีผู้ใช้งานที่ฝ่าฝืนกฎเกณฑ์ร้ายแรงโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
          </Text>
        </View>

        {/* Contact & Reporting */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>ติดต่อทีมงาน</Text>
          <Text style={styles.contactText}>
            หากมีข้อสงสัย ข้อเสนอแนะ หรือต้องการรายงานการละเมิดข้อกำหนดการใช้งาน สามารถติดต่อเราได้ที่
          </Text>
          <Text style={styles.contactEmail}>phatsachon25488@gmail.com</Text>
        </View>

        {/* Footer Navigation (เฉพาะเว็บบราวเซอร์) */}
        {isWeb && (
          <>
            <View style={styles.footerNav}>
              <Pressable
                onPress={() => router.push('/privacy-policy' as any)}
                style={({ pressed }) => [styles.footerLinkPressable, pressed && styles.btnPressed]}
                hitSlop={8}
              >
                <Text style={styles.footerLink}>นโยบายความเป็นส่วนตัว</Text>
              </Pressable>
              <Text style={styles.footerDot}>•</Text>
              <View style={styles.footerLinkPressable}>
                <Text style={[styles.footerLink, styles.footerLinkActive]}>ข้อกำหนดการใช้งาน</Text>
              </View>
              <Text style={styles.footerDot}>•</Text>
              <Pressable
                onPress={() => router.push('/delete-account' as any)}
                style={({ pressed }) => [styles.footerLinkPressable, pressed && styles.btnPressed]}
                hitSlop={8}
              >
                <Text style={styles.footerLink}>คำขอลบบัญชี</Text>
              </Pressable>
            </View>

            <Text style={styles.copyright}>&copy; 2026 KIN RAI DEE Community. All rights reserved.</Text>
          </>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: {
    padding: 6,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  headerRightSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 48,
  },
  mobileScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  mobileScrollContentNarrow: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 36,
  },
  webScrollContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  mobileMainTitle: {
    fontSize: 21,
    lineHeight: 28,
  },
  mobileMainTitleNarrow: {
    fontSize: 18.5,
    lineHeight: 25,
  },
  updatedDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 18,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  introParagraph: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  paragraph: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 24,
    marginBottom: 10,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  boldText: {
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 24,
    color: '#8E8E93',
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#3A3A3C',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  bulletBold: {
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  contactCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  contactText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A7392A',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 32,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    rowGap: 8,
    columnGap: 10,
  },
  footerLinkPressable: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  btnPressed: {
    opacity: 0.6,
  },
  footerLink: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_500Medium',
      default: 'Inter, sans-serif',
    }),
  },
  footerLinkActive: {
    color: '#A7392A',
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  footerDot: {
    fontSize: 13,
    color: '#C7C7CC',
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 14,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
});
