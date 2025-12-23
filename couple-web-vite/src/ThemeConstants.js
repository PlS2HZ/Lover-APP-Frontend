import { createContext, useContext } from 'react';

// ✅ 1. เก็บค่าคงที่
export const THEMES = [
  { id: 'home', name: 'หน้าหลัก', color: 'rose' },
  { id: 'newyear', name: 'ปีใหม่', color: 'yellow' },
  { id: 'chinese', name: 'ตรุษจีน', color: 'red' },
  { id: 'christmas', name: 'คริสต์มาส', color: 'emerald' },
  { id: 'summer', name: 'ฤดูร้อน', color: 'orange' },
  { id: 'winter', name: 'ฤดูหนาว', color: 'blue' },
  { id: 'rainy', name: 'ฤดูฝน', color: 'slate' },
  { id: 'day', name: 'กลางวัน', color: 'sky' },
  { id: 'night', name: 'กลางคืน', color: 'indigo' }
];

// ✅ 2. สร้าง Context ไว้ที่นี่
export const ThemeContext = createContext();

// ✅ 3. สร้าง Hook ไว้ที่นี่ (Vite จะยอมเพราะไฟล์นี้ไม่มี Component)
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};