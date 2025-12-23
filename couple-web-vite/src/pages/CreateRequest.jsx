import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Clock, User, Tag, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const CreateRequestPage = () => {
    // ดึงชื่อ Username มาแสดงแทน Email
    const userName = localStorage.getItem('username') || 'ไม่พบข้อมูลผู้ใช้';
    const userId = localStorage.getItem('user_id');
    
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        header: 'เที่ยว',
        title: '',
        duration: '', // ✨ 7. ระยะเวลารวม
        receiver_username: '', // ใช้ Username แทน Email
        time_start: '',
        time_end: '',
        image_url: '' // ตัวเลือกเสริม
    });

    const categories = ['เที่ยว', 'ออกกำลังกาย', 'เล่นเกม', 'เล่นกีฬา', 'ดูหนัง', 'กินข้าว'];
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://lover-backend.onrender.com';

    // 🔄 ดึงรายชื่อผู้ใช้ทั้งหมดตอนโหลดหน้า
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/users`);
                // ตรวจสอบว่าเป็น Array เพื่อป้องกัน Error setAllUsers
                setAllUsers(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Fetch users error:", err);
            }
        };
        fetchUsers();
    }, [API_URL]);

    // ✨ ฟังก์ชันคำนวณระยะเวลารวมอัตโนมัติ
    useEffect(() => {
        if (formData.time_start && formData.time_end) {
            const start = new Date(formData.time_start);
            const end = new Date(formData.time_end);
            const diff = end - start;

            if (diff > 0) {
                const seconds = Math.floor((diff / 1000) % 60);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));

                let result = "";
                if (days > 0) result += `${days} วัน `;
                if (hours > 0) result += `${hours} ชม. `;
                if (minutes > 0) result += `${minutes} นาที `;
                if (seconds > 0) result += `${seconds} วินาที`;
                
                setFormData(prev => ({ ...prev, duration: result.trim() }));
            } else {
                setFormData(prev => ({ ...prev, duration: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม" }));
            }
        }
    }, [formData.time_start, formData.time_end]);

    // 🔍 ค้นหาผู้รับและแสดง Dropdown ทันทีที่พิมพ์
    const handleSearchUser = (val) => {
        setSearchTerm(val);
        if (val.trim().length >= 1) {
            const filtered = allUsers.filter(u => 
                u.username && 
                u.username.toLowerCase().includes(val.toLowerCase()) && 
                u.id !== userId // ไม่แสดงชื่อตัวเอง
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers([]);
        }
    };

    // 📸 อัปโหลดรูปภาพแนบคำขอไปยัง Supabase Storage
    const handleUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `requests/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('requests')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('requests').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            console.error("Upload error:", error);
            alert('อัปโหลดรูปไม่สำเร็จ!');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ตรวจสอบว่าได้เลือกผู้รับจาก Dropdown หรือยัง
        if (!formData.receiver_username) {
            return alert("กรุณาเลือกผู้รับจากรายการ");
        }
        try {
            const payload = { ...formData, sender_id: userId };
            await axios.post(`${API_URL}/api/request`, payload);
            alert("ส่งคำขอสำเร็จ! 💖");
            // Reset Form หลังส่งสำเร็จ
            setFormData(prev => ({...prev, title: '', duration: '', image_url: '', receiver_username: ''}));
            setSearchTerm('');
        } catch (err) { 
            console.error("Create request error:", err);
            alert("เกิดข้อผิดพลาดในการส่งคำขอ"); 
        }
    };

    return (
        <div className="min-h-screen bg-rose-50 p-4 pb-20">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-rose-100 space-y-6">
                <h1 className="text-3xl font-black text-rose-600 text-center uppercase italic tracking-tighter">Create Request</h1>

                {/* 1. Header Tags */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            type="button" 
                            onClick={() => setFormData({...formData, header: cat})}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${formData.header === cat ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 text-rose-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 2. จากใคร */}
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <label className="text-[10px] font-black text-rose-400 uppercase">2. จาก (YOU)</label>
                        <p className="font-bold text-rose-600">{userName}</p>
                    </div>

                    {/* 3. ถึงใคร (Dropdown Fix) */}
                    <div className="relative p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase">3. ถึงใคร</label>
                        <input 
                            className="w-full bg-transparent font-bold outline-none" 
                            placeholder="พิมพ์ชื่อ..." 
                            value={searchTerm} 
                            onChange={(e) => handleSearchUser(e.target.value)} 
                            autoComplete="off"
                        />
                        {/* รายการ Dropdown ผู้ใช้ */}
                        {filteredUsers.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-[999] bg-white border-2 border-rose-100 rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                                {filteredUsers.map(u => (
                                    <div 
                                        key={u.id} 
                                        onClick={() => { 
                                            setFormData({...formData, receiver_username: u.username}); 
                                            setSearchTerm(u.username); 
                                            setFilteredUsers([]); 
                                        }}
                                        className="p-4 hover:bg-rose-50 cursor-pointer border-b border-rose-50 last:border-0 flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-xs font-bold text-rose-500">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-700">{u.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. รายละเอียด */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">4. รายละเอียด</label>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold h-28 outline-none focus:border-rose-300 transition-all" 
                        placeholder="เขียนคำขอของคุณ..." 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    />
                </div>

                {/* 5 & 6 เวลา */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">5. เวลาที่เริ่ม</label>
                        <input type="datetime-local" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={formData.time_start} onChange={(e) => setFormData({...formData, time_start: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">6. เวลาที่สิ้นสุด</label>
                        <input type="datetime-local" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={formData.time_end} onChange={(e) => setFormData({...formData, time_end: e.target.value})} />
                    </div>
                </div>

                {/* 7. ระยะเวลารวม (Auto Calculated) & แนบรูป (Optional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">7. ระยะเวลารวม</label>
                        <input 
                            className="w-full p-3 bg-slate-100 border border-slate-100 rounded-xl font-bold text-rose-500" 
                            value={formData.duration} 
                            placeholder="รอนับเวลา..."
                            readOnly 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">แนบรูปภาพ (ถ้ามี)</label>
                        <div className="relative">
                            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="file-upload" />
                            <label 
                                htmlFor="file-upload" 
                                className="flex items-center justify-center gap-2 p-3 bg-rose-50 border-2 border-dashed border-rose-200 rounded-xl cursor-pointer text-rose-400 font-bold text-xs hover:bg-rose-100 transition-all h-[46px]"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={16}/> : formData.image_url ? "เปลี่ยนรูปภาพ ✅" : <><ImageIcon size={16}/> เลือกรูปภาพ</>}
                            </label>
                        </div>
                    </div>
                </div>

                {/* แสดงรูปภาพตัวอย่างถ้ามีการอัปโหลด */}
                {formData.image_url && (
                    <div className="flex justify-center">
                        <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-2xl border-2 border-rose-100 shadow-md" />
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                >
                    <Send size={18}/> {uploading ? "กำลังอัปโหลด..." : "ส่งคำขอความรัก ✨"}
                </button>
            </form>
        </div>
    );
};

export default CreateRequestPage;