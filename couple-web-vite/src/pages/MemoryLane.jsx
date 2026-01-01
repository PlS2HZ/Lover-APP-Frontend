/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from 'react'; // Hooks พื้นฐานของ React (จัดการ State, Effect, Reference)
import { supabase } from '../supabaseClient'; // เชื่อมต่อกับ Supabase เพื่อดึงข้อมูล
import { motion, useScroll, useSpring, AnimatePresence, useTransform } from 'framer-motion'; // Library สำหรับทำ Animation
import { useNavigate } from 'react-router-dom'; // Hook สำหรับเปลี่ยนหน้า (Routing)
import { Heart, Sparkles, ChevronDown, Music, Volume2, VolumeX, Star, FastForward, Sun, Moon, Home, Calendar } from 'lucide-react'; // นำเข้าไอคอนสวยๆ จาก Lucide

const MemoryLane = () => {
  // ✍️ ข้อความเดิมของนาย (ห้ามแก้ไขตามสั่ง 100%)
  const headerTitle = "Memories Forever."; 
  const headerSub = "ความทรงจำของกันและกัน... ตลอดเวลา 1275 วันที่มีหนูเข้ามาในชีวิตพี่ ❤️"; 
  const journeyQuote = "ในทุกๆ วันที่เราอยู่เคียงข้างกัน พี่มีความสุขมากๆเลยนะ... ขอบคุณที่ทำให้ทุกความทรงจำมีความหมายนะ";
  const footerTitle = "HAPPY NEW YEAR"; 
  const footerMain = "2026 WITH YOU"; 
  const footerSub = "ขอบคุณที่ร่วมเดินทางผ่านพ้นความสุข์และทุกข์มาตลอด 1275 วันที่แสนพิเศษนี้มาด้วยกัน... และขอบคุณที่จะอยู่สร้างปี 2026 ให้สวยงามไปด้วยกันนะครับคนเก่ง ของขวัญที่ดีที่สุดของพี่คือการที่มีหนูอยู่ข้างๆ ตลอดไป ❤️";

  // State เก็บรายการความทรงจำที่ดึงมาจาก Database
  const [memories, setMemories] = useState([]); 
  // State เก็บ Map ชื่อ User (Key=ID, Value=Username) เพื่อแสดงชื่อคนโพสต์
  const [userMap, setUserMap] = useState({}); 
  // State บอกสถานะการโหลดข้อมูล (True = กำลังโหลด)
  const [loading, setLoading] = useState(true); 
  // State บอกสถานะการเริ่มเดินทาง (False = หน้า Intro, True = เข้าสู่หน้าเนื้อหา)
  const [isStarted, setIsStarted] = useState(false); 
  // State ปิด/เปิดเสียงเพลง (True = ปิดเสียง)
  const [isMuted, setIsMuted] = useState(false); 
  // State ควบคุมการเลื่อนหน้าจออัตโนมัติ (Auto Scroll)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true); 
  // State เก็บ Index ของความทรงจำปัจจุบันที่เลื่อนผ่าน
  const [currentIndex, setCurrentIndex] = useState(0); 
  // State เก็บสถานะ Dark Mode (True = ธีมมืด)
  const [isDarkMode, setIsDarkMode] = useState(true); 

  // Ref สำหรับเข้าถึง Element <audio> เพื่อสั่งเล่น/หยุดเพลง
  const audioRef = useRef(null); 
  // Ref สำหรับเข้าถึง Footer เพื่อเลื่อนไปหาตอนกดข้าม
  const footerRef = useRef(null); 
  // Ref เก็บ Array ของ Element ความทรงจำแต่ละก้อน เพื่อเลื่อนไปหาได้
  const memoryRefs = useRef([]); 
  // Hook สำหรับเปลี่ยนหน้า
  const navigate = useNavigate();

  // Hook จับค่าการเลื่อนหน้าจอ (Scroll Progress: 0 ถึง 1)
  const { scrollYProgress } = useScroll(); 
  // Animation Spring สำหรับ Progress Bar ด้านบน ให้ดูเด้งดึ๋งนุ่มนวล
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 }); 
  
  // สร้าง Animation สีพื้นหลัง (Glow) ตามการเลื่อน (เปลี่ยน Opacity ของสีชมพู)
  const bgGlow = useTransform(scrollYProgress, [0, 0.5, 1], ["rgba(219,39,119,0)", "rgba(219,39,119,0.15)", "rgba(219,39,119,0)"]);

  // ซ่อน Navbar หลักของเว็บเฉพาะตอนเริ่ม Journey (เพื่อให้หน้าจอโล่งเห็นแต่เนื้อหา)
  useEffect(() => {
    const navbar = document.querySelector('nav'); 
    if (isStarted && navbar) {
      navbar.style.display = 'none'; // ซ่อน Navbar
    } else if (navbar) {
      navbar.style.display = 'flex'; // แสดงกลับมาเมื่อออกจากหน้านี้
    }
    return () => { if (navbar) navbar.style.display = 'flex'; }; // Cleanup Function คืนค่าเดิม
  }, [isStarted]);

  // ฟังก์ชันดึงข้อมูลความทรงจำจาก Supabase
  const fetchMemories = useCallback(async () => {
    setLoading(true); // เริ่มโหลด
    try {
      // ดึงข้อมูล 2 อย่างพร้อมกัน: 1. Mood ที่มีคำว่า 'Surprise' 2. รายชื่อ User
      const [moodsRes, usersRes] = await Promise.all([
        supabase.from('daily_moods').select('*').not('image_url', 'is', null).ilike('mood_text', 'Surprise %').order('created_at', { ascending: true }),
        supabase.from('users').select('id, username')
      ]);
      
      // สร้าง Map ชื่อ User เพื่อให้ค้นหาง่ายๆ
      const uMap = {};
      usersRes.data?.forEach(u => uMap[u.id] = u.username);
      setUserMap(uMap);
      
      // เก็บข้อมูลลง State
      setMemories(moodsRes.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); } // จบการโหลด
  }, []);

  // เรียกใช้ fetchMemories เมื่อ Component เริ่มทำงาน
  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  // ✅ ปรับความสมูทให้เนียนขึ้นสำหรับ iPhone/iPad (ใช้ความถี่ 16ms สัมพันธ์กับ Refresh Rate 60Hz)
  // Auto Scroll จะทำงานเมื่อเริ่ม Journey และไม่ได้ปิดการเลื่อนอัตโนมัติ
  useEffect(() => {
    if (isStarted && !loading && isAutoScrolling) {
      const timer = setInterval(() => { 
        window.scrollBy({ top: 2, behavior: 'auto' }); // เลื่อนลงทีละ 2px
      }, 16); 
      return () => clearInterval(timer); // เคลียร์ Interval เมื่อ Unmount
    }
  }, [isStarted, loading, isAutoScrolling]);

  // ฟังก์ชันเริ่มการเดินทาง (กดปุ่ม START)
  const startJourney = () => {
    setIsStarted(true); // เปลี่ยนสถานะเป็นเริ่ม
    setTimeout(() => { 
        if (audioRef.current) {
            audioRef.current.volume = 0; // เริ่มที่เสียงเบาสุด
            audioRef.current.play(); // เล่นเพลง
            let vol = 0;
            // Fade In เสียงเพลงทีละนิดให้นุ่มนวล
            const interval = setInterval(() => {
                if (vol < 0.5) { vol += 0.05; audioRef.current.volume = vol; }
                else { clearInterval(interval); }
            }, 200);
        }
    }, 100);
  };

  // ฟังก์ชันรีเซ็ตกลับไปหน้า Intro (Return to Reality)
  const resetToLaneStart = () => {
    setIsStarted(false); // กลับไปสถานะยังไม่เริ่ม
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนกลับไปบนสุด
    if (audioRef.current) {
        audioRef.current.pause(); // หยุดเพลง
        audioRef.current.currentTime = 0; // รีเซ็ตเพลงไปวินาทีที่ 0
    }
  };

  // ฟังก์ชันเร่งความเร็ว (Fast Forward) ข้ามไปทีละ 50 รายการ
  const handleFastForward = () => {
    const step = 50;
    let nextIndex = currentIndex + step;
    setIsAutoScrolling(false); // หยุดเลื่อนอัตโนมัติชั่วคราว
    
    // ถ้าเกินจำนวนที่มี ให้ไป Footer เลย
    if (nextIndex >= memories.length) {
      footerRef.current?.scrollIntoView({ behavior: 'smooth' });
      setCurrentIndex(memories.length);
    } else {
      // เลื่อนไปที่ Element ถัดไปตาม Index
      memoryRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth' });
      setCurrentIndex(nextIndex);
    }
    // กลับมาเลื่อนอัตโนมัติอีกครั้งหลังผ่านไป 1.5 วินาที
    setTimeout(() => { setIsAutoScrolling(true); }, 1500);
  };

  // ฟังก์ชันแปลงวันที่เป็นรูปแบบที่สวยงาม (DD MMM YYYY)
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  // ส่วนแสดงผลตอนกำลังโหลด (Loading Screen)
  if (loading) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center`}>
      <div className="text-center space-y-4">
        <Sparkles className="w-10 h-10 text-pink-500 animate-spin mx-auto" />
        <p className="animate-pulse font-black tracking-[0.5em] uppercase text-[10px] text-pink-500">Creating Universe...</p>
      </div>
    </div>
  );

  return (
    // Container หลัก ปรับสีพื้นหลังตาม Dark Mode
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#020202] text-white' : 'bg-[#fcfcfc] text-[#1a1a1a]'} font-sans overflow-x-hidden transition-colors duration-1000`}>
      
      {/* Progress Bar ด้านบนสุด แสดงความคืบหน้าการเลื่อน */}
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-600 via-white to-pink-600 origin-left z-[100]" style={{ scaleX }} />
      
      {/* Element เสียงเพลง */}
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
      </audio>

      {/* Background Effect: ดาวลอยและแสงฟุ้ง */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(40)].map((_, i) => (
          <motion.div 
            key={i} 
            // Animation ลอยขึ้น หมุน และจางหาย
            animate={{ y: [0, -1200], x: [0, Math.sin(i) * 50], rotate: [0, 360], opacity: [0, 0.4, 0] }} 
            transition={{ duration: Math.random() * 20 + 20, repeat: Infinity, delay: Math.random() * 10 }} 
            className="absolute blur-[1px]" 
            style={{ left: `${Math.random() * 100}%`, top: '100%', color: isDarkMode ? 'white' : '#ec4899' }} 
          >
            {isDarkMode ? <Star size={Math.random() * 10 + 5} /> : <Heart size={Math.random() * 15 + 5} className="fill-current" />}
          </motion.div>
        ))}
        {/* แสง Glow สีชมพู/ม่วง เบลอๆ ด้านหลัง */}
        <div className={`absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-[120px] ${isDarkMode ? 'bg-pink-900/20' : 'bg-pink-200/40'}`} />
        <div className={`absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[120px] ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-100/40'}`} />
      </div>

      {/* หน้า Intro (แสดงเมื่อยังไม่กด Start) */}
      <AnimatePresence>
      {!isStarted && (
        <motion.div exit={{ opacity: 0, scale: 1.1 }} className={`fixed inset-0 z-[110] flex flex-col items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          {/* ปุ่มกลับหน้า Home มุมขวาล่าง */}
          <div className="absolute bottom-6 right-6 z-[120]">
            <button onClick={() => navigate('/')} className={`p-3 rounded-full border transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-black/5 border-black/10 text-black/40 hover:text-black'}`}>
              <Home size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
            </button>
          </div>

          {/* ปุ่มสลับ Dark Mode มุมขวาบน */}
          <div className="absolute top-10 right-10 z-[120]">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-4 rounded-full border transition-all shadow-xl flex items-center gap-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* Radial Gradient พื้นหลัง */}
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.2)_0%,_transparent_75%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.1)_0%,_transparent_75%)]'}`} />
          
          {/* เนื้อหาหลักหน้า Intro: หัวข้อและปุ่ม Start */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center px-6 z-10 space-y-12">
            <h1 className={`text-[12.5vw] md:text-[10rem] font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${isDarkMode ? 'from-white via-pink-200 to-pink-600' : 'from-[#333] via-pink-500 to-pink-700'} leading-none`}>
                {headerTitle}
            </h1>
            <p className={`text-[5vw] md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} drop-shadow-md`}>
                {headerSub}
            </p>
            <div className="pt-10">
                <motion.button whileHover={{ scale: 1.05 }} onClick={startJourney} className={`group relative px-20 py-7 rounded-full font-black uppercase italic transition-all shadow-2xl ${isDarkMode ? 'bg-white text-black' : 'bg-[#111] text-white'}`}>
                    <span className="flex items-center gap-4 text-lg md:text-xl">START OUR JOURNEY <Heart size={24} className="fill-pink-600 text-pink-600 animate-pulse"/></span>
                </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ส่วนเนื้อหาความทรงจำ (Memory Lane) */}
      <div className="max-w-5xl mx-auto py-60 px-6 relative z-10">
        
        {/* Header คำคมก่อนเริ่มรูปแรก */}
        <header className="h-[80vh] flex flex-col justify-center items-center text-center mb-40"> 
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                <Star className="text-pink-500 mx-auto mb-10 animate-spin-slow" size={56} />
                <h2 className={`text-[7.5vw] md:text-7xl font-serif italic ${isDarkMode ? 'text-white/95' : 'text-[#222]'} px-6 leading-[1.6]`}>
                    "{journeyQuote}"
                </h2>
                <div className={`mt-24 opacity-20 animate-bounce flex flex-col items-center gap-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    <ChevronDown size={40} />
                </div>
            </motion.div>
        </header>

        {/* Loop แสดงรายการความทรงจำ */}
        <div className={`relative border-l ${isDarkMode ? 'border-white/5' : 'border-black/5'} ml-2 md:ml-0`}>
          {memories.map((item, index) => (
            <motion.div 
                key={item.id} 
                ref={el => memoryRefs.current[index] = el} // เก็บ Ref เพื่อใช้ Scroll
                style={{ rotate: index % 2 === 0 ? 1.5 : -1.5 }} // เอียงซ้ายขวาสลับกัน
                initial={{ opacity: 0, y: 150 }} 
                whileInView={{ opacity: 1, y: 0 }} // Animation เมื่อเลื่อนมาเจอ
                viewport={{ once: true, margin: "-100px" }} 
                onViewportEnter={() => setCurrentIndex(index)} // อัปเดต Index ปัจจุบัน
                transition={{ duration: 1.5 }} 
                className={`relative mb-[20vh] flex flex-col ${index % 2 === 0 ? 'md:items-start' : 'md:items-end'} items-center`}
            >
              {/* จุดกลมๆ บนเส้น Timeline */}
              <div className={`absolute -left-[6px] md:left-1/2 md:-translate-x-1/2 top-0 w-4 h-4 rounded-full z-20 shadow-xl ${isDarkMode ? 'bg-white' : 'bg-pink-500'}`} />
              
              <div className="w-full md:w-[68%] group">
                {/* กรอบรูปภาพ */}
                <div className={`relative overflow-hidden rounded-[3.5rem] shadow-2xl border-l-4 transition-all duration-1000 ${isDarkMode ? 'border-pink-600/60 bg-[#0a0a0a]/90 backdrop-blur-2xl' : 'border-pink-500/40 bg-white backdrop-blur-2xl'}`}>
                  
                  {/* ✅ เพิ่ม willChange เพื่อความสมูทสูงสุดในมือถือ */}
                  <motion.img src={item.image_url} className="w-full h-auto object-cover max-h-[850px] opacity-90 group-hover:opacity-100 transition-all duration-1000" style={{ willChange: 'transform' }} />
                  
                  {/* Gradient เงาดำด้านล่างรูป */}
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-t from-black via-transparent to-black/30' : 'bg-gradient-to-t from-black/70 via-transparent to-transparent'} opacity-90`} />
                  
                  {/* ข้อความบนรูปภาพ */}
                  <div className="absolute bottom-0 left-0 right-0 p-10 md:p-14 z-10 text-white"> 
                    
                    <div className="flex flex-col gap-2 mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400 drop-shadow-md">
                            Captured by {userMap[item.user_id] || 'Lover'}
                        </p>

                        {/* --------------------------------------------------------- */}
                        {/* 🗓️ [SECTION: DATE] - คอมเมนต์ไว้ตามสั่ง ห้ามลบทิ้งเด็ดขาด! */}
                        {/* หากต้องการเอากลับมา ให้ลบเครื่องหมาย {/ * และ * /} ออกครับ */}
                        {/* <div className="flex items-center gap-2 text-white/60">
                            <Calendar size={12} className="text-pink-500/80" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em]">{formatDate(item.created_at)}</p>
                        </div> 
                        */}
                        {/* --------------------------------------------------------- */}

                    </div>

                    {/* ข้อความ Mood Text (ตัดคำว่า Surprise ออก) */}
                    <p className="text-[6.2vw] md:text-4xl font-black italic leading-[1.3] drop-shadow-2xl tracking-tight break-words">{item.mood_text.replace('Surprise ', '')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer ด้านล่างสุด */}
        <footer ref={footerRef} className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20"> 
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-16">
            <Heart size={100} className="fill-pink-600 text-pink-600 mx-auto animate-pulse" />
            <div className="space-y-10">
                <h2 className={`text-7xl md:text-[13rem] font-black italic uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#111]'}`}>{footerTitle}</h2>
                <h2 className="text-[13vw] md:text-[11rem] font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-400 to-pink-700 leading-none tracking-tighter animate-gradient-x">{footerMain}</h2>
            </div>
            <p className={`font-bold uppercase text-[4.2vw] md:text-2xl tracking-[0.2em] md:tracking-[0.4em] max-w-5xl mx-auto leading-relaxed italic px-6 ${isDarkMode ? 'text-gray-100' : 'text-[#444]'}`}>{footerSub}</p>
            <div className="pt-24">
                {/* ปุ่มกลับไปหน้า Intro */}
                <button onClick={resetToLaneStart} className={`px-14 py-5 border-2 rounded-full text-[11px] font-black uppercase transition-all shadow-2xl backdrop-blur-lg ${isDarkMode ? 'border-white/10 hover:bg-white hover:text-black' : 'border-black/20 hover:bg-[#111] hover:text-white text-black'}`}>Return to Reality</button>
            </div>
          </motion.div>
        </footer>
      </div>

      {/* ปุ่ม Fast Forward มุมซ้ายล่าง */}
      <button onClick={handleFastForward} className={`fixed bottom-10 left-10 z-[100] flex items-center gap-3 px-6 py-4 backdrop-blur-2xl border rounded-full transition-all shadow-2xl ${isDarkMode ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-black/5 border-black/10 text-black/50 hover:text-black'}`}>
        <FastForward size={20} />
      </button>

      {/* ปุ่ม Volume และ Music Visualizer มุมขวาล่าง */}
      <div className="fixed bottom-10 right-10 z-[100] flex items-center gap-6">
        {isStarted && (
            <div className="flex gap-1.5 items-end h-6 pr-4 border-r border-white/10">
                {/* Animation กราฟเสียงเต้นตามจังหวะสมมติ */}
                {[...Array(5)].map((_, i) => (
                    <motion.div key={i} animate={{ height: [4, 24, 10, 18, 4] }} transition={{ duration: 0.6 + i*0.1, repeat: Infinity }} className="w-1.5 bg-pink-500/80 shadow-lg" />
                ))}
            </div>
        )}
        <button onClick={() => { setIsMuted(!isMuted); audioRef.current.muted = !isMuted; }} className={`p-7 backdrop-blur-3xl border rounded-full transition-all duration-500 shadow-2xl active:scale-90 ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-pink-600' : 'bg-black/5 border-black/10 text-black hover:bg-pink-500'}`}>
            {isMuted ? <VolumeX size={32}/> : <Volume2 size={32}/>}
        </button>
      </div>
    </div>
  );
};

export default MemoryLane;