import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Send, Clock, Trophy, ChevronLeft, Loader2, Flag } from 'lucide-react';

const GameSession = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isSending, setIsSending] = useState(false); 
    const [cooldown, setCooldown] = useState(0);
    const [revealedWord, setRevealedWord] = useState(null); 
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // const API_URL = window.location.hostname === 'localhost' 
    //     ? 'http://localhost:8080' : 'https://lover-app-jjoe.onrender.com';
    const API_URL = 'https://lover-app-jjoe.onrender.com'; // ✅ ระบุไปเลยไม่ต้องเช็ค localhost
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
        if (!isFinished) {
            interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
        } else if (!revealedWord) {
            const saveTime = async () => {
                await supabase.from('game_sessions').update({ time_spent: seconds, status: 'finished' }).eq('id', id);
            };
            saveTime();
            clearInterval(interval);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isFinished, id, seconds, revealedWord]);

    const ask = async (customMsg = null) => {
        const messageToSend = customMsg || input;
        if (!messageToSend.trim() || isFinished || isSending || cooldown > 0) return;
        if (!customMsg) setInput(""); 
        setIsSending(true);
        setCooldown(1);
        try {
            await fetch(`${API_URL}/api/game/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: id, sender_id: user?.id || localStorage.getItem('user_id'), message: messageToSend })
            });
        } catch (err) { 
            console.error("Ask error:", err);
        } finally {
            setIsSending(false); 
            setTimeout(() => inputRef.current?.focus(), 100); 
        }
    };

    const handleGiveUp = async () => {
        if (!window.confirm("แน่ใจนะว่าจะยอมแพ้? คำลับจะถูกเฉลยทันที!")) return;
        try {
            // 1. ดึง game_id จาก Session ก่อน
            const { data: sessionData, error: sessionErr } = await supabase
                .from('game_sessions').select('game_id').eq('id', id).maybeSingle();

            if (sessionErr || !sessionData) {
                alert("ไม่พบข้อมูล Session");
                return;
            }

            // 2. ใช้ game_id ไปหาคำลับใน heart_games
            const { data: gameData, error: gameErr } = await supabase
                .from('heart_games').select('secret_word').eq('id', sessionData.game_id).maybeSingle();

            if (gameErr || !gameData) {
                alert("เฉลยไม่ได้: ไม่พบข้อมูลโจทย์");
                return;
            }

            setRevealedWord(gameData.secret_word);
            setIsFinished(true);
            await supabase.from('game_sessions').update({ status: 'finished' }).eq('id', id);
        } catch (err) {
            console.error("Give up unexpected error:", err);
        }
    };

    const askHint = () => ask("ขอคำใบ้หน่อย");

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-lg mx-auto h-[90vh] flex flex-col p-4 bg-[#fffdfd]">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/mind-game')} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 bg-slate-900 text-white p-4 rounded-3xl flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-2 font-black italic text-sm">
                        <Clock className="text-rose-500" size={18} /> {isFinished ? "FINISHED" : `TIME: ${formatTime(seconds)}`}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isFinished && (
                            <button 
                                onClick={handleGiveUp}
                                className="text-[9px] font-black uppercase bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded-full italic transition-all flex items-center gap-1 shadow-lg"
                            >
                                <Flag size={10} /> ยอมแพ้
                            </button>
                        )}
                        <div className="text-[9px] font-black uppercase bg-rose-500 px-3 py-1 rounded-full italic">🤖 VS BOT</div>
                    </div>
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
                <div className={`bg-gradient-to-br ${revealedWord ? 'from-slate-700 to-slate-900' : 'from-green-400 to-emerald-600'} text-white p-6 rounded-[2.5rem] text-center shadow-2xl mb-4 animate-in zoom-in duration-300`}>
                    {revealedWord ? (
                        <>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1 text-rose-300">ยอมแพ้ซะแล้ว!</h2>
                            <p className="text-sm font-bold mb-4 opacity-80 uppercase tracking-widest">
                                คำลับคือ: <span className="text-yellow-300 text-xl underline px-2">{revealedWord}</span>
                            </p>
                        </>
                    ) : (
                        <>
                            <Trophy className="mx-auto mb-2 text-yellow-300" size={54} fill="currentColor" />
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">MISSION COMPLETE!</h2>
                            <p className="text-[10px] font-bold uppercase mb-4 opacity-80">เวลาของคุณ: {formatTime(seconds)}</p>
                        </>
                    )}
                    <button onClick={() => navigate('/mind-game')} className="w-full bg-white text-slate-800 py-4 rounded-2xl font-black uppercase italic hover:bg-slate-50 transition-all shadow-lg">กลับ Lobby ✨</button>
                </div>
            )}

            {!isFinished && (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-center">
                        <button 
                            onClick={askHint} 
                            disabled={isSending || cooldown > 0} 
                            className="text-[10px] font-black bg-amber-100 text-amber-600 px-4 py-2 rounded-full border-2 border-amber-200 hover:bg-amber-200 transition-all shadow-sm disabled:opacity-50"
                        >
                            💡 ขอคำใบ้ (อัตโนมัติ)
                        </button>
                    </div>
                    <div className="flex gap-2 bg-white p-2 rounded-full border-2 border-pink-100 shadow-2xl pr-4">
                        <input 
                            ref={inputRef}
                            className="flex-1 p-3 pl-6 focus:outline-none font-bold italic text-slate-600 text-sm" 
                            placeholder={cooldown > 0 ? `รอแป๊บนึง...` : "ทายมาสิ..."} 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && ask()} 
                            disabled={isSending || cooldown > 0} 
                        />
                        <button onClick={() => ask()} disabled={isSending || cooldown > 0} className={`p-3 rounded-full transition-all ${cooldown > 0 ? 'bg-slate-200 text-slate-400' : 'bg-rose-500 text-white active:scale-90'}`}>
                            {isSending ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameSession;