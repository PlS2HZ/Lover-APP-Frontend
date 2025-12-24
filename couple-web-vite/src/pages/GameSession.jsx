import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Send, Clock, Trophy, ChevronLeft, Loader2 } from 'lucide-react';

const GameSession = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isSending, setIsSending] = useState(false); 
    const [cooldown, setCooldown] = useState(0);
    const messagesEndRef = useRef(null);

    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

    useEffect(() => {
        const fetchInitial = async () => {
            if (!id) return;
            const { data } = await supabase.from('game_messages').select('*').eq('game_id', id).order('created_at', { ascending: true });
            if (data) {
                setMessages(data);
                if (data.some(m => m.answer === 'ถูกต้อง')) setIsFinished(true);
            }
        };
        fetchInitial();

        const channel = supabase.channel(`session-${id}`)
          .on('postgres_changes', { event: 'INSERT', table: 'game_messages', filter: `game_id=eq.${id}` }, (payload) => {
                setMessages(prev => [...prev, payload.new]); 
                setIsSending(false);
                if (payload.new.answer === 'ถูกต้อง') setIsFinished(true);
          }).subscribe();
        return () => supabase.removeChannel(channel);
    }, [id]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        let interval = null;
        if (!isFinished) interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
        else {
            // ✅ บันทึกเวลาที่ใช้ไปลง DB ทันทีที่ชนะ เพื่อคำนวณ Best Time
            const saveTime = async () => {
                await supabase.from('game_sessions').update({ time_spent: seconds, status: 'finished' }).eq('id', id);
            };
            saveTime();
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isFinished, id, seconds]);

    const ask = async () => {
        if (!input.trim() || isFinished || isSending || cooldown > 0) return;
        const currentMsg = input;
        setInput("");
        setIsSending(true);
        setCooldown(3);
        try {
            await fetch(`${API_URL}/api/game/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: id, sender_id: user?.id || localStorage.getItem('user_id'), message: currentMsg })
            });
        } catch (err) { 
            console.error("Ask error:", err);
            setIsSending(false); setCooldown(0); }
    };

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-lg mx-auto h-[90vh] flex flex-col p-4 bg-[#fffdfd]">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/mind-game')} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><ChevronLeft size={24} /></button>
                <div className="flex-1 bg-slate-900 text-white p-4 rounded-3xl flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-2 font-black italic text-sm"><Clock className="text-rose-500" size={18} /> TIME: {formatTime(seconds)}</div>
                    <div className="text-[9px] font-black uppercase bg-rose-500 px-3 py-1 rounded-full italic">🤖 VS RUBSSARB BOT</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                {messages.map(m => (
                    <div key={m.id} className="mb-4">
                        <div className="flex justify-end mb-1">
                            <div className="bg-slate-900 text-white p-3 px-5 rounded-[1.5rem] rounded-tr-none shadow-lg font-bold text-sm">{m.message}</div>
                        </div>
                        {m.answer && (
                            <div className="flex justify-start items-end gap-2">
                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-black text-white">BOT</div>
                                <div className="bg-white p-3 px-5 rounded-[1.5rem] rounded-tl-none border-2 border-rose-100 shadow-sm text-sm font-black text-rose-600 italic">{m.answer}</div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {isFinished && (
                // ✅ แก้ไข: ลบ animate-bounce ออกเพื่อให้ปุ่มนิ่งกดยางง่าย
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 text-white p-6 rounded-[2.5rem] text-center shadow-2xl mb-4 transition-all duration-500 scale-100">
                    <Trophy className="mx-auto mb-2 text-yellow-300" size={54} fill="currentColor" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">MISSION COMPLETE!</h2>
                    <p className="text-[10px] font-bold uppercase mb-4 opacity-80">เวลาของคุณ: {formatTime(seconds)}</p>
                    <button onClick={() => navigate('/mind-game')} className="w-full bg-white text-green-600 py-4 rounded-2xl font-black uppercase italic hover:bg-green-50 active:scale-95 transition-all shadow-lg">กลับ Lobby ✨</button>
                </div>
            )}

            {!isFinished && (
                <div className="flex gap-2 bg-white p-2 rounded-full border-2 border-pink-100 shadow-2xl pr-4">
                    <input className="flex-1 p-3 pl-6 focus:outline-none font-bold italic text-slate-600" placeholder={cooldown > 0 ? `รอแป๊บนึง (${cooldown} วิ)...` : "ทายมาสิ..."} value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && ask()} disabled={isSending || cooldown > 0} />
                    <button onClick={ask} disabled={isSending || cooldown > 0} className={`p-3 rounded-full transition-all ${cooldown > 0 ? 'bg-slate-200 text-slate-400' : 'bg-rose-500 text-white active:scale-90'}`}>
                        {isSending ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameSession;