/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Sun, Moon, Home } from 'lucide-react';

// ✅ ข้อมูลละอองดาวคงที่
const STATIC_PARTICLES = [...Array(30)].map((_, i) => ({
  id: i,
  left: `${(i * 13.7) % 100}%`,
  width: (i % 5) + 3,
  height: (i % 5) + 3,
  duration: 10 + (i % 12),
  delay: i * 0.2,
  scaleEnd: 0.8 + (i % 6) * 0.2
}));

const MemoryLane = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();
  const audioRef = useRef(null); 

  // ✍️ แยกข้อความเพื่อจัดวางเฉียงซ้าย-ขวา
  const titlePart1 = "Memories";
  const titlePart2 = "Forever.";
  const headerSub = "ความทรงจำของกันและกัน... ตลอดเวลา 1275 วันที่มีหนูเข้ามาในชีวิตพี่ ❤️"; 

  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';
    document.body.style.overflow = "hidden";
    return () => { 
        if (navbar) navbar.style.display = 'flex';
        document.body.style.overflow = "auto";
    };
  }, []);

  const goBackHome = () => {
    navigate('/');
    setTimeout(() => { window.location.reload(); }, 100);
  };

  const startJourney = () => {
    if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = 0; 
        audioRef.current.play().then(() => {
            let vol = 0;
            const fadeIn = setInterval(() => {
                if (vol < 0.4) { vol += 0.05; audioRef.current.volume = vol; }
                else clearInterval(fadeIn);
            }, 150);
            setTimeout(() => { navigate('/memory-detail', { state: { isDarkMode } }); }, 500);
        }).catch(() => { navigate('/memory-detail', { state: { isDarkMode } }); });
    } else { navigate('/memory-detail', { state: { isDarkMode } }); }
  };

  const splitText = (text, baseDelay = 0) => {
    return text.split("").map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: baseDelay + (i * 0.1), 
          duration: 0.3, 
          ease: "easeOut" 
        }}
        style={{ display: 'inline-block' }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ));
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#030303] text-white' : 'bg-[#f8f8f8] text-[#1a1a1a]'} flex flex-col items-center justify-center transition-colors duration-1000 relative overflow-hidden`}>
      
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
      </audio>

      {/* ✅ พื้นหลัง Nebula */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0], opacity: isDarkMode ? [0.3, 0.5, 0.3] : [0.15, 0.25, 0.15] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute top-[-25%] left-[-25%] w-[150%] h-[150%] blur-[120px] ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.35)_0%,_rgba(88,28,135,0.15)_40%,_transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.2)_0%,_rgba(168,85,247,0.1)_50%,_transparent_70%)]'}`} 
        />
        <motion.div 
            animate={{ x: [-100, 100, -100], y: [-50, 50, -50], opacity: isDarkMode ? [0.1, 0.3, 0.1] : [0.05, 0.15, 0.05] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 blur-[150px] ${isDarkMode ? 'bg-[radial-gradient(circle_at_bottom_left,_rgba(30,58,138,0.3)_0%,_transparent_50%)]' : 'bg-[radial-gradient(circle_at_bottom_left,_rgba(219,39,119,0.1)_0%,_transparent_40%)]'}`}
        />
        {STATIC_PARTICLES.map((p) => (
            <motion.div key={p.id} animate={{ y: [0, -1200], opacity: [0, 0.6, 0], scale: [0, p.scaleEnd, 0], x: [0, Math.sin(p.id) * 60] }} transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }} className={`absolute rounded-full shadow-[0_0_10px_currentColor] ${isDarkMode ? 'bg-white/40 text-white/40' : 'bg-pink-500/30 text-pink-500/30'}`} style={{ left: p.left, top: '100%', width: p.width, height: p.height }} />
        ))}
      </div>

      {/* UI Controls */}
      <div className="absolute top-8 right-8 z-[120]">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-4 rounded-full border transition-all shadow-xl flex items-center gap-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>
      <div className="absolute bottom-8 right-8 z-[120]">
        <button onClick={goBackHome} className={`p-3 rounded-full border transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' : 'bg-black/5 border-black/10 text-black/30 hover:text-black'}`}>
          <Home size={14} />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
      </div>

      <motion.div className="text-center px-6 z-10 space-y-4 max-w-6xl relative">
        <div className="relative flex flex-col items-center">
            <h1 className="text-[14vw] md:text-[9rem] font-black italic uppercase tracking-tighter leading-none self-start md:ml-20">
                <span className={`text-transparent bg-clip-text bg-gradient-to-b ${isDarkMode ? 'from-white via-pink-100 to-pink-500' : 'from-[#111] via-pink-400 to-pink-600'}`}>
                    {splitText(titlePart1, 0)}
                </span>
            </h1>
            <h1 className="text-[14vw] md:text-[9rem] font-black italic uppercase tracking-tighter leading-none self-end md:mr-20 -mt-4">
                <span className={`text-transparent bg-clip-text bg-gradient-to-b ${isDarkMode ? 'from-white via-pink-100 to-pink-500' : 'from-[#111] via-pink-400 to-pink-600'}`}>
                    {splitText(titlePart2, titlePart1.length * 0.1)}
                </span>
            </h1>

            <motion.div 
                animate={{ x: ['-100vw', '100vw'] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                className="absolute top-0 bottom-0 w-[60vw] bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[35deg] pointer-events-none z-20"
                style={{ mixBlendMode: 'overlay' }}
            />
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1.5 }} className={`text-[4vw] md:text-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.25em] ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} drop-shadow-lg pt-10`}>
            {headerSub}
        </motion.p>

        <div className="pt-16">
            <div className="relative inline-block">
                {/* ✅ แก้ไข: ดึงวงแหวนกลับมา 2 วงแบบหรูๆ จังหวะช้าๆ */}
                {[...Array(2)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                        transition={{ 
                            duration: 3.5, 
                            repeat: Infinity, 
                            delay: i * 1.5, // กระจายวงแหวนให้ห่างกันหน่อย
                            ease: "easeInOut" 
                        }}
                        className={`absolute inset-0 rounded-full border-2 ${isDarkMode ? 'border-pink-500/40' : 'border-pink-600/30'}`}
                    />
                ))}
                
                <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: isDarkMode ? "0 0 50px rgba(219,39,119,0.4)" : "0 0 35px rgba(219,39,119,0.2)" }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={startJourney} 
                    className={`group relative px-12 py-5 md:px-16 md:py-6 rounded-full font-black uppercase italic transition-all duration-700 shadow-xl ${isDarkMode ? 'bg-white text-black' : 'bg-[#111] text-white'}`}
                >
                    <span className="flex items-center gap-4 text-sm md:text-lg relative z-10 tracking-widest">
                        ..เริ่มต้นเข้าสู่ห้วงเวลา.. <Heart size={22} className="fill-pink-600 text-pink-600 animate-pulse"/>
                    </span>
                </motion.button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MemoryLane;