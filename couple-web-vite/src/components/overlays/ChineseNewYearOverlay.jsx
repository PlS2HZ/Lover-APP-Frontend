/* eslint-disable no-unused-vars */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// ✅ สุ่มค่าข้างนอกเพื่อความเป็น Pure Function
const generateSnow = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100 + "%",
    duration: Math.random() * 5 + 5,
    delay: Math.random() * 5,
  }));
};

const ChristmasOverlay = () => {
  const snowflakes = useMemo(() => generateSnow(20), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* 🎅🏻 ซานต้าบินผ่าน */}
      <motion.div
        className="absolute text-7xl select-none"
        initial={{ right: "-20%", top: "15%" }}
        animate={{ right: "120%" }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        🎅🏻🛷🦌
      </motion.div>

      {/* ❄️ หิมะตก */}
      {snowflakes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute text-white text-xl opacity-70"
          initial={{ top: -20, left: s.left }}
          animate={{ top: "110vh", x: [0, 20, -20, 0] }}
          transition={{ duration: s.duration, repeat: Infinity, ease: "linear", delay: s.delay }}
        >
          ❄️
        </motion.div>
      ))}
    </div>
  );
};

export default ChristmasOverlay;