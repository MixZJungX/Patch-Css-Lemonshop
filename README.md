# 🎯 Thai Robux Redemption System with Queue Management

ระบบรีดีมโรบัคไทยพร้อมระบบจัดการคิวแบบ Real-time

## 🚀 Technology Stack

This project is built with:

* **Frontend**: Vite + TypeScript + React
* **UI Framework**: shadcn/ui + Tailwind CSS
* **Backend**: Supabase (Authentication, Database, Edge Functions)
* **State Management**: React Query + Context API
* **Package Manager**: npm

## ✨ Features

### 🎮 **User Features**
* **Robux Redemption**: ระบบรีดีมโค้ดโรบัค
* **Queue System**: ระบบคิวแบบ Real-time แบบ "ตี๋น้อย"
* **Status Check**: ตรวจสอบสถานะการรีดีมและตำแหน่งในคิว
* **Real-time Updates**: อัปเดตข้อมูลแบบ Real-time ทุก 10 วินาที
* **Thai Language**: ภาษาไทยครบถ้วน

### 🎯 **Queue System Features**
* **Sequential Queue Numbers**: หมายเลขคิวแบบเรียงลำดับ (1, 2, 3...)
* **Queue Display**: แสดงคิวที่กำลังดำเนินการและ 3 คิวถัดไป
* **Position Tracking**: ติดตามตำแหน่งในคิวแบบ Real-time
* **Beautiful UI**: ดีไซน์สวยงามแบบ Glassmorphism
* **Admin Management**: จัดการคิวสำหรับแอดมิน

### 👨‍💼 **Admin Features**
* **Admin Dashboard**: แดชบอร์ดสำหรับแอดมิน
* **Code Management**: จัดการโค้ดรีดีม
* **Queue Management**: จัดการระบบคิว
* **Bulk Import**: นำเข้าข้อมูลแบบ Bulk
* **User Management**: จัดการผู้ใช้งาน

## 🛠️ Setup Instructions

### Prerequisites

* Node.js (v16 or later)
* npm or pnpm
* Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/MixZJungX/Patch-Css-Lemonshop.git
cd Patch-Css-Lemonshop

# Install dependencies
npm install
# or
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. **Create Supabase Project**
2. **Run SQL Setup Script**:

```sql
-- Run the queue_system_setup.sql in Supabase SQL Editor
-- This will create the queue_items table and related functions
```

3. **Deploy Edge Functions** (if needed)

### Initial Admin Setup

Create the initial admin account:

```bash
curl -X POST "your_supabase_url/functions/v1/app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_create_admin" \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@example.com", 
  "password": "your-secure-password", 
  "secret": "admin-setup-secret-key"
}'
```

### Development

```bash
# Start development server
npm run dev
# or
pnpm run dev
```

### Build

```bash
# Build for production
npm run build
# or
pnpm run build
```

## 📁 Application Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   ├── QueueDisplay.tsx
│   ├── QueueStatusChecker.tsx
│   └── QueueManager.tsx
├── pages/              # Page components
│   ├── Home.tsx        # Main redemption page
│   ├── Admin.tsx       # Admin dashboard
│   ├── QueueStatusPage.tsx
│   └── ...
├── lib/                # Utilities and API
│   ├── supabase.ts     # Supabase client
│   ├── queueApi.ts     # Queue system API
│   └── ...
├── contexts/           # React contexts
├── types/              # TypeScript types
└── hooks/              # Custom hooks
```

## 🗄️ Database Schema

### Queue Items Table

```sql
CREATE TABLE queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_number INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  redemption_request_id UUID,
  customer_name TEXT,
  contact_info TEXT,
  product_type TEXT CHECK (product_type IN ('robux', 'chicken', 'rainbow')),
  status TEXT CHECK (status IN ('waiting', 'processing', 'completed', 'cancelled')) DEFAULT 'waiting',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_wait_time INTEGER,
  admin_notes TEXT
);
```

### Views

```sql
-- Waiting Queue View
CREATE VIEW waiting_queue AS
SELECT * FROM queue_items 
WHERE status = 'waiting' 
ORDER BY created_at ASC;

-- Processing Queue View  
CREATE VIEW processing_queue AS
SELECT * FROM queue_items 
WHERE status = 'processing' 
ORDER BY created_at ASC;
```

## 🎨 UI Features

### Glassmorphism Design
* **Backdrop Blur Effects**: เอฟเฟกต์แก้วโปร่งใส
* **Gradient Backgrounds**: พื้นหลังไล่สีสวยงาม
* **Rounded Corners**: มุมโค้งมนทันสมัย
* **Shadow Effects**: เงาที่สวยงาม

### Responsive Design
* **Mobile First**: ออกแบบสำหรับมือถือเป็นหลัก
* **Desktop Optimized**: ปรับแต่งสำหรับเดสก์ท็อป
* **Touch Friendly**: ใช้งานง่ายบนหน้าจอสัมผัส

## 🔄 Real-time Features

* **Auto-refresh**: อัปเดตข้อมูลอัตโนมัติทุก 10 วินาที
* **Live Queue Display**: แสดงคิวแบบ Real-time
* **Status Updates**: อัปเดตสถานะแบบทันที
* **Position Tracking**: ติดตามตำแหน่งในคิวแบบ Live

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app can be deployed to any static hosting platform:
- Netlify
- GitHub Pages
- Firebase Hosting
- AWS S3 + CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/MixZJungX/Patch-Css-Lemonshop/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🎯 About

**Thai Robux Redemption System** - ระบบรีดีมโรบัคไทยที่ทันสมัย พร้อมระบบจัดการคิวแบบ Real-time แบบ "ตี๋น้อย" 🎮✨

---

**Live Demo**: [patch-css-lemonshop.vercel.app](https://patch-css-lemonshop.vercel.app)
