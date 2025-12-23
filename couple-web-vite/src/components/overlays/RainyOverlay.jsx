/* eslint-disable no-unused-vars */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// ✅ สุ่มค่าเม็ดฝนข้างนอก
const generateRaindrops = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 110 - 5 + "%", // ให้เริ่มล้นขอบซ้ายขวานิดหน่อยเผื่อฝนตกเฉียง
    duration: Math.random() * 0.5 + 0.5, // ฝนต้องตกไวมาก
    delay: Math.random() * 2,
    opacity: Math.random() * 0.5 + 0.3,
    height: Math.random() * 20 + 20, // ความยาวของเม็ดฝน
  }));
};

const RainyOverlay = () => {
  const drops = useMemo(() => generateRaindrops(60), []); // ใช้เม็ดฝนเยอะหน่อยจะได้ดูหนัก

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-slate-900/10">
      {/* ⚡ เอฟเฟคฟ้าแลบ (Flash) */}
      <motion.div
        animate={{ opacity: [0, 0, 0.2, 0, 0.3, 0] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.8, 0.82, 0.84, 0.86, 1] }}
        className="absolute inset-0 bg-white"
      />

      {/* 💧 สายฝน */}
      {drops.map((d) => (
        <motion.div
          key={d.id}
          className="absolute bg-blue-400/40"
          initial={{ top: -100, left: d.left }}
          animate={{ 
            top: "110vh",
            x: -20 // ให้ฝนตกเฉียงนิดๆ เหมือนมีลมพัด
          }}
          transition={{ 
            duration: d.duration, 
            repeat: Infinity, 
            ease: "linear", 
            delay: d.delay 
          }}
          style={{ 
            width: '1px', 
            height: d.height, 
            opacity: d.opacity,
            filter: 'blur(0.5px)' 
          }}
        />
      ))}

      {/* ☁️ เมฆลอยช้าๆ */}
      <motion.div
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 text-6xl opacity-40 select-none"
      >
        ☁️
      </motion.div>
    </div>
  );
};

export default RainyOverlay;