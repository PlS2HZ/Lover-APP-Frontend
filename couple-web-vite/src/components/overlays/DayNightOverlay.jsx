/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';

const DayNightOverlay = ({ mode }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {mode === 'day' ? (
        // ☀️ ส่วนของกลางวัน
        <motion.div 
          initial={{ y: -100, x: 100 }}
          animate={{ y: 50, x: -50 }}
          className="absolute right-20 top-20 text-6xl"
        >
          ☀️
        </motion.div>
      ) : (
        // 🌙 ส่วนของกลางคืน
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-20 top-20 text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
        >
          🌙
        </motion.div>
      )}
    </div>
  );
};

// ✅ สำคัญมาก: ต้องมีบรรทัดนี้เพื่อให้ไฟล์อื่นเรียกใช้ได้
export default DayNightOverlay;