import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks: useState (เก็บค่า), useEffect (ทำงานเมื่อโหลดหน้า)
import axios from 'axios'; // นำเข้า axios สำหรับยิง API
import { Camera, User, FileText, Save, Loader2, Users, Lock, BellRing, Sun, Moon, Cloud, Snowflake, Heart } from 'lucide-react'; // นำเข้าไอคอนต่างๆ
import { supabase } from '../supabaseClient'; // นำเข้าตัวเชื่อมต่อ Supabase
import PWAHandler from '../components/PWAHandler'; // นำเข้า Component สำหรับจัดการ PWA (แจ้งเตือน/ติดตั้ง)
import { useTheme } from '../ThemeConstants'; // ✅ นำเข้า Hook สำหรับจัดการ Theme (สี/ฤดูกาล)

const ProfilePage = () => {
    // ✅ เรียกใช้ฟังก์ชันเปลี่ยนธีมจาก Context (Custom Hook)
    // currentTheme: ธีมปัจจุบัน, nextTheme/prevTheme: ฟังก์ชันเปลี่ยนธีมไปข้างหน้า/ย้อนกลับ
    const { currentTheme, nextTheme, prevTheme } = useTheme();
    
    // ดึง user_id จาก LocalStorage เพื่อระบุตัวตน
    const userId = localStorage.getItem('user_id');
    
    // State: สถานะกำลังอัปโหลดรูปภาพ (True = กำลังอัปโหลด)
    const [uploading, setUploading] = useState(false);
    // State: สถานะกำลังบันทึกข้อมูลโปรไฟล์ (True = กำลังบันทึก)
    const [isSaving, setIsSaving] = useState(false);
    // State: ควบคุมการแสดง Modal ยืนยันรหัสผ่าน (True = แสดง)
    const [showPassModal, setShowPassModal] = useState(false);
    // State: เก็บค่ารหัสผ่านที่ผู้ใช้กรอกใน Modal เพื่อยืนยัน
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // State: เก็บข้อมูลโปรไฟล์ที่จะแสดงและแก้ไขในฟอร์ม
    const [profileData, setProfileData] = useState({
        username: '',
        description: '',
        gender: 'อื่นๆ',
        avatar_url: ''
    });
    // State: เก็บชื่อผู้ใช้เดิม เพื่อเปรียบเทียบว่ามีการเปลี่ยนชื่อหรือไม่ (ถ้าเปลี่ยนต้องยืนยันรหัสผ่าน)
    const [originalUsername, setOriginalUsername] = useState('');

    // กำหนด API URL ตาม Environment (Localhost หรือ Production)
    const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    // useEffect: ทำงานเมื่อ userId เปลี่ยน หรือโหลดหน้าครั้งแรก เพื่อดึงข้อมูลโปรไฟล์
    useEffect(() => { if (userId) fetchProfile(); }, [userId]);

    // ฟังก์ชันดึงข้อมูลโปรไฟล์จาก API
    const fetchProfile = async () => {
        try {
            // ยิง API ไปดึง users ทั้งหมด
            const res = await axios.get(`${API_URL}/api/users`);
            if (Array.isArray(res.data)) {
                // หา user ที่ id ตรงกับ userId ของเรา
                const currentUser = res.data.find(u => u.id === userId);
                if (currentUser) {
                    // อัปเดตข้อมูลลง State
                    setProfileData({
                        username: currentUser.username || '',
                        avatar_url: currentUser.avatar_url || '',
                        description: currentUser.description || '',
                        gender: currentUser.gender || 'อื่นๆ'
                    });
                    // เก็บชื่อเดิมไว้เช็คตอนกดบันทึก
                    setOriginalUsername(currentUser.username);
                    // อัปเดตข้อมูลลง LocalStorage ด้วยเพื่อให้ส่วนอื่นของแอปใช้ได้ทันที
                    localStorage.setItem('username', currentUser.username);
                    localStorage.setItem('avatar_url', currentUser.avatar_url);
                }
            }
        } catch (err) { console.error("Error fetching profile:", err); }
    };

    // ฟังก์ชันจัดการอัปโหลดรูปภาพโปรไฟล์
    const handleAvatarUpload = async (e) => {
        try {
            const file = e.target.files[0]; // ดึงไฟล์จาก input
            if (!file) return; // ถ้าไม่มีไฟล์ จบการทำงาน
            
            setUploading(true); // เริ่มสถานะ Uploading
            const fileExt = file.name.split('.').pop(); // หานามสกุลไฟล์
            // ตั้งชื่อไฟล์ใหม่: avatar-{id}-{เวลา}.นามสกุล (กันชื่อซ้ำและ Cache)
            const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`; 
            
            // อัปโหลดไฟล์ขึ้น Supabase Storage Bucket ชื่อ 'profiles'
            let { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, file);
            if (uploadError) throw uploadError; // ถ้า Error โยนไป catch
            
            // ขอ Public URL ของรูปที่อัปโหลดเสร็จ
            const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
            
            // อัปเดต URL รูปใหม่ลง State (แสดงตัวอย่างทันที)
            setProfileData(prev => ({ ...prev, avatar_url: data.publicUrl }));
            alert("อัปโหลดรูปภาพสำเร็จ! อย่าลืมกด 'บันทึก' ยืนยันนะครับ ✨");
        } catch (error) { alert('อัปโหลดรูปไม่สำเร็จ: ' + error.message); } 
        finally { setUploading(false); } // จบสถานะ Uploading
    };

    // ฟังก์ชันกดปุ่มบันทึก (Pre-check)
    const handleSaveProfile = async () => {
        // เช็คว่ามีการเปลี่ยนชื่อ Username หรือไม่?
        if (profileData.username !== originalUsername) { 
            setShowPassModal(true); // ถ้าเปลี่ยนชื่อ ต้องเปิด Modal ขอรหัสผ่านยืนยัน
            return; 
        }
        // ถ้าไม่ได้เปลี่ยนชื่อ ให้บันทึกเลย
        executeSave();
    };

    // ฟังก์ชันบันทึกข้อมูลจริง (ส่งไป Backend)
    const executeSave = async () => {
        setIsSaving(true); // เริ่มสถานะ Saving
        try {
            // ยิง API PATCH เพื่ออัปเดตข้อมูล
            await axios.patch(`${API_URL}/api/users/update`, {
                id: userId,
                ...profileData,
                confirm_password: confirmPassword // ส่งรหัสผ่านไปด้วย (Backend จะเช็คเองว่าต้องใช้ไหม)
            });
            alert("บันทึกข้อมูลสำเร็จ! ❤️");
            await fetchProfile(); // ดึงข้อมูลใหม่มาอัปเดตหน้าจอให้ชัวร์
            setShowPassModal(false); // ปิด Modal (ถ้าเปิดอยู่)
            setConfirmPassword(''); // เคลียร์รหัสผ่าน
        } catch (err) { alert(err.response?.data || "เกิดข้อผิดพลาดในการบันทึก"); } // แจ้งเตือน Error
        finally { setIsSaving(false); } // จบสถานะ Saving
    };

    return (
        // Wrapper หลักของหน้า กำหนดพื้นหลังสีอ่อนๆ
        <div className="min-h-screen bg-rose-50 p-4 pt-10 pb-20 relative">
            {/* Modal ยืนยันรหัสผ่าน (แสดงเมื่อ showPassModal เป็น true) */}
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
                            {/* ปุ่มยกเลิก ปิด Modal */}
                            <button onClick={() => setShowPassModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">ยกเลิก</button>
                            {/* ปุ่มตกลง เรียก executeSave */}
                            <button onClick={executeSave} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-200 uppercase text-xs">ตกลง</button>
                        </div>
                    </div>
                </div>
            )}

            {/* การ์ดโปรไฟล์หลัก */}
            <div className="max-w-md mx-auto bg-white rounded-[3rem] shadow-xl border-2 border-rose-100 overflow-hidden">
                {/* ส่วนหัวสีพื้นหลัง (Header Background) */}
                <div className="bg-rose-500 h-32 relative">
                    {/* ส่วนแสดงรูปโปรไฟล์ (ลอยอยู่กึ่งกลาง) */}
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 group">
                        {/* รูปโปรไฟล์: ถ้าไม่มีรูป ให้ใช้ UI Avatars สร้างรูปจากชื่อ */}
                        <img src={profileData.avatar_url || `https://ui-avatars.com/api/?name=${profileData.username}&background=random`} className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg bg-white" alt="โปรไฟล์" />
                        
                        {/* ปุ่มกล้องสำหรับอัปโหลดรูป (ซ่อน input file ไว้ใน label) */}
                        <label className="absolute bottom-0 right-0 bg-rose-600 p-3 rounded-full text-white cursor-pointer border-2 border-white shadow-md hover:scale-110 transition-transform"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} /></label>
                        
                        {/* Overlay หมุนๆ แสดงตอนกำลังอัปโหลด */}
                        {uploading && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><Loader2 className="text-white animate-spin" size={24} /></div>}
                    </div>
                </div>

                {/* เนื้อหาฟอร์มด้านล่าง */}
                <div className="pt-20 p-8 space-y-6">
                    {/* Input: ชื่อผู้ใช้งาน */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><User size={12}/> ชื่อผู้ใช้งาน</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 outline-none focus:border-rose-300 transition-all" value={profileData.username} onChange={(e) => setProfileData({...profileData, username: e.target.value})} />
                    </div>

                    {/* Radio Button Group: เลือกเพศ */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><Users size={12}/> เพศ</label>
                        <div className="flex gap-2">
                            {['ชาย', 'หญิง', 'อื่นๆ'].map((g) => (
                                <button key={g} onClick={() => setProfileData({...profileData, gender: g})} className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition-all ${profileData.gender === g ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : 'bg-slate-100 text-slate-400'}`}>{g}</button>
                            ))}
                        </div>
                    </div>

                    {/* Textarea: คำอธิบาย */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><FileText size={12}/> คำอธิบายเกี่ยวกับคุณ</label>
                        <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 h-28 resize-none outline-none focus:border-rose-300 transition-all" placeholder="วันนี้คุณรู้สึกอย่างไรบ้าง..." value={profileData.description} onChange={(e) => setProfileData({...profileData, description: e.target.value})} />
                    </div>

                    {/* ✅ ส่วนเลือกฤดูกาล (Theme Switcher) */}
                    <div className="space-y-3 pt-4 border-t border-rose-50">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1">
                            <Sun size={12}/> เลือกฤดูกาล (Seasons Theme)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {/* ปุ่มย้อนกลับธีม */}
                            <button 
                                onClick={prevTheme} 
                                className="py-3 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-400 active:scale-95 transition-all"
                            >
                                Previous
                            </button>
                            {/* ปุ่มไปข้างหน้าธีม */}
                            <button 
                                onClick={nextTheme} 
                                className="py-3 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-rose-500 active:scale-95 transition-all"
                            >
                                Next
                            </button>
                            
                            {/* แสดงชื่อธีมปัจจุบัน */}
                            <div className="col-span-2 py-4 bg-slate-900 text-white rounded-2xl text-center font-black italic uppercase text-[11px] shadow-lg tracking-widest">
                                Current Theme: <span className="text-yellow-400">{currentTheme.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* ส่วนตั้งค่าแจ้งเตือน (PWA) */}
                    <div className="pt-6 border-t border-rose-50 space-y-4">
                        <label className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 ml-1 italic tracking-widest">
                            <BellRing size={14}/> ตั้งค่าการแจ้งเตือน
                        </label>
                        <PWAHandler /> 
                    </div>

                    {/* ปุ่มบันทึกข้อมูลหลัก (แสดง Loading เมื่อบันทึก) */}
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