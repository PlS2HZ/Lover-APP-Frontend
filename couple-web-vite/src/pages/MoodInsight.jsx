import React, { useState, useEffect } from 'react'; // นำเข้า Hook: useState (เก็บค่าที่เปลี่ยนได้), useEffect (ทำงานเมื่อโหลดหน้า)
import { X, Sparkles, Heart, Users } from 'lucide-react'; // นำเข้าไอคอนต่างๆ
import axios from 'axios'; // เครื่องมือสำหรับยิง API ไปหา Backend

// Component รับ Props 3 ตัว: onClose (ฟังก์ชันปิดหน้าต่าง), API_URL (ลิ้งค์ Backend), userId (ไอดีของคนล็อกอิน)
const MoodInsight = ({ onClose, API_URL, userId }) => {
    // State: เก็บข้อความผลลัพธ์ที่ AI วิเคราะห์ออกมา (เริ่มต้นเป็น null คือยังไม่มีผลลัพธ์)
    const [insight, setInsight] = useState(null);
    // State: สถานะ Loading (true = กำลังรอ AI ประมวลผล, false = ว่าง)
    const [loading, setLoading] = useState(false);
    // State: เก็บข้อมูล User ที่เรา "เลือก" จะให้ AI วิเคราะห์ (เลือกจากปุ่ม)
    const [targetUser, setTargetUser] = useState(null);
    // State: เก็บรายชื่อ User ทั้งหมดที่มีในระบบ (เอามาแสดงเป็นปุ่มเลือก)
    const [allUsers, setAllUsers] = useState([]);

    // Effect: ทำงานทันทีเมื่อ Component นี้ถูกเปิดขึ้นมา (หรือเมื่อ API_URL เปลี่ยน)
    useEffect(() => {
        // ยิง API ไปดึงรายชื่อ Users ทั้งหมดมาเก็บลง State allUsers
        axios.get(`${API_URL}/api/users`).then(res => setAllUsers(res.data));
    }, [API_URL]);

    // ฟังก์ชันหลัก: ส่งคำสั่งไปให้ AI วิเคราะห์
    const getAIInsight = async () => {
        if (!targetUser) return; // ถ้ายังไม่ได้เลือกคนที่จะวิเคราะห์ ให้จบการทำงานทันที
        setLoading(true); // เริ่มสถานะ Loading (ปุ่มจะหมุนๆ หรือกดไม่ได้)
        try {
            // ส่ง POST Request ไปที่ Backend เส้น /api/mood/insight พร้อมส่ง id และชื่อของเป้าหมายไป
            const res = await axios.post(`${API_URL}/api/mood/insight`, {
                target_id: targetUser.id,
                target_name: targetUser.username
            });
            setInsight(res.data.insight); // เมื่อได้ตอบกลับ เอาข้อความใส่ State insight เพื่อแสดงผล
        } catch (err) { 
            console.error(err); // ถ้า Error ให้แสดงใน Console
            // กรณี AI มีปัญหา หรือ Server ล่ม ให้ใส่ข้อความปลอบใจ default แทน
            setInsight("ดูเหมือนแฟนจะต้องการกำลังใจนะ ❤️"); }
        finally { setLoading(false); } // ไม่ว่าจะสำเร็จหรือล้มเหลว ให้หยุดสถานะ Loading
    };

    return (
        // Overlay: พื้นหลังสีม่วงจางๆ เบลอๆ (backdrop-blur) บังหน้าจอเดิมไว้
        <div className="fixed inset-0 z-[120] bg-purple-900/40 backdrop-blur-md flex items-center justify-center p-4">
            {/* Modal Box: กล่องสีขาวตรงกลาง หน้าต่างหลัก */}
            <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative">
                {/* ปุ่มกากบาท (X) มุมขวาบน กดแล้วเรียกฟังก์ชัน onClose เพื่อปิดหน้านี้ */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20}/></button>
                
                {/* หัวข้อ Title: AI Analyst พร้อมไอคอนวิบวับ */}
                <h2 className="text-xl font-black italic uppercase text-purple-600 mb-6 flex items-center gap-2">
                    <Sparkles size={24}/> AI Analyst
                </h2>

                {/* Conditional Rendering: เช็คว่ามีผลวิเคราะห์ (insight) หรือยัง? */}
                {!insight ? (
                    // กรณีที่ 1: ยังไม่มีผลวิเคราะห์ (แสดงหน้าเลือกคน)
                    <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14}/> เลือกคนที่ต้องการให้ AI วิเคราะห์
                        </p>
                        {/* Grid แสดงปุ่มเลือก User 2 คอลัมน์ */}
                        <div className="grid grid-cols-2 gap-2">
                            {allUsers.map(u => (
                                <button key={u.id} onClick={() => setTargetUser(u)}
                                    // Logic Styling: ถ้าคนนี้ (u.id) ตรงกับคนที่เลือก (targetUser.id) ให้เปลี่ยนสีปุ่มเป็นสีม่วง
                                    className={`p-3 rounded-2xl text-[10px] font-bold border-2 transition-all ${targetUser?.id === u.id ? 'bg-purple-100 border-purple-400 text-purple-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                    {u.username} {u.id === userId && "(ฉัน)"}
                                </button>
                            ))}
                        </div>
                        {/* ปุ่มกดเริ่มวิเคราะห์ (Disable ถ้ายังไม่เลือกคน หรือกำลังโหลด) */}
                        <button onClick={getAIInsight} disabled={!targetUser || loading} className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all disabled:opacity-50">
                            {/* เปลี่ยนข้อความปุ่มตามสถานะ Loading */}
                            {loading ? 'Analyzing...' : `วิเคราะห์ ${targetUser?.username || ''} ✨`}
                        </button>
                    </div>
                ) : (
                    // กรณีที่ 2: มีผลวิเคราะห์แล้ว (แสดงข้อความจาก AI)
                    <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 animate-in zoom-in duration-300">
                        {/* ข้อความ Insight */}
                        <p className="text-sm text-purple-900 leading-relaxed font-bold italic">"{insight}"</p>
                        {/* ปุ่ม "วิเคราะห์คนอื่นต่อ" -> กดแล้วเซ็ต insight เป็น null เพื่อกลับไปหน้าเลือกคน */}
                        <button onClick={() => setInsight(null)} className="mt-4 text-[10px] font-black uppercase text-purple-400 underline">วิเคราะห์คนอื่นต่อ</button>
                    </div>
                )}
            </div>
        </div>
    );
};
export default MoodInsight;