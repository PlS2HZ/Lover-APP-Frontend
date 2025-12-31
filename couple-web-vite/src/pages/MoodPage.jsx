/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Heart, Clock, Trash2, UserPlus, UserMinus, 
    Users, MessageCircle, Calendar as CalendarIcon, Sparkles 
} from 'lucide-react';
// ✅ นำเข้าคอมโพเนนต์ใหม่ที่สร้างแยกไฟล์ไว้
import MoodCalendar from './MoodCalendar';
import MoodInsight from './MoodInsight';

const moods = [
    { emoji: '😊', label: 'มีความสุข' },
    { emoji: '🥰', label: 'คลั่งรัก' },
    { emoji: '😴', label: 'ง่วงนอน' },
    { emoji: '😤', label: 'เหนื่อยจัง' },
    { emoji: '😋', label: 'หิวมาก' },
    { emoji: '😔', label: 'ซึมเศร้า' },
];

const MoodPage = () => {
    const MY_ID = "d8eb372a-d196-44fc-a73b-1809f27e0a56";
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e";
    const loverMapping = { [MY_ID]: LOVER_ID, [LOVER_ID]: MY_ID };

    const [selectedMood, setSelectedMood] = useState(moods[0]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [moodHistory, setMoodHistory] = useState([]);
    const [users, setUsers] = useState([]);
    const [visibleTo, setVisibleTo] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showInsight, setShowInsight] = useState(false);
    
    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' 
        : 'https://lover-app-jjoe.onrender.com';

    useEffect(() => {
        fetchMoodHistory();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            if (Array.isArray(res.data)) {
                const otherUsers = res.data.filter(u => u.id !== userId);
                setUsers(otherUsers);
                const myPartnerId = loverMapping[userId];
                if (myPartnerId && otherUsers.some(u => u.id === myPartnerId)) {
                    setVisibleTo([myPartnerId]);
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchMoodHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/get-moods?user_id=${userId}`);
            setMoodHistory(res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        if (!note.trim()) return alert("ระบุความรู้สึกนิดนึงนะ ✨");
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/save-mood`, {
                user_id: userId,
                mood_emoji: selectedMood.emoji,
                mood_name: selectedMood.label,
                mood_text: note,
                visible_to: [userId, ...visibleTo]
            });
            setNote('');
            fetchMoodHistory();
        } catch (err) { alert('บันทึกไม่สำเร็จ'); } 
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("ลบความทรงจำนี้ใช่ไหม?")) return;
        try {
            await axios.delete(`${API_URL}/api/mood/delete?id=${id}`);
            fetchMoodHistory();
        } catch (err) { alert("ลบไม่สำเร็จ"); }
    };

    return (
        <div className="min-h-screen bg-rose-50/30 p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6">
                <header className="flex justify-between items-center">
                    <div className="flex-1 text-center pl-10">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Our Mood</h1>
                        <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black">Emotions Tracker</p>
                    </div>
                    {/* ✅ ปุ่มเปิดปฏิทินและ AI */}
                    <div className="flex gap-2">
                        <button onClick={() => setShowInsight(true)} className="p-3 bg-white shadow-md rounded-2xl text-purple-500 active:scale-90 transition-all border border-purple-50">
                            <Sparkles size={20} />
                        </button>
                        <button onClick={() => setShowCalendar(true)} className="p-3 bg-white shadow-md rounded-2xl text-rose-500 active:scale-90 transition-all border border-rose-50">
                            <CalendarIcon size={20} />
                        </button>
                    </div>
                </header>

                {/* Mood Selection & Note Input (เหมือนเดิมของนาย) */}
                <div className="grid grid-cols-3 gap-3">
                    {moods.map((m) => (
                        <button key={m.label} onClick={() => setSelectedMood(m)}
                            className={`p-5 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-2 ${selectedMood.label === m.label ? 'bg-white border-rose-400 shadow-xl scale-105' : 'bg-white/50 border-transparent text-slate-400'}`}>
                            <span className="text-4xl">{m.emoji}</span>
                            <span className="text-[9px] font-black uppercase">{m.label}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-2 border-rose-100/50">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="บอกความรู้สึกให้แฟนรู้หน่อย..."
                        className="w-full h-24 text-sm focus:outline-none resize-none bg-transparent font-bold" />
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase italic flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                    {loading ? 'กำลังส่ง...' : <><Heart size={18} fill="currentColor"/> บันทึกอารมณ์ ✨</>}
                </button>

                {/* History List */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 ml-2"><Clock size={14}/> ประวัติความรู้สึก</h3>
                    <div className="space-y-3">
                        {moodHistory.slice(0, 10).map((item) => {
                            const isMine = item.user_id === userId;
                            return (
                                <div key={item.id} className={`bg-white/70 backdrop-blur-sm p-4 rounded-[2rem] border-2 flex items-center gap-4 shadow-sm ${isMine ? 'border-white' : 'border-rose-100 ml-4'}`}>
                                    <div className={`text-3xl w-14 h-14 rounded-2xl flex items-center justify-center ${isMine ? 'bg-rose-50' : 'bg-blue-50'}`}>{item.mood_emoji}</div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400">{isMine ? 'ฉัน' : 'แฟน'} • {new Date(item.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-xs font-bold text-slate-600">{item.mood_text}</p>
                                    </div>
                                    {isMine && (
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-200 hover:text-rose-500"><Trash2 size={16}/></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ✅ Modals สำหรับฟีเจอร์ใหม่ */}
            {showCalendar && <MoodCalendar moodHistory={moodHistory} onClose={() => setShowCalendar(false)} />}
            {showInsight && <MoodInsight moodHistory={moodHistory} onClose={() => setShowInsight(false)} API_URL={API_URL} userId={userId} />}
        </div>
    );
};

export default MoodPage;