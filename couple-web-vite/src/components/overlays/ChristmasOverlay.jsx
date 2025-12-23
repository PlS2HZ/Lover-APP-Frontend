/* eslint-disable no-unused-vars */
import React from 'react';
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

const ChristmasOverlay = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* ซานต้าบินผ่านหน้าจอ */}
      <motion.div
        className="absolute text-5xl"
        initial={{ left: "-10%", top: "20%" }}
        animate={{ left: "110%" }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        🎅🏻🛷🦌
      </motion.div>
      {/* หิมะเบาๆ */}
      <div className="text-white opacity-50 text-2xl absolute top-0 w-full text-center">❄️ ❄️ ❄️</div>
    </div>
  );
};
export default ChristmasOverlay;