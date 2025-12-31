/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Gift, Plus, CheckCircle, Trash2, X, Link as LinkIcon, Image as ImageIcon, Star, Shuffle, MessageSquare, Users, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const WishlistPage = () => {
    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e"; 
    
    const [items, setItems] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', desc: '', url: '', image_url: '', priority: 3, price_range: 'หลักร้อย' });

    // ✅ Gacha State ใหม่ (Advanced Filter)
    const [showGachaConfig, setShowGachaConfig] = useState(false);
    const [gachaConfig, setGachaConfig] = useState({ targetId: LOVER_ID, minPriority: 1, priceRange: 'ทั้งหมด' });
    const [gachaResult, setGachaResult] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [itemsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/wishlist/get`),
                axios.get(`${API_URL}/api/users`)
            ]);
            const filtered = itemsRes.data.filter(item => item.user_id === userId || (item.visible_to && item.visible_to.includes(userId)));
            setItems(filtered || []);
            setAllUsers(usersRes.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [userId, API_URL]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setUploading(true);
            const fileName = `${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from('wishlist_images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('wishlist_images').getPublicUrl(fileName);
            setNewItem({ ...newItem, image_url: publicUrl });
        } catch (err) { alert("อัปโหลดไม่สำเร็จ"); } finally { setUploading(false); }
    };

    const handleAdd = async () => {
        if (!newItem.name.trim()) return alert("ใส่ชื่อของหน่อย");
        if (!newItem.url.trim() && !newItem.image_url) return alert("ต้องใส่ลิงก์หรือรูปอย่างใดอย่างหนึ่ง!");
        try {
            await axios.post(`${API_URL}/api/wishlist/save`, {
                user_id: userId, item_name: newItem.name, item_description: newItem.desc,
                item_url: newItem.url, image_url: newItem.image_url, priority: newItem.priority,
                price_range: newItem.price_range, visible_to: [userId, LOVER_ID]
            });
            setNewItem({ name: '', desc: '', url: '', image_url: '', priority: 3, price_range: 'หลักร้อย' });
            setShowAdd(false); fetchData();
        } catch (err) { alert("เพิ่มไม่สำเร็จ"); }
    };

    // ✅ ฟังก์ชันสุ่มแบบฉลาด (Filter ตามใจสั่ง)
    const handleRunGacha = () => {
        let pool = items.filter(i => i.user_id === gachaConfig.targetId && !i.is_received);
        
        // Filter ตาม Priority
        pool = pool.filter(i => i.priority >= gachaConfig.minPriority);
        
        // Filter ตามราคา (ถ้าไม่ได้เลือก 'ทั้งหมด')
        if (gachaConfig.priceRange !== 'ทั้งหมด') {
            pool = pool.filter(i => i.price_range === gachaConfig.priceRange);
        }

        if (pool.length === 0) return alert("ไม่มีรายการที่ตรงตามเงื่อนไขนี้เลยนาย ลองปรับใหม่ดูนะ");

        setShowGachaConfig(false);
        setIsSpinning(true);
        setTimeout(() => {
            const result = pool[Math.floor(Math.random() * pool.length)];
            setGachaResult(result);
            setIsSpinning(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Wishlist</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Dreams Catalog ✨</p>
                    </div>
                    <div className="flex gap-2">
                        {/* ✅ ปุ่มสุ่มแบบอยู่เฉยๆ ตามคำขอ */}
                        <button onClick={() => setShowGachaConfig(true)} className="p-3 bg-purple-500 text-white rounded-2xl shadow-lg shadow-purple-100 hover:scale-105 transition-all">
                            <Shuffle size={20} />
                        </button>
                        <button onClick={() => setShowAdd(!showAdd)} className={`p-3 rounded-2xl shadow-lg transition-all ${showAdd ? 'bg-slate-200' : 'bg-rose-500 text-white shadow-rose-100'}`}>
                            {showAdd ? <X size={20} /> : <Plus size={20} />}
                        </button>
                    </div>
                </header>

                {/* ✅ Gacha Config Modal (เหมือนหน้า AI Mood) */}
                {showGachaConfig && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 space-y-6 animate-in zoom-in duration-300">
                            <h2 className="text-xl font-black italic uppercase text-purple-600 flex items-center gap-2">
                                <Filter size={20}/> Gacha Surprise
                            </h2>
                            
                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block">1. เลือกเจ้าของ Wishlist</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allUsers.map(u => (
                                            <button key={u.id} onClick={() => setGachaConfig({...gachaConfig, targetId: u.id})} className={`p-3 rounded-2xl text-[10px] border-2 transition-all ${gachaConfig.targetId === u.id ? 'bg-purple-50 border-purple-400 text-purple-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>{u.username}</button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block">2. ความอยากได้ขั้นต่ำ ({gachaConfig.minPriority} ดาวขึ้นไป)</label>
                                    <div className="flex gap-2">
                                        {[1,2,3,4,5].map(v => (
                                            <Star key={v} size={20} onClick={() => setGachaConfig({...gachaConfig, minPriority: v})} className={gachaConfig.minPriority >= v ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 cursor-pointer'} />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block">3. ช่วงงบประมาณ</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['ทั้งหมด', 'หลักสิบ', 'หลักร้อย', 'หลักพัน', 'หลักหมื่น+'].map(v => (
                                            <button key={v} onClick={() => setGachaConfig({...gachaConfig, priceRange: v})} className={`px-3 py-2 rounded-xl text-[9px] font-black border-2 transition-all ${gachaConfig.priceRange === v ? 'bg-purple-100 border-purple-400 text-purple-600' : 'bg-slate-50 border-transparent text-slate-300'}`}>{v}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowGachaConfig(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">ยกเลิก</button>
                                <button onClick={handleRunGacha} className="flex-2 py-4 bg-purple-500 text-white rounded-2xl font-black uppercase text-[10px] px-8 shadow-lg">เริ่มสุ่มเลย! ✨</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ Result / Spinning Modal */}
                {(isSpinning || gachaResult) && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 text-center space-y-4 shadow-2xl border-4 border-purple-200">
                            {isSpinning ? (
                                <div className="py-10 space-y-4">
                                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-[10px] font-black uppercase text-purple-500 animate-pulse">กำลังเขย่ากล่องสุ่ม...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-4xl">🎁</div>
                                    <h2 className="text-lg font-black text-purple-600 uppercase tracking-tighter">เย้! สุ่มได้ชิ้นนี้</h2>
                                    <div className="bg-slate-50 p-5 rounded-3xl border-2 border-dashed border-purple-200">
                                        <p className="text-sm font-black text-slate-700">{gachaResult.item_name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{gachaResult.price_range} • {gachaResult.priority}⭐</p>
                                    </div>
                                    <button onClick={() => setGachaResult(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">ปิดหน้าต่าง</button>
                                </>
                            )}
                        </div>
                    </div>
                )}

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
                            <label className="p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100">
                                <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                <ImageIcon className={newItem.image_url ? "text-rose-500" : "text-slate-300"} size={20} />
                            </label>
                        </div>
                        {newItem.image_url && <img src={newItem.image_url} className="w-full h-32 object-cover rounded-2xl border-2 border-rose-50 shadow-inner" alt="" />}
                        <button onClick={handleAdd} disabled={uploading} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs shadow-md">
                            {uploading ? "กำลังบันทึกรูป..." : "เพิ่มลงรายการ ✨"}
                        </button>
                    </div>
                )}

                <div className="grid gap-4">
                    {loading ? ( <div className="text-center py-10 text-slate-300 animate-pulse uppercase text-[10px] font-black tracking-widest">กำลังดึงข้อมูล...</div> ) : (
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
                                    {item.user_id === userId && ( <button onClick={() => axios.delete(`${API_URL}/api/wishlist/delete?id=${item.id}`).then(fetchData)} className="p-2 text-rose-200 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button> )}
                                    {!item.is_received && ( <button onClick={() => axios.patch(`${API_URL}/api/wishlist/complete?id=${item.id}`).then(fetchData)} className="p-2 text-emerald-300 hover:text-emerald-500 transition-colors"><CheckCircle size={22}/></button> )}
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