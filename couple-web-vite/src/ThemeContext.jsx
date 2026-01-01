import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks: useState (เก็บค่า), useEffect (ทำงานเมื่อค่าเปลี่ยน)
import { THEMES, ThemeContext } from './ThemeConstants'; // นำเข้าข้อมูลธีม (Array) และ Context Object ที่สร้างไว้

// Component หลักสำหรับจัดการ Theme (Provider)
// รับ children เข้ามาเพื่อห่อหุ้ม Component อื่นๆ ในแอป
export const ThemeProvider = ({ children }) => {
  // State: เก็บ Index ของธีมปัจจุบัน (0, 1, 2...)
  // ใช้ Lazy Initialization (ฟังก์ชันใน useState) เพื่ออ่านค่าจาก LocalStorage แค่ครั้งแรกที่โหลด
  const [currentThemeIndex, setCurrentThemeIndex] = useState(() => {
    // ✅ อ่านค่าที่เคยเซฟไว้ใน Browser
    const saved = localStorage.getItem('app_theme_index');
    // ถ้ามีค่า (ไม่ null) ให้แปลงเป็นตัวเลข ถ้าไม่มีให้เริ่มที่ 0
    return saved !== null ? parseInt(saved) : 0;
  });

  // ดึงข้อมูลธีมจริง (Object) จาก Array ตาม Index ปัจจุบัน
  const currentTheme = THEMES[currentThemeIndex];

  // ฟังก์ชันสลับธีมไปข้างหน้า (Next)
  const nextTheme = () => {
    // ใช้ % (Modulo) เพื่อให้วนกลับมาที่ 0 เมื่อเกินจำนวนธีมที่มี (Loop)
    setCurrentThemeIndex((prev) => (prev + 1) % THEMES.length);
  };

  // ฟังก์ชันสลับธีมถอยหลัง (Previous)
  const prevTheme = () => {
    // บวกความยาวเข้าไปก่อนลบ เพื่อป้องกันค่าติดลบ แล้วค่อย Modulo
    setCurrentThemeIndex((prev) => (prev - 1 + THEMES.length) % THEMES.length);
  };

  // ✅ Effect: ทำงานทุกครั้งที่ currentThemeIndex เปลี่ยนแปลง
  // เพื่อเซฟค่าลง LocalStorage ทันที (ปิดแล้วเปิดใหม่ธีมเดิมยังอยู่)
  useEffect(() => {
    localStorage.setItem('app_theme_index', currentThemeIndex.toString());
  }, [currentThemeIndex]);

  return (
    // ส่งค่าต่างๆ (ธีมปัจจุบัน, ฟังก์ชันเปลี่ยนธีม) ผ่าน Context ไปให้ลูกหลานใช้
    <ThemeContext.Provider value={{ currentTheme, nextTheme, prevTheme, THEMES }}>
      {/* ใส่คลาสธีมที่ตัวคลุมหลัก (เช่น theme-newyear, theme-home) เพื่อให้ CSS เปลี่ยนสีทั้งแอป */}
      {/* transition-all duration-1000 ทำให้สีค่อยๆ เปลี่ยนแบบนุ่มนวล */}
      <div className={`theme-${currentTheme.id} transition-all duration-1000 min-h-screen`}>
        {children} {/* แสดงเนื้อหาภายในแอป */}
      </div>
    </ThemeContext.Provider>
  );
};