/* eslint-disable no-unused-vars */ // ปิดการแจ้งเตือนกรณีมีตัวแปรที่ประกาศแต่ไม่ได้ถูกเรียกใช้
import React, { useEffect, useState, useRef } from 'react'; // นำเข้า React และ Hooks จำเป็น (Effect, State, Ref)
import { motion } from 'framer-motion'; // นำเข้า Library สำหรับทำ Animation (Framer Motion)
import { useNavigate } from 'react-router-dom'; // นำเข้า Hook สำหรับเปลี่ยนหน้า (Routing)
import { Heart, Sun, Moon, Home, Star } from 'lucide-react'; // นำเข้าไอคอนต่างๆ

// ✅ ข้อมูลละอองดาวคงที่ (ประกาศนอก Component เพื่อประสิทธิภาพ ไม่ต้องคำนวณใหม่ทุกครั้งที่ Render)
const STATIC_PARTICLES = [...Array(35)].map((_, i) => ({
  id: i, // ID สำหรับ Key
  left: `${(i * 11.3) % 100}%`, // คำนวณตำแหน่งแนวนอนแบบสุ่มกระจาย
  width: (i % 6) * 4 + 10, // คำนวณขนาดความกว้าง
  height: (i % 6) * 4 + 10, // คำนวณขนาดความสูง
  duration: 12 + (i % 15), // ระยะเวลาลอยขึ้น (ช้า-เร็ว ต่างกัน)
  delay: i * 0.3, // เวลาเริ่ม Animation (ไม่พร้อมกัน)
  scaleEnd: 1.1 + (i % 5) * 0.2, // ขนาดตอนขยายใหญ่สุด
  blur: i % 3 === 0 ? "2px" : "0px" // ใส่ Effect เบลอให้บางดวงเพื่อมิติความลึก
}));

const MemoryLane = () => {
  // State เก็บสถานะ Dark Mode (เริ่มต้นเป็น True = มืด)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Hook สำหรับสั่งเปลี่ยนหน้า
  const navigate = useNavigate();
  
  // Ref อ้างอิงถึง Element <audio>
  const audioRef = useRef(null); 

  // ข้อความหัวข้อและคำโปรย
  const titlePart1 = "Memories";
  const titlePart2 = "Forever.";
  const headerSub = <>ความทรงจำของกันและกัน... <br /> ตลอดเวลา 1275 วันที่มีหนูเข้ามาในชีวิตพี่ ❤️</>; 

  // ✅ แก้ไขการซ่อน Navbar ให้เสถียรขึ้น
  useEffect(() => {
    // สร้าง Class พิเศษเพื่อซ่อน Navbar แบบเด็ดขาด
    const style = document.createElement('style');
    style.id = 'hide-navbar-style';
    style.innerHTML = `nav { display: none !important; }`;
    document.head.appendChild(style);
    
    document.body.style.overflow = "hidden"; // ป้องกันการเลื่อน
    
    return () => { 
        // ลบ Class ทิ้งเมื่อออกจากหน้า ไม่ว่าจะออกด้วยวิธีใด Navbar จะกลับมาปกติ
        const styleElement = document.getElementById('hide-navbar-style');
        if (styleElement) styleElement.remove();
        document.body.style.overflow = "auto";
    };
  }, []);

  // ฟังก์ชันกลับหน้า Home
  const goBackHome = () => {
    navigate('/'); // เปลี่ยนเส้นทางไปหน้าแรก
    setTimeout(() => { window.location.reload(); }, 100); // รีโหลดหน้าเว็บเพื่อให้เคลียร์ค่า Animation
  };

  // ✅ ฟังก์ชันเริ่มการเดินทาง (แก้ไขใหม่ตามที่คุณปรับปรุง)
  const startJourney = () => {
    const targetPath = '/memory-detail'; // เส้นทางปลายทาง
    
    if (audioRef.current) { // ตรวจสอบว่ามี Element เพลงหรือไม่
        audioRef.current.muted = false; // เปิดเสียง
        audioRef.current.volume = 0; // เริ่มที่เสียงเบาสุด
        
        // สั่งเล่นเพลง
        audioRef.current.play()
            .then(() => {
                // ถ้าเล่นได้สำเร็จ ให้ค่อยๆ เพิ่มเสียง (Fade In)
                let vol = 0;
                const fadeIn = setInterval(() => {
                    if (vol < 0.4) { vol += 0.05; audioRef.current.volume = vol; }
                    else clearInterval(fadeIn); // หยุดเพิ่มเมื่อถึงระดับที่กำหนด
                }, 150);
                
                // เปลี่ยนหน้าทันทีที่เพลงเริ่มเล่นได้ (replace: true เพื่อไม่ให้กด Back กลับมาหน้านี้ได้ง่ายๆ)
                navigate(targetPath, { state: { isDarkMode }, replace: true }); 
            })
            .catch(() => {
                // ถ้า Browser บล็อกการเล่นเสียงอัตโนมัติ ให้เปลี่ยนหน้าไปเลยทันที ไม่ต้องรอ
                navigate(targetPath, { state: { isDarkMode }, replace: true });
            });
    } else {
        // กรณีไม่มี Element เพลง ให้เปลี่ยนหน้าทันที
        navigate(targetPath, { state: { isDarkMode }, replace: true });
    }
  };

  // ฟังก์ชันแยกตัวอักษรเพื่อทำ Animation ทีละตัว
  const splitText = (text, baseDelay = 0) => {
    return text.split("").map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 15 }} // เริ่มต้น: จางและอยู่ต่ำ
        animate={{ opacity: 1, y: 0 }} // ปลายทาง: ชัดและอยู่ตำแหน่งปกติ
        transition={{ 
          delay: baseDelay + (i * 0.1), // หน่วงเวลาไล่ระดับ
          duration: 0.3, 
          ease: "easeOut" 
        }}
        style={{ display: 'inline-block' }} // เพื่อให้ Animation Transform ทำงานได้
      >
        {char === " " ? "\u00A0" : char} {/* จัดการช่องว่างให้แสดงผลถูกต้อง */}
      </motion.span>
    ));
  };

  return (
    // Container หลัก: ปรับสีพื้นหลังตามโหมด, จัดกึ่งกลาง, ซ่อนส่วนเกิน
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#020202] text-white' : 'bg-[#ffffff] text-[#1a1a1a]'} flex flex-col items-center justify-center transition-colors duration-1000 relative overflow-hidden`}>
      
      {/* Element เสียงเพลง (ซ่อนอยู่) */}
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        {/* Source ไฟล์เพลงที่อัปเดตใหม่ */}
        <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/happy_new_year_2026/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
      </audio>

      {/* Background Animation Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* แสง Glow ตรงกลางที่ขยายเข้า-ออก (Pulse) */}
        <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: isDarkMode ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute inset-[-10%] blur-[120px] ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.4)_0%,_rgba(88,28,135,0.1)_50%,_transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.15)_0%,_rgba(168,85,247,0.05)_50%,_transparent_70%)]'}`} 
        />
        
        {/* Loop สร้างอนุภาค (ดาว/หัวใจ) ลอยขึ้น */}
        {STATIC_PARTICLES.map((p) => (
            <motion.div 
                key={p.id} 
                animate={{ 
                    y: [0, -1300], // ลอยขึ้น
                    opacity: [0, 0.8, 0], // จาง-ชัด-จาง
                    scale: [0.6, p.scaleEnd, 0.6], // ขยายขนาด
                    rotate: [0, 180, 360] // หมุน
                }} 
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }} 
                className="absolute" 
                style={{ 
                    left: p.left, 
                    top: '110%', 
                    width: p.width, 
                    height: p.height,
                    filter: `blur(${p.blur}) drop-shadow(0 0 8px ${isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(236,72,153,0.5)'})`, // เงาและเบลอ
                    color: isDarkMode ? 'white' : '#ec4899', // สีตามโหมด
                    mixBlendMode: isDarkMode ? 'screen' : 'multiply' // การผสมสี
                }} 
            >
                {/* ไอคอนตามโหมด (ดาว/หัวใจ) */}
                {isDarkMode ? <Star size={p.width} fill="currentColor" /> : <Heart size={p.width} fill="currentColor" />}
            </motion.div>
        ))}
      </div>

      {/* ปุ่มสลับ Dark Mode (ขวาบน) */}
      <div className="absolute top-8 right-8 z-[120]">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-4 rounded-full border transition-all shadow-xl flex items-center gap-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* ปุ่มกลับ Home (ขวาล่าง) */}
      <div className="absolute bottom-8 right-8 z-[120]">
        <button onClick={goBackHome} className={`p-3 rounded-full border transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' : 'bg-black/5 border-black/10 text-black/30 hover:text-black'}`}>
          <Home size={14} />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
      </div>

      {/* ส่วนเนื้อหาหลัก (Title & Button) */}
      <motion.div className="text-center px-6 z-10 space-y-4 max-w-6xl relative w-full">
        {/* Layout ของ Title: ใช้ flex-col เพื่อรองรับมือถือ */}
        <div className="relative flex flex-col items-center gap-2 md:gap-0">
            {/* Title ส่วนที่ 1: Memories */}
            <h1 className="text-[14vw] md:text-[9.5rem] font-black italic uppercase tracking-tighter leading-[1.1] md:leading-none self-start md:ml-20">
                <span className={`text-transparent bg-clip-text bg-gradient-to-b pr-4 ${isDarkMode ? 'from-white via-pink-100 to-pink-500' : 'from-[#111] via-pink-400 to-pink-600'} drop-shadow-[0_0_20px_rgba(219,39,119,0.3)]`}>
                    {splitText(titlePart1, 0)}
                </span>
            </h1>
            {/* Title ส่วนที่ 2: Forever. */}
            <h1 className="text-[14vw] md:text-[9.5rem] font-black italic uppercase tracking-tighter leading-[1.1] md:leading-none self-end md:mr-20 md:-mt-8">
                <span className={`text-transparent bg-clip-text bg-gradient-to-b pr-4 ${isDarkMode ? 'from-white via-pink-100 to-pink-500' : 'from-[#111] via-pink-400 to-pink-600'} drop-shadow-[0_0_20px_rgba(219,39,119,0.3)]`}>
                    {splitText(titlePart2, titlePart1.length * 0.1)}
                </span>
            </h1>

            {/* Shine Effect (แสงเงาวิ่งผ่านข้อความ) */}
            <motion.div 
                animate={{ x: ['-100vw', '100vw'] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                className="absolute top-0 bottom-0 w-[60vw] bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[35deg] pointer-events-none z-20"
                style={{ mixBlendMode: 'overlay' }}
            />
        </div>

        {/* Subtitle (คำโปรย) */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1.5 }} className={`text-[4.5vw] md:text-2xl font-black uppercase tracking-[0.05em] md:tracking-[0.25em] ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} drop-shadow-lg pt-8 md:pt-12 px-4`}>
            {headerSub}
        </motion.p>

        {/* ปุ่ม Start Journey */}
        <div className="pt-12 md:pt-16">
            <div className="relative inline-block">
                {/* Ripple Effect (วงกลมขยายออกหลังปุ่ม) */}
                {[...Array(2)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                        transition={{ 
                            duration: 3.5, 
                            repeat: Infinity, 
                            delay: i * 1.5, 
                            ease: "easeInOut" 
                        }}
                        className={`absolute inset-0 rounded-full border-2 ${isDarkMode ? 'border-pink-500/40' : 'border-pink-600/30'}`}
                    />
                ))}
                
                {/* ตัวปุ่มกด */}
                <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: isDarkMode ? "0 0 50px rgba(219,39,119,0.4)" : "0 0 35px rgba(219,39,119,0.2)" }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={startJourney} 
                    className={`group relative px-10 py-5 md:px-20 md:py-7 rounded-full font-black uppercase italic transition-all duration-700 shadow-xl ${isDarkMode ? 'bg-white text-black' : 'bg-[#111] text-white'}`}
                >
                    <span className="flex items-center gap-3 md:gap-4 text-xs md:text-xl relative z-10 tracking-widest">
                        ..เริ่มต้นเข้าสู่ห้วงเวลา.. <Heart size={24} className="fill-pink-600 text-pink-600 animate-pulse"/>
                    </span>
                </motion.button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MemoryLane; // ส่งออก Component