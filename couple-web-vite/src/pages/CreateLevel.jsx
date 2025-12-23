import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Heart, ArrowLeft, Save, Sparkles, SendHorizontal } from 'lucide-react';

const CreateLevel = () => {
    const [secretWord, setSecretWord] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const navigate = useNavigate();
    
    const userId = localStorage.getItem('user_id');

    const API_URL = window.location.hostname.includes('localhost') 
        ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

    // ✅ ขั้นตอน: ส่งคำลับไปให้ AI เขียนคำอธิบาย
    // ใน CreateLevel.jsx ฟังก์ชัน generateAIDesc
const generateAIDesc = async () => {
    if (!secretWord) {
        alert("ใส่คำลับก่อนนะ เดี๋ยว AI ช่วยเขียนให้!");
        return;
    }

    setIsAiGenerating(true);
    try {
        const res = await fetch(`${API_URL}/api/game/generate-description`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret_word: secretWord })
        });
        
        const data = await res.json();
        // ✅ ถ้าได้ข้อมูลมา ให้ Update State ทันที
        if (data.description && data.description !== "") {
            setDescription(data.description);
        } else {
            alert("AI ส่งค่าว่างกลับมา (อาจเพราะ API Error) ลองตรวจสอบ Terminal ของ Backend นะครับ");
        }
    } catch (err) {
        console.error("AI Generation Error:", err);
        alert("เชื่อมต่อ Backend ไม่สำเร็จ!");
    } finally {
        setIsAiGenerating(false);
    }
};

    // ✅ ขั้นตอน: ตรวจสอบความถูกต้องแล้วบันทึก
    const handleCreate = async () => {
        if (!secretWord || !userId) {
            alert("กรุณาใส่คำลับก่อนบันทึกนะ");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('heart_games')
                .insert([{
                    host_id: userId,
                    secret_word: secretWord,
                    description: description,
                    is_template: true,
                    use_bot: true
                }]);
            
            if (error) throw error;
            alert("สร้างด่านใหม่สำเร็จ! 🎉");
            navigate('/mind-game');
        } catch (err) {
            console.error("Create Level Error:", err);
            alert("เกิดข้อผิดพลาดในการสร้างด่าน: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto min-h-screen">
            {/* Header / Back Button */}
            <button 
                onClick={() => navigate('/mind-game')} 
                className="flex items-center gap-2 text-slate-400 font-bold mb-8 hover:text-rose-500 transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                กลับไป Lobby
            </button>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-pink-50 text-center relative overflow-hidden">
                <Heart className="mx-auto text-pink-500 mb-4 animate-pulse" size={48} fill="currentColor" />
                <h1 className="text-2xl font-black italic uppercase text-slate-800 mb-1">สร้างโจทย์ใหม่</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic mb-8 tracking-wider">อะไรอยู่ในใจฉ้านนน?</p>

                {/* ส่วนที่ 1: พิมพ์คำลับและปุ่มส่งหา AI */}
                <div className="relative mb-8 group">
                    <input 
                        type="text"
                        placeholder="คำลับของคุณคืออะไร?"
                        className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-pink-500 focus:outline-none text-center font-bold text-lg shadow-inner bg-slate-50/50"
                        value={secretWord}
                        onChange={(e) => setSecretWord(e.target.value)}
                    />
                    <button 
                        type="button" 
                        onClick={generateAIDesc}
                        disabled={isAiGenerating || !secretWord}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-500 text-white p-3 rounded-xl hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale shadow-lg shadow-purple-200"
                        title="ให้ AI ช่วยเขียนคำอธิบาย"
                    >
                        {isAiGenerating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                            <Sparkles size={20} />
                        )}
                    </button>
                </div>

                {/* ส่วนที่ 2: ช่องแสดงคำอธิบายสำหรับตรวจสอบ */}
                <div className="mb-8 text-left">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            {isAiGenerating ? "🤖 AI กำลังประมวลผล..." : "📖 คำอธิบาย (สำหรับบอท)"}
                        </label>
                    </div>
                    <textarea 
                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 min-h-[120px] font-bold text-sm focus:outline-none shadow-inner
                            ${isAiGenerating ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100 focus:border-pink-500 bg-slate-50/50'}`}
                        placeholder="AI จะช่วยอธิบายลักษณะคำลับให้ที่นี่..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="text-[9px] text-slate-400 font-bold mt-2 px-2 italic">
                        * คุณสามารถแก้ไขคำอธิบายที่ AI เขียนให้ได้เพื่อให้บอทฉลาดขึ้น
                    </p>
                </div>

                {/* ส่วนที่ 3: ปุ่มบันทึกด่าน */}
                <button 
                    onClick={handleCreate}
                    disabled={loading || isAiGenerating || !secretWord}
                    className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black italic uppercase flex items-center justify-center gap-3 hover:bg-rose-500 transition-all disabled:opacity-20 shadow-xl shadow-slate-200 active:scale-95"
                >
                    <Save size={22} /> 
                    {loading ? "กำลังบันทึก..." : "บันทึกและเปิดด่าน"}
                </button>
            </div>
        </div>
    );
};

export default CreateLevel;