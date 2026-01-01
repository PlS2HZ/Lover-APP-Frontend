import React, { useState } from 'react'; // นำเข้า React และ Hook useState สำหรับจัดการสถานะ
import { useNavigate } from 'react-router-dom'; // นำเข้า Hook สำหรับเปลี่ยนหน้า (Navigate)
import { supabase } from '../supabaseClient'; // นำเข้าตัวเชื่อมต่อฐานข้อมูล Supabase
import { Heart, ArrowLeft, Save, Sparkles, Trash2 } from 'lucide-react'; // นำเข้าไอคอนต่างๆ

const CreateLevel = () => {
    // State: เก็บคำลับ (Secret Word) ที่ผู้ใช้กรอก
    const [secretWord, setSecretWord] = useState("");
    // State: เก็บคำอธิบายหรือคำใบ้ (Description)
    const [description, setDescription] = useState("");
    // State: สถานะ Loading ขณะกำลังบันทึกข้อมูล (True = กำลังบันทึก)
    const [loading, setLoading] = useState(false);
    // State: สถานะ Loading ขณะ AI กำลังคิดคำอธิบาย (True = กำลังโหลด)
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    // Hook: สร้างฟังก์ชัน navigate เพื่อใช้เปลี่ยนหน้า
    const navigate = useNavigate();
    // ดึง user_id ของผู้ใช้ปัจจุบันจาก LocalStorage
    const userId = localStorage.getItem('user_id');

    // กำหนด API URL ตาม Environment (Localhost หรือ Production)
    // const API_URL = window.location.hostname.includes('localhost') 
    //     ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' 
        : 'https://lover-app-jjoe.onrender.com'; // ✅ ระบุไปเลยไม่ต้องเช็ค localhost
         
    // ฟังก์ชันให้ AI ช่วยเขียนคำอธิบาย
    const generateAIDesc = async () => {
        // เช็คก่อนว่ามีคำลับหรือยัง ถ้าไม่มีให้แจ้งเตือน
        if (!secretWord) return alert("ใส่คำลับก่อนนะ เดี๋ยว AI ช่วยเขียนให้!");
        // ถ้ามีคำอธิบายอยู่แล้ว ให้แจ้งเตือนให้ลบก่อน (กันการเขียนทับโดยไม่ตั้งใจ)
        if (description.trim() !== "") {
            return alert("มีคำอธิบายอยู่แล้ว! กรุณากดปุ่ม 'ล้างข้อมูล' ก่อนครับ");
        }

        setIsAiGenerating(true); // เริ่มสถานะ AI กำลังทำงาน (หมุนๆ)
        try {
            // ยิง Request ไปที่ Backend เพื่อขอให้ AI สร้างคำอธิบาย
            const res = await fetch(`${API_URL}/api/game/generate-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret_word: secretWord }) // ส่งคำลับไปให้ AI
            });
            const data = await res.json(); // แปลงผลลัพธ์เป็น JSON
            // ถ้าได้คำอธิบายกลับมา ให้เซ็ตลง State description
            if (data.description) setDescription(data.description);
            else alert("AI ส่งค่าว่างกลับมา ลองใหม่อีกครั้งนะครับ"); // กรณี AI ไม่ตอบ
        } catch (err) { 
            console.error("AI description generation error:", err); // Log Error
            alert("เชื่อมต่อ Backend ไม่สำเร็จ!"); } // แจ้งเตือนผู้ใช้
        finally { setIsAiGenerating(false); } // จบการทำงานของ AI (หยุดหมุน)
    };

    // ฟังก์ชันบันทึกด่านใหม่ลงฐานข้อมูล
    const handleCreate = async () => {
        const cleanWord = secretWord.trim(); // ✅ ตัดช่องว่างหน้าหลังออก ป้องกันการเคาะเว้นวรรคหลอกระบบ
        // เช็คว่ามีคำลับและ User ID หรือไม่
        if (!cleanWord || !userId) return alert("กรุณาใส่คำลับก่อนบันทึกนะ");
        
        setLoading(true); // เริ่มสถานะ Loading (ปุ่มกดไม่ได้)
        try {
            // ✅ 1. เช็คคำซ้ำในฐานข้อมูล (SELECT Policy ทำงานตรงนี้)
            const { data: existing, error: checkErr } = await supabase
                .from('heart_games')
                .select('id')
                .eq('secret_word', cleanWord) // หาว่ามีคำนี้อยู่แล้วหรือไม่
                .maybeSingle(); // ขอข้อมูลแค่แถวเดียว (ถ้ามี)

            if (checkErr) throw checkErr; // ถ้า Error ตอนเช็ค ให้โยน Error ไป catch
            
            // ถ้าเจอว่ามีคำนี้อยู่แล้ว (existing ไม่เป็น null)
            if (existing) {
                alert("คำนี้ถูกใช้งานไปแล้วจ้า! ลองคิดคำอื่นดูนะ 💡");
                setLoading(false); // หยุด Loading
                return; // จบการทำงาน ไม่บันทึกซ้ำ
            }

            // ✅ 2. บันทึกข้อมูลใหม่ (INSERT Policy ทำงานตรงนี้)
            const { error } = await supabase.from('heart_games').insert([{
                host_id: userId, // ID คนสร้าง
                secret_word: cleanWord, // คำลับ
                description: description, // คำอธิบาย
                is_template: true, // ตั้งค่าเป็น Template (ให้คนอื่นเล่นได้)
                use_bot: true // เปิดใช้ Bot
            }]);
            
            if (error) throw error; // ถ้า Error ตอนบันทึก ให้โยน Error ไป catch
            alert("สร้างด่านใหม่สำเร็จ! 🎉"); // แจ้งเตือนสำเร็จ
            navigate('/mind-game'); // ย้ายกลับไปหน้า Lobby
        } catch (err) { 
            console.error("Create error:", err); // Log Error
            alert("เกิดข้อผิดพลาด: " + err.message); // แจ้งเตือนผู้ใช้
        } finally { setLoading(false); } // จบสถานะ Loading
    };

    return (
        // Container หลัก จัดกึ่งกลางหน้าจอ
        <div className="p-6 max-w-md mx-auto min-h-screen">
            {/* ปุ่มย้อนกลับไปหน้า Lobby */}
            <button onClick={() => navigate('/mind-game')} className="flex items-center gap-2 text-slate-400 font-bold mb-8 hover:text-rose-500 transition-colors group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> กลับไป Lobby
            </button>
            
            {/* การ์ดฟอร์มสร้างโจทย์ */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-pink-50 text-center relative overflow-hidden">
                {/* ไอคอนหัวใจเต้น */}
                <Heart className="mx-auto text-pink-500 mb-4 animate-pulse" size={48} fill="currentColor" />
                <h1 className="text-2xl font-black italic uppercase text-slate-800 mb-1">สร้างโจทย์ใหม่</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic mb-8 tracking-wider">อะไรอยู่ในใจฉ้านนน?</p>
                
                {/* ส่วนกรอกคำลับ */}
                <div className="text-left space-y-2 mb-8">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">1. ระบุคำลับของคุณ</label>
                        {/* ปุ่มเรียก AI: Disabled ถ้ากำลังโหลดหรือยังไม่ใส่คำลับ */}
                        <button onClick={generateAIDesc} disabled={isAiGenerating || !secretWord} className="bg-purple-500 text-white p-2 px-3 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase hover:bg-purple-600 disabled:opacity-30 shadow-lg shadow-purple-100">
                            {isAiGenerating ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={14}/>} AI HELP
                        </button>
                    </div>
                    {/* Input คำลับ */}
                    <input type="text" placeholder="คำลับของคุณคืออะไร?" className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-pink-500 text-center font-bold text-lg shadow-inner bg-slate-50/50" value={secretWord} onChange={(e) => setSecretWord(e.target.value)} />
                </div>
                
                {/* ส่วนกรอกคำอธิบาย */}
                <div className="text-left space-y-2 mb-8">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">2. คำอธิบาย (สำหรับบอท)</label>
                        {/* ปุ่มล้างข้อมูลใน Textarea */}
                        <button onClick={() => setDescription("")} className="flex items-center gap-1 text-[9px] font-black text-rose-400 hover:text-rose-600 uppercase transition-colors"><Trash2 size={12} /> ล้างข้อมูล</button>
                    </div>
                    {/* Textarea คำอธิบาย: เปลี่ยนสีขอบถ้า AI กำลังทำงาน */}
                    <textarea className={`w-full p-4 rounded-2xl border-2 transition-all min-h-[120px] font-bold text-sm focus:outline-none shadow-inner ${isAiGenerating ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100 focus:border-pink-500 bg-slate-50/50'}`} placeholder="AI จะช่วยอธิบายลักษณะคำลับให้ที่นี่..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                
                {/* ปุ่มบันทึก: Disabled ถ้ากำลังโหลด/AI ทำงาน/ยังไม่ใส่คำลับ */}
                <button onClick={handleCreate} disabled={loading || isAiGenerating || !secretWord} className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black italic uppercase flex items-center justify-center gap-3 hover:bg-rose-500 transition-all shadow-xl active:scale-95 disabled:opacity-20">
                    <Save size={22} /> {loading ? "กำลังบันทึก..." : "บันทึกและเปิดด่าน"}
                </button>
            </div>
        </div>
    );
};

export default CreateLevel;