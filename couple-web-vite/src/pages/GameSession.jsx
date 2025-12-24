/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Send, Clock, Trophy, ChevronLeft, Loader2 } from 'lucide-react';

const GameSession = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isSending, setIsSending] = useState(false); 
    const [cooldown, setCooldown] = useState(0); // ✅ ระบบนับถอยหลังยื้อเวลา
    const messagesEndRef = useRef(null);

    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchInitialMessages = async () => {
            if (!id) return;
            const { data } = await supabase
                .from('game_messages')
                .select('*')
                .eq('game_id', id)
                .order('created_at', { ascending: true });
            if (data) {
                setMessages(data);
                if (data.some(m => m.answer === 'ถูกต้อง')) setIsFinished(true);
            }
        };
        fetchInitialMessages();

        const channel = supabase.channel(`session-${id}`)
          .on('postgres_changes', 
            { event: 'INSERT', table: 'game_messages', filter: `game_id=eq.${id}` }, 
            (payload) => {
                setMessages(prev => [...prev, payload.new]); 
                setIsSending(false);
                if (payload.new.answer === 'ถูกต้อง') setIsFinished(true);
            }
          ).subscribe();

        return () => supabase.removeChannel(channel);
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ จัดการ Timer สำหรับ Cooldown 3 วินาที
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        let interval = null;
        if (!isFinished) {
            interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
        } else { clearInterval(interval); }
        return () => clearInterval(interval);
    }, [isFinished]);

    const ask = async () => {
        if (!input.trim() || isFinished || isSending || cooldown > 0) return;
        const currentMsg = input;
        setInput("");
        setIsSending(true);
        setCooldown(3); // ✅ ตั้งค่ารอ 3 วินาที

        try {
            await fetch(`${API_URL}/api/game/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: id,
                    sender_id: user?.id || localStorage.getItem('user_id'),
                    message: currentMsg
                })
            });
        } catch (err) {
            console.error("Ask error:", err);
            setIsSending(false);
            setCooldown(0);
        }
    };

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-lg mx-auto h-[90vh] flex flex-col p-4 bg-[#fffdfd]">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/mind-game')} className="p-2 text-slate-400"><ChevronLeft size={24} /></button>
                <div className="flex-1 bg-slate-900 text-white p-4 rounded-3xl flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-2 font-black italic text-sm"><Clock className="text-rose-500 animate-pulse" size={18} /> TIME: {formatTime(seconds)}</div>
                    <div className="text-[9px] font-black uppercase bg-rose-500 px-3 py-1 rounded-full italic shadow-sm">🤖 VS RUBSSARB BOT</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-30 font-black italic uppercase text-xs">เริ่มพิมพ์คำถามเพื่อทายใจได้เลย...</div>
                )}
                {messages.map(m => (
                    <div key={m.id} className="mb-4">
                        <div className="flex justify-end mb-1">
                            <div className="bg-slate-900 text-white p-3 px-5 rounded-[1.5rem] rounded-tr-none shadow-lg font-bold text-sm max-w-[80%]">{m.message}</div>
                        </div>
                        {m.answer && (
                            <div className="flex justify-start items-end gap-2">
                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-black text-white shadow-md">BOT</div>
                                <div className="bg-white p-3 px-5 rounded-[1.5rem] rounded-tl-none border-2 border-rose-100 shadow-sm max-w-[85%]">
                                    <div className="text-sm font-black text-rose-600 leading-relaxed italic">{m.answer}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {isSending && <div className="text-[10px] font-black text-slate-300 italic animate-pulse ml-2">Rubssarb Bot กำลังกวนประสาท...</div>}
                <div ref={messagesEndRef} />
            </div>

            {isFinished && (
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 text-white p-6 rounded-[2.5rem] text-center shadow-2xl animate-bounce mb-4">
                    <Trophy className="mx-auto mb-2" size={44} fill="currentColor" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">MISSION COMPLETE!</h2>
                    <button onClick={() => navigate('/mind-game')} className="mt-4 bg-white text-green-600 px-6 py-2 rounded-full font-black text-[10px] uppercase italic">กลับ Lobby</button>
                </div>
            )}

            {!isFinished && (
                <div className="flex gap-2 bg-white p-2 rounded-full border-2 border-pink-100 shadow-2xl pr-4">
                    <input 
                        className="flex-1 p-3 pl-6 focus:outline-none font-bold italic text-slate-600"
                        placeholder={cooldown > 0 ? `รอแป๊บนึง (${cooldown} วิ)...` : "ทายมาสิว่ามันคืออะไร..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && ask()}
                        disabled={isSending || cooldown > 0}
                    />
                    <button 
                        onClick={ask} 
                        disabled={isSending || cooldown > 0}
                        className={`p-3 rounded-full transition-all shadow-lg ${cooldown > 0 ? 'bg-slate-200 text-slate-400' : 'bg-rose-500 text-white active:scale-90'}`}
                    >
                        {isSending ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameSession;