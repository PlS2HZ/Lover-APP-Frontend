import { createContext, useContext } from 'react'; // นำเข้าฟังก์ชันสร้าง (createContext) และใช้งาน (useContext) Context จาก React

// ✅ 1. เก็บค่าคงที่
// ประกาศตัวแปร THEMES เป็น Array เก็บข้อมูลธีมทั้งหมดที่มีในระบบ
// export เพื่อให้ไฟล์อื่น (เช่น ProfilePage, Navbar) นำไปใช้ได้
export const THEMES = [
  { id: 'home', name: 'หน้าหลัก', color: 'rose' }, // ธีมเริ่มต้น (สีชมพู)
  { id: 'newyear', name: 'ปีใหม่', color: 'yellow' }, // ธีมปีใหม่ (สีเหลือง)
  { id: 'chinese', name: 'ตรุษจีน', color: 'red' }, // ธีมตรุษจีน (สีแดง)
  { id: 'christmas', name: 'คริสต์มาส', color: 'emerald' }, // ธีมคริสต์มาส (สีเขียว)
  { id: 'summer', name: 'ฤดูร้อน', color: 'orange' }, // ธีมฤดูร้อน (สีส้ม)
  { id: 'winter', name: 'ฤดูหนาว', color: 'blue' }, // ธีมฤดูหนาว (สีฟ้า)
  { id: 'rainy', name: 'ฤดูฝน', color: 'slate' }, // ธีมฤดูฝน (สีเทาฟ้า)
  { id: 'day', name: 'กลางวัน', color: 'sky' }, // ธีมกลางวัน (สีท้องฟ้า)
  { id: 'night', name: 'กลางคืน', color: 'indigo' } // ธีมกลางคืน (สีน้ำเงินเข้ม)
];

// ✅ 2. สร้าง Context ไว้ที่นี่
// สร้าง Context Object ชื่อ ThemeContext เพื่อใช้เป็น "ท่อกลาง" ในการส่งข้อมูลธีมไปยังทุกส่วนของแอป
export const ThemeContext = createContext();

// ✅ 3. สร้าง Hook ไว้ที่นี่ (Vite จะยอมเพราะไฟล์นี้ไม่มี Component)
// สร้าง Custom Hook ชื่อ useTheme เพื่ออำนวยความสะดวกในการดึงค่าธีมไปใช้
export const useTheme = () => {
  // ใช้ useContext เพื่อดึงค่าปัจจุบันจาก ThemeContext
  const context = useContext(ThemeContext);
  
  // ตรวจสอบว่า Hook นี้ถูกเรียกใช้ภายใต้ ThemeProvider หรือไม่
  if (!context) {
    // ถ้าไม่ได้ถูกห่อด้วย Provider ให้แจ้ง Error (เพื่อเตือนนักพัฒนา)
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  // ส่งค่า Context (เช่น currentTheme, nextTheme) กลับไปให้ Component ที่เรียกใช้
  return context;
};