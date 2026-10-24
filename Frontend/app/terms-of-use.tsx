import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import LegalNavbar from '../components/LegalNavbar';

const isWeb = Platform.OS === 'web';

export default function TermsOfUseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header: Web uses LegalNavbar, Mobile uses frontend-aey header */}
      {isWeb ? (
        <LegalNavbar activeTab="terms" />
      ) : (
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>ข้อกำหนดการใช้งาน</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>ข้อกำหนดการใช้งาน</Text>
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

        {/* Footer Navigation (เฉพาะเว็บบราวเซอร์) */}
        {isWeb && (
          <>
            <View style={styles.footerNav}>
              <Pressable onPress={() => router.push('/privacy-policy' as any)}>
                <Text style={styles.footerLink}>นโยบายความเป็นส่วนตัว</Text>
              </Pressable>
              <Text style={styles.footerDot}>•</Text>
              <Text style={[styles.footerLink, styles.footerLinkActive]}>ข้อกำหนดการใช้งาน</Text>
              <Text style={styles.footerDot}>•</Text>
              <Pressable onPress={() => router.push('/delete-account' as any)}>
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
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_600SemiBold',
      default: 'NotoSansThai_600SemiBold, sans-serif',
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
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, sans-serif',
    }),
  },
  updatedDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 18,
  },
  introParagraph: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 24,
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
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, sans-serif',
    }),
  },
  paragraph: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 24,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  ruleCard: {
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3.5,
    borderLeftColor: '#A7392A',
  },
  ruleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ruleDesc: {
    fontSize: 13.5,
    color: '#636366',
    lineHeight: 20,
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
  },
  bulletBold: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  footerLink: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  footerLinkActive: {
    color: '#A7392A',
    fontWeight: '700',
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
  },
});
