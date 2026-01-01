import React, { useState, useEffect, useRef } from 'react'; // นำเข้า React Hooks พื้นฐาน
import { useParams, useNavigate } from 'react-router-dom'; // Hooks สำหรับ Routing (ดึง params, เปลี่ยนหน้า)
import { supabase } from '../supabaseClient'; // ตัวเชื่อมต่อ Supabase
import { Send, Clock, Trophy, ChevronLeft, Loader2, Flag } from 'lucide-react'; // นำเข้าไอคอนต่างๆ

const GameSession = ({ user }) => {
    const { id } = useParams(); // ดึง ID ของ Game Session จาก URL
    const navigate = useNavigate(); // สร้างฟังก์ชันสำหรับเปลี่ยนหน้า
    
    // State: เก็บประวัติข้อความแชทในเกม
    const [messages, setMessages] = useState([]);
    // State: เก็บข้อความที่กำลังพิมพ์ใน Input
    const [input, setInput] = useState("");
    // State: เก็บเวลาที่ใช้เล่นเกม (วินาที)
    const [seconds, setSeconds] = useState(0);
    // State: สถานะจบเกม (True = ทายถูกแล้ว หรือ ยอมแพ้แล้ว)
    const [isFinished, setIsFinished] = useState(false);
    // State: สถานะกำลังส่งข้อความ (True = กำลังรอ AI ตอบ)
    const [isSending, setIsSending] = useState(false); 
    // State: เวลานับถอยหลังห้ามพิมพ์ (Cooldown) กัน spam
    const [cooldown, setCooldown] = useState(0);
    // State: เก็บคำเฉลย (กรณีที่กดยอมแพ้)
    const [revealedWord, setRevealedWord] = useState(null); 
    // Refs: สำหรับ Auto Scroll และ Focus Input
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // กำหนด API URL ตาม Environment
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' 
        : 'https://lover-app-jjoe.onrender.com'; // ✅ ระบุไปเลยไม่ต้องเช็ค localhost

    // Effect: ดึงข้อความเก่า และ Subscribe Realtime เมื่อโหลด Session
    useEffect(() => {
        const fetchInitial = async () => {
            if (!id) return; // ถ้าไม่มี ID จบการทำงาน
            // ดึงข้อความแชททั้งหมดของ session นี้ เรียงตามเวลา
            const { data } = await supabase.from('game_messages').select('*').eq('game_id', id).order('created_at', { ascending: true });
            if (data) {
                setMessages(data); // เก็บลง State
                // ถ้ามีข้อความไหนบอกว่า 'ถูกต้อง' แปลว่าจบเกมแล้ว
                if (data.some(m => m.answer === 'ถูกต้อง')) setIsFinished(true);
            }
        };
        fetchInitial();

        // Subscribe Realtime: เมื่อมีข้อความใหม่เพิ่มเข้ามา (INSERT) ให้แสดงผลทันที
        const channel = supabase.channel(`session-${id}`)
          .on('postgres_changes', { event: 'INSERT', table: 'game_messages', filter: `game_id=eq.${id}` }, (payload) => {
                setMessages(prev => [...prev, payload.new]); // เพิ่มข้อความใหม่
                setIsSending(false); // ปลดสถานะ Sending (AI ตอบแล้ว)
                if (payload.new.answer === 'ถูกต้อง') setIsFinished(true); // ถ้าตอบถูก ให้จบเกม
          }).subscribe();
        
        return () => supabase.removeChannel(channel); // Cleanup channel เมื่อออกจากหน้า
    }, [id]);

    // Effect: Auto Scroll ลงมาล่างสุดเสมอเมื่อมีข้อความใหม่
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    // Effect: นับถอยหลัง Cooldown
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Effect: จับเวลาเล่นเกม (Timer)
    useEffect(() => {
        let interval = null;
        if (!isFinished) {
            // ถ้าเกมยังไม่จบ ให้นับเวลาเพิ่มทุกวิ
            interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
        } else if (!revealedWord) {
            // ถ้าเกมจบแล้ว (และไม่ได้ยอมแพ้): บันทึกเวลาลง DB และอัปเดตสถานะเป็น finished
            const saveTime = async () => {
                await supabase.from('game_sessions').update({ time_spent: seconds, status: 'finished' }).eq('id', id);
            };
            saveTime();
            clearInterval(interval);
        } else {
            // ถ้าเกมจบเพราะยอมแพ้ หยุดเวลาเฉยๆ
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isFinished, id, seconds, revealedWord]);

    // ฟังก์ชันส่งข้อความทาย (หรือขอคำใบ้)
    const ask = async (customMsg = null) => {
        const messageToSend = customMsg || input; // ใช้ข้อความที่พิมพ์ หรือ customMsg (เช่นคำใบ้)
        // Validation: ห้ามส่งถ้าว่าง, จบเกมแล้ว, กำลังส่งอยู่, หรือติด cooldown
        if (!messageToSend.trim() || isFinished || isSending || cooldown > 0) return;
        
        if (!customMsg) setInput(""); // เคลียร์ช่อง Input
        setIsSending(true); // เริ่มสถานะกำลังส่ง
        setCooldown(1); // ตั้ง Cooldown สั้นๆ กันเบิ้ล
        
        try {
            // ยิง API ไปหา Backend เพื่อประมวลผลคำตอบกับ AI
            await fetch(`${API_URL}/api/game/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: id, sender_id: user?.id || localStorage.getItem('user_id'), message: messageToSend })
            });
        } catch (err) { 
            console.error("Ask error:", err);
        } finally {
            setIsSending(false); // จบการส่ง (เผื่อ API Error แล้ว Realtime ไม่ทำงาน)
            setTimeout(() => inputRef.current?.focus(), 100); // Focus กลับที่ช่องพิมพ์
        }
    };

    // ฟังก์ชันกดยอมแพ้
    const handleGiveUp = async () => {
        if (!window.confirm("แน่ใจนะว่าจะยอมแพ้? คำลับจะถูกเฉลยทันที!")) return; // ถามยืนยัน
        try {
            // 1. ดึง game_id (โจทย์หลัก) จาก Session ปัจจุบันก่อน
            const { data: sessionData, error: sessionErr } = await supabase
                .from('game_sessions').select('game_id').eq('id', id).maybeSingle();

            if (sessionErr || !sessionData) {
                alert("ไม่พบข้อมูล Session");
                return;
            }

            // 2. ใช้ game_id ไปดึง "secret_word" จากตาราง heart_games
            const { data: gameData, error: gameErr } = await supabase
                .from('heart_games').select('secret_word').eq('id', sessionData.game_id).maybeSingle();

            if (gameErr || !gameData) {
                alert("เฉลยไม่ได้: ไม่พบข้อมูลโจทย์");
                return;
            }

            setRevealedWord(gameData.secret_word); // เก็บคำเฉลยลง State เพื่อแสดงผล
            setIsFinished(true); // จบเกม
            // อัปเดตสถานะ Session เป็น finished ใน DB
            await supabase.from('game_sessions').update({ status: 'finished' }).eq('id', id);
        } catch (err) {
            console.error("Give up unexpected error:", err);
        }
    };

    // ฟังก์ชันลัดสำหรับขอคำใบ้
    const askHint = () => ask("ขอคำใบ้หน่อย");

    // ฟังก์ชันแปลงวินาทีเป็น MM:SS
    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-lg mx-auto h-[90vh] flex flex-col p-4 bg-[#fffdfd]">
            {/* Header: ปุ่มย้อนกลับ และ แถบเวลา */}
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/mind-game')} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 bg-slate-900 text-white p-4 rounded-3xl flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-2 font-black italic text-sm">
                        <Clock className="text-rose-500" size={18} /> {isFinished ? "FINISHED" : `TIME: ${formatTime(seconds)}`}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* ปุ่มยอมแพ้ (แสดงตอนยังไม่จบเกม) */}
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

            {/* Chat Area: พื้นที่แสดงข้อความ */}
            <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                {messages.map(m => (
                    <div key={m.id} className="mb-4">
                        {/* ข้อความของผู้เล่น (ชิดขวา) */}
                        <div className="flex justify-end mb-1">
                            <div className="bg-slate-900 text-white p-3 px-5 rounded-[1.5rem] rounded-tr-none shadow-lg font-bold text-sm">{m.message}</div>
                        </div>
                        {/* คำตอบจาก BOT (ชิดซ้าย) */}
                        {m.answer && (
                            <div className="flex justify-start items-end gap-2">
                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-black text-white">BOT</div>
                                <div className="bg-white p-3 px-5 rounded-[1.5rem] rounded-tl-none border-2 border-rose-100 shadow-sm text-sm font-black text-rose-600 italic">{m.answer}</div>
                            </div>
                        )}
                    </div>
                ))}
                {/* Element เปล่าๆ เพื่อให้ scroll มาล่างสุด */}
                <div ref={messagesEndRef} />
            </div>

            {/* End Game Screen: แสดงเมื่อจบเกม */}
            {isFinished && (
                <div className={`bg-gradient-to-br ${revealedWord ? 'from-slate-700 to-slate-900' : 'from-green-400 to-emerald-600'} text-white p-6 rounded-[2.5rem] text-center shadow-2xl mb-4 animate-in zoom-in duration-300`}>
                    {revealedWord ? (
                        // กรณีแพ้ (เฉลยคำ)
                        <>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1 text-rose-300">ยอมแพ้ซะแล้ว!</h2>
                            <p className="text-sm font-bold mb-4 opacity-80 uppercase tracking-widest">
                                คำลับคือ: <span className="text-yellow-300 text-xl underline px-2">{revealedWord}</span>
                            </p>
                        </>
                    ) : (
                        // กรณีชนะ
                        <>
                            <Trophy className="mx-auto mb-2 text-yellow-300" size={54} fill="currentColor" />
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">MISSION COMPLETE!</h2>
                            <p className="text-[10px] font-bold uppercase mb-4 opacity-80">เวลาของคุณ: {formatTime(seconds)}</p>
                        </>
                    )}
                    <button onClick={() => navigate('/mind-game')} className="w-full bg-white text-slate-800 py-4 rounded-2xl font-black uppercase italic hover:bg-slate-50 transition-all shadow-lg">กลับ Lobby ✨</button>
                </div>
            )}

            {/* Input Area: ช่องพิมพ์และปุ่มส่ง (ซ่อนเมื่อจบเกม) */}
            {!isFinished && (
                <div className="flex flex-col gap-2">
                    {/* ปุ่มลัดขอคำใบ้ */}
                    <div className="flex justify-center">
                        <button 
                            onClick={askHint} 
                            disabled={isSending || cooldown > 0} 
                            className="text-[10px] font-black bg-amber-100 text-amber-600 px-4 py-2 rounded-full border-2 border-amber-200 hover:bg-amber-200 transition-all shadow-sm disabled:opacity-50"
                        >
                            💡 ขอคำใบ้ (อัตโนมัติ)
                        </button>
                    </div>
                    {/* ช่องกรอกข้อความ */}
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