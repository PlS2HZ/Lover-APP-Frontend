import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks
import axios from 'axios'; // นำเข้า axios สำหรับยิง API
import { Send, Clock, User, Tag, Image as ImageIcon, Loader2 } from 'lucide-react'; // นำเข้าไอคอนต่างๆ
import { supabase } from '../supabaseClient'; // ตัวเชื่อมต่อ Supabase

const CreateRequestPage = () => {
    // ดึงชื่อผู้ใช้และ ID จาก LocalStorage (ถ้าไม่มีชื่อให้ใส่ค่า Default)
    const userName = localStorage.getItem('username') || 'ไม่พบข้อมูลผู้ใช้';
    const userId = localStorage.getItem('user_id');
    
    // State: เก็บรายชื่อ User ทั้งหมดที่ดึงมาจาก API
    const [allUsers, setAllUsers] = useState([]);
    // State: เก็บรายชื่อ User ที่กรองแล้วจากการค้นหา
    const [filteredUsers, setFilteredUsers] = useState([]);
    // State: เก็บคำค้นหาในช่อง "ถึงใคร"
    const [searchTerm, setSearchTerm] = useState('');
    // State: สถานะการอัปโหลดรูปภาพ (True = กำลังอัปโหลด)
    const [uploading, setUploading] = useState(false);

    // State: เก็บข้อมูลฟอร์มทั้งหมด
    const [formData, setFormData] = useState({
        header: 'เที่ยว', // หมวดหมู่ Default
        title: '', // รายละเอียด
        duration: '', // ระยะเวลา (คำนวณอัตโนมัติ)
        receiver_username: '', // ชื่อผู้รับ
        time_start: '', // เวลาเริ่ม
        time_end: '', // เวลาจบ
        image_url: '' // URL รูปภาพ (ถ้ามี)
    });

    // ตัวเลือกหมวดหมู่กิจกรรม
    const categories = ['เที่ยว', 'ออกกำลังกาย', 'เล่นเกม', 'เล่นกีฬา', 'ดูหนัง', 'กินข้าว'];
    
    // กำหนด API URL ตาม Environment
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' 
        : 'https://lover-app-jjoe.onrender.com';
         // ✅ ระบุไปเลยไม่ต้องเช็ค localhost

    // Effect: ดึงรายชื่อ User ทั้งหมดเมื่อเข้าหน้าเว็บ
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/users`);
                // ถ้าได้ข้อมูลเป็น Array ให้เก็บลง State ถ้าไม่ใช่ให้เป็น Array ว่าง
                setAllUsers(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Fetch users error:", err);
            }
        };
        fetchUsers();
    }, [API_URL]);

    // Effect: คำนวณระยะเวลา (Duration) อัตโนมัติเมื่อเวลาเริ่มหรือเวลาจบเปลี่ยน
    useEffect(() => {
        if (formData.time_start && formData.time_end) {
            const start = new Date(formData.time_start);
            const end = new Date(formData.time_end);
            const diff = end - start; // หาผลต่างเวลา (ms)

            if (diff > 0) {
                // แปลงหน่วยเวลา
                const mins = Math.floor((diff / 1000) / 60);
                const hours = Math.floor(mins / 60);
                const days = Math.floor(hours / 24);

                // สร้าง String แสดงผล (เช่น 1 วัน 2 ชม.)
                let result = "";
                if (days > 0) result += `${days} วัน `;
                if (hours % 24 > 0) result += `${hours % 24} ชม. `;
                if (mins % 60 > 0) result += `${mins % 60} นาที`;
                
                // อัปเดต Duration ลง State
                setFormData(prev => ({ ...prev, duration: result.trim() || "ไม่กี่วินาที" }));
            } else {
                // แจ้งเตือนถ้าเวลาสิ้นสุดน้อยกว่าเวลาเริ่ม
                setFormData(prev => ({ ...prev, duration: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม" }));
            }
        }
    }, [formData.time_start, formData.time_end]);

    // ฟังก์ชันค้นหา User (Autocomplete)
    const handleSearchUser = (val) => {
        setSearchTerm(val); // อัปเดตคำค้นหา
        if (val.trim().length >= 1) {
            // กรอง User ที่ชื่อตรงกับคำค้นหา และต้องไม่ใช่ตัวเอง
            const filtered = allUsers.filter(u => 
                u.username?.toLowerCase().includes(val.toLowerCase()) && u.id !== userId
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers([]); // ถ้าลบคำค้นหาจนหมด ให้ปิด List
        }
    };

    // ฟังก์ชันอัปโหลดรูปภาพ
    const handleUpload = async (e) => {
        try {
            const file = e.target.files[0]; // รับไฟล์จาก Input
            if (!file) return;
            setUploading(true); // เริ่มสถานะ Upload
            // ตั้งชื่อไฟล์: req-{เวลา}.นามสกุล
            const fileName = `req-${Date.now()}.${file.name.split('.').pop()}`;
            // อัปโหลดขึ้น Supabase Storage Bucket 'requests'
            let { error } = await supabase.storage.from('requests').upload(`requests/${fileName}`, file);
            if (error) throw error;
            // ขอ Public URL ของรูป
            const { data } = supabase.storage.from('requests').getPublicUrl(`requests/${fileName}`);
            // บันทึก URL ลง State Form
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            console.error("Upload error:", error);
            alert('อัปโหลดรูปไม่สำเร็จ!');
        } finally {
            setUploading(false); // จบสถานะ Upload
        }
    };

    // ฟังก์ชันส่งฟอร์ม (Submit)
    const handleSubmit = async (e) => {
        e.preventDefault(); // ป้องกัน Refresh หน้า
        // Validation เบื้องต้น
        if (!formData.receiver_username) return alert("กรุณาเลือกผู้รับ");
        if (formData.duration.includes("ต้องมากกว่า")) return alert("เวลาผิดพลาด");

        try {
            // ยิง API POST เพื่อสร้าง Request ใหม่
            await axios.post(`${API_URL}/api/request`, { ...formData, sender_id: userId });
            alert("ส่งคำขอสำเร็จ! 💖");
            // Reset Form เป็นค่าเริ่มต้นหลังจากส่งเสร็จ
            setFormData({
                header: 'เที่ยว', title: '', duration: '', 
                receiver_username: '', time_start: '', time_end: '', image_url: ''
            });
            setSearchTerm('');
        } catch (err) {
            console.error("Submit request error:", err);
            alert("เกิดข้อผิดพลาดในการส่งคำขอ");
        }
    };

    return (
        <div className="min-h-screen bg-rose-50 p-4 pb-20">
            {/* ฟอร์มหลัก */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-rose-100 space-y-6">
                <h1 className="text-3xl font-black text-rose-600 text-center uppercase italic tracking-tighter">Create Request</h1>

                {/* ส่วนเลือกหมวดหมู่ (Category Buttons) */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map(cat => (
                        <button key={cat} type="button" onClick={() => setFormData({...formData, header: cat})} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${formData.header === cat ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 text-rose-300'}`}>{cat}</button>
                    ))}
                </div>

                {/* ส่วนข้อมูลผู้ส่งและผู้รับ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ผู้ส่ง (Auto) */}
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <label className="text-[10px] font-black text-rose-400 uppercase">2. จาก (YOU)</label>
                        <p className="font-bold text-rose-600">{userName}</p>
                    </div>
                    {/* ผู้รับ (Search Input) */}
                    <div className="relative p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase">3. ถึงใคร</label>
                        <input className="w-full bg-transparent font-bold outline-none" placeholder="พิมพ์ชื่อ..." value={searchTerm} onChange={(e) => handleSearchUser(e.target.value)} autoComplete="off" />
                        {/* Dropdown ผลลัพธ์การค้นหา */}
                        {filteredUsers.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-[999] bg-white border-2 border-rose-100 rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                                {filteredUsers.map(u => (
                                    <div key={u.id} onClick={() => { setFormData({...formData, receiver_username: u.username}); setSearchTerm(u.username); setFilteredUsers([]); }} className="p-4 hover:bg-rose-50 cursor-pointer border-b border-rose-50 last:border-0 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-xs font-bold text-rose-500">{u.username[0].toUpperCase()}</div>
                                        <span className="font-bold text-slate-700">{u.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* รายละเอียดคำขอ (Textarea) */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">4. รายละเอียดคำขอ</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold h-28 outline-none focus:border-rose-300 transition-all" placeholder="เขียนรายละเอียด..." value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>

                {/* เวลาเริ่มและเวลาจบ */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">5. เวลาที่เริ่ม</label>
                        <input type="datetime-local" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={formData.time_start} onChange={(e) => setFormData({...formData, time_start: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">6. เวลาที่สิ้นสุด</label>
                        <input type="datetime-local" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={formData.time_end} onChange={(e) => setFormData({...formData, time_end: e.target.value})} required />
                    </div>
                </div>

                {/* ระยะเวลารวมและอัปโหลดรูป */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">7. ระยะเวลารวม</label>
                        <input className="w-full p-3 bg-slate-100 border border-slate-100 rounded-xl font-bold text-rose-500" value={formData.duration} placeholder="รอนับเวลา..." readOnly />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">แนบรูปภาพ (ถ้ามี)</label>
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="flex items-center justify-center gap-2 p-3 bg-rose-50 border-2 border-dashed border-rose-200 rounded-xl cursor-pointer text-rose-400 font-bold text-xs hover:bg-rose-100 transition-all h-[46px]">
                            {uploading ? <Loader2 className="animate-spin" size={16}/> : formData.image_url ? "เปลี่ยนรูปภาพ ✅" : <><ImageIcon size={16}/> เลือกรูปภาพ</>}
                        </label>
                    </div>
                </div>

                {/* แสดงรูปตัวอย่าง (ถ้ามี) */}
                {formData.image_url && <div className="flex justify-center"><img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-2xl border-2 border-rose-100 shadow-md" /></div>}

                {/* ปุ่มส่งคำขอ */}
                <button type="submit" disabled={uploading} className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                    <Send size={18}/> {uploading ? "กำลังอัปโหลด..." : "ส่งคำขอความรัก ✨"}
                </button>
            </form>
        </div>
    );
};

export default CreateRequestPage;