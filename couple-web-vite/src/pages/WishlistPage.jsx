/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react'; // นำเข้า React Hooks: useState (เก็บสถานะ), useEffect (Side effect), useCallback (จำฟังก์ชันเพื่อลดการสร้างใหม่)
import axios from 'axios'; // นำเข้า axios สำหรับการส่ง HTTP Request ไปยัง API
import { Gift, Plus, CheckCircle, Trash2, X, Link as LinkIcon, Image as ImageIcon, Star, Shuffle, MessageSquare, Users, Filter } from 'lucide-react'; // นำเข้าไอคอนต่างๆ จาก Lucide Library
import { createClient } from '@supabase/supabase-js'; // นำเข้า Client ของ Supabase เพื่อติดต่อฐานข้อมูล/Storage

// สร้างการเชื่อมต่อกับ Supabase โดยใช้ URL และ Key จากไฟล์ .env
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const WishlistPage = () => {
    // ดึง user_id ของผู้ใช้ปัจจุบันที่เก็บไว้ใน LocalStorage
    const userId = localStorage.getItem('user_id');
    // กำหนด URL ของ API Backend (Localhost ถ้าอยู่ในเครื่อง, Onrender ถ้าอยู่บนเว็บจริง)
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';
    // กำหนด ID ของคู่รัก (Hardcode ไว้ตามโค้ดเดิม)
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e"; 
    
    // State: เก็บรายการของขวัญทั้งหมดที่ดึงมาจาก API
    const [items, setItems] = useState([]);
    // State: เก็บรายชื่อ User ทั้งหมดเพื่อใช้ในการ Filter
    const [allUsers, setAllUsers] = useState([]);
    // State: ควบคุมการแสดงฟอร์มเพิ่มของขวัญ (Toggle เปิด/ปิด)
    const [showAdd, setShowAdd] = useState(false);
    // State: สถานะ Loading ขณะดึงข้อมูล (True = กำลังโหลด)
    const [loading, setLoading] = useState(true);
    // State: สถานะ Uploading ขณะอัปโหลดรูปภาพ (True = กำลังอัปโหลด)
    const [uploading, setUploading] = useState(false);
    // State: เก็บข้อมูลของขวัญชิ้นใหม่ที่กำลังจะเพิ่ม (ชื่อ, รายละเอียด, ลิงก์, รูป, ความสำคัญ, ช่วงราคา)
    const [newItem, setNewItem] = useState({ name: '', desc: '', url: '', image_url: '', priority: 3, price_range: 'หลักร้อย' });

    // State: ควบคุมการแสดง Modal ตั้งค่าการสุ่มกาชา (True = แสดง)
    const [showGachaConfig, setShowGachaConfig] = useState(false);
    // State: เก็บค่า Config สำหรับการสุ่ม (สุ่มของใคร, ความสำคัญขั้นต่ำเท่าไหร่, ราคาช่วงไหน)
    const [gachaConfig, setGachaConfig] = useState({ targetId: LOVER_ID, minPriority: 1, priceRange: 'ทั้งหมด' });
    // State: เก็บผลลัพธ์ที่สุ่มได้ (Item Object)
    const [gachaResult, setGachaResult] = useState(null);
    // State: สถานะ Animation การหมุนสุ่ม (True = กำลังหมุนติ้วๆ)
    const [isSpinning, setIsSpinning] = useState(false);

    // ฟังก์ชันดึงข้อมูล (ใช้ useCallback เพื่อไม่ให้สร้างฟังก์ชันใหม่ถ้า userId/API_URL ไม่เปลี่ยน)
    const fetchData = useCallback(async () => {
        try {
            setLoading(true); // เริ่มสถานะโหลด
            // ใช้ Promise.all เพื่อยิง API 2 ตัวพร้อมกัน (ดึงของขวัญ และ ดึง Users)
            const [itemsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/wishlist/get`),
                axios.get(`${API_URL}/api/users`)
            ]);
            // กรองข้อมูล: เอาเฉพาะของตัวเอง หรือ ของที่อนุญาตให้เราเห็น (visible_to)
            const filtered = itemsRes.data.filter(item => item.user_id === userId || (item.visible_to && item.visible_to.includes(userId)));
            setItems(filtered || []); // อัปเดต State รายการของขวัญ
            setAllUsers(usersRes.data || []); // อัปเดต State รายชื่อ Users
        } catch (err) { console.error(err); } finally { setLoading(false); } // จบการโหลดไม่ว่าจะสำเร็จหรือพลาด
    }, [userId, API_URL]);

    // useEffect: สั่งให้ fetchData ทำงานทันทีเมื่อ Component ถูกโหลดครั้งแรก
    useEffect(() => { fetchData(); }, [fetchData]);

    // ✅ ฟังก์ชันกดยืนยันสำเร็จ (มาตรการป้องกัน)
    const confirmComplete = async (item) => {
        // สร้างข้อความยืนยัน
        const confirmMsg = `ยืนยันว่ารายการนี้สำเร็จแล้วใช่ไหม?\n🎁 ของ: ${item.item_name}\n📝 รายละเอียด: ${item.item_description || '-'}`;
        // แสดง Browser Alert ให้กดยืนยัน
        if (window.confirm(confirmMsg)) {
            try {
                // ยิง API Patch เพื่ออัปเดตสถานะว่าได้รับแล้ว (Complete)
                await axios.patch(`${API_URL}/api/wishlist/complete?id=${item.id}`);
                fetchData(); // ดึงข้อมูลใหม่เพื่ออัปเดตหน้าจอ
            } catch (err) { alert("อัปเดตไม่สำเร็จ"); }
        }
    };

    // ฟังก์ชันจัดการเมื่อเลือกไฟล์รูปภาพ
    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; // ดึงไฟล์จาก Input
        if (!file) return; // ถ้าไม่มีไฟล์ก็จบ
        try {
            setUploading(true); // เริ่มสถานะอัปโหลด
            // ตั้งชื่อไฟล์ (ใช้ Timestamp + ชื่อเดิม กันชื่อซ้ำ)
            const fileName = `${Date.now()}_${file.name}`;
            // อัปโหลดขึ้น Supabase Storage ใน Bucket 'wishlist_images'
            const { error: uploadError } = await supabase.storage.from('wishlist_images').upload(fileName, file);
            if (uploadError) throw uploadError;
            // ขอ Public URL ของรูปที่อัปโหลดเสร็จแล้ว
            const { data: { publicUrl } } = supabase.storage.from('wishlist_images').getPublicUrl(fileName);
            // อัปเดต State newItem ให้มี URL รูปภาพ
            setNewItem({ ...newItem, image_url: publicUrl });
        } catch (err) { alert("อัปโหลดไม่สำเร็จ"); } finally { setUploading(false); } // จบสถานะอัปโหลด
    };

    // ฟังก์ชันบันทึกของขวัญใหม่
    const handleAdd = async () => {
        if (!newItem.name.trim()) return alert("ใส่ชื่อของหน่อย"); // Validate ชื่อห้ามว่าง
        if (!newItem.url.trim() && !newItem.image_url) return alert("ต้องใส่ลิงก์หรือรูปอย่างใดอย่างหนึ่ง!"); // Validate ต้องมีลิ้งค์หรือรูป
        try {
            // ยิง API POST เพื่อบันทึกข้อมูล
            await axios.post(`${API_URL}/api/wishlist/save`, {
                user_id: userId, item_name: newItem.name, item_description: newItem.desc,
                item_url: newItem.url, image_url: newItem.image_url, priority: newItem.priority,
                price_range: newItem.price_range, visible_to: [userId, LOVER_ID] // กำหนดให้เห็นได้ทั้งเราและแฟน
            });
            // เคลียร์ค่าในฟอร์มให้ว่าง
            setNewItem({ name: '', desc: '', url: '', image_url: '', priority: 3, price_range: 'หลักร้อย' });
            setShowAdd(false); fetchData(); // ปิดฟอร์มและดึงข้อมูลใหม่
        } catch (err) { alert("เพิ่มไม่สำเร็จ"); }
    };

    // ฟังก์ชันสุ่มของขวัญ (Gacha Logic)
    const handleRunGacha = () => {
        // 1. กรอง Pool ของที่จะสุ่ม: เลือกเฉพาะของ TargetUser และต้องยังไม่ได้รับ (not received)
        let pool = items.filter(i => i.user_id === gachaConfig.targetId && !i.is_received);
        // 2. กรองตามความสำคัญขั้นต่ำ
        pool = pool.filter(i => i.priority >= gachaConfig.minPriority);
        // 3. กรองตามช่วงราคา (ถ้าเลือก 'ทั้งหมด' ก็ไม่ต้องกรอง)
        if (gachaConfig.priceRange !== 'ทั้งหมด') pool = pool.filter(i => i.price_range === gachaConfig.priceRange);

        // ถ้าไม่มีของเหลือให้สุ่มเลย แจ้งเตือน
        if (pool.length === 0) return alert("ไม่มีรายการที่ตรงตามเงื่อนไขนี้เลยนาย");
        
        setShowGachaConfig(false); // ปิดหน้าตั้งค่า
        setIsSpinning(true); // เริ่ม Animation หมุนๆ
        
        // หน่วงเวลา 1.5 วินาที เพื่อความตื่นเต้น
        setTimeout(() => {
            // สุ่ม Index จาก Pool แล้วเลือกของชิ้นนั้นมาแสดง
            setGachaResult(pool[Math.floor(Math.random() * pool.length)]);
            setIsSpinning(false); // หยุดหมุน
        }, 1500);
    };

    return (
        // Wrapper หลักของหน้า กำหนดพื้นหลังและระยะห่าง
        <div className="min-h-screen bg-slate-50/50 p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6">
                {/* ส่วน Header ด้านบน */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Wishlist</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Dreams Catalog ✨</p>
                    </div>
                    <div className="flex gap-2">
                        {/* ✅ ปุ่มสุ่มกาชา: กดแล้วเปิด Modal Config */}
                        <button onClick={() => setShowGachaConfig(true)} className="p-3 bg-purple-500 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                            <Shuffle size={20} />
                        </button>
                        {/* ปุ่มเปิด/ปิดฟอร์มเพิ่มของ: สลับ Icon ตามสถานะ showAdd */}
                        <button onClick={() => setShowAdd(!showAdd)} className={`p-3 rounded-2xl shadow-lg transition-all ${showAdd ? 'bg-slate-200' : 'bg-rose-500 text-white'}`}>
                            {showAdd ? <X size={20} /> : <Plus size={20} />}
                        </button>
                    </div>
                </header>

                {/* Gacha Config Modal: แสดงเมื่อ showGachaConfig เป็น true */}
                {showGachaConfig && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 text-left">
                        <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 space-y-6 animate-in zoom-in duration-300">
                            <h2 className="text-xl font-black italic uppercase text-purple-600 flex items-center gap-2"><Filter size={20}/> Gacha Surprise</h2>
                            <div className="space-y-4">
                                {/* ตัวเลือก 1: เลือกเจ้าของ Wishlist */}
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block">1. เลือกสุ่มจาก Wishlist ของ:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allUsers.map(u => (
                                            <button key={u.id} onClick={() => setGachaConfig({...gachaConfig, targetId: u.id})} className={`p-3 rounded-2xl text-[10px] border-2 transition-all ${gachaConfig.targetId === u.id ? 'bg-purple-50 border-purple-400 text-purple-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>{u.username}</button>
                                        ))}
                                    </div>
                                </div>
                                {/* ตัวเลือก 2: ระดับความสำคัญขั้นต่ำ */}
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block">2. ความอยากได้ขั้นต่ำ ({gachaConfig.minPriority} ดาว)</label>
                                    <div className="flex gap-2">
                                        {[1,2,3,4,5].map(v => (
                                            <Star key={v} size={20} onClick={() => setGachaConfig({...gachaConfig, minPriority: v})} className={gachaConfig.minPriority >= v ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 cursor-pointer'} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* ปุ่ม Action: ยกเลิก หรือ เริ่มสุ่ม */}
                            <div className="flex gap-3">
                                <button onClick={() => setShowGachaConfig(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">ยกเลิก</button>
                                <button onClick={handleRunGacha} className="flex-2 py-4 bg-purple-500 text-white rounded-2xl font-black uppercase text-[10px] px-8">เริ่มสุ่มเลย!</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gacha Result Modal: แสดงเมื่อกำลังหมุน (isSpinning) หรือมีผลลัพธ์แล้ว (gachaResult) */}
                {(isSpinning || gachaResult) && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-6 text-center">
                        <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 space-y-4 shadow-2xl border-4 border-purple-200 animate-in zoom-in duration-300">
                            {/* ถ้ากำลังหมุน ให้แสดง Spinner */}
                            {isSpinning ? <div className="py-10 space-y-4"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-[10px] font-black uppercase text-purple-500">กำลังเขย่ากล่องสุ่ม...</p></div> :
                                // ถ้าได้ผลแล้ว ให้แสดงข้อมูลของขวัญ
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

                {/* Form เพิ่มของขวัญ: แสดงเมื่อ showAdd เป็น true */}
                {showAdd && (
                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-rose-100 space-y-4 shadow-xl">
                        {/* Input ชื่อของ */}
                        <input className="w-full p-4 bg-slate-50 rounded-2xl text-xs border-none outline-none font-bold" placeholder="ชื่อของ..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        {/* Textarea รายละเอียด */}
                        <div className="relative">
                            <textarea className="w-full p-4 pl-10 bg-slate-50 rounded-2xl text-xs border-none outline-none font-bold h-20 resize-none" placeholder="รายละเอียด (สี/ไซส์/รุ่น)..." value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})} />
                            <MessageSquare className="absolute left-3 top-4 text-slate-300" size={16} />
                        </div>
                        {/* ส่วนเลือก Priority และ ช่วงราคา */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* เลือกดาว 1-5 */}
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <label className="text-[8px] uppercase text-slate-400 block mb-2 font-black">ความอยากได้ (1-5)</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(v => (
                                        <Star key={v} size={18} onClick={() => setNewItem({...newItem, priority: v})} className={newItem.priority >= v ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 cursor-pointer'} />
                                    ))}
                                </div>
                            </div>
                            {/* เลือกช่วงราคา */}
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <label className="text-[8px] uppercase text-slate-400 block mb-2 font-black">ช่วงราคา</label>
                                <div className="flex flex-wrap gap-2">
                                    {['หลักสิบ', 'หลักร้อย', 'หลักพัน', 'หลักหมื่น+'].map(v => (
                                        <button key={v} onClick={() => setNewItem({...newItem, price_range: v})} className={`px-3 py-2 rounded-xl text-[9px] font-black border-2 transition-all ${newItem.price_range === v ? 'bg-white border-emerald-400 text-emerald-600' : 'bg-white border-transparent text-slate-300'}`}>{v}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Input ลิงก์ และ ปุ่มอัปโหลดรูป */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input className="w-full p-4 pl-10 bg-slate-50 rounded-2xl text-[10px] outline-none font-bold" placeholder="ลิงก์สินค้า..." value={newItem.url} onChange={e => setNewItem({...newItem, url: e.target.value})} />
                                <LinkIcon className="absolute left-3 top-4 text-slate-300" size={16} />
                            </div>
                            <label className="p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100">
                                <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                <ImageIcon className={newItem.image_url ? "text-rose-500" : "text-slate-300"} size={20} />
                            </label>
                        </div>
                        {/* แสดงรูปตัวอย่างถ้ามี */}
                        {newItem.image_url && <img src={newItem.image_url} className="w-full h-32 object-cover rounded-2xl border-2 border-rose-50 shadow-inner" alt="" />}
                        {/* ปุ่มกดบันทึก */}
                        <button onClick={handleAdd} disabled={uploading} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs shadow-md">
                            {uploading ? "กำลังบันทึกรูป..." : "เพิ่มลงรายการ ✨"}
                        </button>
                    </div>
                )}

                {/* List แสดงรายการของขวัญ */}
                <div className="grid gap-4">
                    {loading ? ( <div className="text-center py-10 text-slate-300 animate-pulse uppercase text-[10px] font-black">กำลังดึงข้อมูล...</div> ) : (
                        items.map((item) => (
                            // Card ของแต่ละชิ้น: ถ้าได้รับแล้ว (is_received) จะสีจางลง
                            <div key={item.id} className={`p-4 rounded-[2.5rem] border-2 flex items-center gap-4 transition-all ${item.is_received ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-white border-white shadow-sm'}`}>
                                <div className="relative">
                                    {/* รูปสินค้า ถ้าไม่มีให้แสดงไอคอน Gift */}
                                    {item.image_url ? ( <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover" alt="" /> ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100"><Gift size={24} /></div>
                                    )}
                                    {/* Tag บอกช่วงราคา */}
                                    <div className="absolute -top-1 -right-1 bg-white px-2 py-0.5 rounded-full text-[7px] font-black shadow-sm border border-slate-100 text-emerald-500 uppercase">{item.price_range}</div>
                                </div>
                                <div className="flex-1">
                                    {/* ชื่อสินค้า และ ดาว */}
                                    <div className="flex items-center gap-1">
                                        <h3 className="text-xs font-black uppercase tracking-tight">{item.item_name}</h3>
                                        <span className="text-[8px] text-yellow-500 flex">
                                            {[...Array(item.priority)].map((_, i) => <Star key={i} size={8} className="fill-current" />)}
                                        </span>
                                    </div>
                                    {/* คำอธิบาย */}
                                    <p className="text-[9px] text-slate-400 font-bold italic line-clamp-1">{item.item_description || "ไม่มีรายละเอียด"}</p>
                                    {/* ลิงก์สินค้า (ถ้ามี) */}
                                    {item.item_url && ( <a href={item.item_url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-blue-400 font-black flex items-center gap-1 mt-1 uppercase hover:underline"><LinkIcon size={8} /> ลิงก์สินค้า</a> )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* ปุ่มลบ (แสดงเฉพาะเจ้าของรายการ) */}
                                    {item.user_id === userId && ( <button onClick={() => axios.delete(`${API_URL}/api/wishlist/delete?id=${item.id}`).then(fetchData)} className="p-2 text-rose-200 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button> )}
                                    {/* ปุ่มยืนยันได้รับของ (แสดงถ้ายังไม่ได้รับ) */}
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