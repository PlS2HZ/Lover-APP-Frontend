import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, User, FileText, Save, Loader2, Users, Lock, BellRing, Sun, Moon, Cloud, Snowflake, Heart } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PWAHandler from '../components/PWAHandler';
import { useTheme } from '../ThemeConstants'; // ✅ ดึงมาจากไฟล์ที่เก็บ THEMES และ useTheme

const ProfilePage = () => {
    // ✅ เรียกใช้ฟังก์ชันเปลี่ยนธีมจาก Context
    const { currentTheme, nextTheme, prevTheme } = useTheme();
    
    const userId = localStorage.getItem('user_id');
    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [profileData, setProfileData] = useState({
        username: '',
        description: '',
        gender: 'อื่นๆ',
        avatar_url: ''
    });
    const [originalUsername, setOriginalUsername] = useState('');

    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

    useEffect(() => { if (userId) fetchProfile(); }, [userId]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            if (Array.isArray(res.data)) {
                const currentUser = res.data.find(u => u.id === userId);
                if (currentUser) {
                    setProfileData({
                        username: currentUser.username || '',
                        avatar_url: currentUser.avatar_url || '',
                        description: currentUser.description || '',
                        gender: currentUser.gender || 'อื่นๆ'
                    });
                    setOriginalUsername(currentUser.username);
                    localStorage.setItem('username', currentUser.username);
                    localStorage.setItem('avatar_url', currentUser.avatar_url);
                }
            }
        } catch (err) { console.error("Error fetching profile:", err); }
    };

    const handleAvatarUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`; 
            let { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
            setProfileData(prev => ({ ...prev, avatar_url: data.publicUrl }));
            alert("อัปโหลดรูปภาพสำเร็จ! อย่าลืมกด 'บันทึก' ยืนยันนะครับ ✨");
        } catch (error) { alert('อัปโหลดรูปไม่สำเร็จ: ' + error.message); } 
        finally { setUploading(false); }
    };

    const handleSaveProfile = async () => {
        if (profileData.username !== originalUsername) { setShowPassModal(true); return; }
        executeSave();
    };

    const executeSave = async () => {
        setIsSaving(true);
        try {
            await axios.patch(`${API_URL}/api/users/update`, {
                id: userId,
                ...profileData,
                confirm_password: confirmPassword 
            });
            alert("บันทึกข้อมูลสำเร็จ! ❤️");
            await fetchProfile(); 
            setShowPassModal(false);
            setConfirmPassword('');
        } catch (err) { alert(err.response?.data || "เกิดข้อผิดพลาดในการบันทึก"); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="min-h-screen bg-rose-50 p-4 pt-10 pb-20 relative">
            {/* Modal ยืนยันรหัสผ่าน */}
            {showPassModal && (
                <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-[3rem] w-full max-w-sm space-y-5 shadow-2xl border-4 border-rose-50">
                        <h3 className="font-black text-slate-700 flex items-center gap-2 text-xl italic uppercase">
                            <Lock size={24} className="text-rose-500"/> ยืนยันรหัสผ่าน
                        </h3>
                        <p className="text-xs text-slate-400 font-bold">โปรดระบุรหัสผ่านเพื่อยืนยันการเปลี่ยนชื่อ</p>
                        <input 
                            type="password" 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-center text-lg focus:border-rose-400 transition-all" 
                            placeholder="••••••••" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowPassModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">ยกเลิก</button>
                            <button onClick={executeSave} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-200 uppercase text-xs">ตกลง</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-md mx-auto bg-white rounded-[3rem] shadow-xl border-2 border-rose-100 overflow-hidden">
                {/* ส่วนหัวรูปโปรไฟล์ */}
                <div className="bg-rose-500 h-32 relative">
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 group">
                        <img src={profileData.avatar_url || `https://ui-avatars.com/api/?name=${profileData.username}&background=random`} className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg bg-white" alt="โปรไฟล์" />
                        <label className="absolute bottom-0 right-0 bg-rose-600 p-3 rounded-full text-white cursor-pointer border-2 border-white shadow-md hover:scale-110 transition-transform"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} /></label>
                        {uploading && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><Loader2 className="text-white animate-spin" size={24} /></div>}
                    </div>
                </div>

                <div className="pt-20 p-8 space-y-6">
                    {/* ข้อมูลพื้นฐาน */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><User size={12}/> ชื่อผู้ใช้งาน</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 outline-none focus:border-rose-300 transition-all" value={profileData.username} onChange={(e) => setProfileData({...profileData, username: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><Users size={12}/> เพศ</label>
                        <div className="flex gap-2">
                            {['ชาย', 'หญิง', 'อื่นๆ'].map((g) => (
                                <button key={g} onClick={() => setProfileData({...profileData, gender: g})} className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition-all ${profileData.gender === g ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : 'bg-slate-100 text-slate-400'}`}>{g}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><FileText size={12}/> คำอธิบายเกี่ยวกับคุณ</label>
                        <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 h-28 resize-none outline-none focus:border-rose-300 transition-all" placeholder="วันนี้คุณรู้สึกอย่างไรบ้าง..." value={profileData.description} onChange={(e) => setProfileData({...profileData, description: e.target.value})} />
                    </div>

                    {/* ✅ ส่วนเลือกฤดูกาล (ย้ายปุ่มมาจากหน้าหลัก) */}
                    <div className="space-y-3 pt-4 border-t border-rose-50">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1">
                            <Sun size={12}/> เลือกฤดูกาล (Seasons Theme)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={prevTheme} 
                                className="py-3 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-400 active:scale-95 transition-all"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={nextTheme} 
                                className="py-3 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-rose-500 active:scale-95 transition-all"
                            >
                                Next
                            </button>
                            
                            {/* แสดงสถานะฤดูกาลปัจจุบัน */}
                            <div className="col-span-2 py-4 bg-slate-900 text-white rounded-2xl text-center font-black italic uppercase text-[11px] shadow-lg tracking-widest">
                                Current Theme: <span className="text-yellow-400">{currentTheme.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* ตั้งค่าแจ้งเตือน */}
                    <div className="pt-6 border-t border-rose-50 space-y-4">
                        <label className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 ml-1 italic tracking-widest">
                            <BellRing size={14}/> ตั้งค่าการแจ้งเตือน
                        </label>
                        <PWAHandler /> 
                    </div>

                    <button onClick={handleSaveProfile} disabled={isSaving || uploading} className="w-full bg-rose-500 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-rose-100 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs">
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูลส่วนตัว ✨"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;