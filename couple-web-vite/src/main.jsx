import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ✅ แก้ไข: เพิ่มส่วน Register Service Worker ให้ถูกต้อง
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 🌟 1. สั่งลงทะเบียนไฟล์ sw.js
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker Registered!', registration);
        
        // 🌟 2. เมื่อพร้อมแล้ว สั่งเช็คอัปเดต
        registration.update();
      })
      .catch(err => {
        console.error('❌ Service Worker Registration Failed:', err);
      });
  });

  // 🌟 3. ถ้าระบบเปลี่ยน Controller (มีเวอร์ชันใหม่) ให้รีโหลด
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload(); 
  });
}