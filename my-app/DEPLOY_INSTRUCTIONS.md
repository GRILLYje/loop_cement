# 🚀 คำแนะนำการ Deploy บน Vercel - แก้ปัญหา 404

## ✅ ไฟล์ที่แก้ไขแล้ว:

1. **`vercel.json`** - ตั้งค่า rewrites สำหรับ SPA
2. **`public/_redirects`** - ไฟล์ redirect สำหรับ Netlify/Vercel
3. **`vite.config.ts`** - เพิ่ม plugin เพื่อ copy _redirects ไปที่ dist

## 📋 ขั้นตอนการ Deploy:

### 1. Commit และ Push Code

```bash
cd "C:\Users\Administrator\Desktop\Loop Cement\my-app"
git add .
git commit -m "Fix Vercel 404 - Add redirects and vercel.json"
git push
```

### 2. ตรวจสอบ Vercel Project Settings

ไปที่ Vercel Dashboard → Project → Settings → General:

- ✅ **Framework Preset**: `Vite`
- ✅ **Build Command**: `npm run build` (Override: ON)
- ✅ **Output Directory**: `dist` (Override: ON)
- ✅ **Install Command**: `npm install` (Override: ON)

### 3. Redeploy

**วิธีที่ 1: Auto Deploy (แนะนำ)**
- Push code ไปที่ Git → Vercel จะ auto-deploy

**วิธีที่ 2: Manual Redeploy**
1. ไปที่ Vercel Dashboard → Project → Deployments
2. คลิก **...** บน deployment ล่าสุด
3. เลือก **Redeploy**

### 4. ตรวจสอบ Build Logs

หลังจาก deploy:
1. ไปที่ Deployment → คลิกที่ deployment ล่าสุด
2. ดู **Build Logs**:
   - ✅ ตรวจสอบว่า build สำเร็จ
   - ✅ ตรวจสอบว่า output directory เป็น `dist`
   - ✅ ตรวจสอบว่าไม่มี error

### 5. ตรวจสอบไฟล์ที่ Deploy

ใน Build Logs ควรเห็น:
- `dist/index.html`
- `dist/_redirects`
- `dist/assets/...`

## 🔍 ตรวจสอบว่าแก้ไขแล้ว:

1. เปิดเว็บไซต์: `https://loopcement.vercel.app`
2. ควรเห็นหน้าเว็บปกติ (ไม่ใช่ 404)
3. ลอง refresh หลายครั้ง
4. ลองเปิด path อื่น เช่น `/test` → ควร redirect ไปที่ `/index.html`

## ⚠️ ถ้ายังเจอปัญหา 404:

### ตรวจสอบ:
1. ✅ ไฟล์ `vercel.json` อยู่ใน root ของ project
2. ✅ ไฟล์ `public/_redirects` อยู่ใน `public/` folder
3. ✅ ไฟล์ `dist/_redirects` ถูกสร้างหลัง build
4. ✅ Vercel Settings ถูกต้อง (Framework = Vite, Output = dist)

### ลองทำ:
1. **Clear Vercel Cache**:
   - ไปที่ Settings → General
   - ลบ Build Cache
   - Redeploy

2. **ตรวจสอบ Root Directory**:
   - ถ้า project อยู่ใน subfolder
   - ไปที่ Settings → General
   - ตั้งค่า **Root Directory**: `my-app`

3. **ตรวจสอบ Build Logs**:
   - ดูว่า `_redirects` ถูก copy ไปที่ dist หรือไม่
   - ดูว่า `vercel.json` ถูกอ่านหรือไม่

## 📝 ไฟล์สำคัญ:

- `vercel.json` - Vercel configuration
- `public/_redirects` - Redirect rules
- `vite.config.ts` - Vite build config
- `dist/` - Build output (หลัง `npm run build`)

## 🎯 สรุป:

1. ✅ Push code ใหม่
2. ✅ ตรวจสอบ Vercel Settings
3. ✅ Redeploy
4. ✅ ตรวจสอบ Build Logs
5. ✅ ทดสอบเว็บไซต์

**หลังจากทำตามขั้นตอนนี้ ควรใช้งานได้แล้ว!** 🎉
