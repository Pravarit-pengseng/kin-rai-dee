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
import { AppFonts } from '@/constants/theme';

const isWeb = Platform.OS === 'web';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;

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
        <LegalNavbar activeTab="privacy" />
      ) : (
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>นโยบายความเป็นส่วนตัว</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && styles.webScrollContent,
          isSmallScreen && styles.mobileScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.mainTitle, isSmallScreen && styles.mobileMainTitle]}>นโยบายความเป็นส่วนตัว</Text>
        <Text style={styles.updatedDate}>อัปเดตล่าสุด 21 ตุลาคม 2569</Text>

        <Text style={styles.introParagraph}>
          แอปพลิเคชัน <Text style={styles.boldText}>KIN RAI DEE</Text> ให้ความสำคัญสูงสุดต่อความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของคุณ เอกสารนี้จะอธิบายประเภทข้อมูลที่เราเก็บรวบรวม วิธีการใช้งาน และสิทธิ์ในการควบคุมข้อมูลของคุณตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </Text>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ข้อมูลที่เราเก็บรวบรวม</Text>
          <Text style={styles.paragraph}>
            เพื่อให้บริการทำงานได้อย่างเต็มประสิทธิภาพ เราจำเป็นต้องเก็บข้อมูลบางส่วนเท่าที่จำเป็น ได้แก่
          </Text>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ข้อมูลบัญชี: </Text>
              ชื่อผู้ใช้ (Username), ชื่อที่แสดง (Display Name), อีเมล และรูปโปรไฟล์
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>เนื้อหาที่คุณสร้าง: </Text>
              รูปภาพอาหาร, ชื่อเมนู, คำอธิบายเมนู, ตำแหน่งร้านอาหาร, ประเภทอาหาร และข้อความความคิดเห็น
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ข้อมูลตำแหน่งที่ตั้ง (Location): </Text>
              พิกัดละติจูดและลองจิจูดของร้านอาหารที่คุณเลือกปักหมุด เพื่อให้ระบบสามารถแสดงตำแหน่งร้านอาหารบนแผนที่ได้อย่างแม่นยำ
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. วัตถุประสงค์ในการใช้ข้อมูล</Text>
          <Text style={styles.paragraph}>
            ข้อมูลของคุณจะถูกนำไปใช้เพื่อวัตถุประสงค์ดังต่อไปนี้เท่านั้น:
          </Text>
          <Text style={styles.paragraph}>
            • ให้บริการฟังก์ชันหลักของแอปพลิเคชัน เช่น การโพสต์รีวิวอาหาร การค้นหาร้านอาหารใกล้เคียง และการแนะนำอาหาร
          </Text>
          <Text style={styles.paragraph}>
            • ปรับปรุงประสิทธิภาพและความเสถียรของระบบ
          </Text>
          <Text style={styles.paragraph}>
            • รักษาความปลอดภัยและป้องกันการใช้งานที่ละเมิดข้อกำหนดของชุมชน
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. สิทธิ์และการควบคุมข้อมูลของคุณ</Text>
          <Text style={styles.paragraph}>
            คุณมีสิทธิ์ในการเข้าถึง แก้ไข หรือขอลบข้อมูลส่วนบุคคลของคุณได้ตลอดเวลา ผ่านฟังก์ชันต่าง ๆ ภายในแอปพลิเคชัน:
          </Text>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การแก้ไขโปรไฟล์: </Text>
              คุณสามารถแก้ไขชื่อผู้ใช้ ชื่อที่แสดง รูปโปรไฟล์ และคำอธิบายตัวเองได้ตลอดเวลาที่หน้าโปรไฟล์
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การลบโพสต์: </Text>
              คุณสามารถลบโพสต์ของคุณเองได้ตลอดเวลา ข้อมูลโพสต์และรูปภาพจะถูกลบออกจากระบบทันที
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การบล็อกผู้ใช้: </Text>
              คุณสามารถบล็อกผู้ใช้ที่ไม่พึงประสงค์ได้ทันทีผ่านหน้าโปรไฟล์หรือหน้าโพสต์ และสามารถปลดบล็อกได้ผ่านหน้าการตั้งค่า
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การลบบัญชีผู้ใช้: </Text>
              คุณสามารถลบบัญชีและข้อมูลทั้งหมดได้ด้วยตนเองผ่านเมนู <Text style={styles.boldText}>ตั้งค่า &gt; ลบบัญชีผู้ใช้</Text> ข้อมูลของคุณรวมถึงโพสต์และคอมเมนต์จะถูกลบออกจากระบบอย่างถาวร
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. ความปลอดภัยของข้อมูล</Text>
          <Text style={styles.paragraph}>
            เราให้ความสำคัญกับความปลอดภัยของข้อมูลของคุณ โดยใช้มาตรการรักษาความปลอดภัยที่ได้มาตรฐาน มีการเข้ารหัสข้อมูลขณะรับส่ง และจำกัดสิทธิ์การเข้าถึงข้อมูล เพื่อป้องกันการสูญหาย การรั่วไหล หรือการเข้าถึงโดยไม่ได้รับอนุญาต
          </Text>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>ติดต่อทีมงาน</Text>
          <Text style={styles.contactText}>
            หากมีข้อสงสัยหรือข้อเสนอแนะเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อเราได้ที่
          </Text>
          <Text style={styles.contactEmail}>phatsachon25488@gmail.com</Text>
        </View>

        {/* Footer Navigation (เฉพาะเว็บบราวเซอร์) */}
        {isWeb && (
          <>
            <View style={styles.footerNav}>
              <View style={styles.footerLinkPressable}>
                <Text style={[styles.footerLink, styles.footerLinkActive]}>นโยบายความเป็นส่วนตัว</Text>
              </View>
              <Text style={styles.footerDot}>•</Text>
              <Pressable
                onPress={() => router.push('/terms-of-use' as any)}
                style={({ pressed }) => [styles.footerLinkPressable, pressed && styles.btnPressed]}
                hitSlop={8}
              >
                <Text style={styles.footerLink}>ข้อกำหนดการใช้งาน</Text>
              </Pressable>
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
    fontFamily: AppFonts.semiBold,
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
    fontFamily: AppFonts.bold,
  },
  mobileMainTitle: {
    fontSize: 21,
    lineHeight: 28,
  },
  updatedDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 18,
    fontFamily: AppFonts.regular,
  },
  introParagraph: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 24,
    fontFamily: AppFonts.regular,
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
    fontFamily: AppFonts.bold,
  },
  paragraph: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 24,
    marginBottom: 10,
    fontFamily: AppFonts.regular,
  },
  boldText: {
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: AppFonts.semiBold,
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
    fontFamily: AppFonts.regular,
  },
  bulletBold: {
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: AppFonts.semiBold,
  },
  contactCard: {
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    fontFamily: AppFonts.bold,
  },
  contactText: {
    fontSize: 13.5,
    color: '#636366',
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: AppFonts.regular,
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B00',
    fontFamily: AppFonts.semiBold,
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
    fontFamily: AppFonts.regular,
  },
  footerLinkActive: {
    color: '#A7392A',
    fontWeight: '700',
    fontFamily: AppFonts.bold,
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
    fontFamily: AppFonts.regular,
  },
});
