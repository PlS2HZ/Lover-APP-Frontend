import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, UserMinus, CheckCircle2, XCircle, Shield, Eye, Bomb, Sparkles, HelpCircle, Trophy, Ghost } from 'lucide-react';

const GangQuizPage = () => {
    // --- State สำหรับตั้งค่าเกม ---
    const [gameState, setGameState] = useState('setup'); 
    const [players, setPlayers] = useState([
        { name: 'พี', score: 0, wrong: 0, shieldSaves: 0, bombHits: 0, items: [] }, 
        { name: 'รสดี', score: 0, wrong: 0, shieldSaves: 0, bombHits: 0, items: [] }
    ]);
    const [maxQuestions, setMaxQuestions] = useState(10);
    const [category, setCategory] = useState('ความรู้รอบตัว');
    const [playedQuestions, setPlayedQuestions] = useState([]);

    // --- State สำหรับดำเนินเกม ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [quiz, setQuiz] = useState(null);
    const [roundAnswers, setRoundAnswers] = useState([]); 
    const [loading, setLoading] = useState(false);
    
    // --- State สำหรับไอเทมและความช่วยเหลือ ---
    const [itemFeedback, setItemFeedback] = useState(""); 
    const [selectedItem, setSelectedItem] = useState(null); 
    const [hiddenOptions, setHiddenOptions] = useState([]); 
    const [showGoldenHint, setShowGoldenHint] = useState(false); 
    const [isShieldActive, setIsShieldActive] = useState(false); 
    const [targetVictim, setTargetVictim] = useState(null); 

    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    useEffect(() => { 
        if (itemFeedback) { 
            const t = setTimeout(() => setItemFeedback(""), 3000); 
            return () => clearTimeout(t); 
        } 
    }, [itemFeedback]);

    const addPlayer = () => setPlayers([...players, { name: '', score: 0, wrong: 0, shieldSaves: 0, bombHits: 0, items: [] }]);
    const removePlayer = (index) => setPlayers(players.filter((_, i) => i !== index));
    const updatePlayerName = (index, val) => {
        const newPlayers = [...players];
        newPlayers[index].name = val;
        setPlayers(newPlayers);
    };

    const startNewRound = useCallback(async () => {
        setLoading(true);
        setQuiz(null);
        setRoundAnswers([]);
        setCurrentPlayerIndex(0);
        setHiddenOptions([]);
        setShowGoldenHint(false);
        setIsShieldActive(false);
        setTargetVictim(null);
        setSelectedItem(null);
        try {
            const excludeList = playedQuestions.join(',');
            const res = await axios.get(`${API_URL}/api/gang-quiz/random?category=${category}&exclude=${encodeURIComponent(excludeList)}`);
            
            if (res.data) { 
                setQuiz(res.data); 
                setPlayedQuestions(prev => [...prev, res.data.question]);
                setGameState('playing'); 
            }
        } catch (err) { console.error(err); setGameState('setup'); }
        setLoading(false);
    }, [category, playedQuestions, API_URL]);

    const removeItem = useCallback((itemType) => {
        setPlayers(prev => {
            const updated = [...prev];
            const pIdx = currentPlayerIndex;
            const itemIdx = updated[pIdx].items.indexOf(itemType);
            if (itemIdx > -1) {
                const newItems = [...updated[pIdx].items];
                newItems.splice(itemIdx, 1);
                updated[pIdx] = { ...updated[pIdx], items: newItems };
            }
            return updated;
        });
        setSelectedItem(null);
    }, [currentPlayerIndex]);

    // ✅ ปรับแต่ง Rate ไอเทมและขีดจำกัดตามคำสั่งนาย
    const giveRandomItem = useCallback((pIdx) => {
        setPlayers(prev => {
            const updated = [...prev];
            const player = updated[pIdx];
            
            // 🎒 ขีดจำกัดคลังไอเทม: นายขอเปลี่ยนเป็น 4 ชิ้น
            if (player.items.length >= 4) return prev; 

            const roll = Math.random() * 100;
            let newItem = null;

            // 🎯 ปรับ Rate ตามที่นายวิเคราะห์ (สะสมโอกาสสุ่ม)
            if (roll < 10) newItem = 'golden';      // 🟡 10% เนตรพระเจ้า
            else if (roll < 25) newItem = 'bomb';    // 💣 15% ระเบิดสั่งตาย (10 + 15 = 25)
            else if (roll < 45) newItem = 'shield';  // 🛡️ 20% โล่ศักดิ์สิทธิ์ (25 + 20 = 45)
            else if (roll < 80) newItem = 'oracle';  // 🔵 35% ดวงตาสีน้ำเงิน (45 + 35 = 80)
            // (อีก 20% ที่เหลือคือไม่ได้ไอเทม เพื่อความท้าทาย)

            if (newItem) player.items.push(newItem);
            return updated;
        });
    }, []);

    const handleAnswer = useCallback((optionIndex) => {
        if (!quiz) return;
        const isCorrect = optionIndex === quiz.answer_index;
        
        const currentAnswer = { 
            playerIndex: currentPlayerIndex, 
            isCorrect, 
            chosenIndex: optionIndex, 
            usedShield: isShieldActive,
            bombTarget: targetVictim 
        };
        
        const updatedRoundAnswers = [...roundAnswers, currentAnswer];
        setRoundAnswers(updatedRoundAnswers);

        // ✅ อัปเดตสถิติพื้นฐาน: ถูก + ผิด = 1 ข้อเสมอ
        setPlayers(prev => {
            const updated = [...prev];
            const player = { ...updated[currentPlayerIndex] };
            
            if (isCorrect) {
                player.score += 1;
                // ✅ ได้ไอเทมเฉพาะเมื่อตอบถูกจริงเท่านั้น
                giveRandomItem(currentPlayerIndex);
            } else {
                player.wrong += 1;
                if (isShieldActive) {
                    player.shieldSaves += 1; 
                }
            }
            updated[currentPlayerIndex] = player;
            return updated;
        });

        // ✅ [แก้ไขจุดที่ 1] ล้างสถานะ Focus/Hover บนมือถือให้หายขาด
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        // บังคับให้ Window เลิกสนใจการคลิกค้าง
        window.getSelection()?.removeAllRanges();

        if (currentPlayerIndex < players.length - 1) {
            // ✅ [แก้ไขจุดที่ 2] บังคับ Re-render ส่วนของปุ่มเพื่อล้างสี Highlight ของระบบมือถือ
            setCurrentPlayerIndex(prev => prev + 1);
            setHiddenOptions([]); 
            setShowGoldenHint(false); 
            setIsShieldActive(false); 
            setTargetVictim(null); 
            setSelectedItem(null);
        } else {
            setPlayers(currentPlayers => {
                const finalUpdated = [...currentPlayers];
                updatedRoundAnswers.forEach(ans => {
                    if (ans.bombTarget) {
                        const victimIdx = finalUpdated.findIndex(p => p.name === ans.bombTarget);
                        const victimAns = updatedRoundAnswers.find(a => a.playerIndex === victimIdx);
                        // โล่เขียวกันระเบิดได้ 100%
                        if (victimAns && !victimAns.isCorrect && !victimAns.usedShield) {
                            finalUpdated[victimIdx].bombHits += 1; 
                        }
                    }
                });
                return finalUpdated;
            });
            setGameState('review');
        }
    }, [quiz, currentPlayerIndex, players, isShieldActive, targetVictim, roundAnswers, giveRandomItem]);

    const getItemInfo = (type) => {
        const info = {
            'shield': { title: 'โล่ศักดิ์สิทธิ์', desc: 'ป้องกันแต้มผิดและระเบิดได้ 100% ในตานี้' },
            'oracle': { title: 'ดวงตาสีน้ำเงิน', desc: 'ตัดตัวเลือกที่ผิดทิ้ง 2 ข้อ' },
            'bomb': { title: 'ระเบิดสั่งตาย', desc: 'เลือกเป้าหมาย 1 คน ถ้าเขาตอบผิด เขาจะโดน x2' },
            'golden': { title: 'เนตรพระเจ้า', desc: 'เห็นเฉลยที่ถูกต้องทันที' }
        };
        return info[type];
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-slate-900 min-h-screen text-white font-bold relative overflow-hidden text-sm">
            {itemFeedback && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-bounce text-[10px] uppercase font-black">{itemFeedback}</div>}

            <h1 className="text-2xl font-black italic text-center mb-8 text-yellow-400 uppercase tracking-tighter">Harry's Roulette Quiz 🍭</h1>

            {/* --- SETUP --- */}
            {gameState === 'setup' && (
                <div className="space-y-6 animate-in fade-in font-black">
                    <div className="bg-slate-800 p-6 rounded-[2rem] border-2 border-slate-700 shadow-xl text-center">
                        <label className="text-[10px] uppercase text-slate-400 mb-4 block tracking-widest font-black underline decoration-yellow-400">รายชื่อผู้ร่วมชะตากรรม</label>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {players.map((p, i) => (
                                <div key={i} className="flex gap-2 animate-in slide-in-from-left">
                                    <input value={p.name} onChange={(e) => updatePlayerName(i, e.target.value)}
                                        placeholder={`คนที่ ${i+1}`} className="flex-1 bg-slate-700 p-3 rounded-xl outline-none border-2 border-transparent focus:border-yellow-400 font-black" />
                                    {players.length > 2 && <button onClick={() => removePlayer(i)} className="text-rose-400 p-2"><UserMinus size={20}/></button>}
                                </div>
                            ))}
                        </div>
                        <button onClick={addPlayer} className="w-full mt-4 py-2 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 text-[10px] flex items-center justify-center gap-2 hover:border-yellow-400 transition-all font-black"><UserPlus size={14}/> เพิ่มสมาชิก</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 font-black">
                        <div className="bg-slate-800 p-4 rounded-2xl border-2 border-slate-700 text-center font-black">
                            <label className="text-[9px] uppercase text-slate-400 block mb-2">จำนวนข้อ</label>
                            <div className="flex justify-around font-black">
                                {[5, 10, 20].map(n => <button key={n} onClick={() => setMaxQuestions(n)} className={`text-xs px-2 py-1 rounded transition-colors font-black ${maxQuestions === n ? 'bg-yellow-400 text-slate-900' : 'text-slate-500 hover:text-white'}`}>{n}</button>)}
                            </div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-2xl border-2 border-slate-700 text-center font-black">
                            <label className="text-[9px] uppercase text-slate-400 block mb-2 font-black">หมวดหมู่</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-transparent text-[10px] text-yellow-400 outline-none cursor-pointer font-black">
                                <option value="ความรู้รอบตัว">🌏 ความรู้รอบตัว</option>
                                <option value="ประวัติศาสตร์กวนๆ">📜 ประวัติศาสตร์</option>
                                <option value="วิทยาศาสตร์น่ารู้">🧪 วิทยาศาสตร์</option>
                                <option value="บันเทิงและดารา">🎬 บันเทิง/ดารา</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={async () => { setPlayers(players.map(p=>({...p, score:0, wrong:0, shieldSaves:0, bombHits:0}))); setPlayedQuestions([]); setCurrentQuestionIndex(0); await startNewRound(); }} disabled={loading} className="w-full py-5 bg-yellow-400 text-slate-900 rounded-[2rem] font-black uppercase italic shadow-lg active:scale-95 transition-all font-black">เริ่มสงครามลูกอม ✨</button>
                </div>
            )}

            {/* --- PLAYING --- */}
            {gameState === 'playing' && quiz && (
                <div className="space-y-6 animate-in slide-in-from-right font-black">
                    <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border-2 border-slate-700 font-black">
                        <div className="text-[10px] uppercase text-slate-400 font-black">ข้อ {currentQuestionIndex + 1}/{maxQuestions}</div>
                        <div className="text-yellow-400 uppercase italic text-sm tracking-tighter font-black">คิว: {players[currentPlayerIndex].name}</div>
                    </div>

                    <div className="p-8 bg-white text-slate-900 rounded-[2.5rem] shadow-2xl relative text-center font-black">
                        {isShieldActive && <Shield className="absolute -top-3 -right-3 text-green-500 fill-green-500 drop-shadow-lg animate-pulse" size={40}/>}
                        {targetVictim && <Bomb className="absolute -top-3 -right-3 text-rose-500 animate-pulse drop-shadow-lg" size={40}/>}
                        <p className="text-lg font-black italic leading-tight uppercase font-black">{quiz.question}</p>
                    </div>

                    <div className="space-y-3 font-black">
                        {quiz.options.map((opt, i) => (
                            !hiddenOptions.includes(i) && (
                                <button key={i} onClick={() => handleAnswer(i)}
                                    className={`w-full p-4 border-2 rounded-2xl text-xs text-left transition-all flex justify-between items-center font-black
                                    ${showGoldenHint && i === quiz.answer_index ? 'bg-yellow-400/20 border-yellow-400 text-yellow-900 scale-105 font-black' : 'bg-slate-800 border-slate-700 hover:border-yellow-400 font-black'}`}>
                                    <span>{opt}</span>
                                    {showGoldenHint && i === quiz.answer_index && <Sparkles size={16} className="text-yellow-600 animate-pulse"/>}
                                </button>
                            )
                        ))}
                    </div>

                    {players[currentPlayerIndex].items.length > 0 && (
                        <div className="bg-slate-800/80 p-5 rounded-[2rem] border border-white/10 shadow-inner font-black">
                            {selectedItem === 'bomb' && !targetVictim ? (
                                <div className="text-center animate-in zoom-in font-black">
                                    <p className="text-[11px] text-rose-400 uppercase font-black mb-3 underline font-black">เลือกเป้าหมายระเบิด!</p>
                                    <div className="grid grid-cols-2 gap-2 font-black">
                                        {players.filter((_, idx) => idx !== currentPlayerIndex).map((p, idx) => (
                                            <button key={idx} onClick={() => { setTargetVictim(p.name); setItemFeedback(`💣 ล็อกเป้าหมายที่ ${p.name}!`); removeItem('bomb'); }}
                                                className="bg-slate-700 p-2 rounded-xl text-[9px] hover:bg-rose-500 transition-colors uppercase font-black font-black">
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} className="mt-3 text-[8px] text-slate-500 uppercase font-black">ยกเลิก</button>
                                </div>
                            ) : selectedItem ? (
                                <div className="text-center space-y-3 animate-in fade-in duration-300 font-black">
                                    <p className="text-[11px] text-yellow-400 uppercase font-black font-black font-black">{getItemInfo(selectedItem).title}</p>
                                    <p className="text-[9px] text-slate-300 italic font-black font-black">{getItemInfo(selectedItem).desc}</p>
                                    <div className="flex gap-2 justify-center font-black">
                                        <button onClick={() => setSelectedItem(null)} className="px-4 py-1.5 bg-slate-700 rounded-lg text-[9px] uppercase">ยกเลิก</button>
                                        <button onClick={() => {
                                            if(selectedItem === 'oracle') { 
                                                let wrongIndices = [];
                                                quiz.options.forEach((_, i) => { if (i !== quiz.answer_index) wrongIndices.push(i); });
                                                setHiddenOptions(wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2));
                                                setItemFeedback("🔵 ตัดช้อยผิดทิ้ง 2 ข้อ!");
                                                removeItem('oracle'); 
                                            }
                                            if(selectedItem === 'golden') { setShowGoldenHint(true); setItemFeedback("✨ เห็นเฉลยแล้ว!"); removeItem('golden'); }
                                            if(selectedItem === 'shield') { setIsShieldActive(true); setItemFeedback("🛡️ โล่ทำงาน!"); removeItem('shield'); }
                                        }} className="px-4 py-1.5 bg-yellow-400 text-slate-900 rounded-lg text-[9px] uppercase font-black shadow-lg font-black">ใช้ไอเทม ✨</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-4 justify-center font-black font-black">
                                    {players[currentPlayerIndex].items.map((item, idx) => (
                                        <button key={idx} onClick={() => setSelectedItem(item)}
                                            className={`p-4 rounded-full shadow-lg transition-all active:scale-75 font-black
                                            ${item === 'shield' ? 'bg-green-500 font-black' : item === 'oracle' ? 'bg-blue-500 font-black' : item === 'bomb' ? 'bg-rose-500 font-black' : 'bg-yellow-400 text-slate-900 font-black'}`}>
                                            {item === 'shield' ? <Shield size={22}/> : item === 'oracle' ? <Eye size={22}/> : item === 'bomb' ? <Bomb size={22}/> : <Sparkles size={22}/>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- REVIEW --- */}
            {gameState === 'review' && quiz && (
                <div className="space-y-5 animate-in zoom-in font-black">
                    <h2 className="text-xl font-black text-center text-yellow-400 italic uppercase underline decoration-rose-500 font-black">ผลตัดสินรอบนี้! 🍭</h2>
                    <div className="bg-white/10 border-2 border-yellow-400/50 p-5 rounded-[2.5rem] shadow-xl text-center font-black">
                        <p className="text-xl text-green-400 font-black italic uppercase font-black">เฉลย: "{quiz.options[quiz.answer_index]}"</p>
                    </div>

                    <div className="bg-slate-800 rounded-[2rem] p-5 border-2 border-slate-700 shadow-inner font-black">
                        <p className="text-[8px] text-slate-400 uppercase mb-3 text-center tracking-widest font-black">ตารางสถิติปัจจุบัน</p>
                        {players.map((p, i) => {
                            const ans = roundAnswers.find(a => a.playerIndex === i);
                            const isVictim = roundAnswers.some(a => a.bombTarget === p.name);
                            const hitByBomb = isVictim && ans && !ans.isCorrect && !ans.usedShield;

                            return (
                                <div key={i} className={`flex justify-between items-center p-3 rounded-xl mb-2 border-2 font-black ${ans?.isCorrect || ans?.usedShield ? 'bg-green-500/10 border-green-500/30' : 'bg-rose-500/10 border-rose-500/30 font-black'}`}>
                                    <div className="flex flex-col font-black font-black">
                                        <div className="flex gap-2 items-center font-black">
                                            <span className="text-sm uppercase font-black">{p.name}</span>
                                            {ans?.usedShield && <span className="text-[7px] bg-green-600 px-1.5 py-0.5 rounded text-white font-black font-black">โล่ (รอด)</span>}
                                            {ans?.bombTarget && <span className="text-[7px] bg-rose-600 px-1.5 py-0.5 rounded text-white font-black font-black">บึ้ม {ans.bombTarget}!</span>}
                                        </div>
                                        <span className="text-[8px] text-slate-400 mt-1 font-black font-black">ถูก {p.score} | ผิด {p.wrong} {p.bombHits > 0 ? `| 💣 -${p.bombHits}` : ''}</span>
                                    </div>
                                    <div className="flex flex-col items-end font-black font-black">
                                        {ans?.isCorrect || ans?.usedShield ? <CheckCircle2 className="text-green-500 font-black" size={16}/> : <XCircle className="text-rose-500 font-black" size={16}/>}
                                        {hitByBomb && <span className="text-[7px] text-yellow-400 font-black font-black font-black">💥 โดน x2!</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={async () => { if(currentQuestionIndex < maxQuestions - 1) { setCurrentQuestionIndex(prev => prev + 1); await startNewRound(); } else { setGameState('endgame'); } }}
                        className="w-full py-4 bg-yellow-400 text-slate-900 rounded-2xl font-black uppercase italic shadow-xl active:scale-95 font-black font-black font-black">ไปต่อ ↻</button>
                </div>
            )}

            {/* --- ENDGAME --- */}
            {gameState === 'endgame' && (
                <div className="space-y-6 text-center animate-in bounce-in font-black">
                    <h2 className="text-3xl font-black text-yellow-400 italic uppercase tracking-widest font-black font-black font-black">ใครซวยที่สุด?</h2>
                    <div className="bg-slate-800 rounded-[2.5rem] p-6 border-2 border-slate-700 shadow-xl font-black font-black font-black font-black">
                        {players.sort((a,b) => a.score - b.score).map((p, i, sorted) => {
                            const isWorst = p.score === sorted[0].score;
                            return (
                                <div key={i} className="py-4 border-b border-slate-700 last:border-0 px-4 font-black font-black font-black font-black">
                                    <div className="flex justify-between items-center mb-3 font-black">
                                        <div className="flex items-center gap-2 font-black font-black font-black font-black font-black">
                                            {isWorst ? <Ghost className="text-rose-500" size={20}/> : <Trophy className="text-yellow-400" size={20}/>}
                                            <span className="uppercase text-sm font-black font-black font-black">{isWorst ? '🤢 ผู้ดวงกุด' : '🏆 ผู้รอดชีวิต'} : {p.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-black font-black font-black font-black">ครบ {maxQuestions} ข้อ</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 font-black font-black font-black font-black">
                                        <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/30 text-green-400 text-[10px] font-black font-black">ถูก {p.score}</div>
                                        <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/30 text-rose-400 text-[10px] text-left font-black font-black font-black">ผิด {p.wrong}</div>
                                    </div>
                                    {(p.bombHits > 0 || p.shieldSaves > 0) && (
                                        <div className="mt-2 flex gap-2 justify-center font-black font-black">
                                            {p.bombHits > 0 && <span className="bg-rose-600/20 text-rose-500 px-2 py-0.5 rounded text-[8px] font-black font-black font-black">💣 ระเบิดสะสม -{p.bombHits}</span>}
                                            {p.shieldSaves > 0 && <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black font-black font-black font-black">🛡️ ป้องกันสำเร็จ {p.shieldSaves} ครั้ง</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => window.location.reload()} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-rose-500/20 active:scale-95 font-black font-black font-black">เริ่มวงใหม่ ↻</button>
                </div>
            )}
        </div>
    );
};

export default GangQuizPage;