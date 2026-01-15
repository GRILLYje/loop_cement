# 🔧 แก้ปัญหา 404 บน Vercel - คู่มือฉบับสมบูรณ์

## ✅ ไฟล์ที่แก้ไขแล้ว:

1. **`vercel.json`** - ตั้งค่า rewrites สำหรับ SPA
2. **`vite.config.ts`** - Build configuration
3. **`.vercelignore`** - ไฟล์ที่ ignore

## 🚀 ขั้นตอนการแก้ปัญหา:

### วิธีที่ 1: ตรวจสอบ Vercel Project Settings

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่ **Settings** → **General**
4. ตรวจสอบว่า:
   - **Framework Preset**: `Vite` หรือ `Other`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (หรือเว้นว่างไว้)

### วิธีที่ 2: Redeploy Project

#### ผ่าน Vercel Dashboard:
1. ไปที่ Project → **Deployments**
2. คลิก **...** (เมนู) บน deployment ล่าสุด
3. เลือก **Redeploy**
4. หรือคลิก **Redeploy** โดยตรง

#### ผ่าน Git:
```bash
# Commit และ push การเปลี่ยนแปลง
git add .
git commit -m "Fix Vercel 404 configuration"
git push
```

### วิธีที่ 3: ลบและสร้าง Project ใหม่ (ถ้ายังไม่ได้)

1. ไปที่ Vercel Dashboard
2. ลบ Project เดิม (ถ้าต้องการ)
3. สร้าง Project ใหม่:
   - เชื่อมต่อ Git Repository
   - **Framework Preset**: เลือก `Vite`
   - Vercel จะ auto-detect settings
   - คลิก **Deploy**

## 📋 Checklist ก่อน Deploy:

- [ ] ไฟล์ `vercel.json` อยู่ใน root ของ project (`my-app/vercel.json`)
- [ ] ไฟล์ `package.json` มี script `build`: `"build": "tsc -b && vite build"`
- [ ] ไฟล์ `vite.config.ts` มี `outDir: 'dist'`
- [ ] Build local สำเร็จ: `npm run build` ทำงานได้
- [ ] ไฟล์ `dist/index.html` ถูกสร้างขึ้น

## 🔍 ตรวจสอบ Build Logs:

1. ไปที่ Vercel Dashboard → Project → **Deployments**
2. คลิกที่ deployment ล่าสุด
3. ดู **Build Logs**:
   - ตรวจสอบว่า build สำเร็จ
   - ตรวจสอบว่า output directory เป็น `dist`
   - ตรวจสอบว่าไม่มี error

## ⚠️ ปัญหาที่พบบ่อย:

### 1. Vercel ไม่ detect Vite
**แก้ไข**: ตั้งค่า Framework Preset เป็น `Vite` ใน Project Settings

### 2. Build ล้มเหลว
**แก้ไข**: 
- ตรวจสอบว่า `npm install` ทำงานได้
- ตรวจสอบ build logs
- ลอง build local: `npm run build`

### 3. 404 ยังอยู่หลังจาก deploy
**แก้ไข**:
- ตรวจสอบว่า `vercel.json` ถูก push ไปที่ Git
- ลอง clear cache และ redeploy
- ตรวจสอบว่า rewrites ถูกต้อง

### 4. Assets ไม่โหลด (CSS/JS)
**แก้ไข**: ตรวจสอบว่า `base: '/'` ใน `vite.config.ts`

## 🎯 Configuration ที่ถูกต้อง:

### `vercel.json`:
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  base: '/',
})
```

## 📞 ถ้ายังไม่ได้:

1. ตรวจสอบ Vercel Build Logs
2. ตรวจสอบว่าไฟล์ทั้งหมดถูก push ไปที่ Git
3. ลองสร้าง Project ใหม่บน Vercel
4. ตรวจสอบ Vercel Status: https://vercel-status.com
