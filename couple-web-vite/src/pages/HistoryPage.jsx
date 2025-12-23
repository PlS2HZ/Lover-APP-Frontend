/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, Clock, User, CheckCircle, XCircle, Heart, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HistoryPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedImg, setSelectedImg] = useState(null);
  const userId = localStorage.getItem('user_id');

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : 'https://lover-backend.onrender.com';
    
  const refreshList = useCallback(async (showSilent = false) => {
    if (!userId) return;
    if (!showSilent) setLoading(true);
    try {
      // ✅ ส่ง user_id ไปเพื่อให้ Backend ดึง Or(sender_id, receiver_id)
      const res = await axios.get(`${API_URL}/api/my-requests?user_id=${userId}&t=${Date.now()}`);
      if (Array.isArray(res.data)) {
        // เรียงลำดับจากใหม่ไปเก่า
        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRequests(sorted);
      }
    } catch (error) { 
      console.error("Refresh List Error:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [userId, API_URL]);

  useEffect(() => { refreshList(); }, [refreshList]);

  const updateStatus = async (id, newStatus) => {
    if (isProcessing) return;
    try {
      const reason = newStatus === 'rejected' ? prompt("ระบุเหตุผลที่ไม่อนุมัติ:") : "";
      if (newStatus === 'rejected' && reason === null) return;

      setIsProcessing(true);
      const res = await axios.post(`${API_URL}/api/update-status`, { id, status: newStatus, comment: reason });

      if (res.status === 200) {
        alert(`ดำเนินการเรียบร้อย ✨`);
        await refreshList(true);
      }
    } catch (err) {
      console.error("updateStatus ", err);
      alert("ดำเนินการสำเร็จ (แจ้งเตือนจะส่งตามไปครับ) ✨");
      await refreshList(true);
    } finally { setIsProcessing(false); }
  };

  // ✅ กรองรายการ "รออนุมัติ": ดึงเฉพาะที่เราเป็น 'ผู้รับ' และสถานะยังเป็น 'pending'
  const pendingList = requests.filter(r => 
    r.status === 'pending' && 
    String(r.receiver_id).toLowerCase() === String(userId).toLowerCase() // ✅ ใช้ toLowerCase เพื่อกันพลาดเรื่อง Case Sensitive
);
  
  // ✅ กรองรายการ "ประวัติ": ดึงรายการที่ไม่ใช่ pending (อนุมัติ/ไม่อนุมัติแล้ว) หรือที่เราเป็น 'คนส่ง' เองแต่ยังไม่โดนตรวจ
  const historyList = requests.filter(r => 
    r.status !== 'pending' || 
    (r.status === 'pending' && String(r.sender_id).toLowerCase() === String(userId).toLowerCase())
);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4 text-rose-400 font-black italic px-4 text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-rose-500"></div>
      <p className="uppercase tracking-tighter">กำลังรีเฟรชประวัติความรัก... ❤️</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 pb-24 font-sans min-h-screen bg-rose-50/20">
      
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedImg(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full active:scale-90 transition-all"><X size={28}/></button>
            <motion.img initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} src={selectedImg} className="max-w-full max-h-[85vh] rounded-[2rem] shadow-2xl border-4 border-white/20" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">History 📋</h2>
        <button onClick={() => refreshList()} className="bg-white border-2 border-rose-100 p-3 rounded-2xl text-[10px] font-black flex items-center gap-2 text-rose-500 hover:shadow-lg transition-all active:scale-90">
          <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} /> REFRESH
        </button>
      </div>

      <div className="flex gap-2 mb-10 bg-white/80 backdrop-blur-sm p-2 rounded-[2rem] shadow-sm border border-rose-50 font-black text-xs md:text-sm">
        <button onClick={() => setActiveTab('pending')} className={`flex-1 py-5 rounded-[1.5rem] transition-all uppercase italic tracking-widest ${activeTab === 'pending' ? 'bg-rose-500 text-white shadow-xl scale-105' : 'text-slate-300'}`}>
          รออนุมัติ ({pendingList.length})
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-5 rounded-[1.5rem] transition-all uppercase italic tracking-widest ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-300'}`}>
          ประวัติ ({historyList.length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="popLayout">
          {(activeTab === 'pending' ? pendingList : historyList).map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-6 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-2xl border-2 border-rose-50 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 text-rose-50/30 opacity-40 group-hover:rotate-12 transition-transform duration-700"><Heart size={250} fill="currentColor" /></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <span className="font-black text-rose-500 text-[10px] uppercase bg-rose-50 px-6 py-2 rounded-full tracking-[0.2em] italic border border-rose-100">{item.category}</span>
                <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase italic tracking-widest shadow-sm border ${item.status === 'pending' ? 'bg-amber-50 text-amber-500 border-amber-100' : item.status === 'approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                  {item.status}
                </div>
              </div>
              
              <h4 className="text-2xl md:text-4xl font-black text-slate-800 mb-2 relative z-10 uppercase italic tracking-tighter leading-none">{item.title}</h4>
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10 italic">
                <Clock size={12} /> {new Date(item.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              </p>

              {item.image_url && (
                <div className="mb-10 relative z-10">
                  <div className="relative overflow-hidden rounded-[2.5rem] border-8 border-rose-50 shadow-inner aspect-video bg-slate-50">
                    <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in" alt="request" onClick={() => setSelectedImg(item.image_url)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-[2.5rem] mb-8 space-y-5 relative z-10 border border-slate-100/50 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-black uppercase italic tracking-widest flex items-center gap-2"><User size={14} /> From:</span>
                  <span className="text-rose-500 font-black text-sm uppercase italic tracking-tighter">{item.sender_name || "ใครบางคน"}</span>
                </div>
                <div className="pt-5 flex flex-col border-t border-slate-200/50">
                  <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] mb-2 italic">⏱️ Activity Duration</span>
                  <span className="text-rose-500 font-black text-xl md:text-3xl uppercase italic tracking-tighter">{item.description}</span>
                </div>
                {item.comment && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mt-5 p-5 bg-white rounded-[1.5rem] text-rose-600 text-xs font-bold italic border-l-8 border-rose-400 shadow-sm leading-relaxed">
                    💬 Reason: {item.comment}
                  </motion.div>
                )}
              </div>

              {item.status === 'pending' && String(item.receiver_id) === String(userId) && (
                <div className="flex flex-col md:flex-row gap-5 relative z-10 pt-4">
                  <button disabled={isProcessing} onClick={() => updateStatus(item.id, 'approved')} className={`flex-1 py-6 rounded-[2rem] font-black shadow-xl transition-all text-sm uppercase italic tracking-widest flex items-center justify-center gap-3 active:scale-95 ${isProcessing ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'}`}>
                    {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <><CheckCircle size={22}/> Approve</>}
                  </button>
                  <button disabled={isProcessing} onClick={() => updateStatus(item.id, 'rejected')} className={`flex-1 py-6 rounded-[2rem] font-black shadow-xl transition-all text-sm uppercase italic tracking-widest flex items-center justify-center gap-3 active:scale-95 ${isProcessing ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-100'}`}>
                    {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <><XCircle size={22}/> Reject</>}
                  </button>
                </div>
              )}

              {item.status !== 'pending' && item.processed_at && (
                <div className="flex items-center justify-center gap-3 text-[9px] font-black text-slate-300 uppercase italic tracking-[0.3em] mt-8 pt-6 border-t border-dashed border-slate-100 relative z-10">
                  <Clock size={12} /> {item.status === 'approved' ? 'Processed at' : 'Rejected at'}: {new Date(item.processed_at).toLocaleString('th-TH')}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {(activeTab === 'pending' ? pendingList : historyList).length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-rose-100 text-rose-200 font-black italic uppercase text-2xl shadow-inner tracking-tighter">
          ยังไม่มีเรื่องราวใหม่ๆ ✨
        </motion.div>
      )}
    </div>
  );
};

export default HistoryPage;