import React, { useState, useEffect, useCallback, useRef } from 'react'; // นำเข้า React Hooks พื้นฐาน
import axios from 'axios'; // นำเข้า axios สำหรับยิง API
import { Trash2, Users, UserPlus, UserMinus, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'; // นำเข้าไอคอนต่างๆ

const MemoryQuizPage = () => {
    // กำหนด ID ของเราและแฟน (Hardcode ไว้) เพื่อใช้ในการจับคู่ (Mapping)
    const MY_ID = "d8eb372a-d196-44fc-a73b-1809f27e0a56";
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e";
    // ใช้ useRef เพื่อสร้าง Object จับคู่ ID โดยไม่ทำให้ Re-render (Mapping ว่าใครคู่กับใคร)
    const loverMapping = useRef({ [MY_ID]: LOVER_ID, [LOVER_ID]: MY_ID }).current;

    // State: เก็บ Tab ที่เลือกปัจจุบัน ('play' = เล่นเกม, 'add' = เพิ่มข้อมูล, 'list' = ดูรายการ)
    const [activeTab, setActiveTab] = useState('play');
    // State: เก็บข้อมูลฟอร์มเพิ่มความทรงจำ (เนื้อหา, หมวดหมู่)
    const [memory, setMemory] = useState({ content: '', category: 'ทั่วไป' });
    // State: เก็บรายการความทรงจำทั้งหมดที่จะแสดงใน Tab 'list'
    const [allMemories, setAllMemories] = useState([]);
    // State: เก็บรายชื่อ User ทั้งหมด (ยกเว้นตัวเอง) เพื่อเลือก visible_to
    const [users, setUsers] = useState([]);
    // State: เก็บ Array ID ของคนที่มีสิทธิ์เห็นความทรงจำที่จะบันทึกใหม่
    const [visibleTo, setVisibleTo] = useState([]);
    // State: เก็บข้อมูลคำถาม Quiz ปัจจุบันที่สุ่มได้จาก API
    const [quiz, setQuiz] = useState(null);
    // State: สถานะ Loading (True = กำลังโหลดข้อมูล/สุ่มคำถาม)
    const [loading, setLoading] = useState(false);
    // State: ข้อความแจ้งเตือนสถานะการบันทึก (เช่น "บันทึกเรียบร้อย")
    const [message, setMessage] = useState('');
    
    // State: เก็บ Array Index ของคำตอบที่กดผิดไปแล้ว (เพื่อ disable ปุ่ม)
    const [wrongAnswers, setWrongAnswers] = useState([]);
    // State: สถานะว่าตอบถูกแล้วหรือยัง (True = ตอบถูกแล้ว)
    const [isCorrect, setIsCorrect] = useState(false);
    // State: เก็บแต้ม (ถูก/ผิด) ในรอบการเล่นนี้
    const [score, setScore] = useState({ correct: 0, wrong: 0 });

    // ดึง user_id ปัจจุบันจาก LocalStorage
    const userId = localStorage.getItem('user_id');
    // กำหนด API URL ตาม environment (Local vs Production)
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    // ฟังก์ชันดึงรายชื่อ User ทั้งหมด (ใช้ useCallback เพื่อลดการสร้างฟังก์ชันใหม่)
    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`); // ยิง API ขอ User List
            if (Array.isArray(res.data)) {
                // กรองเอาเฉพาะคนอื่นที่ไม่ใช่เรา
                const otherUsers = res.data.filter(u => u.id !== userId);
                setUsers(otherUsers); // เก็บลง State
                
                // หา ID ของแฟนจาก loverMapping ถ้าเจอใน List ให้ default เลือกแฟนไว้ก่อน
                const partnerId = loverMapping[userId];
                if (partnerId && otherUsers.some(u => u.id === partnerId)) setVisibleTo([partnerId]);
            }
        } catch (err) { console.error("Fetch Users Error:", err); }
    }, [userId, API_URL, loverMapping]);

    // ฟังก์ชันดึงรายการความทรงจำทั้งหมด (สำหรับ Tab List)
    const fetchAllMemories = useCallback(async () => {
        try {
            // ยิง API ขอความทรงจำทั้งหมดที่ User นี้มีสิทธิ์เห็น
            const response = await axios.get(`${API_URL}/api/memory-quiz/all?user_id=${userId}`);
            if (response.data) setAllMemories(response.data); // เก็บลง State
        } catch (err) { console.error("Fetch Memories Error:", err); }
    }, [userId, API_URL]);

    // ✅ ปรับโครงสร้าง useEffect เพื่อป้องกัน Cascading Renders ถาวร
    // Effect: ทำงานเมื่อ Component โหลด เพื่อดึงรายชื่อ User
    useEffect(() => {
        let isSubscribed = true; // ตัวแปรเช็คว่า Component ยังอยู่ไหม (กัน Memory Leak)
        const init = async () => {
            if (isSubscribed) await fetchUsers(); // เรียกฟังก์ชัน
        };
        init();
        return () => { isSubscribed = false; }; // Cleanup function
    }, [fetchUsers]);

    // Effect: ทำงานเมื่อเปลี่ยน Tab ไปเป็น 'list' เพื่อดึงข้อมูลความทรงจำมาแสดง
    useEffect(() => {
        let isSubscribed = true;
        if (activeTab === 'list') { // เช็คว่าอยู่หน้า List ไหม
            const load = async () => {
                if (isSubscribed) await fetchAllMemories(); // ถ้าใช่ ให้ดึงข้อมูล
            };
            load();
        }
        return () => { isSubscribed = false; };
    }, [activeTab, fetchAllMemories]);

    // ฟังก์ชันบันทึกความทรงจำใหม่
    const handleSaveMemory = async () => {
        if (!memory.content.trim()) return alert("กรุณาพิมพ์ความทรงจำก่อนนะ ✨"); // เช็คค่าว่าง
        try {
            // ยิง API POST เพื่อบันทึก
            await axios.post(`${API_URL}/api/memory-quiz/save`, {
                ...memory, user_id: userId, visible_to: [userId, ...visibleTo] // รวมข้อมูล User และสิทธิ์การมองเห็น
            });
            setMessage('บันทึกเรียบร้อย! ✨'); // แจ้งเตือนสำเร็จ
            setMemory({ content: '', category: 'ทั่วไป' }); // รีเซ็ตฟอร์ม
        } catch (err) { console.error("Save Memory Error:", err); }
    };

    // ฟังก์ชันลบความทรงจำ
    const handleDelete = async (id) => {
        if (!window.confirm("ลบความทรงจำนี้ใช่ไหม?")) return; // ถามยืนยันก่อนลบ
        try {
            // ยิง API Delete
            await axios.delete(`${API_URL}/api/memory-quiz/delete?id=${id}`);
            await fetchAllMemories(); // ดึงข้อมูลใหม่เพื่ออัปเดตหน้าจอ
        } catch (err) { console.error("Delete Memory Error:", err); }
    };

    // ฟังก์ชันสุ่มคำถาม Quiz
    const fetchQuiz = async () => {
        setLoading(true); // เริ่มโหลด
        setQuiz(null); // เคลียร์คำถามเก่า
        setWrongAnswers([]); // เคลียร์คำตอบผิดเก่า
        setIsCorrect(false); // รีเซ็ตสถานะถูกผิด
        setScore({ correct: 0, wrong: 0 }); // รีเซ็ตคะแนนรอบนี้
        
        try {
            // ✅ แก้ไข: ส่ง user_id ไปเพื่อให้ API สุ่มความทรงจำที่คนนี้มองเห็นได้จริงๆ
            const res = await axios.get(`${API_URL}/api/memory-quiz/random?user_id=${userId}`);
            if (res.data) {
                setQuiz(res.data); // เก็บข้อมูลคำถามลง State
            }
        } catch (err) { 
            console.error("Fetch Quiz Error:", err);
            alert("กามเทพนึกไม่ออก ลองพิมพ์เพิ่มข้อมูลดูนะ ✨"); // แจ้งเตือนถ้าไม่มีข้อมูลให้สุ่ม
        }
        setLoading(false); // จบการโหลด
    };

    // ฟังก์ชันจัดการเมื่อ User กดเลือกคำตอบ (index คือตำแหน่งของตัวเลือกที่กด)
    const handleAnswer = async (index) => {
        if (isCorrect || wrongAnswers.includes(index)) return; // ถ้าตอบถูกไปแล้ว หรือเคยตอบผิดอันนี้ไปแล้ว ห้ามกดซ้ำ
        const correct = index === quiz.answer_index; // เช็คว่า Index ที่กด ตรงกับเฉลยไหม
        
        if (correct) {
            // กรณีตอบถูก
            setIsCorrect(true);
            setScore(prev => ({ ...prev, correct: 1 })); // ได้คะแนนถูก 1
            try {
                // ส่ง Notification ไปหาแฟนว่าเราทายถูกแล้ว (Optional feature)
                const partnerId = loverMapping[userId];
                await axios.post(`${API_URL}/api/memory-quiz/submit`, {
                    partner_id: partnerId,
                    question: quiz.question,
                    wrong_count: score.wrong
                });
            } catch (err) { console.error("Notification Error:", err); }
        } else {
            // กรณีตอบผิด
            setWrongAnswers([...wrongAnswers, index]); // บันทึก Index ที่ผิดไว้
            setScore(prev => ({ ...prev, wrong: prev.wrong + 1 })); // เพิ่มคะแนนผิด
        }
    };

    // ฟังก์ชันสลับการเลือก User ที่จะให้มองเห็น (Toggle)
    const toggleVisibleUser = (id) => {
        // ถ้ามี ID นี้อยู่แล้วให้เอาออก ถ้าไม่มีให้ใส่เพิ่ม
        setVisibleTo(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        // Container หลักของหน้า
        <div className="max-w-md mx-auto p-6 bg-white rounded-[2.5rem] shadow-xl mt-10 border-2 border-rose-50 font-bold text-slate-700">
            {/* หัวข้อ Title */}
            <h1 className="text-2xl font-black italic text-pink-500 text-center mb-6 uppercase tracking-tighter">❤️ Memory Quiz</h1>
            
            {/* เมนู Tab ด้านบน (Play / Add / List) */}
            <div className="flex mb-6 bg-slate-100 rounded-2xl p-1 text-[10px] font-black uppercase italic shadow-inner">
                <button onClick={() => setActiveTab('play')} className={`flex-1 py-3 rounded-xl transition-all ${activeTab === 'play' ? 'bg-white shadow-sm text-pink-500' : 'text-slate-400'}`}>เล่นควิซ</button>
                <button onClick={() => setActiveTab('add')} className={`flex-1 py-3 rounded-xl transition-all ${activeTab === 'add' ? 'bg-white shadow-sm text-pink-500' : 'text-slate-400'}`}>เพิ่มข้อมูล</button>
                <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-pink-500' : 'text-slate-400'}`}>คลังความจำ</button>
            </div>

            {/* ส่วนแสดงผล Tab: Play (เล่นเกม) */}
            {activeTab === 'play' && (
                <div className="text-center min-h-[400px] flex flex-col justify-center animate-in fade-in duration-500">
                    {/* ปุ่มเริ่มเล่น (แสดงเมื่อไม่มีคำถามและไม่โหลด) */}
                    {!quiz && !loading && (
                        <button onClick={fetchQuiz} className="bg-pink-500 text-white px-8 py-4 rounded-3xl font-black italic uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">เริ่มสุ่มคำถาม ✨</button>
                    )}
                    {/* ข้อความ Loading */}
                    {loading && <p className="text-slate-400 animate-pulse font-black italic uppercase text-xs">กามเทพกำลังนึกย้อนเวลา...</p>}
                    {/* แสดงคำถามและตัวเลือก (เมื่อมี Quiz) */}
                    {quiz && (
                        <div className="text-left">
                            {/* Header บอกคะแนน */}
                            <div className="flex justify-between items-center mb-4 px-1">
                                <p className="text-[10px] uppercase font-black text-rose-300 italic">ทายใจแฟนกัน ❤️</p>
                                <div className="flex gap-2 text-[10px] font-black italic uppercase">
                                    <span className="text-green-500">ถูก: {score.correct}</span>
                                    <span className="text-red-400">ผิด: {score.wrong}</span>
                                </div>
                            </div>
                            {/* คำถาม */}
                            <p className="text-lg font-black italic text-slate-700 mb-6 uppercase leading-tight">{quiz.question}</p>
                            {/* ตัวเลือกคำตอบ */}
                            <div className="space-y-3">
                                {quiz.options.map((opt, i) => {
                                    const isWrong = wrongAnswers.includes(i); // เช็คว่าเป็นข้อที่ตอบผิดไปแล้วไหม
                                    const isRight = isCorrect && i === quiz.answer_index; // เช็คว่าเป็นข้อถูก (เฉลย) และเราตอบถูกแล้วไหม
                                    return (
                                        <button key={i} onClick={() => handleAnswer(i)} disabled={isCorrect || isWrong} // Disable ถ้าจบเกมแล้วหรือตอบผิดข้อนี้แล้ว
                                            // ปรับ Style ตามสถานะ (ถูก/ผิด/ปกติ)
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
                            {/* เฉลย/Comment เมื่อตอบถูก */}
                            {isCorrect && (
                                <div className="mt-6 p-5 bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 rounded-[2rem] border-2 border-pink-100 font-black italic text-sm animate-bounce text-center shadow-inner">
                                    ✨ {quiz.sweet_comment} ✨
                                </div>
                            )}
                            {/* ปุ่มเล่นรอบต่อไป */}
                            <button onClick={fetchQuiz} className="mt-8 flex items-center justify-center gap-3 bg-rose-500 text-white py-4 rounded-2xl font-black italic uppercase text-xs w-full hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-100">
                                <RotateCcw size={18}/> สุ่มเรื่องราวใหม่เพื่อทดสอบรัก ↻
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ส่วนแสดงผล Tab: List (คลังความจำ) */}
            {activeTab === 'list' && (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-bottom-2">
                    {/* Loop แสดงรายการ Memory */}
                    {allMemories.length > 0 ? allMemories.map((m) => (
                        <div key={m.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 relative group">
                            <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{m.content}"</p>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[8px] font-black text-pink-400 uppercase bg-pink-50 px-2 py-1 rounded-lg"># {m.category}</span>
                                {/* ปุ่มลบ (แสดงเฉพาะของเรา) */}
                                {m.user_id === userId && (
                                    <button onClick={() => handleDelete(m.id)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                )}
                            </div>
                        </div>
                    )) : <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase italic">ยังไม่มีเรื่องราวที่มองเห็นได้...</p>}
                </div>
            )}

            {/* ส่วนแสดงผล Tab: Add (เพิ่มข้อมูล) */}
            {activeTab === 'add' && (
                <div className="space-y-5 animate-in slide-in-from-right-2">
                    {/* Textarea ใส่เนื้อหาความจำ */}
                    <textarea value={memory.content} onChange={(e) => setMemory({...memory, content: e.target.value})}
                        placeholder="เล่าความทรงจำที่นี่..." className="w-full p-5 border-2 border-slate-50 rounded-[2rem] h-40 focus:border-pink-200 outline-none text-xs font-bold italic text-slate-600 bg-slate-50" />
                    <div className="space-y-2 px-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">ใครมองเห็นความทรงจำนี้ได้บ้าง?</label>
                        {/* ปุ่มเลือก User ที่เห็นได้ */}
                        <div className="flex flex-wrap gap-2">
                            {users.map(u => (
                                <button key={u.id} type="button" onClick={() => toggleVisibleUser(u.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-bold transition-all border-2 ${visibleTo.includes(u.id) ? 'bg-pink-100 border-pink-400 text-pink-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                    {visibleTo.includes(u.id) ? <UserPlus size={12}/> : <UserMinus size={12}/>} {u.username}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* ปุ่มบันทึก */}
                    <button onClick={handleSaveMemory} className="w-full bg-pink-500 text-white py-4 rounded-3xl font-black italic uppercase shadow-lg active:scale-95 transition-all">เก็บลงกล่องหัวใจ 🔒</button>
                    {/* ข้อความสถานะการบันทึก */}
                    {message && <p className="text-center text-[10px] font-black text-pink-400 italic mt-2 animate-pulse uppercase tracking-widest">{message}</p>}
                </div>
            )}
        </div>
    );
};

export default MemoryQuizPage;