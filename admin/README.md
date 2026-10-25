# 🛡️ KIN RAI DEE — Admin Moderation Dashboard

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Playwright](https://img.shields.io/badge/E2E%20Tests-Playwright-2EAD33.svg?style=flat&logo=playwright&logoColor=white)](https://playwright.dev)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-EC407A.svg?style=flat)](https://oxc.rs)

เว็บแอปพลิเคชันสำหรับผู้ดูแลระบบและฝ่ายตรวจสอบเนื้อหา (Content Moderation & System Administration) ของแพลตฟอร์ม **KIN RAI DEE** พัฒนาด้วย **Vite**, **React 19**, **TypeScript** และมาพร้อมชุดทดสอบอัตโนมัติแบบครบวงจรด้วย **Playwright**

---

## 📑 สารบัญ (Table of Contents)
- [ฟังก์ชันการทำงานหลัก (Core Features)](#-ฟังก์ชันการทำงานหลัก-core-features)
- [โครงสร้างโฟลเดอร์ (Directory Structure)](#-โครงสร้างโฟลเดอร์-directory-structure)
- [การตั้งค่า Environment Variables](#-การตั้งค่า-environment-variables)
- [คำสั่งการใช้งานทั้งหมด (All Commands Reference)](#-คำสั่งการใช้งานทั้งหมด-all-commands-reference)
- [การทดสอบด้วย Playwright E2E (End-to-End Testing)](#-การทดสอบด้วย-playwright-e2e-end-to-end-testing)
- [การรันด้วย Docker (Docker Containerization)](#-การรันด้วย-docker-docker-containerization)

---

## ⚡ ฟังก์ชันการทำงานหลัก (Core Features)

1. **การยืนยันสิทธิ์ผู้ดูแลระบบ (Admin Role Authorization):**
   - ตรวจสอบสิทธิ์ผ่านตาราง `admins` ใน Supabase อย่างรัดกุม ป้องกันผู้ใช้ทั่วไปเข้าถึงระบบ
2. **ระบบจัดการรายงานเนื้อหาและผู้ใช้ (Moderation & Reports Center):**
   - แสดงคิวรายงานโพสต์และผู้ใช้ที่ไม่เหมาะสม (Pending Reports)
   - **Moderation Detail Drawer:** ตรวจสอบข้อความ เหตุผลที่ถูกรายงาน และหลักฐานประกอบ
   - การตัดสินรายงาน (Report Actions):
     - **Dismiss:** ยกเลิกรายงาน (กรณีเป็นรายงานเท็จ)
     - **Delete Content:** ลบโพสต์ที่ไม่เหมาะสมออกจากแพลตฟอร์มทันที
     - **Ban / Suspend User:** ระงับการใช้งานบัญชีผู้กระทำผิด
3. **ระบบจัดการคำขอลบบัญชี (Account Deletion Requests Queue):**
   - รองรับกระบวนการ PDPA / GDPR และ Apple Store Review Guidelines
   - ผู้ดูแลสามารถตรวจสอบและอนุมัติการลบข้อมูลถาวรของผู้ใช้
4. **สรุปสถิติและประวัติการทำงาน (Metrics & Audit Logs):**
   - แสดงตัวเลขสถิติผู้ใช้งาน โพสต์ และรายงานที่รอดำเนินการ
   - บันทึก Audit Log ทุกการกระทำของผู้ดูแลเพื่อความโปร่งใสและตรวจสอบย้อนหลังได้

---

## 📂 โครงสร้างโฟลเดอร์ (Directory Structure)

```text
admin/
├── e2e/                           # 🎭 Playwright End-to-End Test Suite
│   ├── account-deletion.spec.ts   # ทดสอบการจัดการคำขอลบบัญชี
│   ├── admin-dashboard.spec.ts    # ทดสอบ Dashboard, Drawer และ Moderation Flow
│   ├── backend-api.spec.ts        # ทดสอบการเชื่อมต่อ API ของ Backend โดยตรง
│   └── frontend-app.spec.ts       # ทดสอบหน้าจอหลักของแอป Frontend Mobile Web
│
├── src/
│   ├── components/                # UI Components (Drawer, Tables, Cards, Modals)
│   ├── pages/                     # หน้า Dashboard, Reports, Users, Logs
│   ├── services/                  # การเชื่อมต่อ API Backend และ Supabase
│   ├── types/                     # TypeScript Interfaces และ Type Definitions
│   ├── App.tsx                    # Main Layout และ Routing
│   ├── index.css                  # Global Styles
│   └── main.tsx                   # React Root Mounting
│
├── public/                        # Static Assets
├── .env.example                   # ไฟล์ตัวอย่าง Environment
├── Dockerfile                     # Docker Container Configuration
├── playwright.config.ts           # Playwright Test Configuration
├── vite.config.ts                 # Vite Build Configuration
├── package.json                   # รายการ Scripts และ Dependencies
└── README.md                      # 📖 คู่มือการพัฒนานี้
```

---

## ⚙️ การตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` เป็น `.env` ในโฟลเดอร์ `admin/`:

```bash
cp .env.example .env
```

| ตัวแปร (Variable) | คำอธิบาย (Description) | ตัวอย่าง (Example) |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL ของ Supabase Project | `http://127.0.0.1:54321` หรือ `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key สำหรับ Admin Login | `eyJhbGci...` |
| `VITE_API_URL` | URL ของ Backend API (เว้นว่างไว้เพื่อใช้ Vite Proxy) | `http://localhost:8000` |
| `VITE_BACKEND_URL` | URL ของ Backend API สำหรับ Docker Internal Network | `http://backend:8000` |

---

## 🛠️ คำสั่งการใช้งานทั้งหมด (All Commands Reference)

### 1. ติดตั้ง Dependencies
```bash
cd admin
npm install
```

### 2. รันโหมด Development (Hot Module Replacement)
```bash
npm run dev
```
- เซิร์ฟเวอร์จะเปิดที่: `http://localhost:5173/` (สามารถเข้าถึงผ่าน IP ในเครือข่ายได้ด้วย `--host 0.0.0.0`)

### 3. Build สำหรับ Production
```bash
npm run build
```
- รัน Type-checking (`tsc -b`) และสร้างไฟล์ Optimized Bundles ไว้ในโฟลเดอร์ `dist/`

### 4. พรีวิว Production Build ในเครื่อง
```bash
npm run preview
```

### 5. ตรวจสอบโค้ดด้วย Oxlint
```bash
npm run lint
```

---

## 🎭 การทดสอบด้วย Playwright E2E (End-to-End Testing)

โฟลเดอร์ `admin/e2e` เป็นศูนย์กลางการทดสอบแบบ End-to-End ของทั้งระบบ (ตรวจครอบคลุมทั้ง Admin, Backend API และ Frontend App):

```bash
# รันการทดสอบทั้งหมดในโหมด Headless
npm run test:e2e

# รันการทดสอบแบบ Interactive UI Mode (มีหน้าต่างให้กดดู step และ time-travel)
npx playwright test --ui

# รันเฉพาะไฟล์ที่ต้องการ เช่น backend-api
npx playwright test e2e/backend-api.spec.ts

# รันเฉพาะไฟล์ frontend-app
npx playwright test e2e/frontend-app.spec.ts

# เปิดดูรายงานผลการทดสอบ HTML ล่าสุด
npx playwright show-report

# เปิดดูบันทึก Trace สำหรับ Debug กรณี Test ไม่ผ่าน
npx playwright show-trace test-results/trace.zip
```

> [!TIP]
> ก่อนรัน `npm run test:e2e` ควรแน่ใจว่าได้เปิด Backend API (Port 8000), Admin Dashboard (Port 5173) และ Frontend (Port 8081) ไว้เรียบร้อยแล้ว หรือรันผ่าน `docker compose up -d`

---

## 🐳 การรันด้วย Docker (Docker Containerization)

Admin Dashboard มี Dockerfile พร้อมสำหรับการ Deploy เป็นคอนเทนเนอร์:

```bash
# Build และรันผ่าน Docker Compose
docker compose up --build -d admin

# ดู Logs การทำงาน
docker compose logs -f admin

# ปิดการทำงาน
docker compose stop admin
```
