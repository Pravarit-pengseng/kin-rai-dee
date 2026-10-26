# 🚀 KIN RAI DEE — Backend API Service

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![Uvicorn](https://img.shields.io/badge/ASGI-Uvicorn-499848.svg?style=flat&logo=gunicorn&logoColor=white)](https://www.uvicorn.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Pytest](https://img.shields.io/badge/Tests-Pytest-0A9EDC.svg?style=flat&logo=pytest&logoColor=white)](https://pytest.org)

Backend REST API สำหรับแพลตฟอร์ม **KIN RAI DEE** พัฒนาด้วย **FastAPI** และ **Python 3.11+** เชื่อมต่อฐานข้อมูล **Supabase PostgreSQL** มีระบบรักษาความปลอดภัยระดับ Production ครบครัน ทั้ง Rate Limiting, OWASP Security Headers, Role-based Access Control และ Bidirectional User Safety Filtering

---

## 📑 สารบัญ (Table of Contents)
- [โครงสร้างโค้ด (Directory Structure)](#-โครงสร้างโค้ด-directory-structure)
- [การตั้งค่า Environment Variables](#-การตั้งค่า-environment-variables)
- [คำสั่งการติดตั้งและรันระบบ (Setup & Run Commands)](#-คำสั่งการติดตั้งและรันระบบ-setup--run-commands)
- [การรันด้วย Docker (Docker & Containerization)](#-การรันด้วย-docker-docker--containerization)
- [การทดสอบระบบ (Automated Testing)](#-การทดสอบระบบ-automated-testing)
- [สารบบ API Endpoints (API Routes Catalog)](#-สารบบ-api-endpoints-api-routes-catalog)
- [มาตรฐานความปลอดภัย (Security & Compliance)](#-มาตรฐานความปลอดภัย-security--compliance)

---

## 📂 โครงสร้างโค้ด (Directory Structure)

```text
backend/
├── app/
│   ├── core/
│   │   ├── security.py            # JWT Auth Bearer, Token verification (get_current_user)
│   │   └── validators.py          # Input Sanitization, XSS protection, Payload validation
│   ├── db/
│   │   └── supabase.py            # Supabase Python Client initialization
│   ├── routers/
│   │   ├── admin.py               # 🛡️ Admin Moderation, Reports, Ban User, Metrics
│   │   ├── auth.py                # 🔑 Password Reset & Recovery verification
│   │   ├── categories.py          # 🏷️ Food Category management
│   │   ├── foods.py               # 🍜 Food items & Randomizer engine
│   │   ├── pages.py               # 📄 Static HTML Legal Pages (Terms, Privacy, Account Deletion)
│   │   ├── posts.py               # 📝 User Posts, Likes, Comments, Image storage
│   │   ├── profiles.py            # 👤 User Profile & Avatar management
│   │   ├── restaurants.py         # 🏪 Restaurant Directory & Google Maps integration
│   │   ├── safety.py              # 🚨 User Safety: Report, Block, Unblock, Account Deletion Request
│   │   └── search.py              # 🔍 Search across Foods, Restaurants, and Posts
│   ├── templates/                 # 🌐 Jinja2 HTML Templates
│   │   ├── delete-account.html    # Web Account Deletion Submission Form
│   │   ├── privacy-policy.html    # Privacy Policy Page
│   │   └── terms-of-use.html      # Terms of Use Page
│   └── main.py                    # ⚡ FastAPI App initialization, Middleware, Rate Limiter
│
├── tests/                         # 🧪 Pytest Test Suite
│   ├── test_admin.py              # Tests for Admin Moderation endpoints
│   ├── test_api.py                # Tests for Core Mobile endpoints
│   ├── test_integration_admin_mobile.py # Integration tests between Mobile & Admin
│   ├── test_legal_pages.py        # Tests for Public Legal HTML endpoints
│   └── test_safety.py             # Tests for Report, Block, and Safety endpoints
│
├── test_system_apis.py            # 🚀 Standalone E2E System Test Script (CLI)
├── Kin-Rai-Dee.postman_collection.json # 📬 Postman API Collection
├── pytest.ini                     # Pytest configuration
├── requirements.txt               # Python package dependencies
├── Dockerfile                     # Docker build definition
└── README.md                      # 📖 คู่มือการพัฒนานี้
```

---

## ⚙️ การตั้งค่า Environment Variables

สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ `backend/.env` โดยมีตัวแปรสำคัญดังนี้:

| ตัวแปร (Variable) | คำอธิบาย (Description) | ตัวอย่าง (Example) |
| :--- | :--- | :--- |
| `SUPABASE_URL` | URL ของ Supabase Project | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Secret Key (สำหรับ Backend สิทธิ์ Admin) | `eyJhbGci...` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Anon / Publishable Key | `eyJhbGci...` |
| `ENVIRONMENT` | สภาพแวดล้อม (`development` หรือ `production`) | `development` |
| `ALLOWED_ORIGINS` | อนุญาต CORS Origins (คั่นด้วยจุลภาค `,`) | `http://localhost:8081,http://localhost:5173` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key สำหรับค้นหาร้านอาหาร | `AIzaSy...` |

> [!TIP]
> หากตั้งค่า `ENVIRONMENT=production` ระบบจะปิด Interactive Docs (`/docs`, `/redoc`, `/openapi.json`) โดยอัตโนมัติ เพื่อลดช่องโหว่การโจมตี (Attack Surface Reduction) หากต้องการเปิด Swagger ให้ตั้งเป็น `ENVIRONMENT=development`

---

## 💻 คำสั่งการติดตั้งและรันระบบ (Setup & Run Commands)

### 1. การเตรียม Virtual Environment
```bash
cd backend

# สร้าง venv
python -m venv .venv

# การเปิดใช้งาน Virtual Environment:
# บน Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# บน macOS / Linux:
source .venv/bin/activate
```

### 2. ติดตั้ง Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. คำสั่งการรันเซิร์ฟเวอร์ (Development & Production)

```bash
# วิธีที่ 1: รันด้วย Uvicorn พร้อม Auto-Reload (แนะนำสำหรับ Development)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# วิธีที่ 2: รันด้วย FastAPI CLI ในโหมด Dev
fastapi dev app/main.py

# วิธีที่ 3: รันในโหมด Production แบบหลาย Workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2

# หรือรันด้วย FastAPI CLI Production
fastapi run app/main.py --port 8000
```

- เข้าถึง Root Endpoint: `http://localhost:8000/`
- ดู Swagger Documentation (Dev mode): `http://localhost:8000/docs`
- ดู Redoc (Dev mode): `http://localhost:8000/redoc`

---

## 🐳 การรันด้วย Docker (Docker & Containerization)

### 1. Build และรันเฉพาะ Backend Service ผ่าน Docker Compose
```bash
# จากโฟลเดอร์ Root หรือ backend
docker compose up --build -d backend

# ดูสถานะ Container
docker compose ps

# ดู Live Logs
docker compose logs -f backend

# ปิด Container
docker compose stop backend
```

### 2. รันแบบเดี่ยวด้วย Docker CLI
```bash
cd backend

# Build Docker Image
docker build -t kin-rai-dee-backend .

# Run Container
docker run -d --name kin-rai-dee-api -p 8000:8000 --env-file .env kin-rai-dee-backend

# เข้าไปรัน Shell ภายใน Container
docker exec -it kin-rai-dee-api sh
```

---

## 🧪 การทดสอบระบบ (Automated Testing)

### 1. รัน Pytest Suite ทั้งหมด
```bash
# รันการทดสอบพื้นฐานทั้งหมด (Unauthenticated, Safety, Admin, Legal)
pytest -v

# รันเฉพาะการทดสอบความปลอดภัย (Safety & Blocking)
pytest tests/test_safety.py -v

# รันเฉพาะการทดสอบ Admin & Moderation
pytest tests/test_admin.py -v

# รันเฉพาะการทดสอบหน้าเอกสารทางกฎหมาย
pytest tests/test_legal_pages.py -v
```

#### การรันการทดสอบแบบเต็มรูปแบบ (รวม Authenticated Tests ทั้งหมด)
การทดสอบ API ที่ต้องมีการยืนยันตัวตน (เช่น การสร้างโพสต์, บุ๊กมาร์ก, คอมเมนต์, การแก้ไขโปรไฟล์) จำเป็นต้องระบุอีเมลและรหัสผ่านของบัญชีผู้ใช้ทดสอบ:

**Windows (PowerShell):**
```powershell
$env:TEST_EMAIL="your_test_user@gmail.com"
$env:TEST_PASSWORD="your_password"
pytest tests/test_api.py -v
```

**macOS / Linux / Bash:**
```bash
TEST_EMAIL="your_test_user@gmail.com" TEST_PASSWORD="your_password" pytest tests/test_api.py -v
```
> [!NOTE]
> หากไม่ได้ระบุ `TEST_EMAIL` และ `TEST_PASSWORD` ระบบจะทำการ **Skip (ข้าม)** การทดสอบ 9 ข้อที่ต้องใช้สิทธิ์ผู้ใช้โดยอัตโนมัติ เพื่อป้องกันการเกิด 401 Unauthorized

### 2. รัน Comprehensive End-to-End API Test Script
สคริปต์ `test_system_apis.py` จะยิงทดสอบระบบจริงแบบครบวงจร (Root, Health, Foods, Categories, Posts, Legal Pages, Safety/Reports, Admin Auth):
```bash
# ทดสอบเซิร์ฟเวอร์ Local (ค่าเริ่มต้นที่ port 8000)
python test_system_apis.py --base-url http://localhost:8000

# ทดสอบ Production Staging Server
python test_system_apis.py --base-url https://kin-rai-dee-backend.onrender.com
```

---

## 📡 สารบบ API Endpoints (API Routes Catalog)

### 1. หน้าเว็บกฎหมายและการปฏิบัติตามข้อกำหนด (Public Legal Pages)
- `GET /terms-of-use` — หน้าข้อกำหนดและเงื่อนไขการใช้งาน (HTML)
- `GET /privacy-policy` — หน้านโยบายความเป็นส่วนตัว (HTML)
- `GET /delete-account` — หน้าเว็บส่งคำขอลบบัญชีผู้ใช้ (HTML Form)

### 2. ความปลอดภัยของผู้ใช้และการควบคุมเนื้อหา (User Safety & Moderation)
- `POST /api/safety/report` — ส่งรายงานเนื้อหา/ผู้ใช้ไม่เหมาะสม
- `POST /api/safety/block` — บล็อกผู้ใช้
- `POST /api/safety/unblock` — ปลดบล็อกผู้ใช้
- `GET /api/safety/blocked-users` — ดึงรายชื่อผู้ใช้ที่ตนเองบล็อก
- `POST /api/safety/account-deletion-request` — ส่งคำขอลบบัญชีผู้ใช้

### 3. ระบบผู้ดูแลระบบ (Admin Dashboard)
- `GET /api/admin/metrics` — สรุปสถิติระบบ (ยอดผู้ใช้, โพสต์, รายงานที่รอดำเนินการ)
- `GET /api/admin/reports` — รายการรายงานเนื้อหาและผู้ใช้
- `POST /api/admin/reports/{report_id}/resolve` — ตัดสินรายงาน (อนุมัติ/ยกเลิก/ลบเนื้อหา)
- `POST /api/admin/users/{user_id}/ban` — ระงับการใช้งานบัญชีผู้ใช้
- `POST /api/admin/users/{user_id}/unban` — ปลดการระงับบัญชีผู้ใช้
- `GET /api/admin/deletion-requests` — รายการคำขอลบบัญชีที่รอดำเนินการ
- `POST /api/admin/deletion-requests/{request_id}/approve` — อนุมัติการลบบัญชี
- `GET /api/admin/audit-logs` — บันทึกประวัติการกระทำของผู้ดูแลระบบ

### 4. ชุมชนและโพสต์ (Posts & Community)
- `GET /posts` — ดึงฟีดโพสต์ (กรองผู้ใช้ที่ถูกบล็อกสองทางโดยอัตโนมัติ)
- `POST /posts` — สร้างโพสต์ใหม่พร้อมรูปภาพและพิกัดร้าน
- `GET /posts/{post_id}` — ดูรายละเอียดโพสต์
- `PUT /posts/{post_id}` — แก้ไขโพสต์
- `DELETE /posts/{post_id}` — ลบโพสต์
- `POST /posts/{post_id}/like` — กดถูกใจ/ยกเลิกถูกใจโพสต์
- `GET /posts/{post_id}/comments` — ดึงรายการความคิดเห็น
- `POST /posts/{post_id}/comments` — เพิ่มความคิดเห็น

### 5. อาหารและการสุ่ม (Foods & Recommendations)
- `GET /foods` — รายการเมนูอาหารทั้งหมด
- `GET /foods/random` — สุ่มเมนูอาหาร
- `GET /categories` — หมวดหมู่อาหาร
- `GET /search` — ค้นหาเมนูอาหาร ร้านค้า และโพสต์

---

## 🔒 มาตรฐานความปลอดภัย (Security & Compliance)

1. **Rate Limiting (SlowAPI):**
   - จำกัดความถี่การเรียกใช้งานระดับ Global ที่ 200 requests/นาที ต่อ IP
   - ป้องกันการโจมตีแบบ Brute-force และ DoS/DDoS
2. **Strict CORS Policy:**
   - อนุญาตเฉพาะโดเมนที่ระบุใน `ALLOWED_ORIGINS`
   - ป้องกัน CSRF และ unauthorized cross-origin requests
3. **OWASP Security Headers Middleware:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (ป้องกัน Clickjacking)
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (เมื่อรันใน Production)
4. **Input Sanitization & Validation (`app/core/validators.py`):**
   - ตรวจจับและทำความสะอาด Input ป้องกัน HTML/Script Injection
   - จำกัดความยาวของข้อความ รายงาน และคำขอ
