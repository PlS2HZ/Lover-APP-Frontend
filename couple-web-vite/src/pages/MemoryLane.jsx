/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { motion, useScroll, useSpring, AnimatePresence, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, ChevronDown, Music, Volume2, VolumeX, Star } from 'lucide-react';

const MemoryLane = () => {
  // ✍️ แก้ไขข้อความได้ที่นี่เลยครับนาย
  const headerTitle = "Memories Forever."; 
  const headerSub = "ความทรงจำของกันและกัน... ตลอด 1275 วันที่มีหนู"; 
  const journeyQuote = "ในทุกๆ วันที่เราอยู่เคียงข้างกัน พี่มีความสุขมากๆเลยนะ...";
  const footerTitle = "HAPPY NEW YEAR"; 
  const footerMain = "2026 WITH YOU"; 
  const footerSub = "ขอบคุณที่อยู่ด้วยกันมาตลอดปีและตลออดไปเลยนะ ปีหน้าและปีต่อๆ ไป ก็ขอให้มีกันแบบนี้ตลอดไปนะครับคนเก่ง ❤️";

  const [memories, setMemories] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const [moodsRes, usersRes] = await Promise.all([
        // ✅ เปลี่ยนมาดึงข้อมูล Surprise % แทน MOCK_DATA
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

  // ✅ Auto-Scroll ให้ไหลอัตโนมัติ
  useEffect(() => {
    if (isStarted && !loading) {
      const timer = setInterval(() => { window.scrollBy({ top: 1, behavior: 'auto' }); }, 35); 
      return () => clearInterval(timer);
    }
  }, [isStarted, loading]);

  const startJourney = () => {
    setIsStarted(true);
    setTimeout(() => { if (audioRef.current) audioRef.current.play().catch(e => console.log(e)); }, 100);
  };

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <Sparkles className="w-10 h-10 text-pink-500 animate-spin mx-auto" />
        <p className="animate-pulse font-black tracking-widest uppercase text-[10px]">Loading our universe...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans overflow-x-hidden selection:bg-pink-500/30">
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-600 via-white to-pink-600 origin-left z-[100]" style={{ scaleX }} />
      
      {/* 🎵 ลิ้งก์เพลง (นายเปลี่ยนลิ้งก์ .mp3 ที่ได้จาก Storage ที่นี่นะ) */}
      <audio ref={audioRef} loop preload="auto">
  <source src="https://xqmvmryebvmyariewpvr.supabase.co/storage/v1/object/public/memories_mood_moment/-%20Bow%20Kanyarat%20x%20marr%20team%20_%20%20marr%20EP10.mp3" type="audio/mpeg" />
  Your browser does not support the audio element.
</audio>

      {/* ✨ Star Background */}
      <div className="fixed inset-0 pointer-events-none opacity-25">
        {[...Array(30)].map((_, i) => (
          <motion.div key={i} animate={{ y: [0, -1000], opacity: [0, 1, 0] }} transition={{ duration: Math.random() * 15 + 10, repeat: Infinity }} className="absolute bg-white rounded-full" style={{ width: 2, height: 2, left: `${Math.random() * 100}%`, top: '100%' }} />
        ))}
      </div>

      <AnimatePresence>
      {!isStarted && (
        <motion.div exit={{ opacity: 0, scale: 1.1 }} className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center px-6 z-10">
            <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-4 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{headerTitle}</h1>
            <p className="text-[12px] md:text-sm font-black uppercase tracking-[0.6em] text-pink-500 mb-16">{headerSub}</p>
            <button onClick={startJourney} className="px-14 py-5 bg-white text-black rounded-full font-black uppercase italic shadow-2xl active:scale-95 transition-all">START THE JOURNEY <Heart size={18} className="inline ml-2 fill-pink-600 text-pink-600"/></button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto py-60 px-6">
        <header className="h-screen flex flex-col justify-center items-center text-center mb-60">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 2 }}>
                <h2 className="text-2xl md:text-5xl font-serif italic text-gray-200 px-4 leading-relaxed">"{journeyQuote}"</h2>
                <div className="mt-20 opacity-20 animate-bounce"><ChevronDown /></div>
            </motion.div>
        </header>

        <div className="relative border-l border-white/5 ml-2 md:ml-0">
          {memories.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-150px" }} transition={{ duration: 1.2 }} className={`relative mb-64 flex flex-col ${index % 2 === 0 ? 'md:items-start' : 'md:items-end'} items-center`}>
              <div className="absolute -left-[5px] md:left-1/2 md:-translate-x-1/2 top-0 w-2.5 h-2.5 bg-pink-500 rounded-full z-10 shadow-[0_0_15px_#db2777]" />
              <div className="w-full md:w-[70%] group">
                <div className="relative overflow-hidden rounded-[3rem] shadow-2xl border border-white/10 bg-zinc-900 transition-all duration-1000 group-hover:border-pink-500/50">
                  <img src={item.image_url} className="w-full h-auto object-cover max-h-[750px] opacity-80 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-10">
                    <span className="text-5xl block mb-4">{item.mood_emoji}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-pink-500">Captured by {userMap[item.user_id] || 'Lover'}</p>
                    <p className="text-[22px] font-black italic text-white mb-2">{item.mood_text.replace('Surprise ', 'Memory #')}</p>
                    <p className="text-[9px] font-bold text-white/20 tracking-widest uppercase">{new Date(item.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 2 }} className="space-y-10">
            <Heart size={40} className="fill-pink-600 text-pink-600 mx-auto animate-pulse" />
            <h2 className="text-6xl md:text-9xl font-black italic uppercase text-white tracking-tighter">
                {footerTitle} <br/> <span className="text-pink-600">{footerMain}</span>
            </h2>
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.5em] max-w-lg mx-auto leading-loose">{footerSub}</p>
            <button onClick={() => navigate('/')} className="mt-20 px-10 py-4 border border-white/10 rounded-full text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">Back to Reality</button>
          </motion.div>
        </footer>
      </div>

      <button onClick={() => { setIsMuted(!isMuted); audioRef.current.muted = !isMuted; }} className="fixed bottom-10 right-10 z-[100] p-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-pink-600 transition-all">
        {isMuted ? <VolumeX size={24}/> : <Volume2 size={24}/>}
      </button>
    </div>
  );
};

export default MemoryLane;