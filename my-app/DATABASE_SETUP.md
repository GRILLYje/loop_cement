# Database Setup Instructions

## Supabase Database Configuration

### ✅ การตั้งค่าเสร็จสมบูรณ์แล้ว!

Supabase ได้ถูกตั้งค่าเรียบร้อยแล้วใน `src/lib/supabase.ts`:
- **URL**: `https://hdmzjytalrkjmkeyuwku.supabase.co`
- **Key**: ตั้งค่าแล้ว

### 📋 สร้าง Database Table

1. ไปที่ Supabase Dashboard
2. เปิด SQL Editor
3. คัดลอกและรัน SQL script จากไฟล์ `supabase_setup.sql`

หรือรัน SQL นี้โดยตรง:

```sql
-- สร้างตาราง timers
CREATE TABLE IF NOT EXISTS timers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initial_seconds INTEGER NOT NULL CHECK (initial_seconds >= 0),
  remaining_seconds INTEGER NOT NULL CHECK (remaining_seconds >= 0),
  status TEXT NOT NULL CHECK (status IN ('idle', 'running', 'paused', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง Index
CREATE INDEX IF NOT EXISTS idx_timers_created_at ON timers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timers_status ON timers(status);

-- Function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
CREATE TRIGGER update_timers_updated_at 
    BEFORE UPDATE ON timers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- เปิดใช้งาน Row Level Security
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ CRUD
CREATE POLICY "Allow all operations on timers" ON timers
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 📊 ข้อมูลที่เก็บในตาราง

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | ID ของ Timer (Primary Key) |
| `name` | TEXT | ชื่อของ Timer |
| `initial_seconds` | INTEGER | เวลาเริ่มต้น (วินาที) |
| `remaining_seconds` | INTEGER | เวลาที่เหลืออยู่ (วินาที) |
| `status` | TEXT | สถานะ ('idle', 'running', 'paused', 'finished') |
| `created_at` | TIMESTAMP | วันที่สร้าง |
| `updated_at` | TIMESTAMP | วันที่อัปเดตล่าสุด (อัปเดตอัตโนมัติ) |

### 🔗 Connection String (สำหรับอ้างอิง)

```
postgresql://postgres:[YOUR-PASSWORD]@db.hdmzjytalrkjmkeyuwku.supabase.co:5432/postgres
```

**หมายเหตุ:** แอปใช้ Supabase REST API (via @supabase/supabase-js) ซึ่งปลอดภัยกว่าการเชื่อมต่อ PostgreSQL โดยตรงจาก client side
