# 📱 KIN RAI DEE — Mobile Application (Frontend)

[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020.svg?style=flat&logo=expo&logoColor=white)](https://docs.expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Storage-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com)

แอปพลิเคชันมือถือ **KIN RAI DEE (กินไรดี)** พัฒนาด้วย **React Native** บน **Expo SDK 58** และ **Expo Router v4** รองรับทั้ง **iOS**, **Android** และ **Web Browser**

---

## 📑 สารบัญ (Table of Contents)
- [ฟีเจอร์เด่นของแอป (Key Features)](#-ฟีเจอร์เด่นของแอป-key-features)
- [โครงสร้างโฟลเดอร์ (Directory Structure)](#-โครงสร้างโฟลเดอร์-directory-structure)
- [การตั้งค่า Environment Variables](#-การตั้งค่า-environment-variables)
- [คำสั่งการใช้งานทั้งหมด (All Commands Reference)](#-คำสั่งการใช้งานทั้งหมด-all-commands-reference)
- [คำสั่งลัดใน Expo CLI (CLI Interactive Shortcuts)](#-คำสั่งลัดใน-expo-cli-cli-interactive-shortcuts)
- [การทดสอบบนอุปกรณ์จริง (Testing on Physical Devices)](#-การทดสอบบนอุปกรณ์จริง-testing-on-physical-devices)
- [การ Build และ Deploy Web (Web Export & Vercel)](#-การ-build-และ-deploy-web-web-export--vercel)

---

## ✨ ฟีเจอร์เด่นของแอป (Key Features)

1. **ฟีดรีวิวอาหารและคอมมูนิตี้ (Feed & Community):**
   - สำรวจรีวิวอาหารจากผู้ใช้คนอื่นๆ พร้อมภาพถ่าย คะแนน และพิกัดร้าน
   - กดถูกใจ (Like) และแสดงความคิดเห็น (Comment)
   - สร้างโพสต์ใหม่ อัปโหลดรูปภาพหลายรูปขึ้น Supabase Storage พร้อมระบุพิกัดร้าน
2. **ระบบสุ่มอาหาร (Food Randomizer):**
   - **Random Wheel:** วงล้อเสี่ยงทายเมนูอาหารแบบแอนิเมชันลื่นไหล
   - **Random by Ingredients:** เลือกวัตถุดิบที่มีในตู้เย็นแล้วระบบจะแนะนำเมนูที่ตรงกัน
3. **ระบบความปลอดภัยและการปฏิบัติตามกฎหมาย (User Safety & Legal Compliance):**
   - ปฏิบัติตามมาตรฐาน App Store & Google Play Store Guidelines สำหรับ User-Generated Content (UGC)
   - เมนูรายงานเนื้อหาหรือผู้ใช้ที่ไม่เหมาะสม (Report Modal)
   - เมนูบล็อกผู้ใช้ (Block User) พร้อมระบบกรองข้อมูลสองทาง (Bidirectional blocking)
   - หน้าจัดการรายชื่อผู้ใช้ที่ถูกบล็อก (Blocked Users) และปลดบล็อกได้ทันที
   - หน้าขอลบบัญชีผู้ใช้ (Account Deletion Request)
   - หน้าข้อกำหนดการใช้งาน (Terms of Use) และนโยบายความเป็นส่วนตัว (Privacy Policy)
4. **ระบบยืนยันตัวตนและการกู้คืนรหัสผ่าน (Authentication & Recovery):**
   - เข้าสู่ระบบและสมัครสมาชิกด้วย Supabase Auth
   - ระบบลืมรหัสผ่าน (Forgot Password) พร้อมช่องกรอก OTP 6 หลักแบบ Pill Input และลิงก์รีเซ็ตรหัสผ่าน

---

## 📂 โครงสร้างโฟลเดอร์ (Directory Structure)

```text
frontend/
├── app/
│   ├── (auth)/                # 🔐 กลุ่มหน้า Authentication
│   │   ├── login.tsx          # หน้าเข้าสู่ระบบ
│   │   ├── register.tsx       # หน้าลงทะเบียนสมาชิกใหม่
│   │   ├── forgot-password.tsx# หน้าลืมรหัสผ่านและยืนยัน OTP
│   │   └── _layout.tsx        # Stack Layout สำหรับ Auth
│   ├── (tabs)/                # 📱 หน้าแท็บหลักด้านล่าง
│   │   ├── index.tsx          # แท็บฟีดโพสต์อาหาร (Home)
│   │   ├── search.tsx         # แท็บค้นหาอาหารและร้านค้า
│   │   ├── random-food.tsx    # แท็บวงล้อสุ่มอาหาร
│   │   ├── random-ingredient.tsx # แท็บสุ่มอาหารตามวัตถุดิบ
│   │   ├── profile.tsx        # แท็บโปรไฟล์ส่วนตัว
│   │   └── _layout.tsx        # Bottom Tabs Layout
│   ├── AddPost.tsx            # หน้าสร้างโพสต์รีวิว
│   ├── EditPost.tsx           # หน้าแก้ไขโพสต์
│   ├── MyPost.tsx             # หน้าดูโพสต์ของฉัน
│   ├── OtherPost.tsx          # หน้าดูโพสต์ของผู้อื่น
│   ├── EditProfile.tsx        # หน้าแก้ไขข้อมูลส่วนตัวและอัปโหลดรูป
│   ├── OtherProfile.tsx       # หน้าโปรไฟล์ของผู้ใช้อื่น
│   ├── blocked-users.tsx      # หน้ารายชื่อผู้ใช้ที่ถูกบล็อก
│   ├── delete-account.tsx     # หน้าแบบฟอร์มขอลบบัญชี
│   ├── privacy-policy.tsx     # หน้านโยบายความเป็นส่วนตัว
│   ├── terms-of-use.tsx       # หน้าข้อกำหนดและเงื่อนไข
│   ├── settings.tsx           # หน้าตั้งค่าแอปพลิเคชัน
│   └── _layout.tsx            # Root App Layout พร้อม Providers
│
├── components/                # 🧩 Reusable UI Components
│   ├── auth/                  # คอมโพเนนต์ OTP Pill Input
│   ├── LegalNavbar.tsx        # Header นำทางสำหรับหน้า Legal
│   └── ...                    # การ์ดอาหาร, ปุ่ม, โมดอล
├── lib/                       # 🔌 Utility Libraries
│   └── supabase.ts            # การเชื่อมต่อ Supabase Client (React Native Storage)
├── scripts/                   # 📜 Automation Scripts
│   ├── filter-legal-dist.js   # สคริปต์กรองเฉพาะหน้า Legal สำหรับ Vercel Web Export
│   ├── test_forgot_password.mjs # สคริปต์ทดสอบกระบวนการ Forgot Password OTP
│   └── reset-project.js       # สคริปต์รีเซ็ตโปรเจกต์
├── assets/                    # 🎨 รูปภาพ ไอคอน ฟอนต์
├── Dockerfile                 # คอนเทนเนอร์สำหรับรัน Frontend Web
├── vercel.json                # การตั้งค่า Deploy Web บน Vercel
├── package.json               # รายการ Dependencies และ Scripts
└── README.md                  # 📖 เอกสารคู่มือนี้
```

---

## ⚙️ การตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่โฟลเดอร์ `frontend/.env` โดยกำหนดค่าดังต่อไปนี้:

| ตัวแปร (Variable) | คำอธิบาย (Description) | ตัวอย่าง (Example) |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | URL ของ FastAPI Backend | `http://localhost:8000` หรือ `http://192.168.1.XX:8000` |
| `EXPO_PUBLIC_SUPABASE_URL` | URL ของ Supabase Project | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Anon/Publishable Key | `eyJhbGci...` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API Key สำหรับแสดงแผนที่ร้านอาหาร | `AIzaSy...` |

> [!IMPORTANT]
> หากกำลังทดสอบผ่านมือถือจริงด้วย **Expo Go** ตัวแปร `EXPO_PUBLIC_API_URL` **ห้ามใช้ `localhost`** ให้ใช้ IP Address ของคอมพิวเตอร์ในเครือข่าย Wi-Fi เดียวกัน เช่น `http://192.168.1.50:8000`

---

## 🛠️ คำสั่งการใช้งานทั้งหมด (All Commands Reference)

### 1. ติดตั้ง Dependencies
```bash
cd frontend
npm install
```

### 2. รันแอปพลิเคชัน (Development Server)
```bash
# รัน Expo Server มาตรฐาน
npx expo start
# หรือ
npm start

# รันด้วยโหมด Tunnel (แนะนำเมื่อมือถือกับคอมอยู่คนละ Wi-Fi หรือมีปัญหาเน็ตเวิร์ก)
npx expo start --tunnel

# รันพร้อมล้าง Bundler Cache (เมื่อเกิดปัญหาค้างหรือเปลี่ยน assets)
npx expo start --clear
```

### 3. รันบนแพลตฟอร์มที่ต้องการโดยตรง
```bash
# รันบน Web Browser ทันที
npm run web

# รันบน Android Emulator หรืออุปกรณ์ที่ต่อสาย USB
npm run android

# รันบน iOS Simulator (เฉพาะ macOS)
npm run ios
```

### 4. ตรวจสอบคุณภาพโค้ด (Quality & Health Checks)
```bash
# ตรวจสอบ TypeScript Type Errors
npx tsc --noEmit

# ตรวจสอบ Linter กฎระเบียบโค้ด
npm run lint

# ตรวจสอบความสมบูรณ์ของ Dependencies และ Config ในโปรเจกต์ Expo
npx expo-doctor
```

### 5. คำสั่ง Build และ Export สำหรับ Web
```bash
# Build Expo Web และกรอง Static HTML สำหรับหน้า Legal (PDPA / Terms)
npm run build:web

# หรือเรียก build:legal
npm run build:legal
```

### 6. ทดสอบการส่ง OTP / กู้คืนรหัสผ่าน
```bash
node scripts/test_forgot_password.mjs
```

---

## ⌨️ คำสั่งลัดใน Expo CLI (CLI Interactive Shortcuts)

หลังจากพิมพ์ `npx expo start` ใน Terminal คุณสามารถกดปุ่มลัดต่อไปนี้ได้ทันที:

| ปุ่ม (Key) | หน้าที่ (Action) |
| :---: | :--- |
| `a` | เปิดใน Android Emulator / Device |
| `i` | เปิดใน iOS Simulator |
| `w` | เปิดใน Web Browser |
| `r` | Reload แอปพลิเคชัน |
| `m` | เปิด/ปิด Developer Menu บนอุปกรณ์ |
| `c` | แสดง QR Code สำหรับสแกนเข้า Expo Go อีกครั้ง |
| `Ctrl + C` | หยุดการทำงานของเซิร์ฟเวอร์ |

---

## 📲 การทดสอบบนอุปกรณ์จริง (Testing on Physical Devices)

1. ติดตั้งแอป **Expo Go** จาก App Store (iOS) หรือ Google Play Store (Android)
2. เชื่อมต่อสมาร์ตโฟนและคอมพิวเตอร์เข้ากับ **Wi-Fi วงเดียวกัน**
3. รันคำสั่ง `npx expo start` ใน Terminal
4. **Android:** ใช้แอป Expo Go สแกน QR Code ที่แสดงบน Terminal
5. **iOS:** ใช้แอป Camera (กล้องถ่ายรูป) ส่อง QR Code แล้วแตะแจ้งเตือนเพื่อเปิดใน Expo Go
6. *หากสแกนแล้วไม่ขึ้นหรือไม่สามารถเชื่อมต่อได้ ให้ใช้โหมด Tunnel:*
   ```bash
   npx expo start --tunnel
   ```

---

## 🚀 การ Build และ Deploy Web (Web Export & Vercel)

โปรเจกต์รองรับการ Deploy หน้าเว็บของแอปและหน้าเอกสารทางกฎหมาย (Privacy Policy, Terms of Use, Delete Account) ไปยัง Vercel:

1. สคริปต์ `scripts/filter-legal-dist.js` จะทำการ Export และจัดระเบียบไฟล์ `dist/` ให้อัตโนมัติ
2. ไฟล์ `vercel.json` ได้ตั้งค่า Clean URLs และ Route Rewrites ไว้อย่างสมบูรณ์
3. สั่ง Build:
   ```bash
   npm run build:web
   ```

---

## 📱 การ Build สำหรับ Android (APK & Google Play AAB)

โปรเจกต์ Expo ได้ตั้งค่า Package Name ไว้เป็น `com.kinraidee.app` (ใน `app.json`) พร้อมสำหรับการ Build:

### วิธีที่ 1: Build ผ่าน Cloud ด้วย EAS Build (แนะนำที่สุด — สะดวกและไม่ต้องลง Android Studio)
1. ติดตั้ง EAS CLI และเข้าสู่ระบบ:
   ```bash
   npm install -g eas-cli
   npx eas login
   ```
2. ตั้งค่าโปรเจกต์ EAS ครั้งแรก:
   ```bash
   npx eas build:configure
   ```
3. สั่ง Build ตามเป้าหมายที่ต้องการ:
   - **Build ไฟล์ APK (เพื่อติดตั้งทดสอบบนมือถือโดยตรง / Sideloading):**
     ```bash
     npx eas build -p android --profile preview
     ```
   - **Build ไฟล์ AAB (Android App Bundle สำหรับอัปโหลดขึ้น Google Play Store):**
     ```bash
     npx eas build -p android --profile production
     ```
   *(เมื่อ Build เสร็จในระบบ Cloud จะได้รับลิงก์ดาวน์โหลดไฟล์ `.apk` หรือ `.aab` ทันที)*

### วิธีที่ 2: Build แบบ Local ในเครื่องตัวเอง (Local Prebuild & Gradle)
*หมายเหตุ: จำเป็นต้องมี Android Studio, Android SDK และ Java JDK (JDK 17) ติดตั้งในเครื่อง*
1. สร้างโฟลเดอร์ Native Android ด้วยคำสั่ง Prebuild:
   ```bash
   npx expo prebuild --platform android
   ```
2. คอมไพล์ไฟล์ APK ด้วย Gradle:
   ```bash
   cd android
   # Windows PowerShell:
   .\gradlew.bat assembleRelease
   # macOS / Linux:
   ./gradlew assembleRelease
   ```
3. ไฟล์ APK ที่ได้จะอยู่ที่:
   `android/app/build/outputs/apk/release/app-release.apk`