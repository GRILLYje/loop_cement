# Vercel Deployment Guide

## ✅ การแก้ไขปัญหา 404 NOT_FOUND

### ไฟล์ที่สร้าง/แก้ไข:

1. **`vercel.json`** - ไฟล์ config สำหรับ Vercel
   - ตั้งค่า rewrites เพื่อ redirect ทุก path ไปที่ index.html (สำหรับ SPA)
   - กำหนด build command และ output directory

2. **`vite.config.ts`** - อัปเดต build configuration
   - กำหนด output directory เป็น `dist`
   - ตั้งค่า base path

3. **`package.json`** - เพิ่ม `@supabase/supabase-js` ใน dependencies

## 📋 ขั้นตอนการ Deploy บน Vercel:

### วิธีที่ 1: ใช้ Vercel CLI
```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm i -g vercel

# Login
vercel login

# Deploy
cd my-app
vercel
```

### วิธีที่ 2: ใช้ Vercel Dashboard
1. ไปที่ [Vercel Dashboard](https://vercel.com)
2. คลิก "Add New Project"
3. เชื่อมต่อ GitHub/GitLab/Bitbucket repository
4. Vercel จะ detect Vite project อัตโนมัติ
5. ตั้งค่า:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. คลิก "Deploy"

### วิธีที่ 3: Push ไปที่ Git แล้ว Vercel จะ Deploy อัตโนมัติ
1. Push code ไปที่ Git repository
2. เชื่อมต่อ repository กับ Vercel
3. Vercel จะ deploy อัตโนมัติเมื่อมีการ push

## ⚙️ Vercel Configuration

ไฟล์ `vercel.json` ที่สร้างไว้จะ:
- Redirect ทุก path (`/*`) ไปที่ `/index.html` เพื่อให้ SPA ทำงานได้
- กำหนด build command และ output directory

## 🔧 Troubleshooting

### ถ้ายังเจอปัญหา 404:
1. ตรวจสอบว่าไฟล์ `vercel.json` อยู่ใน root ของ project
2. ตรวจสอบว่า build command ถูกต้อง: `npm run build`
3. ตรวจสอบว่า output directory เป็น `dist`
4. ลอง clear cache และ redeploy

### ถ้า build ล้มเหลว:
1. ตรวจสอบว่า dependencies ติดตั้งครบ: `npm install`
2. ตรวจสอบ build logs ใน Vercel dashboard
3. ลอง build local ก่อน: `npm run build`

## 📝 หมายเหตุ

- Vercel จะ auto-detect Vite project แต่การมี `vercel.json` จะช่วยให้แน่ใจว่า config ถูกต้อง
- ไฟล์ `vercel.json` จะทำให้ทุก route ถูก redirect ไปที่ `index.html` ซึ่งจำเป็นสำหรับ Single Page Application (SPA)
