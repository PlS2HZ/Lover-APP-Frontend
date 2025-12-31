/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { motion, useScroll, useSpring, AnimatePresence, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, ChevronDown, Music, Volume2, VolumeX, Star, ArrowDownToLine } from 'lucide-react';

const MemoryLane = () => {
  // ✍️ ข้อความเดิมของนาย (ห้ามแก้ไขตามสั่ง 100%)
  const headerTitle = "Memories Forever."; 
  const headerSub = "ความทรงจำของกันและกัน... ตลอดเวลา 1275 วันที่มีหนูเข้ามาในชีวิตพี่ ❤️"; 
  const journeyQuote = "ในทุกๆ วันที่เราอยู่เคียงข้างกัน พี่มีความสุขมากๆเลยนะ... ขอบคุณที่ทำให้ทุกความทรงจำมีความหมายนะ";
  const footerTitle = "HAPPY NEW YEAR"; 
  const footerMain = "2026 WITH YOU"; 
  const footerSub = "ขอบคุณที่ร่วมเดินทางผ่านพ้นความสุข์และทุกข์มาตลอด 1275 วันที่แสนพิเศษนี้มาด้วยกัน... และขอบคุณที่จะอยู่สร้างปี 2026 ให้สวยงามไปด้วยกันนะครับคนเก่ง ของขวัญที่ดีที่สุดของพี่คือการที่มีหนูอยู่ข้างๆ ตลอดไป ❤️";

  const [memories, setMemories] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true); 
  const audioRef = useRef(null);
  const footerRef = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  const bgGlow = useTransform(scrollYProgress, [0, 0.5, 1], ["rgba(219,39,119,0)", "rgba(219,39,119,0.15)", "rgba(219,39,119,0)"]);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const [moodsRes, usersRes] = await Promise.all([
        supabase.from('daily_moods').select('*').not('image_url', 'is', null).ilike('mood_text', 'Surprise %').order('created_at', { ascending: true }),
        supabase.from('users').select('id, username')
      ]);
      const uMap = {};
      usersRes.data?.forEach(u => uMap[u.id] = u.username);
      setUserMap(uMap);
      setMemories(moodsRes.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  // ✅ 1. ปรับ Scroll ให้ไวขึ้น (เพิ่มจาก 1px เป็น 2px และปรับเวลาให้เร็วขึ้น)
  useEffect(() => {
    if (isStarted && !loading && isAutoScrolling) {
      const timer = setInterval(() => { 
        window.scrollBy({ top: 2, behavior: 'auto' }); 
      }, 25); // ปรับจาก 35ms เป็น 25ms เพื่อความลื่นไหลและรวดเร็ว
      return () => clearInterval(timer);
    }
  }, [isStarted, loading, isAutoScrolling]);

  const startJourney = () => {
    setIsStarted(true);
    setTimeout(() => { 
        if (audioRef.current) {
            audioRef.current.volume = 0;
            audioRef.current.play();
            let vol = 0;
            const interval = setInterval(() => {
                if (vol < 0.5) { vol += 0.05; audioRef.current.volume = vol; }
                else { clearInterval(interval); }
            }, 200);
        }
    }, 100);
  };

  const scrollToFinale = () => {
    setIsAutoScrolling(false);
    setTimeout(() => {
      footerRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, 100);
  };

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
            <Sparkles className="w-10 h-10 text-pink-500 animate-spin absolute inset-0 m-auto" />
            <Heart className="w-8 h-8 text-white absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="animate-pulse font-black tracking-[0.5em] uppercase text-[10px] text-pink-400">Harmonizing Memories...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans overflow-x-hidden selection:bg-pink-500/30">
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-600 via-white to-pink-600 origin-left z-[100] shadow-[0_0_20px_rgba(219,39,119,0.5)]" style={{ scaleX }} />
      
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
      </audio>

      <motion.div style={{ backgroundColor: bgGlow }} className="fixed inset-0 z-0 pointer-events-none transition-colors duration-1000" />
      
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(60)].map((_, i) => (
          <motion.div 
            key={i} 
            animate={{ 
                y: [0, -1200], 
                opacity: [0, Math.random(), 0],
                scale: [0, Math.random() + 0.5, 0]
            }} 
            transition={{ 
                duration: Math.random() * 25 + 15, 
                repeat: Infinity,
                delay: Math.random() * 10
            }} 
            className="absolute bg-white rounded-full blur-[0.5px]" 
            style={{ width: Math.random() * 2, height: Math.random() * 2, left: `${Math.random() * 100}%`, top: '100%' }} 
          />
        ))}
      </div>

      <AnimatePresence>
      {!isStarted && (
        <motion.div exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }} transition={{ duration: 1.5 }} className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(219,39,119,0.2)_0%,_transparent_75%)] opacity-80" />
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center px-6 z-10 space-y-12">
            <h1 className="text-[12.5vw] md:text-[10rem] font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-200 to-pink-600 drop-shadow-[0_0_60px_rgba(255,192,203,0.4)] leading-none">
                {headerTitle}
            </h1>
            <p className="text-[5vw] md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-pink-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed">
                {headerSub}
            </p>
            <div className="pt-10">
                <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(255,255,255,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startJourney} 
                    className="group relative px-20 py-7 bg-white text-black rounded-full font-black uppercase italic transition-all duration-500 shadow-2xl"
                >
                    <span className="flex items-center gap-4 group-hover:tracking-widest transition-all text-lg md:text-xl">START OUR JOURNEY <Heart size={24} className="fill-pink-600 text-pink-600 animate-pulse"/></span>
                </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto py-60 px-6 relative z-10">
        <header className="h-[80vh] flex flex-col justify-center items-center text-center mb-40"> {/* ✅ 2. ลดความสูง Header ลง */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 2.5 }}>
                <Star className="text-pink-500 mx-auto mb-10 animate-spin-slow shadow-[0_0_30px_rgba(219,39,119,0.6)]" size={56} />
                <h2 className="text-[7.5vw] md:text-7xl font-serif italic text-white/95 px-6 leading-[1.6] drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                    "{journeyQuote}"
                </h2>
                <div className="mt-24 opacity-20 animate-bounce flex flex-col items-center gap-4">
                    <p className="text-[12px] uppercase tracking-[0.5em] font-bold">Scroll through time</p>
                    <ChevronDown size={40} />
                </div>
            </motion.div>
        </header>

        <div className="relative border-l border-white/5 ml-2 md:ml-0">
          {memories.map((item, index) => (
            <motion.div 
                key={item.id} 
                style={{ rotate: index % 2 === 0 ? 1.5 : -1.5 }}
                initial={{ opacity: 0, scale: 0.9, y: 150 }} 
                whileInView={{ opacity: 1, scale: 1, y: 0 }} 
                viewport={{ once: true, margin: "-100px" }} 
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
                // ✅ 3. ลด margin-bottom จาก 35vh เป็น 20vh เพื่อลดช่วงว่างสีดำระหว่างรูป
                className={`relative mb-[20vh] flex flex-col ${index % 2 === 0 ? 'md:items-start' : 'md:items-end'} items-center`}
            >
              <div className="absolute -left-[6px] md:left-1/2 md:-translate-x-1/2 top-0 w-4 h-4 bg-white rounded-full z-20 shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
              
              <div className="w-full md:w-[68%] group">
                <div className="relative overflow-hidden rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.95)] border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-2xl transition-all duration-1000 group-hover:border-pink-500/60 group-hover:shadow-pink-500/30">
                  <motion.img 
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 2 }}
                    src={item.image_url} 
                    className="w-full h-auto object-cover max-h-[850px] opacity-85 group-hover:opacity-100 transition-all duration-1000" 
                    loading="lazy" 
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-90" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-10 md:p-14">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="space-y-6"
                    >
                        <span className="text-7xl block drop-shadow-2xl filter brightness-125">{item.mood_emoji}</span>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-pink-500 mb-3">Captured by {userMap[item.user_id] || 'Lover'}</p>
                            <p className="text-[7.5vw] md:text-4xl font-black italic text-white leading-[1.5] drop-shadow-2xl tracking-tight">
                                {item.mood_text.replace('Surprise ', '')}
                            </p>
                            <div className="w-20 h-1.5 bg-pink-600/40 rounded-full mt-8 shadow-[0_0_15px_rgba(219,39,119,0.3)]" />
                            <p className="text-[11px] font-bold text-white/30 tracking-[0.5em] uppercase mt-5 italic">
                                {new Date(item.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <footer ref={footerRef} className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20"> {/* ✅ 4. ลด pt-40 เป็น pt-20 */}
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 2.5 }} className="space-y-16">
            <Heart size={100} className="fill-pink-600 text-pink-600 mx-auto animate-pulse shadow-pink-500/60" />
            <div className="space-y-10">
                <h2 className="text-7xl md:text-[13rem] font-black italic uppercase text-white tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">{footerTitle}</h2>
                <h2 className="text-[13vw] md:text-[11rem] font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-white to-pink-500 leading-none tracking-tighter animate-gradient-x drop-shadow-[0_0_50px_rgba(219,39,119,0.7)]">{footerMain}</h2>
            </div>
            <p className="text-gray-100 font-bold uppercase text-[4.2vw] md:text-2xl tracking-[0.2em] md:tracking-[0.4em] max-w-5xl mx-auto leading-relaxed italic drop-shadow-2xl px-6 opacity-95">
                {footerSub}
            </p>
            <div className="pt-24 flex flex-col md:flex-row items-center justify-center gap-8">
                <button onClick={() => navigate('/')} className="px-14 py-5 border-2 border-white/10 rounded-full text-[11px] font-black uppercase hover:bg-white hover:text-black transition-all tracking-[0.5em] shadow-2xl backdrop-blur-lg">Return to Reality</button>
            </div>
          </motion.div>
        </footer>
      </div>

      <button 
        onClick={scrollToFinale}
        className="fixed bottom-10 left-10 z-[100] flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-pink-600/20 transition-all shadow-2xl group"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden md:block">Skip to Finale</span>
        <ArrowDownToLine size={20} className="group-hover:translate-y-1 transition-transform" />
      </button>

      <div className="fixed bottom-10 right-10 z-[100] flex items-center gap-6">
        {isStarted && (
            <div className="flex gap-1.5 items-end h-6 pr-4 border-r border-white/10">
                {[...Array(5)].map((_, i) => (
                    <motion.div key={i} animate={{ height: [4, 24, 10, 18, 4] }} transition={{ duration: 0.6 + i*0.1, repeat: Infinity }} className="w-1.5 bg-pink-500/80 shadow-[0_0_15px_rgba(219,39,119,0.6)]" />
                ))}
            </div>
        )}
        <button onClick={() => { setIsMuted(!isMuted); audioRef.current.muted = !isMuted; }} className="p-7 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 text-white hover:bg-pink-600 transition-all duration-500 shadow-2xl group active:scale-90">
            {isMuted ? <VolumeX size={32}/> : <Volume2 size={32} className="group-hover:animate-bounce"/>}
        </button>
      </div>
    </div>
  );
};

export default MemoryLane;