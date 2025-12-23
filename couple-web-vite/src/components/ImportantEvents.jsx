import React, { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';

const ImportantEvents = ({ events, onDelete }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getDetailedCountdown = (eventDate) => {
        const target = new Date(eventDate);
        const diff = target - currentTime;
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60)
        };
    };

    // กรองเฉพาะวันพิเศษ (special)
    const specialEvents = events.filter(ev => ev.category_type === 'special');

    if (specialEvents.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-rose-100 mb-6">
            <h2 className="text-xl font-bold text-rose-600 mb-4 flex items-center gap-2 italic">
                <Star className="text-yellow-400" fill="currentColor" /> รายการสำคัญ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialEvents.map(ev => {
                    const time = getDetailedCountdown(ev.event_date);
                    return (
                        <div key={ev.id} className="p-4 bg-rose-50/50 rounded-2xl border-2 border-rose-100">
                            <div className="flex justify-between items-start mb-3">
                                <p className="font-black text-slate-700">{ev.title}</p>
                                {onDelete && (
                                    <Trash2 size={14} className="text-rose-200 hover:text-rose-500 cursor-pointer" 
                                        onClick={() => onDelete(ev.id, ev.title)}/>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                {[
                                    {v: time.days, l: 'วัน'}, {v: time.hours, l: 'ชม.'}, 
                                    {v: time.minutes, l: 'นาที'}, {v: time.seconds, l: 'วิ.'}
                                ].map((t, idx) => (
                                    <div key={idx} className="bg-white py-2 rounded-xl border border-rose-50 shadow-sm">
                                        <p className="text-lg font-black text-rose-500">{t.v}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{t.l}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ImportantEvents;