/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks: useState (เก็บค่า), useEffect (ทำงานเมื่อโหลดหน้า)
import axios from 'axios'; // นำเข้า axios สำหรับยิง API ไปยัง Backend
import { Heart, Clock, Trash2, User, Calendar as CalendarIcon, Sparkles, Camera, Loader2, X } from 'lucide-react'; // นำเข้าไอคอนต่างๆ เพิ่ม X สำหรับปุ่มลบ
import { createClient } from '@supabase/supabase-js'; // นำเข้าตัวเชื่อมต่อ Supabase
import MoodCalendar from './MoodCalendar'; // นำเข้า Component ปฏิทิน
import MoodInsight from './MoodInsight'; // นำเข้า Component กราฟสรุปผล
import imageCompression from 'browser-image-compression'; // นำเข้า Library สำหรับบีบอัดรูปภาพฝั่ง Client

// สร้างการเชื่อมต่อกับ Supabase โดยใช้ URL และ Key จากไฟล์ environment (.env)
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

// กำหนดรายการอารมณ์ที่มีให้เลือก เป็น Array ของ Object (เก็บ Emoji และข้อความ)
const moods = [
    { emoji: '😊', label: 'มีความสุข' }, { emoji: '🥰', label: 'คลั่งรัก' },
    { emoji: '😴', label: 'ง่วงนอน' }, { emoji: '😤', label: 'เหนื่อยจัง' },
    { emoji: '😋', label: 'หิวมาก' }, { emoji: '😔', label: 'ซึมเศร้า' },
];

const MoodPage = () => {
    // State: เก็บอารมณ์ที่ถูกเลือกปัจจุบัน (ค่าเริ่มต้นคือตัวแรกของ array moods)
    const [selectedMood, setSelectedMood] = useState(moods[0]);
    // State: เก็บข้อความ Note ที่ผู้ใช้พิมพ์
    const [note, setNote] = useState('');
    // State: เก็บ URL ของรูปภาพหลังจากอัปโหลดขึ้น Supabase เสร็จแล้ว
    const [imageUrl, setImageUrl] = useState('');
    // State: สถานะ Loading ขณะกดปุ่มบันทึก (เพื่อปิดปุ่มไม่ให้กดซ้ำ)
    const [loading, setLoading] = useState(false);
    // State: สถานะ Uploading ขณะกำลังอัปโหลดรูปภาพ (เพื่อแสดง icon หมุนๆ)
    const [uploading, setUploading] = useState(false);
    // State: เก็บ Array ประวัติอารมณ์ทั้งหมดที่ดึงมาจาก Database
    const [moodHistory, setMoodHistory] = useState([]);
    // State: เก็บรายชื่อ User ทั้งหมด (ยกเว้นตัวเอง)
    const [users, setUsers] = useState([]);
    // State: เก็บ Object จับคู่ ID กับ Username เพื่อให้แสดงชื่อได้ไวๆ
    const [userMap, setUserMap] = useState({}); 
    // State: เก็บ Array ID ของคนที่มีสิทธิ์เห็นโพสต์นี้
    const [visibleTo, setVisibleTo] = useState([]);
    // State: ควบคุมการแสดง Modal ปฏิทิน (True = แสดง)
    const [showCalendar, setShowCalendar] = useState(false);
    // State: ควบคุมการแสดง Modal Insight (True = แสดง)
    const [showInsight, setShowInsight] = useState(false);
    
    // ดึง user_id ของเราเองที่เก็บไว้ใน LocalStorage
    const userId = localStorage.getItem('user_id');
    // กำหนด URL ของ API Backend
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    // useEffect: ดึงข้อมูลประวัติอารมณ์และรายชื่อ User ทันทีที่เข้าหน้า
    useEffect(() => { fetchMoodHistory(); fetchUsers(); }, []);

    // ฟังก์ชันดึงข้อมูล User ทั้งหมดจาก API
    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`); 
            const otherUsers = res.data.filter(u => u.id !== userId); 
            setUsers(otherUsers); 
            const map = {};
            res.data.forEach(u => map[u.id] = u.username);
            setUserMap(map); 
            setVisibleTo(otherUsers.map(u => u.id));
        } catch (err) { console.error(err); } 
    };

    // ฟังก์ชันดึงประวัติอารมณ์ทั้งหมดจาก API
    const fetchMoodHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/get-moods`); 
            setMoodHistory(res.data || []); 
        } catch (err) { console.error(err); }
    };

    // ฟังก์ชันจัดการเมื่อเลือกไฟล์รูปภาพ (พร้อมระบบบีบอัดและป้องกันชื่อไฟล์ Error)
    const handleImageUpload = async (e) => {
        const file = e.target.files[0]; 
        if (!file) return; 
        try {
            setUploading(true); 

            // --- ส่วนการบีบอัดรูปภาพ ---
            const options = {
                maxSizeMB: 0.1, // บีบอัดเหลือสูงสุดไม่เกิน 100KB
                maxWidthOrHeight: 1280, 
                useWebWorker: true 
            };
            const compressedFile = await imageCompression(file, options);
            // -----------------------

            // แก้ไข: ตั้งชื่อไฟล์ใหม่โดยใช้ Timestamp อย่างเดียวเพื่อป้องกัน Invalid Key จากช่องว่าง
            const fileExt = file.name.split('.').pop();
            const fileName = `mood-${userId}-${Date.now()}.${fileExt}`;
            
            // อัปโหลดไฟล์ที่บีบอัดแล้ว
            const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
            if (uploadError) throw uploadError; 
            
            // ดึง URL สาธารณะมาใช้งาน
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            setImageUrl(data.publicUrl); 
        } catch (error) { 
            console.error(error);
            alert('อัปโหลดไม่สำเร็จ'); 
        } finally { 
            setUploading(false); 
        } 
    };

    // ✅ ฟังก์ชันสำหรับลบรูปภาพที่อัปโหลดไว้ก่อนบันทึก
    const handleRemoveImage = () => {
        setImageUrl(''); // ล้างค่า URL รูปภาพใน State
    };

    // ฟังก์ชันบันทึกข้อมูลเมื่อกดปุ่ม Save
    const handleSave = async () => {
        if (!note.trim()) return alert("ระบุรายละเอียดหน่อยนะ ✨"); 
        setLoading(true); 
        try {
            await axios.post(`${API_URL}/api/save-mood`, {
                user_id: userId, 
                mood_emoji: selectedMood.emoji, 
                mood_name: selectedMood.label,
                mood_text: note, 
                image_url: imageUrl, 
                visible_to: [userId, ...visibleTo] 
            });
            setNote(''); setImageUrl(''); fetchMoodHistory();
        } catch (err) { alert('บันทึกไม่สำเร็จ'); } finally { setLoading(false); } 
    };

    return (
        <div className="min-h-screen bg-rose-50/30 p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6 text-center">
                <header className="flex justify-between items-center">
                    <div className="flex-1 text-center pl-10">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Our Mood</h1>
                        <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black text-center">Emotions & Moments</p>
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
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดวันนี้..." className="w-full h-20 text-sm focus:outline-none resize-none bg-transparent font-bold" />
                    
                    <div className="relative aspect-video bg-slate-50 rounded-3xl border-2 border-dashed border-rose-100 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                            <>
                                <img src={imageUrl} className="w-full h-full object-cover" alt="" />
                                {/* ✅ ปุ่มลบรูปภาพ (X) */}
                                <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all"><X size={16}/></button>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2">
                                {uploading ? <Loader2 className="animate-spin text-rose-300" /> : <Camera className="text-rose-200" size={32} />}
                                <span className="text-[10px] font-black text-rose-300 uppercase">เพิ่มรูปโมเม้นต์</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>

                <button onClick={handleSave} disabled={loading || uploading} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    {loading ? 'กำลังบันทึก...' : <><Heart size={18} fill="currentColor"/> บันทึก Mood & Moment ✨</>}
                </button>

                <div className="space-y-4 pt-4 text-left">
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
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {isMine ? 'ฉัน' : (userMap[item.user_id] || item.user_id)} • {new Date(item.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 break-words">{item.mood_text}</p>
                                            </div>
                                            {isMine && <button onClick={() => axios.delete(`${API_URL}/api/mood/delete?id=${item.id}`).then(fetchMoodHistory)} className="p-1 text-rose-200 hover:text-rose-400 self-center"><Trash2 size={14}/></button>}
                                        </div>
                                        {item.image_url && <img src={item.image_url} className="w-full h-40 object-cover rounded-2xl border border-slate-50 shadow-inner" alt="" />}
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