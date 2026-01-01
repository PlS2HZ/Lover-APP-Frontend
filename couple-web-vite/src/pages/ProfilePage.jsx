import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks พื้นฐานสำหรับจัดการสถานะและวงจรชีวิตของ Component
import axios from 'axios'; // นำเข้า axios สำหรับใช้ติดต่อกับ API Backend
import { Camera, User, FileText, Save, Loader2, Users, Lock, BellRing, Sun, Moon, Cloud, Snowflake, Heart, X } from 'lucide-react'; // นำเข้าไอคอนต่างๆ เพิ่ม X
import { supabase } from '../supabaseClient'; // นำเข้าตัวเชื่อมต่อกับฐานข้อมูลและ Storage ของ Supabase
import PWAHandler from '../components/PWAHandler'; // นำเข้าส่วนจัดการ Progressive Web App (การแจ้งเตือน)
import { useTheme } from '../ThemeConstants'; // นำเข้า Hook สำหรับจัดการระบบธีม (สีและฤดูกาล)
import imageCompression from 'browser-image-compression'; // นำเข้า Library สำหรับบีบอัดรูปภาพก่อนอัปโหลด

const ProfilePage = () => {
    // ✅ ดึงฟังก์ชันและข้อมูลธีมปัจจุบันมาจากระบบ Theme Context
    const { currentTheme, nextTheme, prevTheme } = useTheme();
    
    // ดึง ID ของผู้ใช้งานที่ล็อกอินอยู่จาก LocalStorage
    const userId = localStorage.getItem('user_id');
    
    // State: เก็บสถานะว่ากำลังอัปโหลดรูปภาพอยู่หรือไม่
    const [uploading, setUploading] = useState(false);
    // State: เก็บสถานะว่ากำลังบันทึกข้อมูลลงฐานข้อมูลอยู่หรือไม่
    const [isSaving, setIsSaving] = useState(false);
    // State: ควบคุมการแสดงหน้าต่าง (Modal) ยืนยันรหัสผ่าน
    const [showPassModal, setShowPassModal] = useState(false);
    // State: เก็บค่ารหัสผ่านที่ผู้ใช้กรอกเพื่อยืนยันการเปลี่ยนแปลงสำคัญ
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // State: เก็บข้อมูลโปรไฟล์ทั้งหมดที่จะแสดงและแก้ไข
    const [profileData, setProfileData] = useState({
        username: '',
        description: '',
        gender: 'อื่นๆ',
        avatar_url: ''
    });
    // State: เก็บชื่อผู้ใช้ดั้งเดิมไว้เปรียบเทียบ (ถ้าเปลี่ยนชื่อต้องยืนยันรหัสผ่าน)
    const [originalUsername, setOriginalUsername] = useState('');

    // กำหนด URL ของ API 
    const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    // ดึงข้อมูลโปรไฟล์มาแสดงทันทีเมื่อหน้าเว็บโหลด
    useEffect(() => { if (userId) fetchProfile(); }, [userId]);

    // ฟังก์ชันสำหรับดึงข้อมูลโปรไฟล์จากระบบ Backend
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

    // ฟังก์ชันจัดการการอัปโหลดรูปโปรไฟล์ (พร้อมบีบอัดและป้องกันชื่อไฟล์ Error)
    const handleAvatarUpload = async (e) => {
        try {
            const file = e.target.files[0]; 
            if (!file) return; 
            
            setUploading(true); 

            // --- กระบวนการบีบอัดรูปภาพ ---
            const options = {
                maxSizeMB: 0.1, 
                maxWidthOrHeight: 500, 
                useWebWorker: true 
            };
            const compressedFile = await imageCompression(file, options); 
            // ---------------------------

            // แก้ไข: ตั้งชื่อไฟล์ใหม่ใช้เพียง Timestamp ป้องกันปัญหาชื่อไฟล์มีช่องว่างแล้ว Upload ล้มเหลว
            const fileExt = file.name.split('.').pop(); 
            const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
            
            // อัปโหลดไฟล์ที่บีบอัดแล้ว
            let { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
            if (uploadError) throw uploadError;
            
            // รับ URL สาธารณะเพื่อนำมาแสดงผล
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            
            // อัปเดต URL รูปภาพใหม่ลงใน State
            setProfileData(prev => ({ ...prev, avatar_url: data.publicUrl }));
            alert("อัปโหลดรูปภาพสำเร็จ! อย่าลืมกด 'บันทึก' ยืนยันนะครับ ✨");
        } catch (error) { 
            alert('อัปโหลดรูปไม่สำเร็จ: ' + error.message); 
        } finally { 
            setUploading(false); 
        }
    };

    // ✅ ฟังก์ชันสำหรับลบรูปโปรไฟล์ที่อัปโหลดขึ้นมา (ก่อนกดบันทึก)
    // หมายเหตุ: จะล้างกลับเป็นรูปเริ่มต้นจาก UI Avatars
    const handleRemoveAvatar = () => {
        setProfileData(prev => ({ ...prev, avatar_url: '' }));
    };

    // ฟังก์ชันตรวจสอบก่อนบันทึก
    const handleSaveProfile = async () => {
        if (profileData.username !== originalUsername) { 
            setShowPassModal(true); 
            return; 
        }
        executeSave();
    };

    // ฟังก์ชันสำหรับส่งข้อมูลโปรไฟล์ที่แก้ไขแล้วไปยัง Backend
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
        } catch (err) { 
            alert(err.response?.data || "เกิดข้อผิดพลาดในการบันทึก"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <div className="min-h-screen bg-rose-50 p-4 pt-10 pb-20 relative">
            {showPassModal && (
                <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-[3rem] w-full max-w-sm space-y-5 shadow-2xl border-4 border-rose-50">
                        <h3 className="font-black text-slate-700 flex items-center gap-2 text-xl italic uppercase">
                            <Lock size={24} className="text-rose-500"/> ยืนยันรหัสผ่าน
                        </h3>
                        <p className="text-xs text-slate-400 font-bold">โปรดระบุรหัสผ่านเพื่อยืนยันการเปลี่ยนชื่อ</p>
                        <input type="password" text-align="center" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-center text-lg focus:border-rose-400 transition-all" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <div className="flex gap-3">
                            <button onClick={() => setShowPassModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">ยกเลิก</button>
                            <button onClick={executeSave} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-200 uppercase text-xs">ตกลง</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-md mx-auto bg-white rounded-[3rem] shadow-xl border-2 border-rose-100 overflow-hidden">
                <div className="bg-rose-500 h-32 relative">
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 group">
                        <img src={profileData.avatar_url || `https://ui-avatars.com/api/?name=${profileData.username}&background=random`} className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg bg-white" alt="โปรไฟล์" />
                        
                        {/* ปุ่มลบรูปโปรไฟล์ (X) แสดงเมื่อมีการอัปโหลดรูปภาพแล้ว */}
                        {profileData.avatar_url && (
                            <button type="button" onClick={handleRemoveAvatar} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1.5 rounded-full border-2 border-white shadow-md z-10 hover:bg-rose-600 transition-all"><X size={14} /></button>
                        )}

                        <label className="absolute bottom-0 right-0 bg-rose-600 p-3 rounded-full text-white cursor-pointer border-2 border-white shadow-md hover:scale-110 transition-transform">
                            <Camera size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>
                        {uploading && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><Loader2 className="text-white animate-spin" size={24} /></div>}
                    </div>
                </div>

                <div className="pt-20 p-8 space-y-6">
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

                    <div className="space-y-3 pt-4 border-t border-rose-50">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><Sun size={12}/> เลือกฤดูกาล (Seasons Theme)</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={prevTheme} className="py-3 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-400 active:scale-95 transition-all">Previous</button>
                            <button onClick={nextTheme} className="py-3 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-rose-500 active:scale-95 transition-all">Next</button>
                            <div className="col-span-2 py-4 bg-slate-900 text-white rounded-2xl text-center font-black italic uppercase text-[11px] shadow-lg tracking-widest">Current Theme: <span className="text-yellow-400">{currentTheme.name}</span></div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-rose-50 space-y-4">
                        <label className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 ml-1 italic tracking-widest"><BellRing size={14}/> ตั้งค่าการแจ้งเตือน</label>
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