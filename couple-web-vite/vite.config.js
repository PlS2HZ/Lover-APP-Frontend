import { defineConfig } from 'vite' // นำเข้าฟังก์ชัน defineConfig จาก Vite เพื่อช่วยสร้าง Config พร้อม Type Hint (ตัวช่วยเติมคำ)
import react from '@vitejs/plugin-react' // นำเข้า Plugin React เพื่อให้ Vite รองรับ JSX และฟีเจอร์ Fast Refresh

// https://vite.dev/config/
export default defineConfig({ // ส่งออกการตั้งค่า Default โดยห่อด้วย defineConfig เพื่อให้ Code Editor แนะนำคำสั่งที่ถูกต้องได้
  plugins: [react()], // เปิดใช้งาน Plugin React ในการ Build และ Run โปรเจกต์นี้
})