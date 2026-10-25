# 🗄️ KIN RAI DEE — Supabase Database & Migrations

[![Supabase](https://img.shields.io/badge/Supabase-CLI%20v2-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

โฟลเดอร์นี้รวบรวมไฟล์การตั้งค่า (Configuration), SQL Migrations และนโยบายความปลอดภัย (Row-Level Security - RLS) ของฐานข้อมูล **Supabase PostgreSQL** สำหรับระบบ **KIN RAI DEE**

---

## 📑 สารบัญ (Table of Contents)
- [โครงสร้างโฟลเดอร์ (Directory Structure)](#-โครงสร้างโฟลเดอร์-directory-structure)
- [ลำดับประวัติการทำ Migration (Migrations History)](#-ลำดับประวัติการทำ-migration-migrations-history)
- [ตารางข้อมูลสำคัญในระบบ (Database Tables Overview)](#-ตารางข้อมูลสำคัญในระบบ-database-tables-overview)
- [คำสั่งการใช้งาน Supabase CLI (CLI Commands Reference)](#-คำสั่งการใช้งาน-supabase-cli-cli-commands-reference)
- [มาตรฐานความปลอดภัย RLS (Row-Level Security Policies)](#-มาตรฐานความปลอดภัย-rls-row-level-security-policies)

---

## 📂 โครงสร้างโฟลเดอร์ (Directory Structure)

```text
supabase/
├── migrations/                                          # 📜 ไฟล์ประวัติการเปลี่ยนแปลง Database
│   ├── 20260904122754_remote_schema.sql                 # โครงสร้างฐานข้อมูลเริ่มต้น (Foods, Posts, Profiles)
│   ├── 20261021_admin_tables.sql                        # ตาราง Reports และ Audit Logs
│   ├── 20261022000000_user_safety_and_blocks.sql        # ตาราง User Blocks และฟังก์ชันความปลอดภัย
│   ├── 20261024000000_create_admins_table.sql           # ตาราง Admins และสิทธิ์การเข้าถึงหลังบ้าน
│   ├── 20261025010000_alter_target_id_to_varchar.sql    # ปรับแต่งประเภท Target ID รองรับทั้ง Post และ User
│   ├── 20261025020000_create_deletion_requests.sql      # ตารางคำขอลบบัญชี (Account Deletion Requests)
│   └── 20261025030000_security_hardening.sql            # การเพิ่มความเข้มงวด RLS และ Indexes
├── snippets/                                            # 📝 SQL Snippets สำหรับการทดสอบ
├── config.toml                                          # ⚙️ การตั้งค่า Supabase Local Environment
├── prod_migration_all.sql                               # สคริปต์รวมทุก Migration สำหรับขึ้น Production
└── README.md                                            # 📖 เอกสารคู่มือนี้
```

---

## 📜 ลำดับประวัติการทำ Migration (Migrations History)

1. `20260904122754_remote_schema.sql` — สร้างตารางพื้นฐานของแอป (`profiles`, `foods`, `categories`, `restaurants`, `posts`, `post_likes`, `post_comments`, `post_images`) พร้อม Storage Buckets
2. `20261021_admin_tables.sql` — สร้างตาราง `reports` สำหรับเก็บประวัติการรายงานเนื้อหา และ `admin_audit_logs` สำหรับบันทึกประวัติการกระทำของผู้ดูแล
3. `20261022000000_user_safety_and_blocks.sql` — สร้างตาราง `user_blocks` ป้องกันการมองเห็นข้อมูลระหว่างผู้ใช้ที่บล็อกกัน (Bidirectional safety)
4. `20261024000000_create_admins_table.sql` — สร้างตาราง `admins` ผูกกับ `auth.users.id` เพื่อควบคุมสิทธิ์การเข้าถึง Admin Dashboard
5. `20261025010000_alter_target_id_to_varchar.sql` — อัปเกรดคอลัมน์ `target_id` ในตาราง `reports` เป็น `VARCHAR` เพื่อรองรับ Polymorphic ID (ทั้ง UUID และ String ID)
6. `20261025020000_create_deletion_requests.sql` — สร้างตาราง `account_deletion_requests` เพื่อบันทึกคำขอลบบัญชีตามมาตรฐานกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA/GDPR)
7. `20261025030000_security_hardening.sql` — เพิ่มความปลอดภัยขั้นสูงให้กับฐานข้อมูล (RLS Enforcement, Security Indexes)

---

## 🗄️ ตารางข้อมูลสำคัญในระบบ (Database Tables Overview)

| ตาราง (Table) | คำอธิบาย (Description) |
| :--- | :--- |
| `profiles` | ข้อมูลโปรไฟล์ผู้ใช้ (ชื่อ, ไบโอ, รูปประจำตัว, สถานะการใช้งาน) |
| `posts` | โพสต์รีวิวอาหารและร้านค้าของผู้ใช้งาน |
| `post_images` | รูปภาพประกอบของแต่ละโพสต์ (อ้างอิง URL ใน Storage) |
| `post_comments` | ความคิดเห็นใต้โพสต์ |
| `post_likes` | บันทึกการกดถูกใจโพสต์ของผู้ใช้งาน |
| `foods` | รายการเมนูอาหารสำหรับระบบสุ่มและแนะนำ |
| `categories` | หมวดหมู่อาหาร (เช่น อาหารคาว, หวาน, เครื่องดื่ม) |
| `restaurants` | รายละเอียดร้านอาหารและพิกัดแผนที่ |
| `reports` | รายงานเนื้อหาหรือผู้ใช้ที่ไม่เหมาะสม (สถานะ: pending, resolved, dismissed) |
| `user_blocks` | รายการการบล็อกผู้ใช้ระหว่างกัน (`blocker_id`, `blocked_id`) |
| `account_deletion_requests` | รายการคำขอลบบัญชีผู้ใช้ |
| `admins` | รายชื่อผู้ดูแลระบบที่มีสิทธิ์เข้าใช้งาน Admin Dashboard |
| `admin_audit_logs` | ประวัติการทำงานและการตัดสินรายงานของผู้ดูแลระบบ |

---

## 🛠️ คำสั่งการใช้งาน Supabase CLI (CLI Commands Reference)

> แนะนำให้ติดตั้ง Supabase CLI ผ่าน npm: `npm install -g supabase` หรือเรียกผ่าน `npx supabase`

### 1. เริ่มต้นระบบ Supabase จำลองในเครื่อง (Local Development)
```bash
# สตาร์ท Docker containers สำหรับ Supabase (PostgreSQL, GoTrue, PostgREST, Studio)
npx supabase start

# ตรวจสอบสถานะและ URLs / Keys ในเครื่อง
npx supabase status

# หยุดการทำงานของ Supabase ในเครื่อง
npx supabase stop
```
- Local Studio URL: `http://127.0.0.1:54323` (หรือตามพอร์ตที่กำหนดใน config.toml)
- API URL: `http://127.0.0.1:54321`

### 2. การจัดการ Migration
```bash
# สร้างไฟล์ Migration ใหม่
npx supabase migration new your_migration_name

# นำไฟล์ Migration ไปปรับใช้กับฐานข้อมูล Local
npx supabase migration up

# รีเซ็ตฐานข้อมูล Local และรัน Migrations ทั้งหมดใหม่ตั้งแต่ต้น
npx supabase db reset

# ตรวจสอบความต่างระหว่าง Schema ในเครื่องกับ Database
npx supabase db diff
```

### 3. การเชื่อมต่อกับ Remote Project (Production)
```bash
# ล็อกอินเข้าสู่ Supabase
npx supabase login

# เชื่อมโยงกับ Project บน Cloud
npx supabase link --project-ref your-project-ref

# Push การเปลี่ยนแปลง Migration ขึ้นไปยัง Remote Database
npx supabase db push
```

---

## 🔒 มาตรฐานความปลอดภัย RLS (Row-Level Security Policies)

ทุกตารางในระบบได้ทำการเปิดใช้งาน Row-Level Security (RLS) เพื่อความปลอดภัยสูงสุด:
- **`profiles`:** ผู้ใช้ทั่วไปสามารถอ่านได้เฉพาะโปรไฟล์ที่ไม่ถูกระงับ และสามารถแก้ไขได้เฉพาะโปรไฟล์ของตนเอง (`auth.uid() = id`)
- **`posts`:** โพสต์สาธารณะสามารถอ่านได้ทั่วไป แต่จะถูกกรองหากผู้สร้างถูกบล็อก และสามารถแก้ไข/ลบได้เฉพาะเจ้าของโพสต์ (`auth.uid() = user_id`)
- **`reports` & `admin_audit_logs`:** อนุญาตให้สร้างรายงานได้จากผู้ใช้ที่ยืนยันตัวตนแล้ว แต่สิทธิ์ในการอ่านและแก้ไขทั้งหมดสงวนไว้ให้เฉพาะผู้ใช้ที่มีสถานะในตาราง `admins` หรือผ่าน Service Role Key ของ Backend เท่านั้น
- **`account_deletion_requests`:** ผู้ใช้สามารถส่งคำขอของตนเองได้ หรือส่งผ่าน Public Verification Form
