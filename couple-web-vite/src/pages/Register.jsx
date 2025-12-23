import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✨ คำนวณ API_URL ตามตำแหน่งที่รันแอป (ใช้ได้ทั้ง localhost และ Vercel)
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : 'https://lover-backend.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // ✅ ส่งข้อมูลไปที่ API /api/register
        await axios.post(`${API_URL}/api/register`, formData);
        alert('สมัครสมาชิกสำเร็จ! 🎉 กรุณาล็อกอินเพื่อเริ่มใช้งาน');
        navigate('/login');
    } catch (err) {
        console.error("Register Error:", err);
        const msg = err.response?.data || 'สมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่อ Backend';
        alert(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-rose-100">
        <h2 className="text-3xl font-black text-rose-500 mb-6 text-center italic tracking-tighter uppercase">Join Us ✨</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Username</label>
            <input 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold text-slate-700 focus:border-rose-300 transition-all"
              placeholder="ตั้งชื่อผู้ใช้งาน..." 
              type="text" 
              required 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Password</label>
            <input 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold text-slate-700 focus:border-rose-300 transition-all"
              placeholder="ตั้งรหัสผ่าน..." 
              type="password" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;