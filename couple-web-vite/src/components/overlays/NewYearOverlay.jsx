/* eslint-disable no-unused-vars */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// ✅ 1. ย้ายการสุ่มมาไว้ข้างนอก (Pure Function)
const generateFireworks = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    // สุ่มตำแหน่งซ้าย-ขวา (10% - 90%)
    left: Math.random() * 80 + 10 + "%", 
    // สุ่มเวลาพุ่งขึ้นไป
    delay: Math.random() * 3,
    // สุ่มขนาดของพลุ
    size: Math.random() * 15 + 10,
    // สุ่มสีพลุ (เหลือง, ส้ม, ทอง)
    color: ["#fbbf24", "#f59e0b", "#fb7185"][Math.floor(Math.random() * 3)]
  }));
};

const NewYearOverlay = () => {
  // ✅ 2. ใช้ useMemo เพื่อล็อกค่าสุ่มไว้ ไม่ให้เปลี่ยนตอน Re-render
  const fireworks = useMemo(() => generateFireworks(8), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 bg-black/30 overflow-hidden">
      {fireworks.map((fw) => (
        <motion.div
          key={fw.id}
          className="absolute rounded-full"
          initial={{ bottom: "-5%", left: fw.left, opacity: 1, scale: 1 }}
          animate={{ 
            bottom: ["0%", "60%", "60%"],
            scale: [1, 1, fw.size], // ใช้ขนาดที่สุ่มมา
            opacity: [1, 1, 0],
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            delay: fw.delay, // ใช้ delay ที่สุ่มมา
            ease: "easeOut"
          }}
          style={{ 
            width: '4px', 
            height: '4px', 
            backgroundColor: fw.color,
            boxShadow: `0 0 15px ${fw.color}` 
          }}
        />
      ))}

      {/* ข้อความ Happy New Year ตรงกลาง */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-1/3 w-full text-center text-white font-black text-5xl md:text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
      >
        HAPPY NEW YEAR ✨
      </motion.div>
    </div>
  );
};

export default NewYearOverlay;