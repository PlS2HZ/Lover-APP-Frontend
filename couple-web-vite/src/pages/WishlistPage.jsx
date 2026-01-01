/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react'; // นำเข้า React Hooks พื้นฐานสำหรับจัดการสถานะและ Lifecycle
import axios from 'axios'; // นำเข้า axios สำหรับสื่อสารกับ Backend API
import { Gift, Plus, CheckCircle, Trash2, X, Link as LinkIcon, Image as ImageIcon, Star, Shuffle, MessageSquare, Users, Filter, Loader2 } from 'lucide-react'; // นำเข้าไอคอนต่างๆ เพิ่ม Loader2 และ Trash2
import { createClient } from '@supabase/supabase-js'; // นำเข้า Client สำหรับเชื่อมต่อ Supabase Storage
import imageCompression from 'browser-image-compression'; // นำเข้า Library สำหรับบีบอัดรูปภาพฝั่ง Client

// สร้างการเชื่อมต่อกับ Supabase โดยใช้ค่าจากไฟล์ Environment
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const WishlistPage = () => {
    // ดึง user_id ของผู้ใช้ปัจจุบันจาก LocalStorage
    const userId = localStorage.getItem('user_id');
    // กำหนด URL ของ API โดยเช็คว่าเป็น Localhost หรือ Server จริง
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';
    // ID ของคู่รักที่กำหนดไว้ตายตัว (Hardcode)
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e"; 
    
    // State: เก็บรายการของขวัญทั้งหมด
    const [items, setItems] = useState([]);
    // State: เก็บรายชื่อผู้ใช้ทั้งหมด
    const [allUsers, setAllUsers] = useState([]);
    // State: ควบคุมการเปิด/ปิดฟอร์มเพิ่มของขวัญ
    const [showAdd, setShowAdd] = useState(false);
    // State: สถานะการโหลดข้อมูลเริ่มต้น
    const [loading, setLoading] = useState(true);
    // State: สถานะกำลังอัปโหลดรูปภาพ
    const [uploading, setUploading] = useState(false);
    // State: เก็บข้อมูลของขวัญชิ้นใหม่ที่จะเพิ่ม
    const [newItem, setNewItem] = useState({ name: '', desc: '', url: '', image_url: '', priority: 3, price_range: 'หลักร้อย' });

    // State: ควบคุมการแสดงหน้าตั้งค่าสุ่มกาชา
    const [showGachaConfig, setShowGachaConfig] = useState(false);
    // State: เก็บค่าการตั้งค่าสำหรับการสุ่ม
    const [gachaConfig, setGachaConfig] = useState({ targetId: LOVER_ID, minPriority: 1, priceRange: 'ทั้งหมด' });
    // State: เก็บผลลัพธ์ที่สุ่มได้
    const [gachaResult, setGachaResult] = useState(null);
    // State: สถานะ Animation การหมุนสุ่ม
    const [isSpinning, setIsSpinning] = useState(false);

    // ฟังก์ชันดึงข้อมูลจาก Server (ใช้ useCallback เพื่อลดการสร้างฟังก์ชันใหม่)
    const fetchData = useCallback(async () => {
        try {
            setLoading(true); // เริ่มสถานะ Loading
            // ดึงทั้งรายการของขวัญและรายชื่อผู้ใช้พร้อมกัน
            const [itemsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/wishlist/get`),
                axios.get(`${API_URL}/api/users`)
            ]);
            // กรองเอาเฉพาะรายการที่เรามีสิทธิ์เห็น
            const filtered = itemsRes.data.filter(item => item.user_id === userId || (item.visible_to && item.visible_to.includes(userId)));
            setItems(filtered || []);
            setAllUsers(usersRes.data || []);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); // จบสถานะ Loading
        }
    }, [userId, API_URL]);

    // เรียกดึงข้อมูลทันทีเมื่อเปิดหน้า
    useEffect(() => { fetchData(); }, [fetchData]);

    // ฟังก์ชันยืนยันการรับของขวัญสำเร็จ
    const confirmComplete = async (item) => {
        const confirmMsg = `ยืนยันว่ารายการนี้สำเร็จแล้วใช่ไหม?\n🎁 ของ: ${item.item_name}\n📝 รายละเอียด: ${item.item_description || '-'}`;
        if (window.confirm(confirmMsg)) {
            try {
                // อัปเดตสถานะเป็นสำเร็จผ่าน API Patch
                await axios.patch(`${API_URL}/api/wishlist/complete?id=${item.id}`);
                fetchData(); // ดึงข้อมูลใหม่มาแสดง
            } catch (err) { alert("อัปเดตไม่สำเร็จ"); }
        }
    };

    // ฟังก์ชันจัดการอัปโหลดไฟล์ (แก้ไขปัญหา Invalid Key และเพิ่มระบบบีบอัด)
    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; // รับไฟล์ดิบจาก Input
        if (!file) return;
        try {
            setUploading(true); // เริ่มสถานะอัปโหลด

            // --- ส่วนการบีบอัดรูปภาพ (Compression Logic) ---
            const options = {
                maxSizeMB: 0.1, // บีบอัดให้เหลือสูงสุดไม่เกิน 100KB
                maxWidthOrHeight: 1280, // ปรับขนาดด้านที่ยาวที่สุดไม่เกิน 1280px
                useWebWorker: true // ใช้ Worker ช่วยประมวลผลเพื่อไม่ให้หน้าจอค้าง
            };

            const compressedFile = await imageCompression(file, options); // สั่งบีบอัด
            // ---------------------------------------------

            // ✅ แก้ไข: ตั้งชื่อไฟล์ใหม่โดยใช้ Timestamp และล้างชื่อเดิมทิ้ง เพื่อป้องกันปัญหา Invalid Key (ช่องว่าง/อักขระพิเศษ)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            // อัปโหลดไฟล์ที่ "บีบอัดแล้ว" (compressedFile) ขึ้นไปเก็บที่ Supabase Storage
            const { error: uploadError } = await supabase.storage.from('wishlist_images').upload(fileName, compressedFile);
            
            if (uploadError) throw uploadError; // หากมี Error จะดีดไปที่ Catch

            // ดึง URL สาธารณะของรูปภาพมาใช้งาน
            const { data: { publicUrl } } = supabase.storage.from('wishlist_images').getPublicUrl(fileName);
            
            // อัปเดต State เพื่อแสดงรูปตัวอย่าง
            setNewItem({ ...newItem, image_url: publicUrl });
        } catch (err) { 
            console.error(err);
            alert("อัปโหลดไม่สำเร็จ"); 
        } finally { 
            setUploading(false); // จบสถานะอัปโหลด
        }
    };

    // ✅ ฟังก์ชันสำหรับลบรูปภาพออกจากฟอร์ม (ก่อนกดบันทึก)
    const handleRemoveImage = () => {
        setNewItem(prev => ({ ...prev, image_url: '' })); // ล้างค่า URL รูปใน State ทิ้ง
    };

    // ฟังก์ชันบันทึกของขวัญชิ้นใหม่
    const handleAdd = async () => {
        if (!newItem.name.trim()) return alert("ใส่ชื่อของหน่อย");
        if (!newItem.url.trim() && !newItem.image_url) return alert("ต้องใส่ลิงก์หรือรูปอย่างใดอย่างหนึ่ง!");
        try {
            // บันทึกข้อมูลลงฐานข้อมูลผ่าน API POST
            await axios.post(`${API_URL}/api/wishlist/save`, {
                user_id: userId, item_name: newItem.name, item_description: newItem.desc,
                item_url: newItem.url, image_url: newItem.image_url, priority: newItem.priority,
                price_range: newItem.price_range, visible_to: [userId, LOVER_ID]
            });
            // ล้างข้อมูลในฟอร์มและปิดหน้าต่างเพิ่ม
            setNewItem({ name: '', desc: '', url: '', image_url: '', priority: 3, price_range: 'หลักร้อย' });
            setShowAdd(false); 
            fetchData();
        } catch (err) { alert("เพิ่มไม่สำเร็จ"); }
    };

    // ฟังก์ชันระบบสุ่มกาชา
    const handleRunGacha = () => {
        // กรองรายการที่จะนำมาสุ่มตามเงื่อนไขที่ผู้ใช้เลือก
        let pool = items.filter(i => i.user_id === gachaConfig.targetId && !i.is_received);
        pool = pool.filter(i => i.priority >= gachaConfig.minPriority);
        if (gachaConfig.priceRange !== 'ทั้งหมด') pool = pool.filter(i => i.price_range === gachaConfig.priceRange);

        if (pool.length === 0) return alert("ไม่มีรายการที่ตรงตามเงื่อนไขนี้เลยนาย");
        
        setShowGachaConfig(false); // ปิดหน้าตั้งค่า
        setIsSpinning(true); // เริ่มเล่น Animation
        
        // หน่วงเวลาเพื่อความตื่นเต้นก่อนแสดงผล
        setTimeout(() => {
            setGachaResult(pool[Math.floor(Math.random() * pool.length)]);
            setIsSpinning(false); // หยุด Animation
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header ส่วนหัวของหน้า */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Wishlist</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Dreams Catalog ✨</p>
                    </div>
                    <div className="flex gap-2">
                        {/* ปุ่มเปิดระบบสุ่มกาชา */}
                        <button onClick={() => setShowGachaConfig(true)} className="p-3 bg-purple-500 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                            <Shuffle size={20} />
                        </button>
                        {/* ปุ่มเปิดฟอร์มเพิ่มของขวัญ */}
                        <button onClick={() => setShowAdd(!showAdd)} className={`p-3 rounded-2xl shadow-lg transition-all ${showAdd ? 'bg-slate-200' : 'bg-rose-500 text-white'}`}>
                            {showAdd ? <X size={20} /> : <Plus size={20} />}
                        </button>
                    </div>
                </header>

                {/* หน้าต่างตั้งค่าการสุ่ม (Modal) */}
                {showGachaConfig && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 text-left">
                        <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 space-y-6 animate-in zoom-in duration-300">
                            <h2 className="text-xl font-black italic uppercase text-purple-600 flex items-center gap-2"><Filter size={20}/> Gacha Surprise</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block">1. เลือกสุ่มจาก Wishlist ของ:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allUsers.map(u => (
                                            <button key={u.id} onClick={() => setGachaConfig({...gachaConfig, targetId: u.id})} className={`p-3 rounded-2xl text-[10px] border-2 transition-all ${gachaConfig.targetId === u.id ? 'bg-purple-50 border-purple-400 text-purple-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>{u.username}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block">2. ความอยากได้ขั้นต่ำ ({gachaConfig.minPriority} ดาว)</label>
                                    <div className="flex gap-2">
                                        {[1,2,3,4,5].map(v => (
                                            <Star key={v} size={20} onClick={() => setGachaConfig({...gachaConfig, minPriority: v})} className={gachaConfig.minPriority >= v ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 cursor-pointer'} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowGachaConfig(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">ยกเลิก</button>
                                <button onClick={handleRunGacha} className="flex-2 py-4 bg-purple-500 text-white rounded-2xl font-black uppercase text-[10px] px-8">เริ่มสุ่มเลย!</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* หน้าต่างแสดงผลลัพธ์การสุ่ม (Gacha Result) */}
                {(isSpinning || gachaResult) && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-6 text-center">
                        <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 space-y-4 shadow-2xl border-4 border-purple-200 animate-in zoom-in duration-300">
                            {isSpinning ? <div className="py-10 space-y-4"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-[10px] font-black uppercase text-purple-500">กำลังเขย่ากล่องสุ่ม...</p></div> :
                                <>
                                    <div className="text-4xl">🎁</div>
                                    <h2 className="text-lg font-black text-purple-600 uppercase">เย้! สุ่มได้ชิ้นนี้</h2>
                                    <div className="bg-slate-50 p-5 rounded-3xl border-2 border-dashed border-purple-200">
                                        <p className="text-sm font-black">{gachaResult.item_name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{gachaResult.price_range} • {gachaResult.priority}⭐</p>
                                    </div>
                                    <button onClick={() => setGachaResult(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase">ปิด</button>
                                </>
                            }
                        </div>
                    </div>
                )}

                {/* ฟอร์มสำหรับเพิ่มรายการของขวัญใหม่ */}
                {showAdd && (
                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-rose-100 space-y-4 shadow-xl">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl text-xs border-none outline-none font-bold" placeholder="ชื่อของ..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        <div className="relative">
                            <textarea className="w-full p-4 pl-10 bg-slate-50 rounded-2xl text-xs border-none outline-none font-bold h-20 resize-none" placeholder="รายละเอียด (สี/ไซส์/รุ่น)..." value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})} />
                            <MessageSquare className="absolute left-3 top-4 text-slate-300" size={16} />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <label className="text-[8px] uppercase text-slate-400 block mb-2 font-black">ความอยากได้ (1-5)</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(v => (
                                        <Star key={v} size={18} onClick={() => setNewItem({...newItem, priority: v})} className={newItem.priority >= v ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 cursor-pointer'} />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <label className="text-[8px] uppercase text-slate-400 block mb-2 font-black">ช่วงราคา</label>
                                <div className="flex flex-wrap gap-2">
                                    {['หลักสิบ', 'หลักร้อย', 'หลักพัน', 'หลักหมื่น+'].map(v => (
                                        <button key={v} onClick={() => setNewItem({...newItem, price_range: v})} className={`px-3 py-2 rounded-xl text-[9px] font-black border-2 transition-all ${newItem.price_range === v ? 'bg-white border-emerald-400 text-emerald-600' : 'bg-white border-transparent text-slate-300'}`}>{v}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input className="w-full p-4 pl-10 bg-slate-50 rounded-2xl text-[10px] outline-none font-bold" placeholder="ลิงก์สินค้า..." value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} />
                                <LinkIcon className="absolute left-3 top-4 text-slate-300" size={16} />
                            </div>
                            <label className="p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 flex items-center justify-center">
                                <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                {uploading ? <Loader2 size={20} className="animate-spin text-rose-500" /> : <ImageIcon className={newItem.image_url ? "text-rose-500" : "text-slate-300"} size={20} />}
                            </label>
                        </div>
                        {/* แสดงรูปตัวอย่างก่อนอัปโหลด พร้อมปุ่มลบรูปภาพ */}
                        {newItem.image_url && (
                            <div className="relative w-full h-32 group">
                                <img src={newItem.image_url} className="w-full h-full object-cover rounded-2xl border-2 border-rose-50 shadow-inner" alt="Preview" />
                                <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        {/* ปุ่มกดบันทึกรายการ (จะ Disable ขณะอัปโหลดรูป) */}
                        <button onClick={handleAdd} disabled={uploading} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs shadow-md">
                            {uploading ? "กำลังบันทึกรูป..." : "เพิ่มลงรายการ ✨"}
                        </button>
                    </div>
                )}

                {/* List แสดงรายการของขวัญทั้งหมดที่แสดงเป็นการ์ด */}
                <div className="grid gap-4">
                    {loading ? ( <div className="text-center py-10 text-slate-300 animate-pulse uppercase text-[10px] font-black">กำลังดึงข้อมูล...</div> ) : (
                        items.map((item) => (
                            <div key={item.id} className={`p-4 rounded-[2.5rem] border-2 flex items-center gap-4 transition-all ${item.is_received ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-white border-white shadow-sm'}`}>
                                <div className="relative">
                                    {item.image_url ? ( <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover" alt="" /> ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100"><Gift size={24} /></div>
                                    )}
                                    <div className="absolute -top-1 -right-1 bg-white px-2 py-0.5 rounded-full text-[7px] font-black shadow-sm border border-slate-100 text-emerald-500 uppercase">{item.price_range}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1">
                                        <h3 className="text-xs font-black uppercase tracking-tight">{item.item_name}</h3>
                                        <span className="text-[8px] text-yellow-500 flex">
                                            {[...Array(item.priority)].map((_, i) => <Star key={i} size={8} className="fill-current" />)}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold italic line-clamp-1">{item.item_description || "ไม่มีรายละเอียด"}</p>
                                    {item.item_url && ( <a href={item.item_url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-blue-400 font-black flex items-center gap-1 mt-1 uppercase hover:underline"><LinkIcon size={8} /> ลิงก์สินค้า</a> )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* ปุ่มลบรายการ (แสดงเฉพาะเจ้าของ) */}
                                    {item.user_id === userId && ( <button onClick={() => axios.delete(`${API_URL}/api/wishlist/delete?id=${item.id}`).then(fetchData)} className="p-2 text-rose-200 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button> )}
                                    {/* ปุ่มยืนยันเมื่อได้รับของแล้ว */}
                                    {!item.is_received && ( <button onClick={() => confirmComplete(item)} className="p-2 text-emerald-300 hover:text-emerald-500 transition-colors"><CheckCircle size={22}/></button> )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;