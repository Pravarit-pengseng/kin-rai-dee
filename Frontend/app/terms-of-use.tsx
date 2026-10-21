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

export default function TermsOfUseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>ข้อกำหนดการใช้งาน</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>ข้อกำหนดการใช้งาน</Text>
        <Text style={styles.updatedDate}>อัปเดตล่าสุด 21 ตุลาคม 2569</Text>

        <Text style={styles.introParagraph}>
          ยินดีต้อนรับสู่แอปพลิเคชัน <Text style={styles.boldText}>KIN RAI DEE</Text> ตัวช่วยในการตัดสินใจเลือกมื้ออาหารของคุณในทุกๆ วัน เพื่อให้การเลือกกินเป็นเรื่องง่ายและสนุกยิ่งขึ้น พร้อมร่วมสร้างชุมชนที่ปลอดภัยสำหรับทุกคน การสมัครสมาชิกและการใช้งานแอปพลิเคชันถือว่าคุณยอมรับข้อกำหนดดังต่อไปนี้
        </Text>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. กฎเกณฑ์และมาตรฐานชุมชน</Text>
          <Text style={styles.paragraph}>
            ผู้ใช้งานทุกคนต้องช่วยกันรักษาบรรยากาศที่ดีในชุมชน โดยมีข้อห้ามดังนี้
          </Text>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>เนื้อหาไม่เหมาะสม: </Text>
              ห้ามโพสต์รูปภาพลามกอนาจาร ความรุนแรง ภาพที่น่ารังเกียจ หรือภาพที่ไม่เกี่ยวข้องกับอาหาร
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การคุกคามและกลั่นแกล้ง: </Text>
              ห้ามใช้ถ้อยคำหยาบคาย ข่มขู่ หรือพฤติกรรมกลั่นแกล้งผู้อื่น
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>สแปมและการค้าที่ผิดกฎหมาย: </Text>
              ห้ามโพสต์ข้อความซ้ำๆ เพื่อก่อกวน ลิงก์โฆษณา การพนัน หรือสิ่งผิดกฎหมายทุกชนิด
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ลิขสิทธิ์และทรัพย์สินทางปัญญา: </Text>
              ห้ามนำรูปภาพหรือบทความของผู้อื่นมาแอบอ้างโดยไม่ได้รับความยินยอม
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ความเป็นส่วนตัวของผู้อื่น: </Text>
              ห้ามเปิดเผยข้อมูลส่วนบุคคลหรือภาพบุคคลอื่นโดยไม่ได้รับอนุญาต
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. การรายงานและการบล็อกผู้ใช้</Text>
          <Text style={styles.paragraph}>
            เพื่อให้มั่นใจในความปลอดภัยของผู้ใช้งาน KIN RAI DEE มีเครื่องมือช่วยเหลือดังนี้
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การรายงาน (Report): </Text>
              คุณสามารถกดรายงานโพสต์ ความคิดเห็น หรือผู้ใช้งานที่ไม่เหมาะสมได้ตลอดเวลา ทีมงานจะดำเนินการตรวจสอบและจัดการตามความเหมาะสม
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>การบล็อก (Block): </Text>
              คุณสามารถบล็อกผู้ใช้รายอื่นได้ทันที ระบบจะซ่อนโพสต์และความคิดเห็นระหว่างกัน และสามารถจัดการปลดบล็อกได้ในหน้าการตั้งค่า
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. สิทธิ์ในเนื้อหาและรูปภาพ</Text>
          <Text style={styles.paragraph}>
            คุณยังคงเป็นเจ้าของเนื้อหาและภาพถ่ายที่คุณโพสต์ โดยคุณอนุญาตให้ KIN RAI DEE แสดงผลเนื้อหาดังกล่าวบนระบบของแอปเพื่อให้บริการแก่คุณและเพื่อนสมาชิกในชุมชน
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. การระงับบริการและการลบบัญชี</Text>
          <Text style={styles.paragraph}>
            คุณสามารถขอลบบัญชีผู้ใช้พร้อมข้อมูลส่วนบุคคลทั้งหมดได้ตลอดเวลาที่เมนู <Text style={styles.boldText}>ตั้งค่า &gt; ลบบัญชีผู้ใช้</Text> ทั้งนี้ ทางแอปขอสงวนสิทธิ์ในการระงับหรือปิดบัญชีผู้ใช้งานที่ฝ่าฝืนกฎเกณฑ์ร้ายแรงโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
          </Text>
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
});
