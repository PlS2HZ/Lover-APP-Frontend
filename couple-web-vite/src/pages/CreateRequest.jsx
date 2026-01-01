import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks สำหรับจัดการ State และ Lifecycle
import axios from 'axios'; // นำเข้า axios สำหรับใช้ติดต่อสื่อสารกับ API (ยิง HTTP Request)
import { Send, Clock, User, Tag, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react'; // นำเข้าไอคอนสวยๆ รวมถึง Trash2 สำหรับปุ่มลบ
import { supabase } from '../supabaseClient'; // นำเข้าตัวเชื่อมต่อ Supabase ที่ตั้งค่าไว้แล้ว
import imageCompression from 'browser-image-compression'; // นำเข้า Library สำหรับบีบอัดรูปภาพ

const CreateRequestPage = () => {
    // ดึงชื่อผู้ใช้จาก LocalStorage เพื่อนำมาแสดงผล (ถ้าไม่มีให้ใช้ค่าเริ่มต้น)
    const userName = localStorage.getItem('username') || 'ไม่พบข้อมูลผู้ใช้';
    // ดึง User ID จาก LocalStorage เพื่อใช้ในการส่งคำขอ
    const userId = localStorage.getItem('user_id');
    
    // State สำหรับเก็บรายชื่อผู้ใช้ทั้งหมดที่ดึงมาจากฐานข้อมูล
    const [allUsers, setAllUsers] = useState([]);
    // State สำหรับเก็บรายชื่อผู้ใช้ที่ผ่านการกรองแล้ว (ใช้ในระบบค้นหา)
    const [filteredUsers, setFilteredUsers] = useState([]);
    // State สำหรับเก็บคำค้นหาที่พิมพ์ในช่อง "ถึงใคร"
    const [searchTerm, setSearchTerm] = useState('');
    // State สำหรับแจ้งสถานะว่ากำลังอัปโหลดรูปอยู่หรือไม่ (แสดง Loading)
    const [uploading, setUploading] = useState(false);

    // State สำหรับเก็บข้อมูลทั้งหมดในฟอร์มที่จะส่งไปยัง Server
    const [formData, setFormData] = useState({
        header: 'เที่ยว', // กำหนดหมวดหมู่เริ่มต้นเป็น 'เที่ยว'
        title: '', // รายละเอียดของคำขอ
        duration: '', // ระยะเวลา (จะถูกคำนวณอัตโนมัติ)
        receiver_username: '', // ชื่อผู้รับที่เลือก
        time_start: '', // วันเวลาที่เริ่มต้นกิจกรรม
        time_end: '', // วันเวลาที่สิ้นสุดกิจกรรม
        image_url: '' // URL ของรูปภาพหลังจากอัปโหลดสำเร็จ
    });

    // รายการหมวดหมู่กิจกรรมต่างๆ ที่มีให้เลือก
    const categories = ['เที่ยว', 'ออกกำลังกาย', 'เล่นเกม', 'เล่นกีฬา', 'ดูหนัง', 'กินข้าว'];
    
    // กำหนด URL ของ API โดยเช็คว่าเป็นเครื่องตัวเอง (localhost) หรือ Server จริง
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' 
        : 'https://lover-app-jjoe.onrender.com';

    // ดึงรายชื่อ User ทั้งหมดเมื่อ Component ถูกโหลดครั้งแรก
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // ยิง GET Request ไปที่ API เพื่อเอาข้อมูล User ทั้งหมด
                const res = await axios.get(`${API_URL}/api/users`);
                // ตรวจสอบว่าข้อมูลที่ได้เป็น Array หรือไม่ ถ้าใช่ให้บันทึก ถ้าไม่ใช่ให้เป็นค่าว่าง
                setAllUsers(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                // แสดง Error ใน Console หากดึงข้อมูลไม่สำเร็จ
                console.error("Fetch users error:", err);
            }
        };
        fetchUsers(); // เรียกใช้ฟังก์ชันดึงข้อมูล
    }, [API_URL]); // ทำงานใหม่หาก API_URL เปลี่ยนแปลง

    // คำนวณระยะเวลา (Duration) อัตโนมัติเมื่อมีการเปลี่ยนเวลาเริ่มหรือเวลาจบ
    useEffect(() => {
        if (formData.time_start && formData.time_end) {
            const start = new Date(formData.time_start); // แปลงเวลาเริ่มเป็น Object Date
            const end = new Date(formData.time_end); // แปลงเวลาจบเป็น Object Date
            const diff = end - start; // คำนวณผลต่างเป็นมิลลิวินาที

            if (diff > 0) {
                // คำนวณแปลงหน่วยจากมิลลิวินาที เป็น วัน ชม. และ นาที
                const mins = Math.floor((diff / 1000) / 60);
                const hours = Math.floor(mins / 60);
                const days = Math.floor(hours / 24);

                let result = ""; // ตัวแปรสำหรับเก็บ String แสดงผล
                if (days > 0) result += `${days} วัน `;
                if (hours % 24 > 0) result += `${hours % 24} ชม. `;
                if (mins % 60 > 0) result += `${mins % 60} นาที`;
                
                // อัปเดตข้อมูลระยะเวลาลงใน State formData
                setFormData(prev => ({ ...prev, duration: result.trim() || "ไม่กี่วินาที" }));
            } else {
                // ถ้าเลือกเวลาผิด (จบก่อนเริ่ม) ให้แจ้งเตือนในช่อง Duration
                setFormData(prev => ({ ...prev, duration: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม" }));
            }
        }
    }, [formData.time_start, formData.time_end]); // ทำงานเมื่อเวลาเริ่มหรือเวลาจบมีการเปลี่ยนแปลง

    // ฟังก์ชันสำหรับค้นหาผู้ใช้ (Autocomplete)
    const handleSearchUser = (val) => {
        setSearchTerm(val); // อัปเดตคำที่พิมพ์ลงใน State
        if (val.trim().length >= 1) {
            // กรองรายชื่อผู้ใช้ที่ตรงกับคำค้น และต้องไม่ใช่ตัวเอง
            const filtered = allUsers.filter(u => 
                u.username?.toLowerCase().includes(val.toLowerCase()) && u.id !== userId
            );
            setFilteredUsers(filtered); // เก็บผลลัพธ์การกรองลง State
        } else {
            setFilteredUsers([]); // ถ้าลบจนว่าง ให้ล้างรายการแนะนำ
        }
    };

    // ฟังก์ชันอัปโหลดรูปภาพ (เพิ่มการบีบอัดรูปภาพ)
    const handleUpload = async (e) => {
        try {
            const file = e.target.files[0]; // รับไฟล์รูปภาพจาก Input
            if (!file) return; // ถ้าไม่มีไฟล์ให้หยุดการทำงานทันที
            setUploading(true); // เริ่มแสดงสถานะ Loading

            // --- ส่วนการบีบอัดรูปภาพ (Compression) ---
            const options = {
                maxSizeMB: 0.1, // กำหนดขนาดไฟล์สูงสุดเป็น 0.1MB (หรือ 100KB)
                maxWidthOrHeight: 1280, // กำหนดความกว้างหรือสูงไม่เกิน 1280px
                useWebWorker: true // ใช้ Web Worker ช่วยทำงานเบื้องหลัง
            };

            const compressedFile = await imageCompression(file, options); // เริ่มทำการบีบอัดรูปภาพ
            // ------------------------------------

            // แก้ไข: ตั้งชื่อไฟล์ใหม่โดยใช้แค่ Timestamp เพื่อเลี่ยงปัญหาชื่อไฟล์มีช่องว่างแล้ว Error
            const fileExt = file.name.split('.').pop();
            const fileName = `req-${Date.now()}.${fileExt}`;
            
            // อัปโหลดไฟล์ที่ "บีบอัดแล้ว" (compressedFile) ขึ้นไปที่ Supabase Storage
            let { error } = await supabase.storage.from('requests').upload(`requests/${fileName}`, compressedFile);
            
            if (error) throw error; // ถ้า Supabase แจ้ง Error ให้โยนไปที่ Catch

            // ดึง URL ที่เป็นสาธารณะของไฟล์ที่อัปโหลดสำเร็จ
            const { data } = supabase.storage.from('requests').getPublicUrl(`requests/${fileName}`);
            
            // บันทึก URL ของรูปภาพลงใน State formData เพื่อใช้ส่งเข้า Database ต่อไป
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            console.error("Upload error:", error); // Log ข้อผิดพลาด
            alert('อัปโหลดรูปไม่สำเร็จ!'); // แจ้งเตือนผู้ใช้
        } finally {
            setUploading(false); // ปิดสถานะ Loading ไม่ว่าจะสำเร็จหรือไม่ก็ตาม
        }
    };

    // ✅ ฟังก์ชันสำหรับลบรูปภาพที่เลือกไว้ (ก่อนกดบันทึก)
    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image_url: '' })); // ล้างค่า URL รูปภาพใน State ออก
    };

    // ฟังก์ชันสำหรับส่งข้อมูลทั้งหมดไปยัง Server
    const handleSubmit = async (e) => {
        e.preventDefault(); // ป้องกันการ Refresh หน้าเว็บเมื่อกด Submit
        
        // ตรวจสอบความถูกต้องเบื้องต้น
        if (!formData.receiver_username) return alert("กรุณาเลือกผู้รับ"); // ต้องเลือกผู้รับ
        if (formData.duration.includes("ต้องมากกว่า")) return alert("เวลาผิดพลาด"); // เวลาต้องถูกต้อง

        try {
            // ยิง POST Request ส่งข้อมูลทั้งหมดไปบันทึกที่ Backend
            await axios.post(`${API_URL}/api/request`, { ...formData, sender_id: userId });
            alert("ส่งคำขอสำเร็จ! 💖"); // แจ้งเตือนเมื่อสำเร็จ

            // ล้างข้อมูลในฟอร์มให้กลับเป็นค่าเริ่มต้น
            setFormData({
                header: 'เที่ยว', title: '', duration: '', 
                receiver_username: '', time_start: '', time_end: '', image_url: ''
            });
            setSearchTerm(''); // ล้างช่องค้นหาชื่อผู้รับ
        } catch (err) {
            console.error("Submit request error:", err); // Log ข้อผิดพลาด
            alert("เกิดข้อผิดพลาดในการส่งคำขอ"); // แจ้งเตือนเมื่อล้มเหลว
        }
    };

    return (
        <div className="min-h-screen bg-rose-50 p-4 pb-20">
            {/* กล่องฟอร์มหลัก */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-rose-100 space-y-6">
                <h1 className="text-3xl font-black text-rose-600 text-center uppercase italic tracking-tighter">Create Request</h1>

                {/* ส่วนการเลือกหมวดหมู่กิจกรรม */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map(cat => (
                        <button key={cat} type="button" onClick={() => setFormData({...formData, header: cat})} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${formData.header === cat ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 text-rose-300'}`}>{cat}</button>
                    ))}
                </div>

                {/* ส่วนข้อมูลผู้ส่งและช่องค้นหาผู้รับ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ข้อมูลผู้ส่ง (ดึงมาจาก LocalStorage) */}
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <label className="text-[10px] font-black text-rose-400 uppercase">2. จาก (YOU)</label>
                        <p className="font-bold text-rose-600">{userName}</p>
                    </div>
                    {/* ช่องพิมพ์ค้นหาผู้รับ (Autocomplete) */}
                    <div className="relative p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase">3. ถึงใคร</label>
                        <input className="w-full bg-transparent font-bold outline-none" placeholder="พิมพ์ชื่อ..." value={searchTerm} onChange={(e) => handleSearchUser(e.target.value)} autoComplete="off" />
                        {/* แสดงรายการชื่อผู้ใช้ที่ค้นหาพบ */}
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

                {/* ช่องกรอกรายละเอียดกิจกรรม */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">4. รายละเอียดคำขอ</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold h-28 outline-none focus:border-rose-300 transition-all" placeholder="เขียนรายละเอียด..." value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>

                {/* ช่องเลือกเวลาเริ่มและสิ้นสุด */}
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

                {/* ส่วนแสดงระยะเวลารวมและอัปโหลดรูปภาพ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ช่องแสดงระยะเวลาที่คำนวณได้ (อ่านอย่างเดียว) */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">7. ระยะเวลารวม</label>
                        <input className="w-full p-3 bg-slate-100 border border-slate-100 rounded-xl font-bold text-rose-500" value={formData.duration} placeholder="รอนับเวลา..." readOnly />
                    </div>
                    {/* ส่วนของปุ่มอัปโหลดรูปภาพ */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">แนบรูปภาพ (ถ้ามี)</label>
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="flex items-center justify-center gap-2 p-3 bg-rose-50 border-2 border-dashed border-rose-200 rounded-xl cursor-pointer text-rose-400 font-bold text-xs hover:bg-rose-100 transition-all h-[46px]">
                            {uploading ? <Loader2 className="animate-spin" size={16}/> : formData.image_url ? "เปลี่ยนรูปภาพ ✅" : <><ImageIcon size={16}/> เลือกรูปภาพ</>}
                        </label>
                    </div>
                </div>

                {/* แสดงรูปตัวอย่าง และปุ่มลบรูปภาพที่เลือกไว้ */}
                {formData.image_url && (
                    <div className="relative w-32 h-32 mx-auto group">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover rounded-2xl border-2 border-rose-100 shadow-md" />
                        {/* ปุ่มลบรูปภาพ (ถังขยะสีแดง) จะแสดงเมื่อมีรูปภาพอัปโหลดแล้ว */}
                        <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600 transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}

                {/* ปุ่มสำหรับกดส่งคำขอทั้งหมด */}
                <button type="submit" disabled={uploading} className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                    <Send size={18}/> {uploading ? "กำลังอัปโหลด..." : "ส่งคำขอความรัก ✨"}
                </button>
            </form>
        </div>
    );
};

export default CreateRequestPage;