import React, { useState } from 'react';
import { X, Heart, MessageCircle } from 'lucide-react';

const MoodCalendar = ({ moodHistory, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    
    // ✅ คำนวณจำนวนวันตามเดือนปัจจุบันจริง
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthName = now.toLocaleString('th-TH', { month: 'long' });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // ✅ จัดกลุ่มข้อมูลตามวันที่
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
            <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20}/></button>
                
                <header className="mb-6 text-center">
                    <h2 className="text-xl font-black italic uppercase text-rose-500 flex items-center justify-center gap-2">
                        <Heart size={20} fill="currentColor"/> {monthName} Rainbow
                    </h2>
                </header>
                
                <div className="grid grid-cols-7 gap-2">
                    {days.map(day => {
                        const dayMoods = moodMap[day] || [];
                        const latestMood = dayMoods[0]; // แสดงอันล่าสุดในช่อง
                        return (
                            <button key={day} onClick={() => dayMoods.length > 0 && setSelectedDate({ day, moods: dayMoods })}
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${dayMoods.length > 0 ? 'border-rose-100 bg-rose-50 shadow-sm' : 'border-slate-50 bg-slate-50/50 opacity-50'}`}>
                                <span className="text-[8px] font-black text-slate-300 mb-0.5">{day}</span>
                                <span className="text-sm">{latestMood?.mood_emoji}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ✅ Detail Popup เมื่อคลิกที่วัน */}
                {selectedDate && (
                    <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border-2 border-white shadow-inner animate-in slide-in-from-top duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black uppercase text-rose-400">วันที่ {selectedDate.day} {monthName}</span>
                            <span className="text-[10px] font-bold text-slate-400">{selectedDate.moods.length} กิจกรรม</span>
                        </div>
                        <div className="space-y-3">
                            {selectedDate.moods.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm">
                                    <span className="text-xl">{m.mood_emoji}</span>
                                    <p className="text-[11px] font-bold text-slate-600 flex-1">{m.mood_text}</p>
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