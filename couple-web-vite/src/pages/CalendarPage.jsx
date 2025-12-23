/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { Heart, Bell, Trash2, Users, RefreshCw, Clock, Filter, Star, UserPlus, UserMinus } from 'lucide-react';

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [date, setDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [timeHour, setTimeHour] = useState("00");
    const [timeMinute, setTimeMinute] = useState("00");
    const [timeSecond, setTimeSecond] = useState("00");

    const [viewMode, setViewMode] = useState('month'); 
    const [viewFilter, setViewFilter] = useState({ 
        month: new Date().getMonth(), 
        year: new Date().getFullYear() 
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        visibleTo: [],
        repeatType: 'none',
        categoryType: 'normal' 
    });

    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://lover-backend.onrender.com';

    // ✅ ระบบ Mapping ID คู่รัก
    const MY_ID = "d8eb372a-d196-44fc-a73b-1809f27e0a56";
    const LOVER_ID = "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e";
    const loverMapping = { [MY_ID]: LOVER_ID, [LOVER_ID]: MY_ID };

    const toggleVisibleUser = (targetUserId) => {
        setFormData(prev => {
            const isSelected = prev.visibleTo.includes(targetUserId);
            return {
                ...prev,
                visibleTo: isSelected 
                    ? prev.visibleTo.filter(id => id !== targetUserId) 
                    : [...prev.visibleTo, targetUserId]
            };
        });
    };

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 5; i <= currentYear + 10; i++) {
            years.push(i);
        }
        return years;
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchEvents = async () => {
    try {
        // ✅ ต้องมี ?user_id=${userId} เพื่อให้ Backend กรอง visible_to ได้
        const res = await axios.get(`${API_URL}/api/events?user_id=${userId}`);
        console.log("Data from DB:", res.data); // ลองเปิด Console ดูว่าข้อมูลมาไหม
        setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
        console.error("Fetch Events Error:", err); 
    }
};

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            if (Array.isArray(res.data)) {
                const otherUsers = res.data.filter(u => u.id !== userId);
                setUsers(otherUsers);
                const myPartnerId = loverMapping[userId];
                if (myPartnerId) {
                    setFormData(prev => ({
                        ...prev,
                        visibleTo: otherUsers.some(u => u.id === myPartnerId) ? [myPartnerId] : []
                    }));
                }
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const initPage = async () => {
            setIsLoading(true);
            try { await Promise.all([fetchEvents(), fetchUsers()]); }
            catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        if (userId) initPage();
    }, [userId]);

    const filteredOverview = useMemo(() => {
    return events.filter(ev => {
        const evDate = new Date(ev.event_date);
        const evYear = evDate.getFullYear();
        const evMonth = evDate.getMonth();
        
        const isYearly = ev.repeat_type === 'yearly';
        const isMonthly = ev.repeat_type === 'monthly';
        const isDaily = ev.repeat_type === 'daily';

        if (viewMode === 'year') {
            return evYear === viewFilter.year || isYearly;
        }

        // ✅ ใช้การเช็คเดือนและปีที่ยืดหยุ่นขึ้น
        const matchYear = evYear === viewFilter.year || isYearly;
        const matchMonth = evMonth === viewFilter.month || isMonthly || isDaily;
        
        return matchYear && matchMonth;
    });
}, [events, viewFilter, viewMode]);

    const getDetailedCountdown = (eventDate, repeatType) => {
        const now = currentTime; 
        let target = new Date(eventDate);
        if (repeatType === 'yearly') {
            target.setFullYear(now.getFullYear());
            if (target < now) target.setFullYear(now.getFullYear() + 1);
        } else if (repeatType === 'monthly') {
            target.setFullYear(now.getFullYear());
            target.setMonth(now.getMonth());
            if (target < now) target.setMonth(now.getMonth() + 1);
        }
        const diff = target - now;
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60)
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const combinedDate = new Date(date);
            combinedDate.setHours(parseInt(timeHour));
            combinedDate.setMinutes(parseInt(timeMinute));
            combinedDate.setSeconds(parseInt(timeSecond));
            combinedDate.setMilliseconds(0);
            const payload = {
            event_date: combinedDate.toISOString(), 
            title: formData.title,
            description: formData.description,
            created_by: userId, // ✅ มั่นใจว่าบรรทัดนี้มี และ userId ไม่เป็น null
            visible_to: formData.visibleTo, // ตัวแปรนี้ต้องมี [userId, LOVER_ID]
            repeat_type: formData.repeatType,
            category_type: formData.categoryType 
        };
            await axios.post(`${API_URL}/api/events/create`, payload);
            alert(`🔔 บันทึกนัดหมายสำเร็จ!`);
            const myPartnerId = loverMapping[userId];
            setFormData({ 
                title: '', description: '', 
                visibleTo: myPartnerId ? [myPartnerId] : [], 
                repeatType: 'none', categoryType: 'normal' 
            });
            fetchEvents();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const deleteEvent = async (id, title) => {
        if (!window.confirm(`ต้องการลบกิจกรรม "${title}" ใช่หรือไม่?`)) return;
        try {
            // ✅ ส่ง title ไปด้วยเพื่อให้ Discord แจ้งเตือนชื่อนัดหมายที่ลบ
            await axios.delete(`${API_URL}/api/events/delete?id=${id}&title=${encodeURIComponent(title)}`);
            setEvents(prev => prev.filter(ev => ev.id !== id));
            alert("ลบรายการสำเร็จ ✨");
        } catch (err) { alert("ลบไม่สำเร็จ"); }
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month' && events.length > 0) {
            const hasEvent = events.some(ev => {
                const evDate = new Date(ev.event_date);
                if (ev.repeat_type === 'yearly') return evDate.getDate() === date.getDate() && evDate.getMonth() === date.getMonth();
                if (ev.repeat_type === 'monthly') return evDate.getDate() === date.getDate();
                if (ev.repeat_type === 'daily') return true;
                return evDate.toDateString() === date.toDateString();
            });
            return hasEvent ? <div className="h-1.5 w-1.5 bg-rose-400 rounded-full mx-auto mt-1"></div> : null;
        }
    };

    const handleActiveDateChange = ({ activeStartDate }) => {
        setViewFilter({
            month: activeStartDate.getMonth(),
            year: activeStartDate.getFullYear()
        });
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-rose-50 text-rose-500 font-bold animate-pulse uppercase italic tracking-tighter">Prepare Calendar... ❤️</div>;

    return (
        <div className="min-h-screen bg-rose-50 p-4 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-rose-600 flex items-center gap-2 italic uppercase tracking-tighter">
                    <Heart fill="currentColor" /> Calendar
                </h1>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-rose-100">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Bell className="text-rose-400" /> เพิ่มกิจกรรม
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl" placeholder="หัวข้อ" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        
                        <div className="flex gap-2">
                            <select className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none" value={timeHour} onChange={(e) => setTimeHour(e.target.value)}>
                                {Array.from({length: 24}, (_, i) => {
                                    const h = i.toString().padStart(2, '0');
                                    return <option key={h} value={h}>{h} นาฬิกา</option>
                                })}
                            </select>
                            <select className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none" value={timeMinute} onChange={(e) => setTimeMinute(e.target.value)}>
                                {Array.from({length: 60}, (_, i) => {
                                    const m = i.toString().padStart(2, '0');
                                    return <option key={m} value={m}>{m} น.</option>
                                })}
                            </select>
                            <select className="flex-1 p-3 bg-rose-50 border-2 border-rose-100 rounded-xl text-xs font-bold text-rose-500 outline-none" value={timeSecond} onChange={(e) => setTimeSecond(e.target.value)}>
                                {Array.from({length: 60}, (_, i) => {
                                    const s = i.toString().padStart(2, '0');
                                    return <option key={s} value={s}>{s} วิ.</option>
                                })}
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-400">ประเภทกิจกรรม</label>
                            <div className="flex gap-2">
                                {[
                                    {id: 'normal', label: 'วันธรรมดา'},
                                    {id: 'important', label: 'วันสำคัญ'},
                                    {id: 'special', label: 'วันพิเศษ (รายการสำคัญ)'}
                                ].map(cat => (
                                    <button key={cat.id} type="button" onClick={() => setFormData({ ...formData, categoryType: cat.id })} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${formData.categoryType === cat.id ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <input className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl col-span-1 md:col-span-2" placeholder="รายละเอียด..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-400">วนซ้ำ</label>
                            <div className="flex flex-wrap gap-2">
                                {['none', 'daily', 'monthly', 'yearly'].map(type => (
                                    <button key={type} type="button" onClick={() => setFormData({ ...formData, repeatType: type })} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${formData.repeatType === type ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {type === 'none' ? 'ครั้งเดียว' : type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-rose-50">
                            <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                <Users size={12}/> ใครมองเห็นกิจกรรมนี้ได้บ้าง? (แฟน)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {users.map(user => (
                                    <button key={user.id} type="button" onClick={() => toggleVisibleUser(user.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${formData.visibleTo.includes(user.id) ? 'bg-rose-100 border-rose-400 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}>
                                        {formData.visibleTo.includes(user.id) ? <UserPlus size={14}/> : <UserMinus size={14}/>} {user.username}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="bg-rose-500 text-white font-black py-4 rounded-xl shadow-lg uppercase text-sm col-span-1 md:col-span-2 mt-2 transition-all active:scale-95">บันทึก ✨</button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-rose-100">
                    <h2 className="text-xl font-bold text-rose-600 mb-4 flex items-center gap-2 italic">
                        <Star className="text-yellow-400" fill="currentColor" /> รายการสำคัญ
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {events
    .filter(ev => ev.category_type === 'special' || ev.is_special === true) // ✅ เช็คทั้ง 2 อย่าง
    .map(ev => {
        const time = getDetailedCountdown(ev.event_date, ev.repeat_type);
                            return (
                                <div key={ev.id} className="p-4 bg-rose-50/50 rounded-2xl border-2 border-rose-100 transition-all hover:bg-white group">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="font-black text-slate-700 uppercase italic tracking-tighter">{ev.title}</p>
                                        <Trash2 size={14} className="text-rose-200 hover:text-rose-500 cursor-pointer" onClick={() => deleteEvent(ev.id, ev.title)}/>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        {[ {v: time.days, l: 'วัน'}, {v: time.hours, l: 'ชม.'}, {v: time.minutes, l: 'นาที'}, {v: time.seconds, l: 'วิ.'} ].map((t, idx) => (
                                            <div key={idx} className="bg-white py-2 rounded-xl border border-rose-50 shadow-sm">
                                                <p className="text-lg font-black text-rose-500 leading-none">{t.v}</p>
                                                <p className="text-[8px] font-black text-slate-300 uppercase mt-1">{t.l}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-rose-100">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2 uppercase italic tracking-tighter">
                            <Filter className="text-rose-400" size={20} /> ภาพรวมปฏิทิน
                        </h2>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="bg-rose-50 p-1 rounded-xl flex gap-1 mr-2 border border-rose-100">
                                <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${viewMode === 'month' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300'}`}>Month</button>
                                <button onClick={() => setViewMode('year')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${viewMode === 'year' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300'}`}>Year</button>
                            </div>
                            {viewMode === 'month' && (
                                <select className="p-2 rounded-xl bg-rose-50 border-none text-xs font-bold text-rose-600 outline-none" value={viewFilter.month} onChange={(e) => setViewFilter({...viewFilter, month: parseInt(e.target.value)})}>
                                    {Array.from({length: 12}, (_, i) => (<option key={i} value={i}>{new Date(0, i).toLocaleString('en-GB', {month: 'long'})}</option>))}
                                </select>
                            )}
                            <select className="p-2 rounded-xl bg-rose-50 border-none text-xs font-bold text-rose-600 outline-none" value={viewFilter.year} onChange={(e) => setViewFilter({...viewFilter, year: parseInt(e.target.value)})}>
                                {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredOverview.length > 0 ? filteredOverview.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).map(ev => (
                            <div key={`ov-${ev.id}`} className={`p-4 rounded-2xl border transition-all ${ev.category_type === 'special' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-100'}`}>
                                <div className="flex justify-between items-center">
                                    <p className="font-black text-slate-700 text-sm truncate uppercase italic tracking-tighter">{ev.title}</p>
                                    {ev.category_type === 'special' && <Star size={12} fill="currentColor" className="text-amber-400"/>}
                                </div>
                                <p className="text-[10px] text-slate-400 font-black mt-1 italic uppercase">{new Date(ev.event_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        )) : <p className="text-center col-span-full py-16 text-slate-300 text-[10px] font-black uppercase italic tracking-widest">ไม่มีรายการที่ตรงกับเงื่อนไข ❤️</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-rose-100 h-fit">
                        <Calendar onChange={setDate} value={date} tileContent={tileContent} className="border-none w-full" onActiveStartDateChange={handleActiveDateChange} />
                    </div>
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="font-black text-slate-400 sticky top-0 bg-rose-50/80 backdrop-blur-sm py-2 text-[10px] border-b-2 border-rose-100 uppercase italic tracking-widest px-2">📅 รายการวันที่ {date.toLocaleDateString('th-TH')}</h3>
                        {events.filter(ev => {
    const d = new Date(ev.event_date);
    const activeDate = date; // วันที่เลือกในปฏิทิน

    // ✅ เทียบเฉพาะ วัน/เดือน/ปี ไม่เอาเวลามาเกี่ยว
    const isSameDay = d.getDate() === activeDate.getDate() &&
                      d.getMonth() === activeDate.getMonth() &&
                      d.getFullYear() === activeDate.getFullYear();

    if (ev.repeat_type === 'yearly') return d.getDate() === activeDate.getDate() && d.getMonth() === activeDate.getMonth();
    if (ev.repeat_type === 'monthly') return d.getDate() === activeDate.getDate();
    if (ev.repeat_type === 'daily') return true;
    return isSameDay;
}).map(event => (
                            <div key={event.id} className={`bg-white p-5 rounded-3xl border-l-8 shadow-sm flex justify-between items-center transition-all hover:scale-[1.02] ${event.category_type === 'special' ? 'border-amber-400' : 'border-rose-400'}`}>
                                <div>
                                    <p className="font-black text-slate-700 uppercase italic tracking-tighter">{event.title}</p>
                                    <p className="text-[11px] text-slate-400 font-bold leading-tight mt-1">{event.description || "ไม่มีรายละเอียด"}</p>
                                </div>
                                <Trash2 size={18} className="text-slate-200 hover:text-rose-500 cursor-pointer transition-all active:scale-90" onClick={() => deleteEvent(event.id, event.title)}/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;