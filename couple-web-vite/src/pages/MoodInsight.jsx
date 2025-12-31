import React, { useState, useEffect } from 'react';
import { X, Sparkles, Heart, Users } from 'lucide-react';
import axios from 'axios';

const MoodInsight = ({ onClose, API_URL, userId }) => {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/users`).then(res => setAllUsers(res.data));
    }, [API_URL]);

    const getAIInsight = async () => {
        if (!targetUser) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/mood/insight`, {
                target_id: targetUser.id,
                target_name: targetUser.username
            });
            setInsight(res.data.insight);
        } catch (err) { 
            console.error(err);
            setInsight("ดูเหมือนแฟนจะต้องการกำลังใจนะ ❤️"); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-purple-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20}/></button>
                <h2 className="text-xl font-black italic uppercase text-purple-600 mb-6 flex items-center gap-2">
                    <Sparkles size={24}/> AI Analyst
                </h2>

                {!insight ? (
                    <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14}/> เลือกคนที่ต้องการให้ AI วิเคราะห์
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {allUsers.map(u => (
                                <button key={u.id} onClick={() => setTargetUser(u)}
                                    className={`p-3 rounded-2xl text-[10px] font-bold border-2 transition-all ${targetUser?.id === u.id ? 'bg-purple-100 border-purple-400 text-purple-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                    {u.username} {u.id === userId && "(ฉัน)"}
                                </button>
                            ))}
                        </div>
                        <button onClick={getAIInsight} disabled={!targetUser || loading} className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all disabled:opacity-50">
                            {loading ? 'Analyzing...' : `วิเคราะห์ ${targetUser?.username || ''} ✨`}
                        </button>
                    </div>
                ) : (
                    <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 animate-in zoom-in duration-300">
                        <p className="text-sm text-purple-900 leading-relaxed font-bold italic">"{insight}"</p>
                        <button onClick={() => setInsight(null)} className="mt-4 text-[10px] font-black uppercase text-purple-400 underline">วิเคราะห์คนอื่นต่อ</button>
                    </div>
                )}
            </div>
        </div>
    );
};
export default MoodInsight;