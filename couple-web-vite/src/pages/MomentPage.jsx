import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Camera, Send, Heart, Loader2, X, Trash2, Image as ImageIcon, UserPlus, UserMinus, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';

const MomentPage = () => {
    const MY_ID = "d8eb372a-d196-44fc-a73b-1809f27e0a56";
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e";
    const loverMapping = { [MY_ID]: LOVER_ID, [LOVER_ID]: MY_ID };

    const [moments, setMoments] = useState([]);
    const [users, setUsers] = useState([]);
    const [visibleTo, setVisibleTo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newMoment, setNewMoment] = useState({ url: '', caption: '' });
    const [showForm, setShowForm] = useState(false);

    const userId = localStorage.getItem('user_id');
    // const API_URL = window.location.hostname === 'localhost' 
    //     ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';
    const API_URL = 'https://lover-app-jjoe.onrender.com'; // ✅ ระบุไปเลยไม่ต้องเช็ค localhost
    useEffect(() => { 
        fetchData(); 
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            if (Array.isArray(res.data)) {
                const otherUsers = res.data.filter(u => u.id !== userId);
                setUsers(otherUsers);
                const myPartnerId = loverMapping[userId];
                if (myPartnerId) setVisibleTo([myPartnerId]);
            }
        } catch (err) { console.error(err); }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/moment/get?user_id=${userId}`);
            setMoments(res.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [userId]);

    const handleImageUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            setUploading(true);
            const fileName = `moment-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            setNewMoment(prev => ({ ...prev, url: data.publicUrl }));
        } catch (error) { 
            console.log("Error handleImageUpload", error);
            alert('อัปโหลดรูปไม่สำเร็จ'); } finally { setUploading(false); }
    };

    const handleSave = async () => {
        if (!newMoment.url) return alert("เลือกรูปก่อนนะ ✨");
        try {
            await axios.post(`${API_URL}/api/moment/save`, {
                user_id: userId,
                image_url: newMoment.url,
                caption: newMoment.caption,
                visible_to: [userId, ...visibleTo]
            });
            setNewMoment({ url: '', caption: '' });
            setShowForm(false);
            fetchData();
        } catch (err) { 
            console.log("Error handleSave", err);
            alert("บันทึกไม่สำเร็จ"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("ลบโมเมนต์นี้ใช่ไหม?")) return;
        try {
            await axios.delete(`${API_URL}/api/moment/delete?id=${id}`);
            fetchData();
        } catch (err) { 
            console.log("Error handleDelete", err);
            alert("ลบไม่สำเร็จ"); }
    };

    return (
        <div className="min-h-screen bg-white p-6 pb-24 font-bold text-slate-700">
            <div className="max-w-md mx-auto space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black italic uppercase">Moments</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">เก็บความทรงจำวันละรูป ✨</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="p-3 bg-slate-900 text-white rounded-2xl active:scale-90 transition-all">
                        {showForm ? <X size={20}/> : <Camera size={20} />}
                    </button>
                </header>

                {showForm && (
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 space-y-4 shadow-xl">
                        <div className="relative aspect-video bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden">
                            {newMoment.url ? <img src={newMoment.url} className="w-full h-full object-cover" alt="preview" /> :
                                <label className="cursor-pointer flex flex-col items-center gap-2">
                                    {uploading ? <Loader2 className="animate-spin text-slate-400" /> : <ImageIcon className="text-slate-300" size={32} />}
                                    <span className="text-[10px] font-black text-slate-400 uppercase">คลิกเพื่อเลือกรูปภาพ</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>}
                        </div>
                        <textarea className="w-full p-4 bg-white rounded-2xl text-xs focus:border-slate-900 h-20 outline-none resize-none font-bold" placeholder="วันนี้ทำอะไรมาบ้าง..." value={newMoment.caption} onChange={e => setNewMoment({...newMoment, caption: e.target.value})} />
                        
                        {/* ✅ ปุ่มเลือกแฟน */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                                <Users size={12}/> ใครมองเห็นได้บ้าง?
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {users.map(u => (
                                    <button key={u.id} type="button" onClick={() => setVisibleTo(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-bold border-2 ${visibleTo.includes(u.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                        {u.username}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={uploading || !newMoment.url} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">บันทึก Moment ✨</button>
                    </div>
                )}

                <div className="space-y-8">
                    {loading ? (
                        <div className="text-center py-10 text-slate-300 animate-pulse uppercase text-[10px] font-black">กำลังโหลดอัลบั้ม...</div>
                    ) : (
                        moments.map((m) => (
                            <div key={m.id} className="space-y-3">
                                <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border-4 border-white shadow-xl">
                                    <img src={m.image_url} alt="moment" className="w-full h-full object-cover" />
                                    <div className="absolute top-4 right-4 bg-white/80 px-3 py-1 rounded-full text-[9px] font-black text-slate-700 italic">{new Date(m.created_at).toLocaleDateString('th-TH')}</div>
                                </div>
                                <div className="px-2 flex items-start justify-between">
                                    <p className="text-sm font-bold italic">"{m.caption}"</p>
                                    <div className="flex items-center gap-2">
                                        {m.user_id === userId && (
                                            <button onClick={() => handleDelete(m.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                        )}
                                        <Heart size={16} className="text-rose-400 fill-rose-400" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
export default MomentPage;