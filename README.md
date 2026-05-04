# S.ARAN OIL & AUTOPART · ERP System

ระบบจัดการอะไหล่ยานยนต์ระดับองค์กร — **บริษัท เอส.อรัญ ออยล์ แอนด์ ออโต้พาร์ท จำกัด**

## 🏗️ Tech Stack

### Backend
- **.NET 9** + ASP.NET Core Web API
- **Entity Framework Core 9** + Npgsql (PostgreSQL)
- **ASP.NET Core Identity** + JWT Bearer
- **Serilog** (logging)
- **Swagger / OpenAPI**

### Frontend
- **React 18** + **TypeScript 5**
- **Vite 5** (build tool)
- **TailwindCSS 3.4** + custom design system
- **TanStack Router** + **TanStack Query**
- **Zustand** (state management)
- **React Hook Form** + **Zod**
- **i18next** (TH/EN)

### Database
- **PostgreSQL** on Supabase (Tokyo region)

### Hosting
- **Frontend**: Cloudflare Pages → `softcraft.co.th`
- **Backend**: Render.com → `api.softcraft.co.th`
- **Database**: Supabase

## 📁 Project Structure

```
soomboon-erp/
├── api/                              .NET Solution
│   ├── Soomboon.Api/                 Web API (Controllers, Program.cs)
│   ├── Soomboon.Core/                Domain (Entities, Interfaces)
│   ├── Soomboon.Infrastructure/      Data (EF Core, Repositories)
│   └── Soomboon.Tests/               Unit + Integration tests
├── web/                              React frontend (Vite)
│   ├── src/
│   │   ├── api/                      Axios clients
│   │   ├── components/               Reusable UI
│   │   ├── features/                 Feature modules
│   │   ├── lib/                      Utilities
│   │   └── store/                    Zustand stores
│   └── public/                       Static assets (logo.png)
├── docs/                             Documentation
└── .github/workflows/                CI/CD pipelines
```

## 🚀 Getting Started

### Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [Visual Studio 2022](https://visualstudio.microsoft.com/) or [VS Code](https://code.visualstudio.com/)

### Backend Setup

```bash
cd api

# Restore packages
dotnet restore

# Run EF migrations (creates tables in Supabase)
dotnet ef database update --project Soomboon.Infrastructure --startup-project Soomboon.Api

# Run API
dotnet run --project Soomboon.Api
```

API จะรันที่ `https://localhost:7001`
Swagger: `https://localhost:7001/swagger`

### Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Start dev server
npm run dev
```

App จะรันที่ `http://localhost:5173`

### Configuration

แก้ไข `api/Soomboon.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Host=db.xxx.supabase.co;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;"
  },
  "Jwt": {
    "Secret": "your-256-bit-secret-key-here",
    "Issuer": "soomboon-api",
    "Audience": "soomboon-web"
  }
}
```

แก้ไข `web/.env`:
```
VITE_API_URL=https://localhost:7001/api
```

## 📚 Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture
- [API.md](docs/API.md) — API endpoints reference
- [DEPLOY.md](docs/DEPLOY.md) — Deployment guide

## 📝 License

© 2026 S.ARAN OIL & AUTOPART CO., LTD. All rights reserved.
