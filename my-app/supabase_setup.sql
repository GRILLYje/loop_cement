-- ============================================
-- Supabase Database Setup Script
-- สำหรับระบบ Timer Countdown
-- ============================================

-- สร้างตาราง timers
CREATE TABLE IF NOT EXISTS timers (
  -- ID ใช้ TEXT เพื่อรองรับ string ID จาก client
  id TEXT PRIMARY KEY,
  
  -- ชื่อ Timer
  name TEXT NOT NULL,
  
  -- เวลาเริ่มต้น (วินาที)
  initial_seconds INTEGER NOT NULL CHECK (initial_seconds >= 0),
  
  -- เวลาที่เหลืออยู่ (วินาที)
  remaining_seconds INTEGER NOT NULL CHECK (remaining_seconds >= 0),
  
  -- สถานะของ Timer
  status TEXT NOT NULL CHECK (status IN ('idle', 'running', 'paused', 'finished')),
  
  -- วันที่สร้าง
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- วันที่อัปเดตล่าสุด
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง Index เพื่อเพิ่มความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_timers_created_at ON timers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timers_status ON timers(status);

-- สร้าง Function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง Trigger เพื่ออัปเดต updated_at เมื่อมีการแก้ไขข้อมูล
CREATE TRIGGER update_timers_updated_at 
    BEFORE UPDATE ON timers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy เพื่อให้สามารถ CRUD ได้ทั้งหมด
-- (ปรับแต่งตามความต้องการด้านความปลอดภัยของคุณ)
CREATE POLICY "Allow all operations on timers" ON timers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ข้อมูลที่เก็บในตาราง:
-- ============================================
-- id: TEXT - ID ของ Timer (ใช้ string จาก Date.now().toString())
-- name: TEXT - ชื่อของ Timer
-- initial_seconds: INTEGER - เวลาเริ่มต้น (วินาที)
-- remaining_seconds: INTEGER - เวลาที่เหลืออยู่ (วินาที)
-- status: TEXT - สถานะ ('idle', 'running', 'paused', 'finished')
-- created_at: TIMESTAMP - วันที่สร้าง
-- updated_at: TIMESTAMP - วันที่อัปเดตล่าสุด
-- ============================================

-- ตัวอย่างข้อมูล:
-- INSERT INTO timers (id, name, initial_seconds, remaining_seconds, status)
-- VALUES ('1234567890', 'Timer 1', 300, 300, 'idle');
