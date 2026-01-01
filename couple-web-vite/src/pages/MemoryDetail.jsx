/* eslint-disable no-unused-vars */ // ปิดการแจ้งเตือนตัวแปรไม่ได้ใช้
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'; // React Hooks พื้นฐาน
import { useLocation, useNavigate } from 'react-router-dom'; // Hooks สำหรับ Routing
import { supabase } from '../supabaseClient'; // เชื่อมต่อ Database
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion'; // Library Animation
import { Heart, Sparkles, ChevronDown, Volume2, VolumeX, Star, FastForward, Play, Pause, Calendar } from 'lucide-react'; // ไอคอนต่างๆ

// ✅ ข้อมูลละอองเบลอ (Bokeh) สำหรับหน้า Ready (สร้างแสงวิบวับเบลอๆ)
const BOKEH_PARTICLES = [...Array(15)].map((_, i) => ({
  id: i,
  left: `${(i * 17.5) % 100}%`, // ตำแหน่งแกน X แบบสุ่มกระจาย
  top: `${(i * 13.3) % 100}%`, // ตำแหน่งแกน Y แบบสุ่มกระจาย
  size: 40 + (i % 6) * 20, // ขนาดแตกต่างกัน
  duration: 15 + (i % 10), // ความเร็วในการเคลื่อนที่ต่างกัน
  delay: i * 0.5 // เวลาเริ่มเล่น Animation ต่างกัน
}));

// ✅ ข้อมูลอนุภาคฟุ้งกระจายชัดเจน (ดาว/หัวใจ) ปรับปรุงให้มีหลายขนาดและคมชัด
const FLOW_PARTICLES = [...Array(35)].map((_, i) => ({
  id: i,
  left: `${(i * 11.3) % 100}%`,
  size: (i % 6) * 4 + 12, // กระจายขนาดตั้งแต่เล็กไปจนถึงใหญ่ชัดเจน (12px - 32px)
  duration: 12 + (i % 15),
  delay: i * 0.3,
  scaleEnd: 1.1 + (i % 5) * 0.2, // ขนาดตอนขยายใหญ่สุด
  blur: i % 4 === 0 ? "2px" : "0px" // สลับความชัดเบลอเพื่อสร้างมิติความลึก (Depth)
}));

const MemoryDetail = () => {
  const { state } = useLocation(); // รับค่า State ที่ส่งมาจากหน้าก่อนหน้า (MemoryLane)
  const navigate = useNavigate(); // Hook เปลี่ยนหน้า
  const isDarkMode = state?.isDarkMode ?? true; // ดึงค่า Dark Mode ถ้าไม่มีให้ Default เป็น True

  // ✍️ ข้อความเดิม (ห้ามแก้ไข 100%) - เก็บไว้ใช้แสดงผล
  const journeyQuote = "ในทุกๆ วันที่เราอยู่เคียงข้างกัน พี่มีความสุขมากๆเลยนะ... ขอบคุณที่ทำให้ทุกความทรงจำมีความหมายนะ";
  const footerTitle = "HAPPY NEW YEAR"; 
  const footerMain = "2026 WITH YOU"; 
  const footerSub = "ขอบคุณที่ร่วมเดินทางผ่านพ้นความสุข์และทุกข์มาตลอด 1275 วันที่แสนพิเศษนี้มาด้วยกัน... และขอบคุณที่จะอยู่สร้างปี 2026 ให้สวยงามไปด้วยกันนะครับคนเก่ง ของขวัญที่ดีที่สุดของพี่คือการที่มีหนูอยู่ข้างๆ ตลอดไป ❤️";

  // State ต่างๆ
  const [memories, setMemories] = useState([]); // เก็บรายการความทรงจำ
  const [userMap, setUserMap] = useState({}); // เก็บชื่อ User (Map ID -> Username)
  const [loading, setLoading] = useState(true); // สถานะการโหลด
  const [isAutoScrolling, setIsAutoScrolling] = useState(false); // สถานะเลื่อนอัตโนมัติ
  const [isReady, setIsReady] = useState(false); // สถานะกดปุ่ม "เริ่มต้นเดินทาง"
  const [isMuted, setIsMuted] = useState(false); // สถานะปิดเสียง
  const [currentIndex, setCurrentIndex] = useState(0); // Index ปัจจุบันที่ดูอยู่

  // Refs สำหรับเข้าถึง Element โดยตรง
  const audioRef = useRef(null); // เพลง
  const footerRef = useRef(null); // ส่วนท้าย
  const startQuoteRef = useRef(null); // ส่วนคำคมเริ่มต้น
  const memoryRefs = useRef([]); // รายการความทรงจำ

  // Animation Hooks
  const { scrollYProgress } = useScroll(); // จับตำแหน่งการ Scroll (0-1)
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 }); // Animation แถบ Progress Bar

  // Effect: ตั้งค่าหน้าจอเมื่อเข้ามาครั้งแรก
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none'; // ซ่อน Navbar
    window.scrollTo(0, 0); // เลื่อนไปบนสุดเสมอ
    return () => { if (navbar) navbar.style.display = 'flex'; }; // คืนค่า Navbar เมื่อออก
  }, []);

  // ฟังก์ชันโหลดรูปภาพล่วงหน้า (Preload) เพื่อให้เลื่อนแล้วรูปไม่กระพริบ
  const preloadImages = (data) => {
    data.forEach((item) => {
      const img = new Image();
      img.src = item.image_url;
    });
  };

  // ฟังก์ชันดึงข้อมูลความทรงจำจาก Supabase
  const fetchMemories = useCallback(async () => {
    try {
      const [moodsRes, usersRes] = await Promise.all([
        supabase.from('daily_moods').select('*').not('image_url', 'is', null).ilike('mood_text', 'Surprise %').order('created_at', { ascending: true }),
        supabase.from('users').select('id, username')
      ]);
      const uMap = {};
      usersRes.data?.forEach(u => uMap[u.id] = u.username);
      setUserMap(uMap);
      const data = moodsRes.data || [];
      setMemories(data);
      preloadImages(data); // เรียก Preload ทันทีที่ได้ข้อมูล
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  // ฟังก์ชันเมื่อกดปุ่ม "เริ่มต้นเดินทาง" (Ready)
  const handleReady = () => {
    setIsReady(true); // เปลี่ยนสถานะเป็นพร้อม
    setIsAutoScrolling(true); // เริ่มเลื่อนอัตโนมัติ
    if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = 0;
        audioRef.current.play().then(() => {
            let vol = 0;
            // Fade In เสียงเพลงทีละนิด
            const fadeIn = setInterval(() => {
                if (vol < 0.45) { vol += 0.05; audioRef.current.volume = Math.min(vol, 1); }
                else clearInterval(fadeIn);
            }, 200);
        });
    }
    // เลื่อนหน้าจอลงไปที่ส่วนคำคมเริ่มต้น
    setTimeout(() => { startQuoteRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  // Effect: ควบคุมการเลื่อนอัตโนมัติ (Auto Scroll)
  useEffect(() => {
    if (!loading && isAutoScrolling && isReady) {
      const timer = setInterval(() => { window.scrollBy({ top: 2, behavior: 'auto' }); }, 16); // เลื่อนทีละ 2px ทุก 16ms (60fps)
      return () => clearInterval(timer);
    }
  }, [loading, isAutoScrolling, isReady]);

  // ฟังก์ชันแสดงข้อความทีละตัวอักษร (Typewriter Effect) สำหรับหน้า Ready
  const renderRevealText = (text) => {
    return text.split("").map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + (i * 0.04), duration: 0.5 }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ));
  };

  // Effect: Fade Out เสียงเพลงเมื่อเลื่อนถึงตอนจบ (98% ของหน้า)
  useEffect(() => {
    if (scrollYProgress.get() > 0.98 && audioRef.current) {
        const fadeOut = setInterval(() => {
            if (audioRef.current.volume > 0.05) audioRef.current.volume -= 0.05;
            else { audioRef.current.pause(); clearInterval(fadeOut); }
        }, 200);
    }
  }, [scrollYProgress]);

  // ฟังก์ชันข้ามเนื้อหา (Fast Forward)
  const handleFastForward = () => {
    const step = 50; // ข้ามทีละ 50 รูป
    let nextIndex = currentIndex + step;
    setIsAutoScrolling(false); // หยุดเลื่อนชั่วคราว
    if (nextIndex >= memories.length) footerRef.current?.scrollIntoView({ behavior: 'smooth' }); // ถ้าเกิน ให้ไป Footer
    else {
      memoryRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth' }); // ไปที่รูปถัดไป
      setCurrentIndex(nextIndex);
    }
    setTimeout(() => { if (isReady) setIsAutoScrolling(true); }, 1500); // กลับมาเลื่อนต่อ
  };

  // หน้า Loading
  if (loading) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center`}>
      <Sparkles className="w-10 h-10 text-pink-500 animate-spin" />
    </div>
  );

  return (
    // Container หลัก
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#020202] text-white' : 'bg-[#fcfcfc] text-[#1a1a1a]'} font-sans overflow-x-hidden transition-colors duration-1000`}>
      {/* Progress Bar ด้านบน */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-600 to-pink-600 origin-left z-[100]" style={{ scaleX, position: 'fixed' }} />
      
      {/* Element เสียงเพลง */}
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/happy_new_year_2026/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
      </audio>

      {/* ✅ อนุภาคฟุ้งกระจายชัดเจน (ดาว/หัวใจ) พื้นหลัง */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {FLOW_PARTICLES.map((p) => (
          <motion.div 
            key={p.id} 
            animate={{ 
                y: [0, -1350], 
                opacity: [0, 0.8, 0], 
                scale: [0.6, p.scaleEnd, 0.6],
                rotate: [0, 180, 360]
            }} 
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }} 
            className="absolute" 
            style={{ 
                left: p.left, 
                top: '110%', 
                color: isDarkMode ? 'white' : '#ec4899',
                filter: `blur(${p.blur}) drop-shadow(0 0 10px ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(236,72,153,0.4)'})`,
                mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                willChange: 'transform' // บังคับใช้ GPU เพื่อประหยัด CPU มือถือ
            }} 
          >
            {isDarkMode ? <Star size={p.size} fill="currentColor" /> : <Heart size={p.size} fill="currentColor" />}
          </motion.div>
        ))}
        {/* แสง Ambient Glow ด้านหลัง */}
        <div className={`absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-[120px] ${isDarkMode ? 'bg-pink-900/20' : 'bg-pink-200/40'}`} />
        <div className={`absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[120px] ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-100/40'}`} />
      </div>

      {/* หน้า Ready (Overlay ก่อนเริ่ม) */}
      <AnimatePresence>
        {!isReady && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[150] ${isDarkMode ? 'bg-black' : 'bg-white'} flex flex-col items-center justify-center p-6 text-center overflow-hidden`}
          >
            {/* Fog & Bokeh Effects */}
            <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }} transition={{ duration: 20, repeat: Infinity }} className={`absolute inset-0 blur-[100px] opacity-30 ${isDarkMode ? 'bg-[radial-gradient(circle,_rgba(219,39,119,0.4)_0%,_transparent_70%)]' : 'bg-[radial-gradient(circle,_rgba(219,39,119,0.2)_0%,_transparent_70%)]'}`} />
            {BOKEH_PARTICLES.map((p) => (
              <motion.div key={p.id} animate={{ y: [0, -50, 0], x: [0, 30, 0], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }} className={`absolute rounded-full blur-[40px] ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-300/20'}`} style={{ left: p.left, top: p.top, width: p.size, height: p.size }} />
            ))}

            <motion.div className="relative z-10 space-y-12">
                <Heart size={70} className="text-pink-500 mx-auto animate-pulse fill-pink-500" />
                
                <div className="space-y-6 max-w-2xl mx-auto">
                  <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-tight">
                    {renderRevealText("Are you ready,")} <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-pink-400 to-pink-600 drop-shadow-[0_0_20px_rgba(219,39,119,0.6)]">
                       {renderRevealText("My Baby?")}
                    </span>
                  </h2>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }} className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-base md:text-xl font-medium tracking-wide leading-relaxed`}>
                    ของขวัญชิ้นนี้รวบรวมทุกความทรงจำ <br/>
                    สำหรับการเดินทางตลอดช่วงเวลา 1,275 วันที่เราผ่านมาด้วยกัน <br/>
                    พร้อมแล้วหรือยังสำหรับการเดินทางครั้งนี้?
                  </motion.p>
                </div>

                {/* ปุ่มเริ่มต้นเดินทาง พร้อม Effect */}
                <div className="relative inline-block group">
                  <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-[-20px] bg-pink-500/40 rounded-full blur-3xl" />
                  <motion.button 
                      onClick={handleReady}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="relative px-20 py-6 md:px-24 md:py-8 bg-pink-600 text-white rounded-full font-black uppercase italic transition-all shadow-[0_15px_50px_rgba(219,39,119,0.5)] text-lg md:text-2xl"
                  >
                      เริ่มต้นเดินทาง❤️
                  </motion.button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* เนื้อหาหลัก (Timeline รูปภาพ) */}
      <div className="max-w-5xl mx-auto py-60 px-6 relative z-10">
        
        {/* Header คำคมแรก */}
        <header ref={startQuoteRef} className="h-[80vh] flex flex-col justify-center items-center text-center mb-40">
          <Star className="text-pink-500 mb-10 animate-spin-slow" size={56} />
          <h2 className={`text-[7.5vw] md:text-7xl font-serif italic ${isDarkMode ? 'text-white/95' : 'text-[#222]'} leading-[1.6]`}>"{journeyQuote}"</h2>
          <ChevronDown className="mt-20 opacity-20 animate-bounce" size={40} />
        </header>

        {/* Loop แสดงรูปภาพความทรงจำ */}
        <div className="relative border-l border-white/5">
          {memories.map((item, index) => (
            <motion.div key={item.id} ref={el => memoryRefs.current[index] = el} style={{ rotate: index % 2 === 0 ? 1.5 : -1.5 }} initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} onViewportEnter={() => setCurrentIndex(index)} transition={{ duration: 1.5 }} className={`relative mb-[25vh] flex flex-col items-center md:items-start`}>
              <div className={`absolute -left-[6px] md:left-1/2 md:-translate-x-1/2 top-0 w-4 h-4 rounded-full z-20 shadow-xl ${isDarkMode ? 'bg-white' : 'bg-pink-500'}`} />
              <div className="w-full md:w-[68%] group">
                {/* กรอบรูปภาพ */}
                <div className={`relative overflow-hidden rounded-[3.5rem] shadow-2xl border-l-4 transition-all duration-1000 ${isDarkMode ? 'border-pink-600/60 bg-[#0a0a0a]' : 'border-pink-500/40 bg-white'}`}>
                  <motion.img src={item.image_url} className="w-full h-auto object-cover max-h-[850px]" style={{ willChange: 'transform' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-10 z-10 text-white">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-pink-400 mb-3">Captured by {userMap[item.user_id] || 'Lover'}</p>
                    <p className="text-[6.2vw] md:text-4xl font-black italic break-words">{item.mood_text.replace('Surprise ', '')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer จบการเดินทาง */}
        <footer ref={footerRef} className="min-h-screen flex flex-col items-center justify-center text-center">
          <Heart size={100} className="fill-pink-600 text-pink-600 animate-pulse mb-10" />
          <h2 className={`text-7xl md:text-[13rem] font-black italic uppercase ${isDarkMode ? 'text-white' : 'text-[#111]'}`}>{footerTitle}</h2>
          <h2 className="text-[13vw] md:text-[11rem] font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-700">{footerMain}</h2>
          <p className="text-[4.2vw] md:text-2xl italic px-6 mt-10">{footerSub}</p>
          <button onClick={() => { navigate('/memory-lane'); setTimeout(() => window.location.reload(), 100); }} className="mt-20 px-14 py-5 border-2 rounded-full font-black uppercase hover:bg-pink-600 hover:text-white transition-all shadow-xl">Back to Memories</button>
        </footer>
      </div>

      {/* ✅ แถบควบคุม (ซ้ายล่าง): ข้าม และ หยุด/เล่น ปรับขนาดให้ Compact สำหรับมือถือ */}
      <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[100] flex gap-2 md:gap-3">
        {/* ปุ่มข้าม */}
        <button onClick={handleFastForward} className={`p-3 md:p-4 backdrop-blur-xl border rounded-full transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-black/5 border-black/10 text-black/50 hover:text-black'}`}>
          <FastForward size={18} className="md:w-5 md:h-5" />
        </button>
        {/* ปุ่มหยุด/เล่น Auto Scroll */}
        <button 
            onClick={() => setIsAutoScrolling(!isAutoScrolling)} 
            className={`p-3 md:p-4 backdrop-blur-xl border rounded-full transition-all ${isDarkMode ? 'bg-pink-600/20 border-pink-500/50 text-pink-500' : 'bg-pink-100 border-pink-300 text-pink-600'}`}
        >
          {isAutoScrolling ? <Pause size={18} className="md:w-5 md:h-5" /> : <Play size={18} className="md:w-5 md:h-5 fill-current"/>}
        </button>
      </div>
      
      {/* ✅ แถบเสียง (ขวาล่าง): ปรับขนาดให้ประหยัดพื้นที่มากขึ้น */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex items-center gap-3 md:gap-6">
        {/* Visualizer เสียงเต้น */}
        <div className="flex gap-1 items-end h-4 md:h-6 pr-2 md:pr-4 border-r border-white/10">
            {[...Array(4)].map((_, i) => (
                <motion.div key={i} animate={{ height: isAutoScrolling ? [4, 18, 8, 14, 4] : 4 }} transition={{ duration: 0.6 + i*0.1, repeat: Infinity }} className="w-1 md:w-1.5 bg-pink-500/80 shadow-lg" />
            ))}
        </div>
        {/* ปุ่มปิด/เปิดเสียง */}
        <button onClick={() => { setIsMuted(!isMuted); audioRef.current.muted = !isMuted; }} className={`p-4 md:p-7 backdrop-blur-xl border rounded-full transition-all active:scale-90 shadow-2xl ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-pink-600/20' : 'bg-black/5 border-black/10 text-black hover:bg-pink-500/10'}`}>
            {isMuted ? <VolumeX size={20} className="md:w-8 md:h-8"/> : <Volume2 size={20} className="md:w-8 md:h-8"/>}
        </button>
      </div>
    </div>
  );
};

export default MemoryDetail;