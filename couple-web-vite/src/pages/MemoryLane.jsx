/* eslint-disable no-unused-vars */ // ปิดการแจ้งเตือน Error กรณีมีตัวแปรที่ประกาศแต่ไม่ได้ใช้
import React, { useEffect, useState, useRef } from 'react'; // นำเข้า React และ Hooks (useEffect: ทำงานเมื่อโหลด, useState: เก็บค่า, useRef: อ้างอิง Element)
import { motion } from 'framer-motion'; // นำเข้า Library สำหรับทำ Animation
import { useNavigate } from 'react-router-dom'; // นำเข้า Hook สำหรับเปลี่ยนหน้าเว็บ
import { Heart, Sun, Moon, Home, Star } from 'lucide-react'; // นำเข้าไอคอนต่างๆ

// ✅ ข้อมูลละอองดาวคงที่ (ประกาศนอก Component เพื่อไม่ให้คำนวณใหม่ทุกครั้งที่ Render)
const STATIC_PARTICLES = [...Array(35)].map((_, i) => ({
  id: i, // ID สำหรับ key
  left: `${(i * 11.3) % 100}%`, // คำนวณตำแหน่งแนวนอนแบบสุ่มกระจาย
  width: (i % 6) * 4 + 10, // คำนวณขนาดความกว้างแบบสุ่ม
  height: (i % 6) * 4 + 10, // คำนวณขนาดความสูงแบบสุ่ม
  duration: 12 + (i % 15), // ระยะเวลาลอยขึ้น (ช้า-เร็ว ต่างกัน)
  delay: i * 0.3, // เวลาเริ่มเล่น Animation (ไม่พร้อมกัน)
  scaleEnd: 1.1 + (i % 5) * 0.2, // ขนาดตอนขยายใหญ่สุด
  blur: i % 3 === 0 ? "2px" : "0px" // ใส่ Effect เบลอให้บางดวงเพื่อมิติ
}));

const MemoryLane = () => {
  // State เก็บสถานะ Dark Mode (true = มืด, false = สว่าง)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Hook สำหรับสั่งเปลี่ยนหน้า
  const navigate = useNavigate();
  
  // Ref สำหรับเข้าถึง HTML Audio Element เพื่อควบคุมเพลง
  const audioRef = useRef(null); 

  // ข้อความหัวข้อที่จะนำไปทำ Animation แยกตัวอักษร
  const titlePart1 = "Memories";
  const titlePart2 = "Forever.";
  const headerSub = "ความทรงจำของกันและกัน... ตลอดเวลา 1275 วันที่มีหนูเข้ามาในชีวิตพี่ ❤️"; 

  // Effect นี้ทำงานครั้งเดียวเมื่อเข้ามาหน้านี้ (Mount)
  useEffect(() => {
    const navbar = document.querySelector('nav'); // ค้นหา Navbar หลักของเว็บ
    if (navbar) navbar.style.display = 'none'; // ซ่อน Navbar ไม่ให้เห็นในหน้านี้
    document.body.style.overflow = "hidden"; // ล็อกไม่ให้ Scroll หน้าจอได้
    
    // Cleanup Function: ทำงานเมื่อออกจากหน้านี้ (Unmount)
    return () => { 
        if (navbar) navbar.style.display = 'flex'; // แสดง Navbar กลับมาเหมือนเดิม
        document.body.style.overflow = "auto"; // ปลดล็อกให้ Scroll ได้ตามปกติ
    };
  }, []);

  // ฟังก์ชันกลับหน้าแรก
  const goBackHome = () => {
    navigate('/'); // สั่งเปลี่ยนหน้าไปที่ '/'
    setTimeout(() => { window.location.reload(); }, 100); // รีโหลดหน้าเว็บเพื่อให้เคลียร์ค่าต่างๆ (Optional)
  };

  // ฟังก์ชันเริ่มการเดินทาง (กดปุ่ม Start)
  const startJourney = () => {
    if (audioRef.current) { // ตรวจสอบว่ามี Element เพลงอยู่จริงไหม
        audioRef.current.muted = false; // เปิดเสียง (Unmute)
        audioRef.current.volume = 0; // ตั้งเสียงเริ่มต้นเป็น 0 (เพื่อจะค่อยๆ ดังขึ้น)
        
        // สั่งเล่นเพลง
        audioRef.current.play().then(() => {
            let vol = 0;
            // สร้าง Loop เพื่อเพิ่มเสียงทีละนิด (Fade In) ทุกๆ 150ms
            const fadeIn = setInterval(() => {
                if (vol < 0.4) { vol += 0.05; audioRef.current.volume = vol; } // เพิ่มเสียงจนถึง 0.4
                else clearInterval(fadeIn); // เมื่อถึง 0.4 ให้หยุด Loop
            }, 150);
            // รอ 0.5 วินาที แล้วเปลี่ยนหน้าไปที่ '/memory-detail' พร้อมส่งค่า DarkMode ไปด้วย
            setTimeout(() => { navigate('/memory-detail', { state: { isDarkMode } }); }, 500);
        }).catch(() => { 
            // กรณี Browser บล็อกการเล่นเสียงอัตโนมัติ ให้เปลี่ยนหน้าไปเลยโดยไม่ต้องรอเพลง
            navigate('/memory-detail', { state: { isDarkMode } }); 
        });
    } else { 
        // ถ้าไม่มี Element เพลง ให้เปลี่ยนหน้าเลย
        navigate('/memory-detail', { state: { isDarkMode } }); 
    }
  };

  // ฟังก์ชันแยกข้อความทีละตัวอักษรเพื่อทำ Animation
  const splitText = (text, baseDelay = 0) => {
    return text.split("").map((char, i) => (
      <motion.span
        key={i} // Key สำหรับ React List
        initial={{ opacity: 0, y: 15 }} // สถานะเริ่มต้น: จางหายและอยู่ต่ำกว่าปกติ
        animate={{ opacity: 1, y: 0 }} // สถานะปลายทาง: ชัดเจนและกลับมาตำแหน่งเดิม
        transition={{ 
          delay: baseDelay + (i * 0.1), // หน่วงเวลาทีละตัวอักษรให้ขึ้นไม่พร้อมกัน
          duration: 0.3, // ระยะเวลา Animation
          ease: "easeOut" // รูปแบบการเคลื่อนไหว
        }}
        style={{ display: 'inline-block' }} // จัดให้เป็นบล็อกเพื่อรองรับ Transform
      >
        {char === " " ? "\u00A0" : char} {/* ถ้าเป็นช่องว่าง ให้ใช้ Non-breaking space */}
      </motion.span>
    ));
  };

  return (
    // Container หลัก: ปรับสีพื้นหลังตาม Dark Mode, จัดกลางจอ, ซ่อนส่วนเกิน
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#020202] text-white' : 'bg-[#ffffff] text-[#1a1a1a]'} flex flex-col items-center justify-center transition-colors duration-1000 relative overflow-hidden`}>
      
      {/* Element เสียงเพลง (ซ่อนอยู่) */}
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
      </audio>

      {/* ส่วน Background Animation */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* แสง Glow ตรงกลางจอ: ขยายและหดได้ (Pulse Effect) */}
        <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: isDarkMode ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute inset-[-10%] blur-[120px] ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.4)_0%,_rgba(88,28,135,0.1)_50%,_transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.15)_0%,_rgba(168,85,247,0.05)_50%,_transparent_70%)]'}`} 
        />
        
        {/* Loop สร้างละอองดาว/หัวใจ จากข้อมูล STATIC_PARTICLES */}
        {STATIC_PARTICLES.map((p) => (
            <motion.div 
                key={p.id} 
                animate={{ 
                    y: [0, -1300], // ลอยขึ้นข้างบน
                    opacity: [0, 0.8, 0], // จาง -> ชัด -> จาง
                    scale: [0.6, p.scaleEnd, 0.6], // ขยายและหด
                    rotate: [0, 180, 360] // หมุนตัว
                }} 
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }} 
                className="absolute" 
                style={{ 
                    left: p.left, 
                    top: '110%', // เริ่มจากใต้จอ
                    width: p.width, 
                    height: p.height,
                    // ใส่เงาและเบลอ
                    filter: `blur(${p.blur}) drop-shadow(0 0 8px ${isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(236,72,153,0.5)'})`,
                    color: isDarkMode ? 'white' : '#ec4899', // สีตามโหมด
                    mixBlendMode: isDarkMode ? 'screen' : 'multiply' // การผสมสีกับพื้นหลัง
                }} 
            >
                {/* ถ้าโหมดมืดเป็นดาว โหมดสว่างเป็นหัวใจ */}
                {isDarkMode ? <Star size={p.width} fill="currentColor" /> : <Heart size={p.width} fill="currentColor" />}
            </motion.div>
        ))}
      </div>

      {/* ปุ่มสลับ Dark Mode มุมขวาบน */}
      <div className="absolute top-8 right-8 z-[120]">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-4 rounded-full border transition-all shadow-xl flex items-center gap-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />} {/* ไอคอนเปลี่ยนตามโหมด */}
          <span className="text-[10px] font-black uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* ปุ่ม Home มุมขวาล่าง */}
      <div className="absolute bottom-8 right-8 z-[120]">
        <button onClick={goBackHome} className={`p-3 rounded-full border transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' : 'bg-black/5 border-black/10 text-black/30 hover:text-black'}`}>
          <Home size={14} />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
      </div>

      {/* ส่วนเนื้อหาหลัก (Title & Button) */}
      <motion.div className="text-center px-6 z-10 space-y-4 max-w-6xl relative w-full">
        {/* ✅ ปรับปรุงระยะห่าง Responsive: ใช้ flex-col เพื่อจัดบรรทัด */}
        <div className="relative flex flex-col items-center gap-2 md:gap-0">
            {/* หัวข้อบรรทัดแรก: Memories */}
            <h1 className="text-[14vw] md:text-[9.5rem] font-black italic uppercase tracking-tighter leading-[1.1] md:leading-none self-start md:ml-20">
                <span className={`text-transparent bg-clip-text bg-gradient-to-b ${isDarkMode ? 'from-white via-pink-100 to-pink-500' : 'from-[#111] via-pink-400 to-pink-600'} drop-shadow-[0_0_20px_rgba(219,39,119,0.3)]`}>
                    {splitText(titlePart1, 0)} {/* เรียกใช้ฟังก์ชันแยกตัวอักษร */}
                </span>
            </h1>
            
            {/* หัวข้อบรรทัดที่สอง: Forever. (จัดชิดขวาในจอใหญ่) */}
            <h1 className="text-[14vw] md:text-[9.5rem] font-black italic uppercase tracking-tighter leading-[1.1] md:leading-none self-end md:mr-20 md:-mt-8">
                <span className={`text-transparent bg-clip-text bg-gradient-to-b ${isDarkMode ? 'from-white via-pink-100 to-pink-500' : 'from-[#111] via-pink-400 to-pink-600'} drop-shadow-[0_0_20px_rgba(219,39,119,0.3)]`}>
                    {splitText(titlePart2, titlePart1.length * 0.1)} {/* เริ่ม Animation หลังจากบรรทัดแรกจบ */}
                </span>
            </h1>

            {/* แสงเงาสีขาววิ่งผ่านข้อความ (Shine Effect) */}
            <motion.div 
                animate={{ x: ['-100vw', '100vw'] }} // วิ่งจากซ้ายไปขวา
                transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                className="absolute top-0 bottom-0 w-[60vw] bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[35deg] pointer-events-none z-20"
                style={{ mixBlendMode: 'overlay' }}
            />
        </div>

        {/* ข้อความรอง (Subtitle) */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1.5 }} className={`text-[4.5vw] md:text-2xl font-black uppercase tracking-[0.05em] md:tracking-[0.25em] ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} drop-shadow-lg pt-8 md:pt-12 px-4`}>
            {headerSub}
        </motion.p>

        {/* ปุ่ม Start Journey */}
        <div className="pt-12 md:pt-16">
            <div className="relative inline-block">
                {/* วงกลมระลอกคลื่น (Ripple Effect) หลังปุ่ม */}
                {[...Array(2)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 1.8], opacity: [0.5, 0] }} // ขยายและจางหาย
                        transition={{ 
                            duration: 3.5, 
                            repeat: Infinity, 
                            delay: i * 1.5, 
                            ease: "easeInOut" 
                        }}
                        className={`absolute inset-0 rounded-full border-2 ${isDarkMode ? 'border-pink-500/40' : 'border-pink-600/30'}`}
                    />
                ))}
                
                {/* ตัวปุ่ม Start จริงๆ */}
                <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: isDarkMode ? "0 0 50px rgba(219,39,119,0.4)" : "0 0 35px rgba(219,39,119,0.2)" }} // Effect เมื่อเอาเมาส์ชี้
                    whileTap={{ scale: 0.95 }} // Effect เมื่อกด
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

export default MemoryLane; // ส่งออก Component เพื่อนำไปใช้ที่อื่น