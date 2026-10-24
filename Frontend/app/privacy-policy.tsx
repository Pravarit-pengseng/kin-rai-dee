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
import LegalNavbar from '../components/LegalNavbar';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <LegalNavbar activeTab="privacy" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>นโยบายความเป็นส่วนตัว</Text>
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
              อีเมล, ชื่อที่แสดง, ชื่อผู้ใช้, รูปโปรไฟล์ และคำอธิบายตัวเอง
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
              <Text style={styles.bulletBold}>ข้อมูลการตั้งค่าความปลอดภัย: </Text>
              รายชื่อผู้ใช้ที่คุณบล็อก และรายการเมนูที่บันทึกไว้
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. วัตถุประสงค์ในการใช้ข้อมูล</Text>
          <Text style={styles.paragraph}>
            เรานำข้อมูลไปใช้เพื่อพัฒนาประสบการณ์การใช้งาน เช่น การสุ่มเมนูอาหารให้ตรงใจ, การแสดงฟีดชุมชน, การกลั่นกรองเนื้อหาไม่เหมาะสม และการรักษาความปลอดภัยของระบบ ทั้งนี้ เราไม่มีนโยบายจำหน่ายหรือเปิดเผยข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอกเพื่อการโฆษณา
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. สิทธิ์และการควบคุมข้อมูลของคุณ</Text>
          <Text style={styles.paragraph}>
            คุณสามารถจัดการข้อมูลและความเป็นส่วนตัวของคุณได้ตลอดเวลา
          </Text>

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

        {/* Footer Navigation */}
        <View style={styles.footerNav}>
          <Text style={[styles.footerLink, styles.footerLinkActive]}>นโยบายความเป็นส่วนตัว</Text>
          <Text style={styles.footerDot}>•</Text>
          <Pressable onPress={() => router.push('/terms-of-use' as any)}>
            <Text style={styles.footerLink}>ข้อกำหนดการใช้งาน</Text>
          </Pressable>
          <Text style={styles.footerDot}>•</Text>
          <Pressable onPress={() => router.push('/delete-account' as any)}>
            <Text style={styles.footerLink}>คำขอลบบัญชี</Text>
          </Pressable>
        </View>

        <Text style={styles.copyright}>&copy; 2026 KIN RAI DEE Community. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 48,
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
  },
  contactText: {
    fontSize: 13.5,
    color: '#636366',
    lineHeight: 20,
    marginBottom: 6,
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A7392A',
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
