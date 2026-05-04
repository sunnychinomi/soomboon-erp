# Setup Guide · Day 1

## Prerequisites

ตรวจสอบเครื่องของคุณ:

```bash
# .NET SDK 9.0 ขึ้นไป
dotnet --version

# Node.js 20 ขึ้นไป
node --version

# Git
git --version
```

ถ้ายังไม่มี:
- **.NET 9 SDK**: https://dotnet.microsoft.com/download
- **Node.js LTS**: https://nodejs.org/
- **VS Code**: https://code.visualstudio.com/ (แนะนำ extensions: C# Dev Kit, ESLint, Tailwind CSS)

---

## 1. Setup Backend (.NET API)

### 1.1 ใส่ Database Password

แก้ไข `api/Soomboon.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Host=db.vnglixgjsekuzuyvzjbl.supabase.co;Database=postgres;Username=postgres;Password=[YOUR_SUPABASE_PASSWORD];SslMode=Require;Trust Server Certificate=true;"
  }
}
```

> 🔑 หา Supabase password ได้ที่ Supabase Dashboard → Settings → Database

### 1.2 Restore + Build

```bash
cd api
dotnet restore
dotnet build
```

### 1.3 สร้าง Migration ครั้งแรก

```bash
# ติดตั้ง EF tool (ถ้ายังไม่มี)
dotnet tool install --global dotnet-ef

# สร้าง initial migration
dotnet ef migrations add InitialCreate \
  --project Soomboon.Infrastructure \
  --startup-project Soomboon.Api \
  --output-dir Data/Migrations

# Apply ลง database (สร้าง tables)
dotnet ef database update \
  --project Soomboon.Infrastructure \
  --startup-project Soomboon.Api
```

### 1.4 รัน API

```bash
dotnet run --project Soomboon.Api
```

เปิด browser:
- API: `https://localhost:7001`
- Swagger: `https://localhost:7001/swagger`

### 1.5 ทดสอบ Register/Login

ผ่าน Swagger:
1. คลิก `POST /api/auth/register`
2. กดปุ่ม "Try it out"
3. ใส่ JSON:
   ```json
   {
     "username": "admin",
     "email": "admin@softcraft.co.th",
     "password": "Admin@2026",
     "fullName": "Administrator"
   }
   ```
4. กด Execute → ได้ JWT token
5. ลอง `POST /api/auth/login` ด้วยข้อมูลเดียวกัน

---

## 2. Setup Frontend (React)

### 2.1 Copy Logo Files

Copy logo image ที่ save ไว้:
```bash
cp ../logo.png web/public/logo.png
cp ../logo-mono.png web/public/logo-mono.png
```

### 2.2 ติดตั้ง Dependencies

```bash
cd web
npm install
```

> ⏰ ครั้งแรกใช้เวลา ~2-3 นาที (~300MB)

### 2.3 ตั้งค่า Environment

Copy `.env.example` → `.env`:
```bash
cp .env.example .env
```

แก้ไข `.env`:
```
VITE_API_URL=https://localhost:7001/api
```

### 2.4 รัน Dev Server

```bash
npm run dev
```

เปิด browser → `http://localhost:5173`

---

## 3. ทดสอบ End-to-End

1. รัน API (terminal 1): `dotnet run --project Soomboon.Api`
2. รัน Web (terminal 2): `npm run dev`
3. เปิด `http://localhost:5173`
4. เห็นหน้า Login Enterprise
5. กรอก:
   - Username: `admin`
   - Password: `Admin@2026`
6. กด "เข้าสู่ระบบ"
7. ✅ ถ้าเข้า Dashboard ได้ = ทุกอย่างทำงาน!

---

## 🔍 Troubleshooting

### .NET error: "Unable to connect to PostgreSQL"
- ตรวจสอบ Supabase password ใน `appsettings.Development.json`
- ตรวจสอบ Supabase project ยัง active

### React error: "Network Error"
- ตรวจสอบ API กำลังรันที่ `https://localhost:7001`
- Browser อาจปฏิเสธ self-signed cert → ไปที่ `https://localhost:7001/swagger` แล้ว Accept ก่อน

### CORS error
- ตรวจสอบ `Cors:AllowedOrigins` ใน `appsettings.json` มี `http://localhost:5173`

### `dotnet ef` command not found
```bash
dotnet tool install --global dotnet-ef
```

---

## 📚 Next Steps (Phase 2)

- [ ] Implement Inventory module (Stock, Products, Receiving)
- [ ] Implement Purchase module (PR, PO, Vendors)
- [ ] Implement Sales module (SO, Invoice, Receipt)
- [ ] Implement Admin module (Users, Roles, Branches)
- [ ] Add reports + PDF export
- [ ] Setup CI/CD (push to GitHub triggers deploy)
- [ ] Production deploy:
  - Backend → Render.com
  - Frontend → Cloudflare Pages
