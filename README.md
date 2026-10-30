# 🍽️ KIN RAI DEE (กินไรดี) — Food Community & Recommendation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020.svg?style=flat&logo=expo&logoColor=white)](https://docs.expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![Vite](https://img.shields.io/badge/Vite-Admin%20Dashboard-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20BaaS-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tests-2EAD33.svg?style=flat&logo=playwright&logoColor=white)](https://playwright.dev)

**KIN RAI DEE (กินไรดี)** คือแพลตฟอร์มคอมมูนิตี้สำหรับสายกินแบบครบวงจร ที่ช่วยแก้ปัญหาโลกแตก "วันนี้กินอะไรดี?" ประกอบด้วย Mobile Application (iOS & Android & Web), FastAPI Backend, Admin Moderation Dashboard และฐานข้อมูล Supabase

---

## 📑 สารบัญ (Table of Contents)
- [สถาปัตยกรรมระบบ (Architecture)](#-สถาปัตยกรรมระบบ-architecture)
- [โครงสร้างโปรเจกต์ (Project Structure)](#-โครงสร้างโปรเจกต์-project-structure)
- [Port & Service Overview](#-port--service-overview)
- [เริ่มต้นใช้งานด่วน (Quick Start with Docker)](#-เริ่มต้นใช้งานด่วน-quick-start-with-docker)
- [คำสั่งการรันที่ Root (Root Workspace Scripts)](#-คำสั่งการรันที่-root-root-workspace-scripts)
- [การรันแบบแยก Service (Manual Local Run)](#-การรันแบบแยก-service-manual-local-run)
- [การทดสอบระบบ (Testing & Quality Assurance)](#-การทดสอบระบบ-testing--quality-assurance)
- [เอกสารของแต่ละโมดูล (Module Documentations)](#-เอกสารของแต่ละโมดูล-module-documentations)
- [ความปลอดภัยและข้อกำหนดทางกฎหมาย (Legal & Compliance)](#-ความปลอดภัยและข้อกำหนดทางกฎหมาย-legal--compliance)

---

## 🏛️ สถาปัตยกรรมระบบ (Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        KIN RAI DEE PLATFORM                            │
└────────────────────────────────────────────────────────────────────────┘
        │                                                │
        ▼                                                ▼
┌───────────────────────────┐                ┌───────────────────────────┐
│   Mobile App (Frontend)   │                │ Admin Web Dashboard       │
│   Expo SDK 58 / React 19  │                │ Vite + React 19 + TS      │
│   • Feed & Post Reviews   │                │ • Review Reports/Flags    │
│   • Random Wheel          │                │ • User Ban & Moderation   │
│   • Ingredient Matching   │                │ • Audit Logs & Analytics  │
│   • Safety / Block / OTP  │                │ • Account Deletion Queue  │
│   (Port 8081 / Expo Go)   │                │ (Port 5173)               │
└─────────────┬─────────────┘                └─────────────┬─────────────┘
              │                                            │
              │                 REST API                   │
              └───────────────────►◄───────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────────────┐
              │          Backend API (FastAPI)             │
              │ • SlowAPI Rate Limiter (200 req/min)       │
              │ • Strict CORS & OWASP Security Headers     │
              │ • Content & Safety Validators              │
              │ • Jinja2 Static Legal Pages                │
              │ (Port 8000)                                │
              └────────────────────┬───────────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────────────┐
              │       Supabase (PostgreSQL & Storage)      │
              │ • Row-Level Security (RLS)                 │
              │ • Auth GoTrue & Password Recovery          │
              │ • Post/Avatar Bucket Storage               │
              └────────────────────────────────────────────┘
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
kin-rai-dee/
├── admin/                     # 🛡️ ระบบหลังบ้าน Admin Dashboard (Vite + React + TS)
│   ├── e2e/                   # Playwright End-to-End Tests
│   ├── src/                   # React Components, Moderation Drawers, Pages
│   ├── Dockerfile             # Docker Container Configuration
│   ├── package.json           # Scripts (dev, build, lint, test:e2e)
│   └── README.md              # 📖 คู่มือการพัฒนา Admin Dashboard
│
├── backend/                   # 🚀 REST API Service (FastAPI + Python 3.11+)
│   ├── app/
│   │   ├── core/              # Security, Auth Middleware, Validators
│   │   ├── db/                # Supabase Python Client
│   │   ├── routers/           # Endpoint Routers (auth, posts, safety, admin, etc.)
│   │   ├── templates/         # Legal HTML (Terms, Privacy, Account Deletion)
│   │   └── main.py            # App Initialization, CORS, Rate Limiting
│   ├── tests/                 # Pytest Unit & Integration Tests
│   ├── test_system_apis.py    # Comprehensive E2E System Test Script
│   ├── Dockerfile             # Backend Dockerfile
│   ├── requirements.txt       # Python Dependencies
│   └── README.md              # 📖 คู่มือการพัฒนา Backend API
│
├── frontend/                  # 📱 Mobile & Web App (Expo SDK 58 + React Native)
│   ├── app/
│   │   ├── (auth)/            # Login, Register, Forgot Password
│   │   ├── (tabs)/            # Home Feed, Search, Random Food, Ingredients, Profile
│   │   ├── AddPost.tsx        # Create Post with Images & Location
│   │   ├── EditProfile.tsx    # Profile Settings & Avatar Upload
│   │   └── privacy-policy.tsx # Privacy & Terms Screens
│   ├── components/            # UI Components & LegalNavbar
│   ├── scripts/               # Build scripts (legal dist filter, test otp)
│   ├── Dockerfile             # Frontend Dockerfile
│   ├── package.json           # Expo Scripts
│   └── README.md              # 📖 คู่มือการพัฒนา Frontend Mobile App
│
├── supabase/                  # 🗄️ Database Schemas & Migrations (Supabase CLI)
│   ├── migrations/            # SQL Migration Scripts
│   ├── config.toml            # Supabase Local Config
│   └── README.md              # 📖 คู่มือการจัดการ Database & Migrations
│
├── docker-compose.yml         # 🐳 Orchestration รวมทุก Service (backend, admin, frontend)
├── package.json               # 📦 Root Package Scripts
└── README.md                  # 📖 เอกสารภาพรวมหลัก (หน้านี้)
```

---

## 🌐 Port & Service Overview

| Service | Port | Local URL | รายละเอียด |
| :--- | :---: | :--- | :--- |
| **Backend API** | `8000` | http://localhost:8000 | FastAPI REST API & Public Legal Pages |
| **Admin Dashboard** | `5173` | http://localhost:5173 | Vite React Moderation Dashboard |
| **Frontend Web** | `8081` | http://localhost:8081 | Expo Web App |
| **Supabase Local (Optional)** | `54321` / `54500` | http://127.0.0.1:54321 | Local Supabase Studio & API |

---

## ⚡ เริ่มต้นใช้งานด่วน (Quick Start with Docker)

คุณสามารถเปิดทุก Service (Backend, Admin, Frontend) ได้พร้อมกันด้วยคำสั่งเดียวผ่าน Docker Compose:

### 1. โคลนและเตรียมไฟล์ Environment
```bash
git clone https://github.com/Pravarit-pengseng/kin-rai-dee.git
cd kin-rai-dee

# คัดลอกและตั้งค่า .env ของแต่ละโฟลเดอร์
cp backend/.env.example backend/.env       # (หากมี หรือใส่ค่า Supabase)
cp admin/.env.example admin/.env
cp frontend/.env.example frontend/.env
```

### 2. รันระบบทั้งหมดด้วย Docker Compose
```bash
# รันทุก Service พร้อม Build ในโหมด Background
docker compose up --build -d

# ตรวจสอบสถานะการทำงาน
docker compose ps

# ดู Live Logs ของทุก Service
docker compose logs -f
```

### 3. ปิดการทำงาน
```bash
docker compose down
```

---

## 🛠️ คำสั่งการรันที่ Root (Root Workspace Scripts)

ที่โฟลเดอร์ Root (`kin-rai-dee/`) มีคำสั่งลัดผ่าน `package.json` ให้เรียกใช้งานได้อย่างสะดวก:

```bash
# รันทุก Container ด้วย Docker Compose
npm run docker:up

# ปิดทุก Container
npm run docker:down

# รันเฉพาะ Backend Container
npm run docker:backend

# รันเฉพาะ Admin Dashboard Container
npm run docker:admin

# เปิด Admin Dashboard ในโหมด Local Development (Vite HMR)
npm run admin

# Build Admin Dashboard สำหรับ Production
npm run admin:build

# รัน Playwright End-to-End Test Suite ทั้งหมด
npm run test:e2e
```

---

## 💻 การรันแบบแยก Service (Manual Local Run)

### 1. รัน Backend API (FastAPI)
```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Root: http://localhost:8000
- Swagger Docs (โหมด Development): http://localhost:8000/docs

### 2. รัน Frontend Mobile App (Expo)
```bash
cd frontend
npm install

# รัน Expo Dev Server
npx expo start

# รันแบบเปิด tunnel เพื่อทดสอบข้ามเครือข่ายมือถือ
npx expo start --tunnel

# รันบน Web Browser ทันที
npm run web
```

### 3. รัน Admin Dashboard (Vite)
```bash
cd admin
npm install
npm run dev
```
- เปิดเบราว์เซอร์ที่: http://localhost:5173

---

## 🧪 การทดสอบระบบ (Testing & Quality Assurance)

โปรเจกต์ KIN RAI DEE มีชุดการทดสอบครอบคลุมทั้ง Unit Test, Integration Test, E2E Browser Testing และ System API Tests:

### 1. คำสั่งลัดจาก Root Workspace
```bash
# รัน Playwright E2E Tests ทั้งหมดแบบ Headless
npm run test:e2e
```

### 2. รัน Playwright E2E Tests (`admin/`)
ศูนย์กลางการทดสอบแบบ End-to-End ครอบคลุมทั้ง Admin Dashboard, Backend API และ Frontend Mobile Web:
```bash
cd admin

# รันการทดสอบทั้งหมดแบบ Headless
npm run test:e2e
# หรือ
npx playwright test

# รันแบบเปิดหน้าต่างเบราว์เซอร์จริง (Headed Mode)
npx playwright test --headed

# รันแบบ Interactive UI Mode (มี Time-travel และขั้นตอนแบบละเอียด)
npx playwright test --ui

# รันเจาะจงเฉพาะไฟล์ที่ต้องการ:
npx playwright test e2e/account-deletion.spec.ts   # หน้าขอลบบัญชี PDPA และ Responsive (375x667)
npx playwright test e2e/admin-dashboard.spec.ts    # แดชบอร์ดผู้ดูแล, Moderation Drawer, Audit Logs
npx playwright test e2e/backend-api.spec.ts       # ตรวจสอบความเชื่อมต่อ API และ Legal Pages
npx playwright test e2e/frontend-app.spec.ts      # หน้าจอหลัก Mobile Web (Login, Register, Recovery)

# ดูรายงานผลการทดสอบแบบ HTML
npx playwright show-report
```

### 3. รัน Backend Unit & Integration Tests (Pytest)
```bash
cd backend

# เปิดใช้งาน Virtual Environment
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux:        source .venv/bin/activate

# รันการทดสอบพื้นฐานทั้งหมด (Unauthenticated, Safety, Admin, Legal)
pytest -v

# รันเฉพาะโมดูลที่ต้องการ:
pytest tests/test_safety.py -v                  # ความปลอดภัย การรายงาน และการบล็อก (Safety & Report)
pytest tests/test_admin.py -v                   # ระบบผู้ดูแลและการจัดการเนื้อหา (Admin & Moderation)
pytest tests/test_integration_admin_mobile.py -v # เชื่อมต่อระหว่าง Mobile และ Admin RBAC
pytest tests/test_legal_pages.py -v             # หน้าข้อกำหนดทางกฎหมายและแบบฟอร์มขอลบบัญชี
pytest tests/test_api.py -v                     # Core Mobile API (ฟีด, ค้นหา, สุ่มอาหาร, ร้านอาหาร)

# รันแบบครบวงจร (รวม 9 Authenticated Tests ที่ต้องใช้ User Token)
# Windows PowerShell:
$env:TEST_EMAIL="user@gmail.com"; $env:TEST_PASSWORD="password"; pytest -v
# macOS/Linux:
TEST_EMAIL="user@gmail.com" TEST_PASSWORD="password" pytest -v
```

### 4. รัน Comprehensive End-to-End API Health Test
สคริปต์ทดสอบสุขภาพและ Endpoint ทั้งหมดของ Backend (ตรวจทั้ง Mobile API, Legal Pages และ Admin endpoints):
```bash
# ทดสอบ Local (Port 8000)
python backend/test_system_apis.py --base-url http://localhost:8000

# ทดสอบ Production Staging
python backend/test_system_apis.py --base-url https://your-backend-api.com
```

### 5. รัน Typecheck, Linter และ Logic Validation
```bash
# ตรวจสอบ TypeScript ใน Frontend Mobile
cd frontend
npx tsc --noEmit
npm run lint

# ทดสอบตรรกะการตรวจสอบ Validation รหัสผ่าน และ OTP 6 หลัก
node scripts/test_forgot_password.mjs

# ตรวจสอบ Linter และทดสอบ Build ใน Admin Dashboard
cd admin
npm run lint
npm run build
```

---

## 🏗️ การ Build สำหรับ Production (Production Build)

สรุปคำสั่ง Build สำหรับแต่ละโมดูลเพื่อนำไป Deploy บน Cloud หรือ Production Server:

### 1. Frontend Web & Legal Pages (Expo Export)
สร้าง Static Web Bundle สำหรับหน้าเว็บและหน้า Legal (PDPA / Terms) พร้อม Deploy ไปยัง Vercel:
```bash
cd frontend
npm run build:web
```
- Output: โฟลเดอร์ `frontend/dist/`

### 2. Frontend Mobile App — Android (APK & Google Play AAB)
โปรเจกต์ Expo รองรับการ Build สำหรับ Android 2 รูปแบบ:

#### แบบที่ 1: Build ผ่าน Cloud ด้วย EAS Build (แนะนำ — ได้ไฟล์พร้อมดาวน์โหลด ไม่ต้องใช้ Android Studio)
```bash
cd frontend

# Build ไฟล์ APK เพื่อส่งให้คนในทีมติดตั้งทดสอบบนเครื่องจริง
npx eas build -p android --profile preview

# Build ไฟล์ AAB (Android App Bundle) เพื่อส่งขึ้น Google Play Store
npx eas build -p android --profile production
```

#### แบบที่ 2: Build แบบ Local ในเครื่องตัวเอง (ต้องมี Android SDK & Java JDK)
```bash
cd frontend

# 1. แปลงโปรเจกต์เป็น Native Android
npx expo prebuild --platform android

# 2. คอมไพล์ APK ด้วย Gradle (Windows PowerShell)
cd android
.\gradlew.bat assembleRelease
# (macOS/Linux: ./gradlew assembleRelease)
```
- Output APK: `frontend/android/app/build/outputs/apk/release/app-release.apk`

### 3. Admin Dashboard (Vite SPA Build)
ตรวจสอบ TypeScript และ Bundle เว็บแผงควบคุมผู้ดูแลระบบ:
```bash
cd admin
npm run build

# ทดสอบพรีวิว Production Build ในเครื่อง:
npm run preview
```
- Output: โฟลเดอร์ `admin/dist/`

### 3. Backend API (Docker Image Build)
สร้าง Container Image พร้อมรันบน Docker / Cloud Run / VPS:
```bash
cd backend
docker build -t kin-rai-dee-backend .
```

---

## 📖 เอกสารของแต่ละโมดูล (Module Documentations)

ดูรายละเอียดเชิงลึก การตั้งค่า Environment และคู่มือคำสั่งเฉพาะทางของแต่ละส่วนได้ที่:
- 📱 [Frontend Mobile App README](file:///d:/software_project/kin-rai-dee/frontend/README.md)
- 🚀 [Backend FastAPI API README](file:///d:/software_project/kin-rai-dee/backend/README.md)
- 🛡️ [Admin Dashboard README](file:///d:/software_project/kin-rai-dee/admin/README.md)
- 🗄️ [Supabase Database README](file:///d:/software_project/kin-rai-dee/supabase/README.md)

---

## ⚖️ ความปลอดภัยและข้อกำหนดทางกฎหมาย (Legal & Compliance)

ระบบรองรับข้อกำหนด App Store / Google Play Store Guidelines เรื่อง User Generated Content (UGC) และ PDPA / GDPR:
- **ข้อกำหนดการใช้งาน (Terms of Use):** `GET /terms-of-use`
- **นโยบายความเป็นส่วนตัว (Privacy Policy):** `GET /privacy-policy`
- **การขอลบบัญชีผู้ใช้ (Account Deletion Request):** `GET /delete-account` และ `POST /api/safety/account-deletion-request`
- **ระบบความปลอดภัยและการรายงาน (Safety & Moderation):**
  - รายงานโพสต์/ผู้ใช้ที่ไม่เหมาะสม (`/api/safety/report`)
  - บล็อกและปลดบล็อกผู้ใช้ (`/api/safety/block`, `/api/safety/unblock`)
  - ป้องกันการเข้าถึงข้อมูลที่ถูกบล็อกทั้งสองฝั่ง (Bidirectional safety filtering)
