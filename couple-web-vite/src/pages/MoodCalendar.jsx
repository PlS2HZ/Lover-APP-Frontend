import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Heart, User } from 'lucide-react';

const MoodCalendar = ({ moodHistory, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [userMap, setUserMap] = useState({});
    const now = new Date();
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';
    
    // ✅ ดึงรายชื่อ User เพื่อหาชื่อจาก ID
    useEffect(() => {
        axios.get(`${API_URL}/api/users`).then(res => {
            const map = {};
            res.data.forEach(u => map[u.id] = u.username);
            setUserMap(map);
        });
    }, [API_URL]);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthName = now.toLocaleString('th-TH', { month: 'long' });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const moodMap = {};
    moodHistory.forEach(item => {
        const d = new Date(item.created_at);
        if (d.getMonth() === now.getMonth()) {
            const date = d.getDate();
            if (!moodMap[date]) moodMap[date] = [];
            moodMap[date].push(item);
        }
    });

    return (
        <div className="fixed inset-0 z-[110] bg-rose-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300 text-left">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
                <header className="mb-6 text-center">
                    <h2 className="text-xl font-black italic uppercase text-rose-500 flex items-center justify-center gap-2"><Heart size={20} fill="currentColor"/> {monthName} Rainbow</h2>
                </header>
                <div className="grid grid-cols-7 gap-2">
                    {days.map(day => {
                        const dayMoods = moodMap[day] || [];
                        const latest = dayMoods[0];
                        return (
                            <button key={day} onClick={() => dayMoods.length > 0 && setSelectedDate({ day, moods: dayMoods })} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${dayMoods.length > 0 ? 'border-rose-100 bg-rose-50 shadow-sm' : 'border-slate-50 bg-slate-50/50 opacity-50 cursor-default'}`}>
                                <span className="text-[8px] font-black text-slate-300 mb-0.5">{day}</span>
                                <span className="text-sm">{latest?.mood_emoji}</span>
                            </button>
                        );
                    })}
                </div>
                {selectedDate && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-[2rem] border-2 border-white shadow-inner space-y-4 animate-in slide-in-from-top duration-300">
                        <span className="text-[10px] font-black uppercase text-rose-400 px-1">วันที่ {selectedDate.day} {monthName}</span>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {selectedDate.moods.map((m, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm space-y-2 border border-slate-100">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl shrink-0 mt-1">{m.mood_emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                                                <User size={8} className="text-rose-300"/> {userMap[m.user_id] || m.user_id}
                                            </p>
                                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed break-words">{m.mood_text}</p>
                                        </div>
                                    </div>
                                    {m.image_url && <img src={m.image_url} className="w-full h-32 object-cover rounded-xl border border-rose-50" alt="" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default MoodCalendar;