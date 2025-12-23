import React, { useState, useEffect } from 'react';
import { THEMES, ThemeContext } from './ThemeConstants'; 

export const ThemeProvider = ({ children }) => {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(() => {
    // ✅ อ่านค่าที่เคยเซฟไว้
    const saved = localStorage.getItem('app_theme_index');
    return saved !== null ? parseInt(saved) : 0;
  });

  const currentTheme = THEMES[currentThemeIndex];

  // ฟังก์ชันสลับไปข้างหน้า
  const nextTheme = () => {
    setCurrentThemeIndex((prev) => (prev + 1) % THEMES.length);
  };

  // ฟังก์ชันสลับถอยหลัง
  const prevTheme = () => {
    setCurrentThemeIndex((prev) => (prev - 1 + THEMES.length) % THEMES.length);
  };

  // ✅ เซฟค่าลง LocalStorage ทันทีที่ currentThemeIndex เปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('app_theme_index', currentThemeIndex.toString());
  }, [currentThemeIndex]);

  return (
    <ThemeContext.Provider value={{ currentTheme, nextTheme, prevTheme, THEMES }}>
      {/* ใส่คลาสธีมที่ตัวคลุมหลักเพื่อให้สีเปลี่ยนทั้งแอป */}
      <div className={`theme-${currentTheme.id} transition-all duration-1000 min-h-screen`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};