import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks: useState (เก็บค่า), useEffect (ทำงานเมื่อโหลดหน้า)
import axios from 'axios'; // เครื่องมือสำหรับยิง API ไปยัง Backend
import { supabase } from '../supabaseClient'; // ตัวเชื่อมต่อกับ Supabase Storage
import { Image as ImageIcon, Save, Trash2, Plus, Loader2, ArrowLeft, Monitor, Smartphone, LayoutGrid, X } from 'lucide-react'; // นำเข้าไอคอนต่างๆ เพิ่ม X สำหรับปุ่มลบรูป
import { useNavigate } from 'react-router-dom'; // Hook สำหรับใช้ในการเปลี่ยนเส้นทางหน้าเว็บ
import imageCompression from 'browser-image-compression'; // Library สำหรับบีบอัดรูปภาพฝั่ง Client

const HomeAdminPage = () => {
    // State: เก็บข้อมูลการตั้งค่าหน้าหลัก (Slideshow, รูปภาพคงที่, รูปพิกเซล)
    const [config, setConfig] = useState({ 
        slideshow: [], 
        fixed: [], 
        mosaic: { pc: '', mobile: '' } 
    });
    // State: สถานะการโหลดข้อมูลเริ่มต้นจาก Server (True = กำลังโหลด)
    const [loading, setLoading] = useState(true);
    // State: สถานะขณะกำลังทำการอัปโหลดรูปภาพ (ใช้แสดง Overlay โหลด)
    const [uploading, setUploading] = useState(false);

    const navigate = useNavigate(); // สร้างฟังก์ชัน navigate สำหรับเปลี่ยนหน้า
    const userId = localStorage.getItem('user_id'); // ดึง ID ผู้ใช้ปัจจุบันจาก LocalStorage
    
    // รายชื่อ ID ของผู้ใช้ที่มีสิทธิ์เข้าถึงหน้านี้ (Admin Only)
    const ALLOWED_IDS = ["d8eb372a-d196-44fc-a73b-1809f27e0a56", "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e"];
    
    // กำหนด URL ของ API โดยเช็คว่าเป็นเครื่องตัวเองหรือ Server จริง
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' 
        : 'https://lover-app-jjoe.onrender.com';

    // Effect: ตรวจสอบสิทธิ์ผู้ใช้ทันทีที่หน้าเว็บโหลด
    useEffect(() => {
        if (!ALLOWED_IDS.includes(userId)) {
            alert("ขออภัยครับ หน้านี้สำหรับเจ้าของแอปเท่านั้น ✨"); // แจ้งเตือนหากไม่มีสิทธิ์
            navigate('/'); // ส่งกลับไปหน้าแรกทันที
        }
    }, [userId, navigate]);

    // Effect: ดึงข้อมูลการตั้งค่าปัจจุบันจากฐานข้อมูล
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/home-config/get`);
                const newConfig = { slideshow: [], fixed: [], mosaic: { pc: '', mobile: '' } };
                
                res.data.forEach(item => {
                    // แปลงข้อมูลจาก JSON string ในฐานข้อมูลกลับเป็น Object
                    const parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                    newConfig[item.config_type] = parsedData;
                });
                setConfig(newConfig); // อัปเดตข้อมูลเข้าสู่ State
            } catch (err) { 
                console.error("Fetch Config Error:", err); 
            } finally { 
                setLoading(false); // ปิดสถานะการโหลด
            }
        };
        fetchConfig();
    }, [API_URL]);

    // ฟังก์ชันจัดการอัปโหลดรูปภาพ (พร้อมระบบบีบอัดและแก้ปัญหาชื่อไฟล์ Error)
    const handleFileUpload = async (e, type, index = null, subType = null) => {
        const file = e.target.files[0]; // รับไฟล์ที่ผู้ใช้เลือก
        if (!file) return;
        setUploading(true); // เริ่มแสดงสถานะ Loading Overlay
        
        try {
            // --- ขั้นตอนการบีบอัดรูปภาพ (Compression) ---
            const options = {
                maxSizeMB: 0.1, // บีบอัดให้ขนาดไม่เกิน 100KB
                maxWidthOrHeight: 1920, 
                useWebWorker: true 
            };
            const compressedFile = await imageCompression(file, options); // เริ่มบีบอัด
            // ------------------------------------------

            // ✅ แก้ไข: ตั้งชื่อไฟล์ใหม่โดยใช้เพียง Timestamp เพื่อป้องกัน Error Invalid Key (ช่องว่าง/อักขระพิเศษ)
            const fileExt = file.name.split('.').pop();
            const fileName = `home-${type}-${Date.now()}.${fileExt}`;
            
            // อัปโหลดไฟล์ที่ "บีบอัดแล้ว" ขึ้นไปยัง Supabase Storage ใน Bucket 'profiles'
            const { error } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
            if (error) throw error;
            
            // ขอรับ URL สาธารณะของรูปภาพที่อัปโหลดเสร็จ
            const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(fileName);
            const publicUrl = urlData.publicUrl;

            // อัปเดตข้อมูลใน State ตามประเภทที่อัปโหลด
            let updatedConfig = { ...config };
            if (type === 'slideshow') {
                updatedConfig.slideshow[index].mobile = publicUrl;
                updatedConfig.slideshow[index].pc = publicUrl;
            } else if (type === 'fixed') {
                updatedConfig.fixed[index] = publicUrl;
            } else if (type === 'mosaic') {
                updatedConfig.mosaic[subType] = publicUrl; 
            }
            setConfig(updatedConfig); // เซ็ตค่าใหม่เพื่อให้ UI แสดงรูปตัวอย่างทันที
        } catch (err) { 
            console.error(err);
            alert("Upload Failed: " + err.message); 
        } finally { 
            setUploading(false); // ปิดสถานะ Loading Overlay
        }
    };

    // ✅ ฟังก์ชันสำหรับล้างรูปภาพออกจากส่วนต่างๆ (ก่อนกดบันทึก)
    const handleRemoveFile = (type, index = null, subType = null) => {
        let updatedConfig = { ...config };
        if (type === 'slideshow') {
            updatedConfig.slideshow[index].mobile = '';
            updatedConfig.slideshow[index].pc = '';
        } else if (type === 'fixed') {
            updatedConfig.fixed[index] = '';
        } else if (type === 'mosaic') {
            updatedConfig.mosaic[subType] = '';
        }
        setConfig(updatedConfig);
    };

    // ฟังก์ชันบันทึกข้อมูลการตั้งค่าลงฐานข้อมูล (บันทึกทีละหมวดหมู่)
    const saveToDB = async (configType) => {
        try {
            // ส่งข้อมูลกลับไปบันทึกผ่าน API POST (ต้องแปลงเป็น String ก่อนส่ง)
            await axios.post(`${API_URL}/api/home-config/update`, {
                config_type: configType,
                data: JSON.stringify(config[configType])
            });
            alert(`บันทึกข้อมูล ${configType} เรียบร้อยแล้ว ❤️`);
        } catch (err) { 
            console.error("Save Error:", err);
            alert("Save Failed"); 
        }
    };

    // แสดงข้อความ Loading ระหว่างดึงข้อมูลครั้งแรก
    if (loading) return <div className="p-10 text-center font-bold animate-pulse text-rose-500">กำลังเตรียมข้อมูล...</div>;

    // ดึงตัวแปรจาก State ออกมาใช้งานเพื่อให้โค้ดในส่วน JSX สั้นลง
    const slideshow = config.slideshow || [];
    const fixed = config.fixed || [];
    const mosaic = config.mosaic || { pc: '', mobile: '' };

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24 font-bold">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header ส่วนหัวพร้อมปุ่มย้อนกลับ */}
                <header className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rose-500 transition-colors"><ArrowLeft size={24}/></button>
                    <h1 className="text-2xl font-black text-slate-800 italic uppercase">Home Editor</h1>
                </header>

                {/* ส่วนที่ 1: Slideshow Editor */}
                <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-sm font-black text-slate-700 uppercase italic flex items-center gap-2">📸 Slideshow</h2>
                        <button onClick={() => setConfig({...config, slideshow: [...slideshow, {pc:'', mobile:'', caption:''}]})} className="bg-rose-100 text-rose-500 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 active:scale-90 transition-transform">
                            <Plus size={16}/> เพิ่มรูปใหม่
                        </button>
                    </div>
                    <div className="space-y-4">
                        {slideshow.map((item, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-3xl space-y-3 relative border border-slate-100 shadow-inner">
                                <div className="flex gap-4">
                                    <div className="relative w-20 h-20 shrink-0">
                                        <label className="w-full h-full bg-white rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer">
                                            {item.mobile ? <img src={item.mobile} className="w-full h-full object-cover" alt="Preview"/> : <Plus size={24} className="text-slate-300"/>}
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'slideshow', idx)}/>
                                        </label>
                                        {/* ✅ ปุ่มลบรูปภาพย่อย */}
                                        {item.mobile && <button type="button" onClick={() => handleRemoveFile('slideshow', idx)} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-md z-10"><X size={10}/></button>}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-[10px] text-slate-400 uppercase italic">Caption (คำบรรยายใต้ภาพ)</p>
                                        <textarea placeholder="ใส่คำหวานๆ..." value={item.caption} onChange={(e) => {
                                                let updated = [...slideshow];
                                                updated[idx].caption = e.target.value;
                                                setConfig({...config, slideshow: updated});
                                            }} className="w-full text-xs p-3 rounded-xl border-0 bg-white shadow-sm h-16"/>
                                    </div>
                                </div>
                                <button onClick={() => setConfig({...config, slideshow: slideshow.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-white text-rose-500 p-2 rounded-full shadow-lg border border-rose-50 active:scale-75">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => saveToDB('slideshow')} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Save size={20}/> บันทึก Slideshow
                    </button>
                </section>

                {/* ส่วนที่ 2: Fixed Photos Editor */}
                <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                    <h2 className="text-sm font-black text-slate-700 uppercase italic border-b pb-3 flex items-center gap-2">🖼️ รูปภาพหน้าเว็บไซต์ (5 รูป)</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 uppercase">ฝั่งซ้าย (ลำดับที่ 1-3)</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[0, 1, 2].map(idx => (
                                    <div key={idx} className="relative aspect-square">
                                        <label className="w-full h-full bg-slate-50 rounded-2xl overflow-hidden cursor-pointer relative border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-rose-300 transition-colors">
                                            {fixed[idx] ? <img src={fixed[idx]} className="w-full h-full object-cover" alt="Fixed"/> : <div className="text-center"><Plus size={20} className="mx-auto text-slate-300"/><span className="text-[9px] text-slate-300">{idx+1}</span></div>}
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'fixed', idx)}/>
                                        </label>
                                        {/* ✅ ปุ่มล้างค่ารูปภาพคงที่ */}
                                        {fixed[idx] && <button type="button" onClick={() => handleRemoveFile('fixed', idx)} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-md z-10"><X size={10}/></button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 uppercase">ฝั่งขวา (ลำดับที่ 4-5)</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[3, 4].map(idx => (
                                    <div key={idx} className="relative aspect-video">
                                        <label className="w-full h-full bg-slate-50 rounded-2xl overflow-hidden cursor-pointer relative border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-rose-300 transition-colors">
                                            {fixed[idx] ? <img src={fixed[idx]} className="w-full h-full object-cover" alt="Fixed"/> : <div className="text-center"><Plus size={20} className="mx-auto text-slate-300"/><span className="text-[9px] text-slate-300">{idx+1}</span></div>}
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'fixed', idx)}/>
                                        </label>
                                        {/* ✅ ปุ่มล้างค่ารูปภาพคงที่ */}
                                        {fixed[idx] && <button type="button" onClick={() => handleRemoveFile('fixed', idx)} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-md z-10"><X size={10}/></button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => saveToDB('fixed')} className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Save size={20}/> บันทึกรูปภาพ
                    </button>
                </section>

                {/* ส่วนที่ 3: Mosaic Editor */}
                <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                    <h2 className="text-sm font-black text-slate-700 uppercase italic border-b pb-3 flex items-center gap-2">🧩 รูปพิกเซล</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase"><Smartphone size={16}/> สำหรับมือถือ</div>
                        <div className="relative aspect-[9/16] max-w-[150px] mx-auto">
                            <label className="block w-full h-full bg-slate-50 rounded-3xl overflow-hidden relative border-4 border-dashed border-slate-200 cursor-pointer group hover:border-rose-400 transition-all">
                                {mosaic.mobile ? <img src={mosaic.mobile} className="w-full h-full object-cover" alt="Mobile Mosaic"/> : <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300"><Plus size={32}/><span className="text-[10px]">เลือกรูปมือถือ</span></div>}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition-opacity">เปลี่ยนรูป</div>
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'mosaic', null, 'mobile')}/>
                            </label>
                            {/* ✅ ปุ่มล้างค่ารูปพิกเซลมือถือ */}
                            {mosaic.mobile && <button type="button" onClick={() => handleRemoveFile('mosaic', null, 'mobile')} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md z-10"><X size={14}/></button>}
                        </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-sky-400 text-xs font-black uppercase"><Monitor size={16}/> สำหรับคอมพิวเตอร์</div>
                        <div className="relative aspect-video">
                            <label className="block w-full h-full bg-slate-50 rounded-3xl overflow-hidden relative border-4 border-dashed border-slate-200 cursor-pointer group hover:border-sky-400 transition-all">
                                {mosaic.pc ? <img src={mosaic.pc} className="w-full h-full object-cover" alt="PC Mosaic"/> : <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300"><Plus size={32}/><span className="text-[10px]">เลือกรูปคอม</span></div>}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition-opacity">เปลี่ยนรูป</div>
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'mosaic', null, 'pc')}/>
                            </label>
                            {/* ✅ ปุ่มล้างค่ารูปพิกเซลคอมพิวเตอร์ */}
                            {mosaic.pc && <button type="button" onClick={() => handleRemoveFile('mosaic', null, 'pc')} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md z-10"><X size={14}/></button>}
                        </div>
                    </div>
                    <button onClick={() => saveToDB('mosaic')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95 font-black uppercase tracking-widest text-sm italic">
                        <Save size={20}/> บันทึกรูปพิกเซล
                    </button>
                </section>
            </div>

            {/* ส่วนแสดงสถานะโหลด (Loading Overlay) */}
            {uploading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[999] flex-col gap-4">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-rose-500 font-black italic animate-pulse">กำลังบีบอัดและอัปโหลดรูปภาพ...</p>
                </div>
            )}
        </div>
    );
};

export default HomeAdminPage;