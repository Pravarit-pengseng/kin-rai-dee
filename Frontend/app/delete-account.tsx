import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import LegalNavbar from '../components/LegalNavbar';
import { API_BASE_URL } from '../services/api';
import { supabase } from '../lib/supabase';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      if (Platform.OS === 'web') {
        window.alert('กรุณากรอกอีเมลที่ถูกต้อง');
      } else {
        Alert.alert('ข้อมูลไม่ถูกต้อง', 'กรุณากรอกอีเมลที่ถูกต้อง');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      try {
        const res = await fetch(`${API_BASE_URL}/api/legal/delete-account-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), reason: reason.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      } catch (apiErr) {
        console.warn('API error, falling back to direct Supabase:', apiErr);
        const { error } = await supabase.from('account_deletion_requests').insert({
          email: email.trim().toLowerCase(),
          reason: reason.trim(),
          status: 'pending',
        });
        if (error) throw error;
      }
      setIsSubmitted(true);
    } catch (err: any) {
      const msg = err.message || 'เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('ส่งคำขอไม่สำเร็จ', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <LegalNavbar activeTab="delete" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.mobileScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.mainTitle, isSmallScreen && styles.mobileMainTitle]}>คำขอลบบัญชีผู้ใช้และข้อมูลทั้งหมด</Text>
        <Text style={styles.updatedDate}>อัปเดตล่าสุด 21 ตุลาคม 2569</Text>

        <Text style={styles.introParagraph}>
          ผู้ใช้งานแอปพลิเคชัน <Text style={styles.boldText}>KIN RAI DEE</Text> สามารถขอลบบัญชีผู้ใช้และข้อมูลส่วนตัวทั้งหมดออกจากระบบได้ตลอดเวลา เพื่อความเป็นส่วนตัวและความปลอดภัยของคุณ
        </Text>

        <View style={styles.divider} />

        {/* 1. ช่องทางการลบบัญชี */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. วิธีการลบบัญชีผู้ใช้</Text>
          <Text style={styles.paragraph}>
            คุณสามารถเลือกดำเนินการลบบัญชีผู้ใช้ได้ 2 ช่องทาง ดังนี้
          </Text>

          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>วิธีที่ 1: ลบด้วยตนเองผ่านแอปพลิเคชัน</Text>
            <Text style={styles.cardBoxText}>
              1. เปิดแอป <Text style={styles.boldText}>KIN RAI DEE</Text> บนโทรศัพท์ของคุณ{'\n'}
              2. ไปที่แท็บ <Text style={styles.boldText}>"โปรไฟล์"</Text>{'\n'}
              3. กดไอคอน <Text style={styles.boldText}>"ตั้งค่า"</Text> (รูปฟันเฟือง){'\n'}
              4. เลือกเมนู <Text style={styles.boldText}>"ลบบัญชีผู้ใช้"</Text> และกดยืนยัน ระบบจะลบข้อมูลให้ทันที
            </Text>
          </View>

          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>วิธีที่ 2: ขอลบผ่านหน้าเว็บนี้</Text>
            <Text style={styles.cardBoxText}>
              กรอกอีเมลที่คุณใช้สมัครไว้ในแบบฟอร์มด้านล่าง หรือส่งอีเมลมาที่{' '}
              <Text style={styles.emailText}>phatsachon25488@gmail.com</Text> ทีมงานจะตรวจสอบและดำเนินการลบบัญชีของคุณภายใน 24–48 ชั่วโมง
            </Text>
          </View>
        </View>

        {/* 2. ข้อมูลที่จะถูกลบ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. ข้อมูลที่จะถูกลบอย่างถาวร</Text>
          <Text style={styles.paragraph}>
            เมื่อลบบัญชีแล้ว ข้อมูลทั้งหมดของคุณจะถูกลบออกจากระบบอย่างถาวรและไม่สามารถกู้คืนได้ ดังนี้
          </Text>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ข้อมูลบัญชีและโปรไฟล์: </Text>
              อีเมล, ชื่อที่แสดง, ชื่อผู้ใช้, รูปโปรไฟล์ และข้อความแนะนำตัวทั้งหมด
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>โพสต์และรูปภาพอาหาร: </Text>
              ภาพถ่ายอาหาร เมนู และเนื้อหาทั้งหมดที่คุณเคยโพสต์ไว้ในชุมชน
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ความคิดเห็น: </Text>
              ข้อความความคิดเห็นทั้งหมดที่คุณเคยเขียนไว้
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ประวัติการใช้งาน: </Text>
              ประวัติการค้นหา และรายการอาหารที่คุณเคยกดบันทึกไว้
            </Text>
          </View>
        </View>

        {/* 3. ระยะเวลาการลบข้อมูล */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ระยะเวลาการลบข้อมูล</Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ข้อมูลบัญชีและเนื้อหาทั้งหมด: </Text>
              จะถูกลบออกจากระบบอย่างถาวรทันทีหลังจากกดยืนยัน (หรือหลังจากทีมงานตรวจสอบคำขอเรียบร้อยแล้ว)
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>ประวัติการเชื่อมต่อเพื่อความปลอดภัย: </Text>
              บันทึกการเข้าใช้งานระบบจะถูกล้างทิ้งโดยอัตโนมัติภายใน 7–14 วัน
            </Text>
          </View>
        </View>

        {/* 4. แบบฟอร์มส่งคำขอ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. แบบฟอร์มส่งคำขอลบบัญชี</Text>
          <Text style={styles.paragraph}>
            หากคุณไม่ได้ติดตั้งแอปพลิเคชันแล้ว สามารถกรอกอีเมลด้านล่างเพื่อให้ทีมงานช่วยดำเนินการลบบัญชีให้ได้เลยครับ
          </Text>

          {isSubmitted ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>✓ ได้รับคำขอลบบัญชีเรียบร้อยแล้ว</Text>
              <Text style={styles.successText}>
                ระบบได้รับคำขอลบบัญชีสำหรับอีเมล <Text style={styles.boldText}>{email}</Text> เรียบร้อยแล้ว ทีมงานจะดำเนินการตรวจสอบและลบข้อมูลของคุณอย่างถาวรภายใน 24–48 ชั่วโมง
              </Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.label}>อีเมลที่ใช้ลงทะเบียนใน KIN RAI DEE *</Text>
              <TextInput
                style={styles.input}
                placeholder="กรอกอีเมลของคุณ เช่น example@gmail.com"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>เหตุผลในการขอลบ (ไม่บังคับ)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="บอกเหตุผลหรือข้อเสนอแนะเพื่อให้เรานำไปปรับปรุงบริการ (ไม่บังคับ)"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
              />

              <Pressable
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>กำลังส่งคำขอ...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>ส่งคำขอลบบัญชีผู้ใช้</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerNav}>
          <Pressable
            onPress={() => router.push('/privacy-policy' as any)}
            style={({ pressed }) => [styles.footerLinkPressable, pressed && styles.btnPressed]}
            hitSlop={8}
          >
            <Text style={styles.footerLink}>นโยบายความเป็นส่วนตัว</Text>
          </Pressable>
          <Text style={styles.footerDot}>•</Text>
          <Pressable
            onPress={() => router.push('/terms-of-use' as any)}
            style={({ pressed }) => [styles.footerLinkPressable, pressed && styles.btnPressed]}
            hitSlop={8}
          >
            <Text style={styles.footerLink}>ข้อกำหนดการใช้งาน</Text>
          </Pressable>
          <Text style={styles.footerDot}>•</Text>
          <View style={styles.footerLinkPressable}>
            <Text style={[styles.footerLink, styles.footerLinkActive]}>คำขอลบบัญชี</Text>
          </View>
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
  mobileMainTitle: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  mobileScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
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
  emailText: {
    color: '#FF6B00',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  cardBox: {
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderLeftWidth: 4,
    borderLeftColor: '#A7392A',
  },
  cardBoxTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  cardBoxText: {
    fontSize: 14,
    color: '#3A3A3C',
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
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
  formContainer: {
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    marginTop: 6,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_600SemiBold',
      default: 'Inter, sans-serif',
    }),
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: '#1A1A1A',
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  textArea: {
    height: 84,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#A7392A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  successCard: {
    backgroundColor: '#F0F9F0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4EDDA',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    marginTop: 10,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  successText: {
    fontSize: 14,
    color: '#3A3A3C',
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
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
