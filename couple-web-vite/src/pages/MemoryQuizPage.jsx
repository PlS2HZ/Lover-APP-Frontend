import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Trash2, Users, UserPlus, UserMinus, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

const MemoryQuizPage = () => {
    const MY_ID = "d8eb372a-d196-44fc-a73b-1809f27e0a56";
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e";
    const loverMapping = useRef({ [MY_ID]: LOVER_ID, [LOVER_ID]: MY_ID }).current;

    const [activeTab, setActiveTab] = useState('play');
    const [memory, setMemory] = useState({ content: '', category: 'ทั่วไป' });
    const [allMemories, setAllMemories] = useState([]);
    const [users, setUsers] = useState([]);
    const [visibleTo, setVisibleTo] = useState([]);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState({ correct: 0, wrong: 0 });

    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            if (Array.isArray(res.data)) {
                const otherUsers = res.data.filter(u => u.id !== userId);
                setUsers(otherUsers);
                const partnerId = loverMapping[userId];
                if (partnerId && otherUsers.some(u => u.id === partnerId)) setVisibleTo([partnerId]);
            }
        } catch (err) { console.error("Fetch Users Error:", err); }
    }, [userId, API_URL, loverMapping]);

    const fetchAllMemories = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/memory-quiz/all?user_id=${userId}`);
            if (response.data) setAllMemories(response.data);
        } catch (err) { console.error("Fetch Memories Error:", err); }
    }, [userId, API_URL]);

    // ✅ ปรับโครงสร้าง useEffect เพื่อป้องกัน Cascading Renders ถาวร
    useEffect(() => {
        let isSubscribed = true;
        const init = async () => {
            if (isSubscribed) await fetchUsers();
        };
        init();
        return () => { isSubscribed = false; };
    }, [fetchUsers]);

    useEffect(() => {
        let isSubscribed = true;
        if (activeTab === 'list') {
            const load = async () => {
                if (isSubscribed) await fetchAllMemories();
            };
            load();
        }
        return () => { isSubscribed = false; };
    }, [activeTab, fetchAllMemories]);

    const handleSaveMemory = async () => {
        if (!memory.content.trim()) return alert("กรุณาพิมพ์ความทรงจำก่อนนะ ✨");
        try {
            await axios.post(`${API_URL}/api/memory-quiz/save`, {
                ...memory, user_id: userId, visible_to: [userId, ...visibleTo]
            });
            setMessage('บันทึกเรียบร้อย! ✨');
            setMemory({ content: '', category: 'ทั่วไป' });
        } catch (err) { console.error("Save Memory Error:", err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("ลบความทรงจำนี้ใช่ไหม?")) return;
        try {
            await axios.delete(`${API_URL}/api/memory-quiz/delete?id=${id}`);
            await fetchAllMemories();
        } catch (err) { console.error("Delete Memory Error:", err); }
    };

    const fetchQuiz = async () => {
        setLoading(true); 
        setQuiz(null); 
        setWrongAnswers([]); 
        setIsCorrect(false);
        setScore({ correct: 0, wrong: 0 });
        
        try {
            // ✅ แก้ไข: ส่ง user_id ไปเพื่อให้ API สุ่มความทรงจำที่คนนี้มองเห็นได้จริงๆ
            const res = await axios.get(`${API_URL}/api/memory-quiz/random?user_id=${userId}`);
            if (res.data) {
                setQuiz(res.data);
            }
        } catch (err) { 
            console.error("Fetch Quiz Error:", err);
            alert("กามเทพนึกไม่ออก ลองพิมพ์เพิ่มข้อมูลดูนะ ✨");
        }
        setLoading(false);
    };

    const handleAnswer = async (index) => {
        if (isCorrect || wrongAnswers.includes(index)) return;
        const correct = index === quiz.answer_index;
        
        if (correct) {
            setIsCorrect(true);
            setScore(prev => ({ ...prev, correct: 1 }));
            try {
                const partnerId = loverMapping[userId];
                await axios.post(`${API_URL}/api/memory-quiz/submit`, {
                    partner_id: partnerId,
                    question: quiz.question,
                    wrong_count: score.wrong
                });
            } catch (err) { console.error("Notification Error:", err); }
        } else {
            setWrongAnswers([...wrongAnswers, index]);
            setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        }
    };

    const toggleVisibleUser = (id) => {
        setVisibleTo(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-[2.5rem] shadow-xl mt-10 border-2 border-rose-50 font-bold text-slate-700">
            <h1 className="text-2xl font-black italic text-pink-500 text-center mb-6 uppercase tracking-tighter">❤️ Memory Quiz</h1>
            
            <div className="flex mb-6 bg-slate-100 rounded-2xl p-1 text-[10px] font-black uppercase italic shadow-inner">
                <button onClick={() => setActiveTab('play')} className={`flex-1 py-3 rounded-xl transition-all ${activeTab === 'play' ? 'bg-white shadow-sm text-pink-500' : 'text-slate-400'}`}>เล่นควิซ</button>
                <button onClick={() => setActiveTab('add')} className={`flex-1 py-3 rounded-xl transition-all ${activeTab === 'add' ? 'bg-white shadow-sm text-pink-500' : 'text-slate-400'}`}>เพิ่มข้อมูล</button>
                <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-pink-500' : 'text-slate-400'}`}>คลังความจำ</button>
            </div>

            {activeTab === 'play' && (
                <div className="text-center min-h-[400px] flex flex-col justify-center animate-in fade-in duration-500">
                    {!quiz && !loading && (
                        <button onClick={fetchQuiz} className="bg-pink-500 text-white px-8 py-4 rounded-3xl font-black italic uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">เริ่มสุ่มคำถาม ✨</button>
                    )}
                    {loading && <p className="text-slate-400 animate-pulse font-black italic uppercase text-xs">กามเทพกำลังนึกย้อนเวลา...</p>}
                    {quiz && (
                        <div className="text-left">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <p className="text-[10px] uppercase font-black text-rose-300 italic">ทายใจแฟนกัน ❤️</p>
                                <div className="flex gap-2 text-[10px] font-black italic uppercase">
                                    <span className="text-green-500">ถูก: {score.correct}</span>
                                    <span className="text-red-400">ผิด: {score.wrong}</span>
                                </div>
                            </div>
                            <p className="text-lg font-black italic text-slate-700 mb-6 uppercase leading-tight">{quiz.question}</p>
                            <div className="space-y-3">
                                {quiz.options.map((opt, i) => {
                                    const isWrong = wrongAnswers.includes(i);
                                    const isRight = isCorrect && i === quiz.answer_index;
                                    return (
                                        <button key={i} onClick={() => handleAnswer(i)} disabled={isCorrect || isWrong}
                                            className={`w-full p-4 rounded-2xl border-2 text-[11px] font-black uppercase italic transition-all flex justify-between items-center ${
                                                isRight ? 'bg-green-50 border-green-400 text-green-700 shadow-md' :
                                                isWrong ? 'bg-red-50 border-red-200 text-red-300 opacity-60' :
                                                'bg-white border-slate-50 text-slate-500 hover:border-pink-200 shadow-sm'
                                            }`}>
                                            {opt}
                                            {isRight && <CheckCircle2 size={16}/>}
                                            {isWrong && <XCircle size={16}/>}
                                        </button>
                                    );
                                })}
                            </div>
                            {isCorrect && (
                                <div className="mt-6 p-5 bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 rounded-[2rem] border-2 border-pink-100 font-black italic text-sm animate-bounce text-center shadow-inner">
                                    ✨ {quiz.sweet_comment} ✨
                                </div>
                            )}
                            <button onClick={fetchQuiz} className="mt-8 flex items-center justify-center gap-3 bg-rose-500 text-white py-4 rounded-2xl font-black italic uppercase text-xs w-full hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-100">
                                <RotateCcw size={18}/> สุ่มเรื่องราวใหม่เพื่อทดสอบรัก ↻
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'list' && (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-bottom-2">
                    {allMemories.length > 0 ? allMemories.map((m) => (
                        <div key={m.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 relative group">
                            <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{m.content}"</p>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[8px] font-black text-pink-400 uppercase bg-pink-50 px-2 py-1 rounded-lg"># {m.category}</span>
                                {m.user_id === userId && (
                                    <button onClick={() => handleDelete(m.id)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                )}
                            </div>
                        </div>
                    )) : <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase italic">ยังไม่มีเรื่องราวที่มองเห็นได้...</p>}
                </div>
            )}

            {activeTab === 'add' && (
                <div className="space-y-5 animate-in slide-in-from-right-2">
                    <textarea value={memory.content} onChange={(e) => setMemory({...memory, content: e.target.value})}
                        placeholder="เล่าความทรงจำที่นี่..." className="w-full p-5 border-2 border-slate-50 rounded-[2rem] h-40 focus:border-pink-200 outline-none text-xs font-bold italic text-slate-600 bg-slate-50" />
                    <div className="space-y-2 px-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">ใครมองเห็นความทรงจำนี้ได้บ้าง?</label>
                        <div className="flex flex-wrap gap-2">
                            {users.map(u => (
                                <button key={u.id} type="button" onClick={() => toggleVisibleUser(u.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-bold transition-all border-2 ${visibleTo.includes(u.id) ? 'bg-pink-100 border-pink-400 text-pink-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                    {visibleTo.includes(u.id) ? <UserPlus size={12}/> : <UserMinus size={12}/>} {u.username}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleSaveMemory} className="w-full bg-pink-500 text-white py-4 rounded-3xl font-black italic uppercase shadow-lg active:scale-95 transition-all">เก็บลงกล่องหัวใจ 🔒</button>
                    {message && <p className="text-center text-[10px] font-black text-pink-400 italic mt-2 animate-pulse uppercase tracking-widest">{message}</p>}
                </div>
            )}
        </div>
    );
};

export default MemoryQuizPage;