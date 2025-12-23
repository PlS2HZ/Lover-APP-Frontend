/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Send, Clock, Trophy, ChevronLeft } from 'lucide-react';

const GameSession = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

    const fetchMessages = useCallback(async () => {
        if (!id) return;
        const { data } = await supabase
            .from('game_messages')
            .select('*')
            .eq('game_id', id)
            .order('created_at', { ascending: true });
        
        if (data) {
            setMessages(data);
            if (data.some(m => m.answer === 'ถูกต้อง')) {
                setIsFinished(true);
            }
        }
    }, [id]);

    useEffect(() => {
        let active = true;
        const initFetch = async () => { if (active) await fetchMessages(); };
        initFetch();

        const channel = supabase.channel(`session-${id}`)
          .on('postgres_changes', 
            { event: '*', table: 'game_messages', filter: `game_id=eq.${id}` }, 
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => [...prev, payload.new]); 
                } else if (payload.eventType === 'UPDATE') {
                    setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
                    if (payload.new.answer === 'ถูกต้อง') setIsFinished(true);
                }
          }).subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    }, [id, fetchMessages]);

    useEffect(() => {
        let interval = null;
        if (!isFinished) {
            interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isFinished]);

    const ask = async () => {
        if (!input || isFinished) return;
        const currentMsg = input;
        setInput("");

        try {
            await fetch(`${API_URL}/api/game/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: id,
                    sender_id: user.id,
                    message: currentMsg
                })
            });
        } catch (err) {
            console.error("Ask error:", err);
        }
    };

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-lg mx-auto h-[90vh] flex flex-col p-4 bg-[#fffdfd]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/mind-game')} className="p-2 text-slate-400">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 bg-slate-900 text-white p-4 rounded-3xl flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-2 font-black italic text-sm">
                        <Clock className="text-rose-500 animate-pulse" size={18} />
                        TIME: {formatTime(seconds)}
                    </div>
                    <div className="text-[9px] font-black uppercase bg-rose-500 px-3 py-1 rounded-full italic shadow-sm">
                        {mode === 'bot' ? '🤖 VS GEMINI AI' : '💖 VS MY LOVE'}
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-30 font-black italic uppercase text-xs">
                        เริ่มพิมพ์คำถามเพื่อทายใจได้เลย...
                    </div>
                )}
{messages.map(m => (
    <div key={m.id} className="mb-4 animate-in fade-in slide-in-from-bottom-2">
        {/* ผู้เล่นถาม */}
        <div className="flex justify-end mb-1">
            <div className="bg-slate-900 text-white p-3 px-5 rounded-[1.5rem] rounded-tr-none shadow-lg font-bold text-sm max-w-[80%]">
                {m.message}
            </div>
        </div>
        
        {/* บอทตอบ */}
        {m.answer && (
            <div className="flex justify-start items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-black text-white shadow-md">
                    BOT
                </div>
                <div className="bg-white p-3 px-5 rounded-[1.5rem] rounded-tl-none border-2 border-rose-100 shadow-sm max-w-[85%]">
                    <div className="text-sm font-black text-rose-600 leading-relaxed italic">
                        {m.answer}
                    </div>
                </div>
            </div>
        )}
    </div>
))}
            </div>

            {/* Success Screen */}
            {isFinished && (
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 text-white p-6 rounded-[2.5rem] text-center shadow-2xl animate-bounce mb-4 border-4 border-white">
                    <Trophy className="mx-auto mb-2" size={44} fill="currentColor" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">MISSION COMPLETE!</h2>
                    <p className="font-bold text-xs italic opacity-90">ใช้เวลาทั้งหมด: {formatTime(seconds)}</p>
                    <button onClick={() => navigate('/mind-game')} className="mt-4 bg-white text-green-600 px-6 py-2 rounded-full font-black text-[10px] uppercase italic">กลับ Lobby</button>
                </div>
            )}

            {/* Input Area */}
            {!isFinished && (
                <div className="flex gap-2 bg-white p-2 rounded-full border-2 border-pink-100 shadow-2xl pr-4">
                    <input 
                        className="flex-1 p-3 pl-6 focus:outline-none font-bold italic text-slate-600"
                        placeholder="คำลับคืออะไรนะ..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && ask()}
                    />
                    <button onClick={ask} className="bg-rose-500 text-white p-3 rounded-full active:scale-90 transition-all shadow-lg">
                        <Send size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameSession;