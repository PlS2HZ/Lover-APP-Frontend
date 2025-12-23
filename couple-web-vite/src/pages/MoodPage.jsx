import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, Clock, Trash2, UserPlus, UserMinus, Users } from 'lucide-react';

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
    
    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

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
                // ✅ Auto-tag แฟน
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

    const toggleVisibleUser = (targetUserId) => {
        setVisibleTo(prev => prev.includes(targetUserId) 
            ? prev.filter(id => id !== targetUserId) 
            : [...prev, targetUserId]
        );
    };

    const handleSave = async () => {
        if (!note.trim()) return alert("ระบุความรู้สึกนิดนึงนะ ✨");
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/save-mood`, {
                user_id: userId,
                mood_emoji: selectedMood.emoji,
                mood_text: note,
                // ✅ แท็กตัวเองและคนที่เลือก
                visible_to: [userId, ...visibleTo]
            });
            alert('ส่งความรู้สึกให้แฟนแล้ว! ❤️');
            setNote('');
            fetchMoodHistory();
        } catch (err) { 
            console.log("Error handleSave", err);
            alert('บันทึกไม่สำเร็จ'); } 
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("ลบความทรงจำนี้ใช่ไหม?")) return;
        try {
            await axios.delete(`${API_URL}/api/mood/delete?id=${id}`);
            fetchMoodHistory();
        } catch (err) { 
            console.log("Error handleDelete", err);
            alert("ลบไม่สำเร็จ"); }
    };

    return (
        <div className="min-h-screen bg-rose-50/30 p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6">
                <header className="text-center">
                    <h1 className="text-3xl font-black italic uppercase">Our Daily Mood</h1>
                    <p className="text-[10px] text-rose-400 uppercase tracking-widest">วันนี้รู้สึกอย่างไรบ้าง?</p>
                </header>

                <div className="grid grid-cols-3 gap-3">
                    {moods.map((m) => (
                        <button key={m.label} onClick={() => setSelectedMood(m)}
                            className={`p-5 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-2 ${selectedMood.label === m.label ? 'bg-white border-rose-400 shadow-xl' : 'bg-white/50 border-transparent text-slate-400'}`}>
                            <span className="text-4xl">{m.emoji}</span>
                            <span className="text-[9px] font-black uppercase">{m.label}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-2 border-rose-100/50">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="บอกความรู้สึกให้แฟนรู้หน่อย..."
                        className="w-full h-24 text-sm focus:outline-none resize-none bg-transparent font-bold" />
                </div>

                {/* ✅ เพิ่มปุ่มเลือกแฟน */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1">
                        <Users size={12}/> ใครมองเห็นกิจกรรมนี้ได้บ้าง? (แฟน)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {users.map(u => (
                            <button key={u.id} type="button" onClick={() => toggleVisibleUser(u.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${visibleTo.includes(u.id) ? 'bg-rose-100 border-rose-400 text-rose-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                {visibleTo.includes(u.id) ? <UserPlus size={14}/> : <UserMinus size={14}/>} {u.username}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase italic flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                    {loading ? 'กำลังส่ง...' : <><Heart size={18} fill="currentColor"/> บันทึกอารมณ์ ✨</>}
                </button>

                <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 ml-2"><Clock size={14}/> ประวัติความรู้สึก</h3>
                    <div className="space-y-3">
                        {moodHistory.map((item) => (
                            <div key={item.id} className="bg-white/70 backdrop-blur-sm p-4 rounded-[2rem] border-2 border-white flex items-center gap-4 shadow-sm">
                                <div className="text-3xl bg-rose-50 w-14 h-14 rounded-2xl flex items-center justify-center">{item.mood_emoji}</div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 italic">{new Date(item.created_at).toLocaleString('th-TH')}</p>
                                    <p className="text-xs font-bold">{item.mood_text}</p>
                                </div>
                                {item.user_id === userId && (
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MoodPage;