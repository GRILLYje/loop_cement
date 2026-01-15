# 🔧 แก้ปัญหา: Could not read package.json

## ❌ ปัญหา:
```
npm error path /vercel/path0/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## ✅ สาเหตุ:
Vercel ค้นหา `package.json` ใน root directory แต่ project อยู่ใน `my-app/` folder

## 🚀 วิธีแก้ไข:

### วิธีที่ 1: ตั้งค่า Root Directory ใน Vercel (แนะนำ)

1. ไปที่ **Vercel Dashboard**
2. เลือก Project: **loopcement**
3. ไปที่ **Settings** → **General**
4. หา **Root Directory**
5. ตั้งค่าเป็น: `my-app`
6. คลิก **Save**
7. **Redeploy** project

### วิธีที่ 2: ตรวจสอบว่า Root Directory ถูกต้อง

ใน Vercel Settings → General:
- **Root Directory**: `my-app` (ต้องมี)
- ถ้าเป็น `/` หรือว่าง → เปลี่ยนเป็น `my-app`

## 📋 Checklist:

- [ ] Root Directory ตั้งเป็น `my-app`
- [ ] Framework Preset: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

## 🔄 หลังจากตั้งค่า:

1. **Redeploy** project:
   - ไปที่ Deployments
   - คลิก **Redeploy** หรือ
   - Push code ใหม่

2. **ตรวจสอบ Build Logs**:
   - ควรเห็น: `Found package.json in my-app/`
   - Build ควรสำเร็จ

## ⚠️ ถ้ายังไม่ได้:

1. ตรวจสอบว่า Git repository มี folder `my-app/`
2. ตรวจสอบว่า `my-app/package.json` มีอยู่
3. ลองสร้าง Project ใหม่และตั้ง Root Directory เป็น `my-app` ตั้งแต่แรก
