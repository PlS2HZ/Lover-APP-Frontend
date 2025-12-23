import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ✅ ส่วนที่เพิ่มเข้าไปเพื่อให้ PWA อัปเดตอัตโนมัติ
if ('serviceWorker' in navigator) {
  // เมื่อ Service Worker พร้อมทำงาน
  navigator.serviceWorker.ready.then(registration => {
    // สั่งให้เช็คหาไฟล์เวอร์ชันใหม่จาก Server (Vercel/GitHub) ทันที
    registration.update(); 
  });

  // ถ้าตรวจพบว่ามีไฟล์เวอร์ชันใหม่ และถูกติดตั้ง (installed) เรียบร้อยแล้ว
  // ให้ทำการรีเฟรชหน้าเว็บอัตโนมัติเพื่อให้ผู้ใช้เห็นโค้ดล่าสุด
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload(); 
  });
}