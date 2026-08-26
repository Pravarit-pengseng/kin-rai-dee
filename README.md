# KIN ARI DEE Mobile aplication


## โครงสร้างไฟล์

```text
kin-rai-dee/
│
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx
│   │   │   └── explore.tsx
│   │   └── _layout.tsx
│   ├── components/
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── food.ts
│   ├── assets/
│   ├── .env
│   └── package.json
│
└── backend/
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── routes/
    │   │   └── foods.py
    │   ├── services/
    │   │   └── food_service.py
    │   ├── db/
    │   │   └── supabase.py
    │   └── schemas/
    │       └── food.py
    ├── Dockerfile
    ├── docker-compose.yml
    ├── requirements.txt
    ├── .dockerignore
    └── .env
```

## คำสั่งรัน Frontend

```bash
cd frontend
npm install
  เพื่อติดตั้ง dependency 
npx expo start
  เพื่อจำลองแอพในโทรศัพท์ โดยสแกน Qrcode
```

หากเชื่อมต่อมือถือไม่ได้:

```bash
npx expo start --tunnel
```

หากมีปัญหาเกี่ยวกับ cache:

```bash
npx expo start --clear
```

คำสั่งลัดหลังจากรัน Expo:

```text
a = เปิด Android
w = เปิด Web
r = Reload
```

ตรวจสอบ Expo Project:

```bash
npx expo-doctor
```

ตรวจสอบ TypeScript:

```bash
npx tsc --noEmit
```


## คำสั่งรัน Backend

```bash
cd backend
```

Build และรัน Docker:

```bash
docker compose up --build
```

รันหลังจาก Build แล้ว:

```bash
docker compose up
```

รันแบบ Background:

```bash
docker compose up -d
```

หยุดและลบ Container:

```bash
docker compose down
```

Restart Container:

```bash
docker compose restart
```

ดูสถานะ Container:

```bash
docker compose ps
```

ดู Logs:

```bash
docker compose logs
```

ดู Logs แบบต่อเนื่อง:

```bash
docker compose logs -f
```

ดู Logs เฉพาะ Service `api`:

```bash
docker compose logs -f api
```

Build ใหม่โดยไม่ใช้ Cache:

```bash
docker compose build --no-cache
docker compose up
```

เข้าไปใน Container:

```bash
docker compose exec api sh
```

ออกจาก Container:

```bash
exit
```

## คำสั่ง FastAPI

รัน FastAPI ด้วย Uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Development:

```bash
fastapi dev app/main.py
```

Production:

```bash
fastapi run app/main.py
```

## พัฒนา Frontend และ Backend พร้อมกัน

Terminal 1 — Frontend:

```bash
cd frontend
npx expo start
```

Terminal 2 — Backend:

```bash
cd backend
docker compose up
```

## URL สำหรับทดสอบ Backend

```text
http://localhost:8000
http://localhost:8000/docs
```

## การตั้งค่า API URL ใน Frontend

หากทดสอบบนคอมพิวเตอร์เครื่องเดียวกัน:

```ts
const API_URL = "http://localhost:8000";
```

หากทดสอบบนโทรศัพท์จริง ให้ใช้ IP ของคอมพิวเตอร์:

```ts
const API_URL = "http://192.168.1.10:8000";
```

ตรวจสอบ IP บน Windows:

```bash
ipconfig
```

ตัวอย่างการเรียก API:

```ts
const response = await fetch(`${API_URL}/foods`);
const data = await response.json();
```

## Official Documentation

- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [FastAPI](https://fastapi.tiangolo.com/tutorial/)
- [Uvicorn](https://www.uvicorn.org/)
- [Docker](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Supabase Database](https://supabase.com/docs/guides/database/overview)
- [Supabase Python](https://supabase.com/docs/reference/python/introduction)
- [PostgreSQL](https://www.postgresql.org/docs/)
