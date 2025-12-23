/* eslint-disable no-unused-vars */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const generateSnowflakes = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100 + "%",
    duration: Math.random() * 5 + 7, // ตกช้าๆ นุ่มนวล
    delay: Math.random() * 10,
    size: Math.random() * 15 + 10,
  }));
};

const WinterOverlay = () => {
  const flakes = useMemo(() => generateSnowflakes(30), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-blue-100/10">
      {/* ตุ๊กตาหิมะมุมล่างจอ */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-5 left-10 text-7xl select-none"
      >
        ☃️
      </motion.div>

      {/* หิมะตกแบบส่ายไปมา */}
      {flakes.map((f) => (
        <motion.div
          key={f.id}
          className="absolute text-white opacity-80"
          initial={{ top: -50, left: f.left }}
          animate={{ 
            top: "110vh",
            x: [0, 30, -30, 0] // การส่ายของหิมะ
          }}
          transition={{ 
            duration: f.duration, 
            repeat: Infinity, 
            ease: "linear", 
            delay: f.delay 
          }}
          style={{ fontSize: f.size }}
        >
          ❄️
        </motion.div>
      ))}
    </div>
  );
};

export default WinterOverlay;