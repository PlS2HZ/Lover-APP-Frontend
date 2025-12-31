/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Heart, Clock, Trash2, Users, Calendar as CalendarIcon, 
    Sparkles, Camera, Image as ImageIcon, Loader2, X 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import MoodCalendar from './MoodCalendar';
import MoodInsight from './MoodInsight';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const moods = [
    { emoji: '😊', label: 'มีความสุข' }, { emoji: '🥰', label: 'คลั่งรัก' },
    { emoji: '😴', label: 'ง่วงนอน' }, { emoji: '😤', label: 'เหนื่อยจัง' },
    { emoji: '😋', label: 'หิวมาก' }, { emoji: '😔', label: 'ซึมเศร้า' },
];

const MoodPage = () => {
    const [selectedMood, setSelectedMood] = useState(moods[0]);
    const [note, setNote] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [moodHistory, setMoodHistory] = useState([]);
    const [users, setUsers] = useState([]);
    const [visibleTo, setVisibleTo] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showInsight, setShowInsight] = useState(false);
    
    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    useEffect(() => { fetchMoodHistory(); fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            const otherUsers = res.data.filter(u => u.id !== userId);
            setUsers(otherUsers);
            // Default ให้ส่งหาทุกคนที่เป็นเพื่อน/แฟน
            setVisibleTo(otherUsers.map(u => u.id));
        } catch (err) { console.error(err); }
    };

    const fetchMoodHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/get-moods`);
            setMoodHistory(res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setUploading(true);
            const fileName = `mood-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            setImageUrl(data.publicUrl);
        } catch (error) { alert('อัปโหลดไม่สำเร็จ'); } finally { setUploading(false); }
    };

    const handleSave = async () => {
        if (!note.trim()) return alert("ระบุรายละเอียดหน่อยนะ ✨");
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/save-mood`, {
                user_id: userId, mood_emoji: selectedMood.emoji, mood_name: selectedMood.label,
                mood_text: note, image_url: imageUrl, visible_to: [userId, ...visibleTo]
            });
            setNote(''); setImageUrl(''); fetchMoodHistory();
        } catch (err) { alert('บันทึกไม่สำเร็จ'); } finally { setLoading(false); }
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
                        <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black">Emotions & Moments</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowInsight(true)} className="p-3 bg-white shadow-md rounded-2xl text-purple-500 border border-purple-50"><Sparkles size={20} /></button>
                        <button onClick={() => setShowCalendar(true)} className="p-3 bg-white shadow-md rounded-2xl text-rose-500 border border-rose-50"><CalendarIcon size={20} /></button>
                    </div>
                </header>

                <div className="grid grid-cols-3 gap-3">
                    {moods.map((m) => (
                        <button key={m.label} onClick={() => setSelectedMood(m)}
                            className={`p-5 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-2 ${selectedMood.label === m.label ? 'bg-white border-rose-400 shadow-xl scale-105' : 'bg-white/50 border-transparent text-slate-400'}`}>
                            <span className="text-4xl">{m.emoji}</span>
                            <span className="text-[9px] font-black uppercase">{m.label}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-2 border-rose-100/50 space-y-4">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดความรู้สึกวันนี้..." className="w-full h-20 text-sm focus:outline-none resize-none bg-transparent font-bold" />
                    <div className="relative aspect-video bg-slate-50 rounded-3xl border-2 border-dashed border-rose-100 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                            <>
                                <img src={imageUrl} className="w-full h-full object-cover" alt="preview" />
                                <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full"><X size={14}/></button>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2">
                                {uploading ? <Loader2 className="animate-spin text-rose-300" /> : <Camera className="text-rose-200" size={32} />}
                                <span className="text-[10px] font-black text-rose-300 uppercase">เพิ่มรูปโมเม้นต์</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <label className="text-[9px] font-black text-slate-300 uppercase w-full">แชร์ให้ใครบ้าง:</label>
                        {users.map(u => (
                            <button key={u.id} onClick={() => setVisibleTo(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black border-2 transition-all ${visibleTo.includes(u.id) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                {u.username}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={handleSave} disabled={loading || uploading} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    {loading ? 'กำลังบันทึก...' : <><Heart size={18} fill="currentColor"/> บันทึก Mood & Moment ✨</>}
                </button>

                {/* ✅ ประวัติล่าสุด: แยกฝั่ง ซ้าย (คนอื่น) - ขวา (ฉัน) */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 ml-2"><Clock size={14}/> ประวัติล่าสุด</h3>
                    <div className="space-y-4">
                        {moodHistory.slice(0, 20).map((item) => {
                            const isMine = item.user_id === userId;
                            return (
                                <div key={item.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] bg-white p-4 rounded-[2rem] border-2 shadow-sm flex flex-col gap-3 ${isMine ? 'border-rose-200 rounded-tr-none' : 'border-slate-100 rounded-tl-none'}`}>
                                        <div className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`text-2xl w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isMine ? 'bg-rose-50' : 'bg-blue-50'}`}>
                                                {item.mood_emoji}
                                            </div>
                                            <div className={`flex-1 min-w-0 ${isMine ? 'text-right' : 'text-left'}`}>
                                                <p className="text-[9px] font-black text-slate-400">
                                                    {isMine ? 'ฉัน' : 'คนอื่น'} • {new Date(item.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 break-words">{item.mood_text}</p>
                                            </div>
                                            {isMine && (
                                                <button onClick={() => handleDelete(item.id)} className="p-1 text-rose-200 hover:text-rose-400 self-center">
                                                    <Trash2 size={14}/>
                                                </button>
                                            )}
                                        </div>
                                        {item.image_url && (
                                            <img src={item.image_url} className="w-full h-40 object-cover rounded-2xl border border-slate-50 shadow-inner" alt="moment" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {showCalendar && <MoodCalendar moodHistory={moodHistory} onClose={() => setShowCalendar(false)} />}
            {showInsight && <MoodInsight onClose={() => setShowInsight(false)} API_URL={API_URL} userId={userId} />}
        </div>
    );
};
export default MoodPage;