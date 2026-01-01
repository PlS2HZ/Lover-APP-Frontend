/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ChevronDown, Volume2, VolumeX, Star, FastForward, Play, Pause, Calendar } from 'lucide-react';

// ✅ ข้อมูลละอองเบลอ (Bokeh) สำหรับหน้า Ready
const BOKEH_PARTICLES = [...Array(15)].map((_, i) => ({
  id: i,
  left: `${(i * 17.5) % 100}%`,
  top: `${(i * 13.3) % 100}%`,
  size: 40 + (i % 6) * 20,
  duration: 15 + (i % 10),
  delay: i * 0.5
}));

// ✅ ข้อมูลอนุภาคฟุ้งกระจาย (ใช้ตลอดทั้งหน้าเว็บ)
const FLOW_PARTICLES = [...Array(40)].map((_, i) => ({
  id: i,
  left: `${(i * 7.7) % 100}%`,
  size: 10 + (i % 15),
  duration: 15 + (i % 10),
  delay: i * 0.4
}));

const MemoryDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const isDarkMode = state?.isDarkMode ?? true;

  // ✍️ ข้อความเดิม (ห้ามแก้ไข 100%)
  const journeyQuote = "ในทุกๆ วันที่เราอยู่เคียงข้างกัน พี่มีความสุขมากๆเลยนะ... ขอบคุณที่ทำให้ทุกความทรงจำมีความหมายนะ";
  const footerTitle = "HAPPY NEW YEAR"; 
  const footerMain = "2026 WITH YOU"; 
  const footerSub = "ขอบคุณที่ร่วมเดินทางผ่านพ้นความสุข์และทุกข์มาตลอด 1275 วันที่แสนพิเศษนี้มาด้วยกัน... และขอบคุณที่จะอยู่สร้างปี 2026 ให้สวยงามไปด้วยกันนะครับคนเก่ง ของขวัญที่ดีที่สุดของพี่คือการที่มีหนูอยู่ข้างๆ ตลอดไป ❤️";

  const [memories, setMemories] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isReady, setIsReady] = useState(false); 
  const [isMuted, setIsMuted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const audioRef = useRef(null);
  const footerRef = useRef(null);
  const startQuoteRef = useRef(null);
  const memoryRefs = useRef([]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';
    window.scrollTo(0, 0);
    return () => { if (navbar) navbar.style.display = 'flex'; };
  }, []);

  const preloadImages = (data) => {
    data.forEach((item) => {
      const img = new Image();
      img.src = item.image_url;
    });
  };

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
      preloadImages(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const handleReady = () => {
    setIsReady(true);
    setIsAutoScrolling(true);
    if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = 0;
        audioRef.current.play().then(() => {
            let vol = 0;
            const fadeIn = setInterval(() => {
                if (vol < 0.45) { vol += 0.05; audioRef.current.volume = Math.min(vol, 1); }
                else clearInterval(fadeIn);
            }, 200);
        });
    }
    setTimeout(() => { startQuoteRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  useEffect(() => {
    if (!loading && isAutoScrolling && isReady) {
      const timer = setInterval(() => { window.scrollBy({ top: 2, behavior: 'auto' }); }, 16);
      return () => clearInterval(timer);
    }
  }, [loading, isAutoScrolling, isReady]);

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

  useEffect(() => {
    if (scrollYProgress.get() > 0.98 && audioRef.current) {
        const fadeOut = setInterval(() => {
            if (audioRef.current.volume > 0.05) audioRef.current.volume -= 0.05;
            else { audioRef.current.pause(); clearInterval(fadeOut); }
        }, 200);
    }
  }, [scrollYProgress]);

  const handleFastForward = () => {
    const step = 50;
    let nextIndex = currentIndex + step;
    setIsAutoScrolling(false);
    if (nextIndex >= memories.length) footerRef.current?.scrollIntoView({ behavior: 'smooth' });
    else {
      memoryRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth' });
      setCurrentIndex(nextIndex);
    }
    setTimeout(() => { if (isReady) setIsAutoScrolling(true); }, 1500);
  };

  if (loading) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center`}>
      <Sparkles className="w-10 h-10 text-pink-500 animate-spin" />
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#020202] text-white' : 'bg-[#fcfcfc] text-[#1a1a1a]'} font-sans overflow-x-hidden transition-colors duration-1000`}>
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-600 to-pink-600 origin-left z-[100]" style={{ scaleX, position: 'fixed' }} />
      
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
      </audio>

      {/* ✅ อนุภาคฟุ้งกระจายตลอดเวลาจนจบ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {FLOW_PARTICLES.map((p) => (
          <motion.div 
            key={p.id} 
            animate={{ y: [0, -1300], opacity: [0, 0.7, 0], scale: [0.5, 1, 0.5] }} 
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }} 
            className="absolute blur-[1px]" 
            style={{ left: p.left, top: '100%', color: isDarkMode ? 'white' : '#ec4899' }} 
          >
            {isDarkMode ? <Star size={p.size} /> : <Heart size={p.size} className="fill-current" />}
          </motion.div>
        ))}
        {/* แสง Ambient Glow */}
        <div className={`absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-[120px] ${isDarkMode ? 'bg-pink-900/20' : 'bg-pink-200/40'}`} />
        <div className={`absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[120px] ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-100/40'}`} />
      </div>

      {/* ✅ หน้า Ready อัปเดตข้อความและปุ่มตามสั่ง */}
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
                    ของขวัญชิ้นนี้รวบรวมทุกความทรงจำสำหรับการเดินทางตลอดช่วงเวลา 1,275 วันที่เราผ่านมาด้วยกัน <br/>
                    พร้อมแล้วหรือยังสำหรับการเดินทางครั้งนี้?
                  </motion.p>
                </div>

                <div className="relative inline-block group">
                  <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-[-20px] bg-pink-500/40 rounded-full blur-3xl" />
                  <motion.button 
                      onClick={handleReady}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="relative px-24 py-8 bg-pink-600 text-white rounded-full font-black uppercase italic transition-all shadow-[0_15px_50px_rgba(219,39,119,0.5)] text-lg md:text-2xl"
                  >
                      เริ่มต้นเดินทาง❤️
                  </motion.button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto py-60 px-6 relative z-10">
        <header ref={startQuoteRef} className="h-[80vh] flex flex-col justify-center items-center text-center mb-40">
          <Star className="text-pink-500 mb-10 animate-spin-slow" size={56} />
          <h2 className={`text-[7.5vw] md:text-7xl font-serif italic ${isDarkMode ? 'text-white/95' : 'text-[#222]'} leading-[1.6]`}>"{journeyQuote}"</h2>
          <ChevronDown className="mt-20 opacity-20 animate-bounce" size={40} />
        </header>

        <div className="relative border-l border-white/5">
          {memories.map((item, index) => (
            <motion.div key={item.id} ref={el => memoryRefs.current[index] = el} style={{ rotate: index % 2 === 0 ? 1.5 : -1.5 }} initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} onViewportEnter={() => setCurrentIndex(index)} transition={{ duration: 1.5 }} className={`relative mb-[25vh] flex flex-col items-center md:items-start`}>
              <div className={`absolute -left-[6px] md:left-1/2 md:-translate-x-1/2 top-0 w-4 h-4 rounded-full z-20 shadow-xl ${isDarkMode ? 'bg-white' : 'bg-pink-500'}`} />
              <div className="w-full md:w-[68%] group">
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

        <footer ref={footerRef} className="min-h-screen flex flex-col items-center justify-center text-center">
          <Heart size={100} className="fill-pink-600 text-pink-600 animate-pulse mb-10" />
          <h2 className={`text-7xl md:text-[13rem] font-black italic uppercase ${isDarkMode ? 'text-white' : 'text-[#111]'}`}>{footerTitle}</h2>
          <h2 className="text-[13vw] md:text-[11rem] font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-700">{footerMain}</h2>
          <p className="text-[4.2vw] md:text-2xl italic px-6 mt-10">{footerSub}</p>
          <button onClick={() => { navigate('/memory-lane'); setTimeout(() => window.location.reload(), 100); }} className="mt-20 px-14 py-5 border-2 rounded-full font-black uppercase hover:bg-pink-600 hover:text-white transition-all shadow-xl">Back to Memories</button>
        </footer>
      </div>

      <div className="fixed bottom-10 left-10 z-[100] flex gap-3">
        <button onClick={handleFastForward} className={`p-4 backdrop-blur-xl border rounded-full ${isDarkMode ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-black/5 border-black/10 text-black/50 hover:text-black'}`}><FastForward size={20} /></button>
        <button onClick={() => setIsAutoScrolling(!isAutoScrolling)} className={`p-4 backdrop-blur-xl border rounded-full transition-all ${isDarkMode ? 'bg-pink-600/20 border-pink-500/50 text-pink-500' : 'bg-pink-100 border-pink-300 text-pink-600'}`}>
          {isAutoScrolling ? <Pause size={20} /> : <Play size={20} className="fill-current"/>}
        </button>
      </div>
      
      <div className="fixed bottom-10 right-10 z-[100] flex items-center gap-6">
        <div className="flex gap-1.5 items-end h-6 pr-4 border-r border-white/10">
            {[...Array(5)].map((_, i) => (
                <motion.div key={i} animate={{ height: isAutoScrolling ? [4, 24, 10, 18, 4] : 4 }} transition={{ duration: 0.6 + i*0.1, repeat: Infinity }} className="w-1.5 bg-pink-500/80 shadow-lg" />
            ))}
        </div>
        <button onClick={() => { setIsMuted(!isMuted); audioRef.current.muted = !isMuted; }} className={`p-7 backdrop-blur-xl border rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-pink-600' : 'bg-black/5 border-black/10 text-black hover:bg-pink-500'}`}>{isMuted ? <VolumeX size={32}/> : <Volume2 size={32}/>}</button>
      </div>
    </div>
  );
};

export default MemoryDetail;