# 🚀 Deploy Guide

Production deployment ของ S.ARAN ERP system

## Architecture

```
softcraft.co.th             → Cloudflare Pages (React)
soomboon-api.onrender.com   → Render.com (.NET API)
db.[id].supabase.co         → Supabase PostgreSQL
```

---

## 🔵 Backend → Render.com

### 1. สมัคร Render Account
- ไป https://render.com
- คลิก **"Sign in with GitHub"**
- Authorize Render to access your repos

### 2. Generate JWT Secret
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```
**เก็บค่านี้ไว้ — จะใช้ใน Step 4**

### 3. สร้าง Web Service
1. Render Dashboard → **"New +"** → **"Web Service"**
2. เลือก repo `soomboon-erp`
3. กรอก:
   - **Name**: `soomboon-api`
   - **Region**: `Singapore` (ใกล้ไทยสุด)
   - **Branch**: `main`
   - **Root Directory**: `api`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./Soomboon.Api/Dockerfile`
   - **Plan**: **Free**

### 4. Environment Variables
คลิก **"Advanced"** → เพิ่ม:

| Key | Value |
|-----|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__Default` | `Host=aws-1-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.vnglixgjsekuzuyvzjbl;Password=K3p5w99412!;SslMode=Require;Trust Server Certificate=true;Pooling=true;` |
| `Jwt__Secret` | (ค่าจาก Step 2) |
| `Jwt__Issuer` | `soomboon-api` |
| `Jwt__Audience` | `soomboon-web` |
| `Jwt__ExpiryMinutes` | `60` |
| `Jwt__RefreshExpiryDays` | `30` |
| `Cors__AllowedOrigins__0` | `https://soomboon.softcraft.co.th` |
| `Cors__AllowedOrigins__1` | `https://soomboon-erp.pages.dev` |

> 💡 **Note**: ใช้ `__` (double underscore) เป็นตัวคั่นใน .NET config (เทียบเท่า `:`)

### 5. Deploy
- คลิก **"Create Web Service"**
- รอ 5-10 นาที (Build + Deploy)
- เมื่อเสร็จได้ URL: `https://soomboon-api.onrender.com`

### 6. ทดสอบ
```bash
curl https://soomboon-api.onrender.com/health
# ควรได้: {"status":"healthy","time":"..."}
```

เปิด Swagger: `https://soomboon-api.onrender.com/swagger`

---

## 🟢 Frontend → Cloudflare Pages

### 1. สร้าง Pages Project
1. Cloudflare Dashboard → **Workers & Pages** → **Create**
2. Tab **"Pages"** → **"Connect to Git"**
3. Authorize GitHub → เลือก `soomboon-erp` repo
4. คลิก **"Begin setup"**

### 2. Build Configuration
- **Project name**: `soomboon`
- **Production branch**: `main`
- **Framework preset**: **Vite**
- **Build command**: `cd web && npm install && npm run build`
- **Build output directory**: `web/dist`
- **Root directory**: `/` (leave default)

### 3. Environment Variables
คลิก **"Environment variables (advanced)"** → เพิ่ม:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://soomboon-api.onrender.com/api` |
| `NODE_VERSION` | `20` |

### 4. Deploy
- คลิก **"Save and Deploy"**
- รอ 2-5 นาที
- ได้ URL: `https://soomboon-erp.pages.dev`

---

## 🌐 Custom Domain → soomboon.softcraft.co.th

### 1. ใน Cloudflare Pages Project
1. คลิกโปรเจกต์ `soomboon`
2. Tab **"Custom domains"**
3. **"Set up a custom domain"**
4. ใส่: `soomboon.softcraft.co.th`
5. คลิก **"Continue"** → **"Activate domain"**
6. รอ 1-2 นาที (Cloudflare auto-creates CNAME)

### 2. ทดสอบ
เปิด: `https://soomboon.softcraft.co.th`

---

## 🔄 Auto Deploy (CI/CD)

หลัง setup เสร็จ — **push ไป GitHub** = auto deploy:

```bash
git add .
git commit -m "feat: add new feature"
git push
```

- ✅ Render rebuilds API automatically
- ✅ Cloudflare Pages rebuilds frontend automatically

---

## 🆘 Troubleshooting

### Render: Build fails
- เช็ค **Logs** ใน Render Dashboard
- ทั่วไป: connection string ผิด หรือ port ผิด

### Render: API ตอบช้ามาก (~30s) ครั้งแรก
- ✅ ปกติสำหรับ Free tier (sleep หลัง 15 นาทีไม่ใช้)
- 💰 อัปเกรดเป็น Starter ($7/mo) เพื่อไม่ sleep

### Frontend: "Network Error" ตอน Login
- เช็ค `VITE_API_URL` ใน Cloudflare Pages env vars
- เช็ค CORS ใน API env vars (ต้อง allow Cloudflare domain)

### CORS Error
ใน Render env vars เพิ่ม:
- `Cors__AllowedOrigins__0` = Cloudflare URL จริง
- เช่น: `https://abc123.soomboon-erp.pages.dev`

### Database connection fails on Render
- Supabase pooler ต้องอนุญาต IP ของ Render (ปกติเปิดให้ทุก IP)
- เช็ค Settings → Database → Network restrictions

---

## 📊 Monitoring

### Render
- Dashboard → Service → **Logs** (real-time)
- Dashboard → Service → **Metrics** (CPU, Memory, Response time)

### Cloudflare Pages
- Dashboard → Pages → Project → **Analytics**
- Dashboard → Pages → Project → **Deployments** (history)

### Supabase
- Dashboard → Project → **Reports**
- Dashboard → Project → **Logs**

---

## 💰 Cost Summary

| Service | Plan | ราคา |
|---------|------|------|
| Render Web Service | Free (sleeps) | ฿0 |
| Cloudflare Pages | Free (unlimited) | ฿0 |
| Supabase | Free (500MB) | ฿0 |
| Domain (softcraft.co.th) | OnlyDomains | ~฿800/ปี |
| **Total** | | **~฿800/ปี** |

อัปเกรด recommendation:
- Render Starter ($7/mo) — ไม่ sleep, performance ดีขึ้น
- Supabase Pro ($25/mo) — เมื่อ DB > 500MB
