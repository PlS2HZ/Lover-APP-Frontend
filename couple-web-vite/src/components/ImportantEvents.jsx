import React, { useState, useEffect } from 'react'; // นำเข้า React และ Hooks (useState เก็บค่า, useEffect ทำงานตามวงจรชีวิต)
import { Star, Trash2 } from 'lucide-react'; // นำเข้าไอคอนรูปดาวและถังขยะ

// Component แสดงรายการเหตุการณ์สำคัญ (รับ props: events = ข้อมูลกิจกรรม, onDelete = ฟังก์ชันลบ)
const ImportantEvents = ({ events, onDelete }) => {
    // State: เก็บเวลาปัจจุบัน (เพื่อให้ Countdown เดินตลอดเวลา)
    const [currentTime, setCurrentTime] = useState(new Date());

    // Effect: ตั้งเวลาให้ทำงานทุก 1 วินาที เพื่ออัปเดต currentTime
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000); // อัปเดตเวลาทุก 1000ms
        return () => clearInterval(timer); // Cleanup: เคลียร์ timer เมื่อ Component ถูกทำลาย (Unmount)
    }, []);

    // ฟังก์ชันคำนวณเวลานับถอยหลัง (รับวันเวลาเป้าหมายเข้ามา)
    const getDetailedCountdown = (eventDate) => {
        const target = new Date(eventDate); // แปลงวันที่เป้าหมายเป็น Object Date
        const diff = target - currentTime; // หาผลต่างเวลา (ms) ระหว่างเป้าหมายกับเวลาปัจจุบัน
        
        // ถ้าเวลาผ่านไปแล้ว (ผลต่างน้อยกว่าหรือเท่ากับ 0) ให้คืนค่าเป็น 0 ทั้งหมด
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        
        // คำนวณแปลงหน่วยเวลาจาก Milliseconds
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)), // คำนวณวัน
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24), // คำนวณชั่วโมง (เศษจากวัน)
            minutes: Math.floor((diff / 1000 / 60) % 60), // คำนวณนาที (เศษจากชั่วโมง)
            seconds: Math.floor((diff / 1000) % 60) // คำนวณวินาที (เศษจากนาที)
        };
    };

    // กรองเอาเฉพาะ Event ที่มีประเภทเป็น 'special' (วันพิเศษ) เท่านั้น
    const specialEvents = events.filter(ev => ev.category_type === 'special');

    // ถ้าไม่มีรายการพิเศษเลย ไม่ต้องแสดงอะไร (return null)
    if (specialEvents.length === 0) return null;

    return (
        // Container หลัก: พื้นหลังสีขาว ขอบมน มีเงา
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-rose-100 mb-6">
            {/* หัวข้อส่วนรายการสำคัญ */}
            <h2 className="text-xl font-bold text-rose-600 mb-4 flex items-center gap-2 italic">
                <Star className="text-yellow-400" fill="currentColor" /> รายการสำคัญ
            </h2>
            
            {/* Grid Layout สำหรับวางการ์ดรายการ (มือถือ 1 คอลัมน์, จอใหญ่ 2 คอลัมน์) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* วนลูปแสดงข้อมูลแต่ละ Event */}
                {specialEvents.map(ev => {
                    const time = getDetailedCountdown(ev.event_date); // คำนวณเวลาที่เหลือของรายการนี้
                    return (
                        // การ์ดแต่ละรายการ
                        <div key={ev.id} className="p-4 bg-rose-50/50 rounded-2xl border-2 border-rose-100">
                            {/* ส่วนหัวการ์ด (ชื่อรายการ + ปุ่มลบ) */}
                            <div className="flex justify-between items-start mb-3">
                                <p className="font-black text-slate-700">{ev.title}</p>
                                {/* ถ้ามีการส่งฟังก์ชัน onDelete มา ให้แสดงปุ่มลบ */}
                                {onDelete && (
                                    <Trash2 size={14} className="text-rose-200 hover:text-rose-500 cursor-pointer" 
                                        onClick={() => onDelete(ev.id, ev.title)}/>
                                )}
                            </div>
                            
                            {/* ตารางแสดงเวลานับถอยหลัง (วัน/ชม./นาที/วิ.) */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                                {[
                                    {v: time.days, l: 'วัน'}, {v: time.hours, l: 'ชม.'}, 
                                    {v: time.minutes, l: 'นาที'}, {v: time.seconds, l: 'วิ.'}
                                ].map((t, idx) => (
                                    // กล่องเวลาแต่ละหน่วย
                                    <div key={idx} className="bg-white py-2 rounded-xl border border-rose-50 shadow-sm">
                                        <p className="text-lg font-black text-rose-500">{t.v}</p> {/* ตัวเลขเวลา */}
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{t.l}</p> {/* หน่วยเวลา */}
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