/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks: useState (เก็บค่า), useEffect (ทำงานเมื่อโหลดหน้า)
import axios from 'axios'; // นำเข้า axios สำหรับยิง API ไปยัง Backend
import { Heart, Clock, Trash2, User, Calendar as CalendarIcon, Sparkles, Camera, Loader2, X } from 'lucide-react'; // นำเข้าไอคอนต่างๆ
import { createClient } from '@supabase/supabase-js'; // นำเข้าตัวเชื่อมต่อ Supabase
import MoodCalendar from './MoodCalendar'; // นำเข้า Component ปฏิทิน
import MoodInsight from './MoodInsight'; // นำเข้า Component กราฟสรุปผล

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
    // State: เก็บ Object จับคู่ ID กับ Username (เช่น { '1': 'UserA' }) เพื่อให้แสดงชื่อได้ไวๆ ไม่ต้อง loop หา
    const [userMap, setUserMap] = useState({}); // ✅ Map ID เป็น Username
    // State: เก็บ Array ID ของคนที่มีสิทธิ์เห็นโพสต์นี้
    const [visibleTo, setVisibleTo] = useState([]);
    // State: ควบคุมการแสดง Modal ปฏิทิน (True = แสดง)
    const [showCalendar, setShowCalendar] = useState(false);
    // State: ควบคุมการแสดง Modal Insight (True = แสดง)
    const [showInsight, setShowInsight] = useState(false);
    
    // ดึง user_id ของเราเองที่เก็บไว้ใน LocalStorage ตอน Login
    const userId = localStorage.getItem('user_id');
    // กำหนด URL ของ API Backend (ถ้ารันในเครื่องใช้ localhost, ถ้าขึ้นเว็บจริงใช้ onrender)
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    // useEffect: ทำงานครั้งแรกครั้งเดียวเมื่อเปิดหน้านี้ (เพราะ Dependency Array [] ว่างเปล่า)
    // สั่งให้ดึงข้อมูลประวัติอารมณ์ (fetchMoodHistory) และข้อมูล User (fetchUsers) ทันที
    useEffect(() => { fetchMoodHistory(); fetchUsers(); }, []);

    // ฟังก์ชันดึงข้อมูล User ทั้งหมดจาก API
    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`); // ยิง Request ไปขอข้อมูล User
            const otherUsers = res.data.filter(u => u.id !== userId); // กรองเอาเฉพาะ User ที่ไม่ใช่เรา
            setUsers(otherUsers); // บันทึกลง State
            
            // สร้าง Map จับคู่ ID -> Username
            const map = {};
            res.data.forEach(u => map[u.id] = u.username);
            setUserMap(map); // บันทึกลง State userMap
            
            // กำหนดให้ Default ของโพสต์ใหม่ คือให้ User คนอื่นเห็นได้ทั้งหมด
            setVisibleTo(otherUsers.map(u => u.id));
        } catch (err) { console.error(err); } // แสดง Error ถ้ามีปัญหา
    };

    // ฟังก์ชันดึงประวัติอารมณ์ทั้งหมดจาก API
    const fetchMoodHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/get-moods`); // ยิง Request ไปขอข้อมูล Moods
            setMoodHistory(res.data || []); // บันทึกลง State (ถ้าไม่มีข้อมูลให้ใส่ Array ว่าง)
        } catch (err) { console.error(err); }
    };

    // ฟังก์ชันจัดการเมื่อเลือกไฟล์รูปภาพ
    const handleImageUpload = async (e) => {
        const file = e.target.files[0]; // ดึงไฟล์แรกจาก Input
        if (!file) return; // ถ้าไม่ได้เลือกไฟล์ ให้จบการทำงาน
        try {
            setUploading(true); // เริ่มสถานะ Uploading (ไอคอนหมุน)
            // ตั้งชื่อไฟล์ใหม่ให้ไม่ซ้ำ: mood-{ไอดีเรา}-{เวลาปัจจุบัน}.นามสกุลไฟล์
            const fileName = `mood-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
            
            // อัปโหลดไฟล์ไปยัง Supabase Storage ใน Bucket ชื่อ 'profiles'
            const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file);
            if (uploadError) throw uploadError; // ถ้า Error ให้โยนไปที่ catch
            
            // ดึง URL รูปที่เป็นสาธารณะ (Public URL) มาใช้งาน
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            setImageUrl(data.publicUrl); // เก็บ URL ลง State เพื่อเตรียมบันทึก
        } catch (error) { alert('อัปโหลดไม่สำเร็จ'); } finally { setUploading(false); } // จบการทำงาน ปิดสถานะ Uploading
    };

    // ฟังก์ชันบันทึกข้อมูลเมื่อกดปุ่ม Save
    const handleSave = async () => {
        if (!note.trim()) return alert("ระบุรายละเอียดหน่อยนะ ✨"); // เช็คว่าพิมพ์ข้อความหรือยัง ถ้ายังให้แจ้งเตือน
        setLoading(true); // เริ่มสถานะ Loading (ปิดปุ่มกด)
        try {
            // ส่งข้อมูลไปยัง API Backend เพื่อบันทึกลง Database
            await axios.post(`${API_URL}/api/save-mood`, {
                user_id: userId, 
                mood_emoji: selectedMood.emoji, 
                mood_name: selectedMood.label,
                mood_text: note, 
                image_url: imageUrl, 
                visible_to: [userId, ...visibleTo] // ส่ง Array ของคนที่มีสิทธิ์เห็นไปด้วย
            });
            // เมื่อบันทึกสำเร็จ: เคลียร์ค่าในฟอร์ม และดึงข้อมูลประวัติใหม่มาแสดงทันที
            setNote(''); setImageUrl(''); fetchMoodHistory();
        } catch (err) { alert('บันทึกไม่สำเร็จ'); } finally { setLoading(false); } // จบการทำงาน ปิดสถานะ Loading
    };

    return (
        <div className="min-h-screen bg-rose-50/30 p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6 text-center">
                {/* ส่วน Header ด้านบนสุด */}
                <header className="flex justify-between items-center">
                    <div className="flex-1 text-center pl-10">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Our Mood</h1>
                        <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black text-center">Emotions & Moments</p>
                    </div>
                    {/* ปุ่มเปิด Modal Insight (Sparkles) และ Calendar */}
                    <div className="flex gap-2">
                        <button onClick={() => setShowInsight(true)} className="p-3 bg-white shadow-md rounded-2xl text-purple-500 border border-purple-50"><Sparkles size={20} /></button>
                        <button onClick={() => setShowCalendar(true)} className="p-3 bg-white shadow-md rounded-2xl text-rose-500 border border-rose-50"><CalendarIcon size={20} /></button>
                    </div>
                </header>

                {/* Grid แสดงปุ่มเลือกอารมณ์ 6 ช่อง */}
                <div className="grid grid-cols-3 gap-3">
                    {moods.map((m) => (
                        <button key={m.label} onClick={() => setSelectedMood(m)}
                            // เช็คเงื่อนไข: ถ้าอารมณ์นี้ถูกเลือกอยู่ (selectedMood) ให้ใส่พื้นหลังขาวและเงา ถ้าไม่เลือกให้จางๆ
                            className={`p-5 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-2 ${selectedMood.label === m.label ? 'bg-white border-rose-400 shadow-xl scale-105' : 'bg-white/50 border-transparent text-slate-400'}`}>
                            <span className="text-4xl">{m.emoji}</span>
                            <span className="text-[9px] font-black uppercase">{m.label}</span>
                        </button>
                    ))}
                </div>

                {/* กล่องใส่ข้อความและรูปภาพ */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-2 border-rose-100/50 space-y-4">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดวันนี้..." className="w-full h-20 text-sm focus:outline-none resize-none bg-transparent font-bold" />
                    
                    {/* พื้นที่แสดงรูปภาพ หรือ ปุ่มอัปโหลด */}
                    <div className="relative aspect-video bg-slate-50 rounded-3xl border-2 border-dashed border-rose-100 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                            // ถ้ามี URL รูปภาพแล้ว ให้แสดงรูป พร้อมปุ่มลบ (X)
                            <>
                                <img src={imageUrl} className="w-full h-full object-cover" alt="" />
                                <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full"><X size={14}/></button>
                            </>
                        ) : (
                            // ถ้ายังไม่มีรูป ให้แสดงปุ่ม Upload (Input type file ซ่อนอยู่ ใช้ label ครอบ)
                            <label className="cursor-pointer flex flex-col items-center gap-2">
                                {uploading ? <Loader2 className="animate-spin text-rose-300" /> : <Camera className="text-rose-200" size={32} />}
                                <span className="text-[10px] font-black text-rose-300 uppercase">เพิ่มรูปโมเม้นต์</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>

                {/* ปุ่มบันทึกข้อมูล (Disable เมื่อกำลัง Load หรือ Upload) */}
                <button onClick={handleSave} disabled={loading || uploading} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    {loading ? 'กำลังบันทึก...' : <><Heart size={18} fill="currentColor"/> บันทึก Mood & Moment ✨</>}
                </button>

                {/* ส่วนแสดงประวัติล่าสุด (Feed) */}
                <div className="space-y-4 pt-4 text-left">
                    <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 ml-2"><Clock size={14}/> ประวัติล่าสุด</h3>
                    <div className="space-y-4">
                        {/* วนลูปแสดงข้อมูล 20 รายการแรก */}
                        {moodHistory.slice(0, 20).map((item) => {
                            const isMine = item.user_id === userId; // เช็คว่าเป็นโพสต์ของฉันหรือไม่
                            return (
                                // จัดตำแหน่ง: ถ้าเป็นของฉันชิดขวา (justify-end) คนอื่นชิดซ้าย (justify-start)
                                <div key={item.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] bg-white p-4 rounded-[2rem] border-2 shadow-sm flex flex-col gap-3 ${isMine ? 'border-rose-200 rounded-tr-none' : 'border-slate-100 rounded-tl-none'}`}>
                                        <div className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* แสดง Emoji */}
                                            <div className={`text-2xl w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isMine ? 'bg-rose-50' : 'bg-blue-50'}`}>
                                                {item.mood_emoji}
                                            </div>
                                            {/* แสดงชื่อและเวลา */}
                                            <div className={`flex-1 min-w-0 ${isMine ? 'text-right' : 'text-left'}`}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {/* ใช้ userMap แปลง ID เป็นชื่อ ถ้าไม่มีชื่อให้ใช้ "ฉัน" หรือ ID เดิม */}
                                                    {isMine ? 'ฉัน' : (userMap[item.user_id] || item.user_id)} • {new Date(item.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 break-words">{item.mood_text}</p>
                                            </div>
                                            {/* ปุ่มลบโพสต์ (แสดงเฉพาะของตัวเอง) */}
                                            {isMine && <button onClick={() => axios.delete(`${API_URL}/api/mood/delete?id=${item.id}`).then(fetchMoodHistory)} className="p-1 text-rose-200 hover:text-rose-400 self-center"><Trash2 size={14}/></button>}
                                        </div>
                                        {/* แสดงรูปภาพถ้ามี */}
                                        {item.image_url && <img src={item.image_url} className="w-full h-40 object-cover rounded-2xl border border-slate-50 shadow-inner" alt="" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* แสดง Modal ปฏิทินและ Insight เมื่อ State เป็น True */}
            {showCalendar && <MoodCalendar moodHistory={moodHistory} onClose={() => setShowCalendar(false)} />}
            {showInsight && <MoodInsight onClose={() => setShowInsight(false)} API_URL={API_URL} userId={userId} />}
        </div>
    );
};
export default MoodPage;