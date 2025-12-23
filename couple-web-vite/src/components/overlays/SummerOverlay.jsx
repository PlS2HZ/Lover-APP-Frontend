/* eslint-disable no-unused-vars */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const generateSunRays = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100 + "%",
    top: Math.random() * 100 + "%",
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 5,
    size: Math.random() * 20 + 10,
  }));
};

const SummerOverlay = () => {
  const sparkles = useMemo(() => generateSunRays(15), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-yellow-400/5">
      {/* พระอาทิตย์ดวงใหญ่ที่มุมจอ */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.7, 0.9, 0.7] 
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 text-[150px] filter blur-sm"
      >
        ☀️
      </motion.div>

      {/* แสงระยิบระยับกระจายทั่วจอ */}
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute text-yellow-300 opacity-60"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0], 
            scale: [0, 1.5, 0],
            rotate: 180 
          }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
          style={{ left: s.left, top: s.top, fontSize: s.size }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
};

export default SummerOverlay;