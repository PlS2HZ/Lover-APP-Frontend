import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  PlusCircle, Gamepad2, Lock, Play, Trophy, Clock, Trash2 , Sparkles, Info  
} from 'lucide-react';

const MindGame = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

  useEffect(() => {
    fetchLevels();
    const channel = supabase.channel('lobby-updates')
      .on('postgres_changes', { event: '*', table: 'heart_games' }, fetchLevels)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('heart_games')
        .select(`
          *,
          host:users!heart_games_host_id_fkey(username),
          sessions:game_sessions(time_spent, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLevels(data || []);
    } catch (err) {
      console.error("Fetch levels error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLevel = async (id, word) => {
    if (window.confirm(`คุณต้องการลบโจทย์คำว่า "${word}" ใช่หรือไม่?`)) {
      // ✅ ทำงานได้เพราะ RLS DELETE Policy: true
      const { error } = await supabase.from('heart_games').delete().eq('id', id);
      if (error) alert("ลบไม่สำเร็จ: " + error.message);
      else fetchLevels();
    }
  };
  
  const handlePlayNow = async (level) => {
    if (!userId) return alert("กรุณาเข้าสู่ระบบก่อน");
    try {
        const res = await fetch(`${API_URL}/api/game/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: level.id, guesser_id: userId, use_bot: true })
        });
        const session = await res.json();
        if (res.ok && session.id) {
            navigate(`/game-session/${session.id}?mode=bot`);
        }
    } catch (err) { 
        console.error("Play now error:", err);
      alert("ไม่สามารถเริ่มเกมได้"); }
  };

  // ✅ ฟังก์ชันปุ่ม "?" (เฉลย/ใบ้)
  const handleShowHint = (level, bestTime) => {
    if (bestTime > 0) {
      alert(`🎉 ด่านนี้คุณเคลียร์แล้ว!\nคำลับคือ: "${level.secret_word}"`);
    } else {
      const hint = level.description || "บอทยังไม่ได้เขียนคำอธิบายไว้จ้า";
      alert(`💡 คำใบ้แรก (Hint Preview):\n${hint.substring(0, 100)}...`);
    }
  };

  const formatTime = (s) => {
    if (!s || s === 0) return "--:--";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBotAutoCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/game/bot-auto-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guesser_id: userId })
      });
      const session = await res.json();
      if (res.ok && session.id) {
        navigate(`/bot-game-session/${session.id}`);
      } else {
        alert("บอทงอแง สุ่มคำให้ไม่ได้ ลองกดใหม่นะ!");
      }
    } catch (err) {
      console.error("Bot auto-create error:", err);
      alert("เชื่อมต่อ Server ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdfd] pb-20">
      <div className="bg-white border-b border-rose-100 p-6 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter flex items-center gap-2">
              <Gamepad2 className="text-purple-500" size={32} /> Mind Game
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">คลังโจทย์ทายใจระบบ AI 🤖</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBotAutoCreate} disabled={loading} className="group flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs uppercase italic hover:bg-purple-700 active:scale-95 shadow-lg shadow-purple-100">
              <Sparkles size={18} /> บอทสร้างโจทย์
            </button>
            <button onClick={() => navigate('/create-level')} className="group flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl font-bold text-xs uppercase italic hover:bg-rose-500 active:scale-95 shadow-lg shadow-slate-200">
              <PlusCircle size={18} /> สร้างด่าน
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
        {loading ? (
          <div className="text-center py-20 animate-spin w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full mx-auto"></div>
        ) : levels.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
            <h3 className="text-slate-500 font-black uppercase italic">ยังไม่มีโจทย์ในขณะนี้</h3>
          </div>
        ) : levels.map((level, index) => {
            const isOwner = level.host_id === userId;
            const levelNumber = levels.length - index;
            const bestTime = level.sessions?.reduce((min, s) => 
              (s.status === 'finished' && (s.time_spent < min || min === 0) ? s.time_spent : min), 0);

            return (
              <div key={level.id} className={`relative bg-white rounded-[2rem] p-5 shadow-xl shadow-slate-100 border-2 transition-all ${isOwner ? 'border-slate-100' : 'border-rose-50 hover:border-rose-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg">
                      <span className="text-[10px] font-black uppercase italic leading-none mb-1 text-rose-400">Lv.</span>
                      <span className="text-xl font-black leading-none">{levelNumber}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-purple-50 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">โหมด AI</span>
                        <span className="text-slate-300 text-[10px] font-bold flex items-center gap-1 uppercase">
                          <Clock size={10} /> {new Date(level.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-700 uppercase italic leading-tight">
                        โจทย์จาก: {level.host?.username || 'Unknown'} 
                        {isOwner && <span className="text-rose-400 normal-case ml-2">({level.secret_word})</span>}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase italic flex items-center gap-1 mt-1">
                        <Trophy size={12} className="text-amber-400" /> Best Time: {formatTime(bestTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isOwner && (
                      <button onClick={() => handleDeleteLevel(level.id, level.secret_word)} className="bg-slate-100 text-slate-400 w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90 shadow-sm">
                        <Trash2 size={20} />
                      </button>
                    )}
                    <button onClick={() => handlePlayNow(level)} className="bg-gradient-to-br from-rose-400 to-pink-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 hover:from-rose-500 hover:to-pink-700 transition-all">
                      <Play size={20} fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                   {/* ✅ ปุ่ม "?" ที่อัปเดตใหม่ */}
                   <button 
                    onClick={() => handleShowHint(level, bestTime)}
                    className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400 hover:bg-purple-100 hover:text-purple-600 transition-colors shadow-sm"
                   >
                    ?
                   </button>
                   <span className="text-[9px] font-black text-slate-300 uppercase italic">
                     {bestTime > 0 ? "เคลียร์แล้ว! คลิก ? เพื่อดูเฉลย" : "คลิกปุ่ม Play เพื่อเริ่มทายกับ Bot"}
                   </span>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default MindGame;