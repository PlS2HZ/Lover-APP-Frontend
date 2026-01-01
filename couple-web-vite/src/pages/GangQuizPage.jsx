import React, { useState, useEffect, useCallback } from 'react'; // นำเข้า React Hooks พื้นฐาน
import axios from 'axios'; // นำเข้า axios สำหรับยิง API
import { UserPlus, UserMinus, CheckCircle2, XCircle, Shield, Eye, Bomb, Sparkles, HelpCircle, Trophy, Ghost, ArrowRight, Smartphone } from 'lucide-react'; // นำเข้าไอคอน

const GangQuizPage = () => {
    // --- State สำหรับตั้งค่าเกม ---
    // gameState: ควบคุมหน้าจอ ('setup' = ตั้งค่า, 'playing' = ระหว่างเล่น, 'review' = เฉลย, 'endgame' = จบเกม)
    const [gameState, setGameState] = useState('setup'); 
    // players: เก็บข้อมูลผู้เล่นทุกคน (ชื่อ, คะแนน, สถานะต่างๆ, ไอเทมที่มี)
    const [players, setPlayers] = useState([
        { name: 'พี', score: 0, wrong: 0, shieldSaves: 0, bombHits: 0, items: [] }, 
        { name: 'รสดี', score: 0, wrong: 0, shieldSaves: 0, bombHits: 0, items: [] }
    ]);
    // maxQuestions: จำนวนข้อที่จะเล่น (default 10)
    const [maxQuestions, setMaxQuestions] = useState(10);
    // category: หมวดหมู่คำถามที่เลือก
    const [category, setCategory] = useState('ความรู้รอบตัว');
    // playedQuestions: เก็บรายชื่อคำถามที่เล่นไปแล้ว เพื่อกันไม่ให้ซ้ำ
    const [playedQuestions, setPlayedQuestions] = useState([]);

    // --- State สำหรับดำเนินเกม ---
    // currentQuestionIndex: ข้อปัจจุบันที่เล่นอยู่ (0, 1, 2...)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // currentPlayerIndex: ผู้เล่นคนปัจจุบันที่ถึงคิวตอบ (Index ใน array players)
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    // quiz: เก็บข้อมูลโจทย์คำถามปัจจุบัน
    const [quiz, setQuiz] = useState(null);
    // roundAnswers: เก็บคำตอบของทุกคนในรอบนั้นๆ (เพื่อเอาไปคิดคะแนนตอนจบข้อ)
    const [roundAnswers, setRoundAnswers] = useState([]); 
    // loading: สถานะกำลังโหลดโจทย์
    const [loading, setLoading] = useState(false);
    
    // --- State สำหรับระบบสลับคน (Handover) ---
    // isWaitingHandover: True = จบตาคนปัจจุบันแล้ว รอส่งมือถือให้คนถัดไป
    const [isWaitingHandover, setIsWaitingHandover] = useState(false);
    // lastChosenIndex: เก็บ index ของช้อยส์ที่เพิ่งกดไป (เพื่อ highlight สี)
    const [lastChosenIndex, setLastChosenIndex] = useState(null);

    // --- State สำหรับไอเทมและความช่วยเหลือ ---
    // itemFeedback: ข้อความแจ้งเตือนผลการใช้ไอเทม (เด้งขึ้นมาแล้วหายไป)
    const [itemFeedback, setItemFeedback] = useState(""); 
    // selectedItem: ไอเทมที่กำลังเลือกจะใช้ (ยังไม่กดยืนยัน)
    const [selectedItem, setSelectedItem] = useState(null); 
    // hiddenOptions: เก็บ Index ของช้อยส์ที่จะถูกซ่อน (ผลจากไอเทม Oracle)
    const [hiddenOptions, setHiddenOptions] = useState([]); 
    // showGoldenHint: True = แสดงเฉลย (ผลจากไอเทม Golden Eye)
    const [showGoldenHint, setShowGoldenHint] = useState(false); 
    // isShieldActive: True = เปิดใช้โล่ป้องกันในตานี้
    const [isShieldActive, setIsShieldActive] = useState(false); 
    // targetVictim: ชื่อผู้เล่นที่เป็นเป้าหมายของระเบิด
    const [targetVictim, setTargetVictim] = useState(null); 

    // กำหนด API URL
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    // Effect: ตั้งเวลาเคลียร์ข้อความแจ้งเตือน (itemFeedback) อัตโนมัติใน 3 วินาที
    useEffect(() => { 
        if (itemFeedback) { 
            const t = setTimeout(() => setItemFeedback(""), 3000); 
            return () => clearTimeout(t); 
        } 
    }, [itemFeedback]);

    // ฟังก์ชันเพิ่มผู้เล่นใหม่
    const addPlayer = () => setPlayers([...players, { name: '', score: 0, wrong: 0, shieldSaves: 0, bombHits: 0, items: [] }]);
    // ฟังก์ชันลบผู้เล่น
    const removePlayer = (index) => setPlayers(players.filter((_, i) => i !== index));
    // ฟังก์ชันอัปเดตชื่อผู้เล่น
    const updatePlayerName = (index, val) => {
        const newPlayers = [...players];
        newPlayers[index].name = val;
        setPlayers(newPlayers);
    };

    // ฟังก์ชันเริ่มรอบใหม่ (สุ่มโจทย์)
    const startNewRound = useCallback(async () => {
        setLoading(true);
        setQuiz(null); // เคลียร์โจทย์เก่า
        setRoundAnswers([]); // เคลียร์คำตอบเก่า
        setCurrentPlayerIndex(0); // เริ่มที่คนแรก
        setHiddenOptions([]); // เคลียร์ตัวช่วยตัดช้อย
        setShowGoldenHint(false); // เคลียร์เฉลย
        setIsShieldActive(false); // ปิดโล่
        setTargetVictim(null); // เคลียร์เป้าระเบิด
        setSelectedItem(null); // ยกเลิกการเลือกไอเทม
        setIsWaitingHandover(false); // ยกเลิกหน้าส่งเครื่อง
        setLastChosenIndex(null); // เคลียร์ไฮไลท์ช้อยส์
        try {
            // สร้าง list คำถามที่เล่นไปแล้วเพื่อส่งไป exclude
            const excludeList = playedQuestions.join(',');
            // ยิง API สุ่มคำถาม
            const res = await axios.get(`${API_URL}/api/gang-quiz/random?category=${category}&exclude=${encodeURIComponent(excludeList)}`);
            if (res.data) { 
                setQuiz(res.data); 
                setPlayedQuestions(prev => [...prev, res.data.question]); // เพิ่มคำถามลง list ที่เล่นแล้ว
                setGameState('playing'); // เปลี่ยนสถานะเป็น playing
            }
        } catch (err) { console.error(err); setGameState('setup'); } // ถ้า error กลับไปหน้า setup
        setLoading(false);
    }, [category, playedQuestions, API_URL]);

    // ฟังก์ชันลบไอเทมออกจาก inventory ผู้เล่น (เมื่อใช้แล้ว)
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
        setSelectedItem(null); // ยกเลิกการเลือกหลังใช้
    }, [currentPlayerIndex]);

    // ฟังก์ชันสุ่มแจกไอเทม (เมื่อตอบถูก)
    const giveRandomItem = useCallback((pIdx) => {
        setPlayers(prev => {
            const updated = [...prev];
            const player = updated[pIdx];
            if (player.items.length >= 4) return prev; // ถ้าไอเทมเต็ม 4 ช่อง ไม่แจกเพิ่ม
            const roll = Math.random() * 100; // สุ่มตัวเลข 0-100
            let newItem = null;
            // กำหนดความน่าจะเป็นของไอเทมแต่ละชนิด
            if (roll < 10) newItem = 'golden'; // 10%
            else if (roll < 25) newItem = 'bomb'; // 15%
            else if (roll < 45) newItem = 'shield'; // 20%
            else if (roll < 80) newItem = 'oracle'; // 35%
            if (newItem) player.items.push(newItem);
            return updated;
        });
    }, []);

    // ฟังก์ชันจัดการเมื่อผู้เล่นกดตอบ
    const handleAnswer = (optionIndex) => {
        if (!quiz || loading || isWaitingHandover) return; // ถ้าไม่พร้อม ห้ามกด
        
        setLastChosenIndex(optionIndex); // แสดงสถานะว่าเลือกข้อนี้
        const isCorrect = optionIndex === quiz.answer_index;
        
        // บันทึกผลการตอบของคนนี้
        const currentAnswer = { 
            playerIndex: currentPlayerIndex, 
            isCorrect, 
            chosenIndex: optionIndex, 
            usedShield: isShieldActive,
            bombTarget: targetVictim 
        };
        
        const updatedRoundAnswers = [...roundAnswers, currentAnswer];
        setRoundAnswers(updatedRoundAnswers);

        // อัปเดตคะแนนและสถานะผู้เล่น
        setPlayers(prev => {
            const updated = [...prev];
            const player = { ...updated[currentPlayerIndex] };
            if (isCorrect) {
                player.score += 1;
                giveRandomItem(currentPlayerIndex); // ตอบถูกได้ไอเทม
            } else {
                player.wrong += 1;
                if (isShieldActive) player.shieldSaves += 1; // นับสถิติการใช้โล่
            }
            updated[currentPlayerIndex] = player;
            return updated;
        });

        // ✅ แก้ปัญหา "กรอบเหลือง" ค้าง: ล้าง Focus ออกจากปุ่ม
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        window.getSelection()?.removeAllRanges();

        // ✅ หน่วงเวลาเล็กน้อยแล้วเข้าสู่สถานะรอส่งเครื่อง (Handover)
        setTimeout(() => {
            setIsWaitingHandover(true);
        }, 500); // 0.5 วินาที
    };

    // ฟังก์ชันเปลี่ยนคนเล่น (กดปุ่ม "ไปต่อ" ในหน้า Handover)
    const nextPlayer = () => {
        setLastChosenIndex(null); // ล้างไฮไลท์คำตอบ
        setIsWaitingHandover(false); // ปิดหน้า Handover

        if (currentPlayerIndex < players.length - 1) {
            // ถ้ายังไม่ครบทุกคน ให้ไปคนถัดไป และรีเซ็ตสถานะไอเทม
            setCurrentPlayerIndex(prev => prev + 1);
            setHiddenOptions([]); 
            setShowGoldenHint(false); 
            setIsShieldActive(false); 
            setTargetVictim(null); 
            setSelectedItem(null);
        } else {
            // ถ้าครบทุกคนแล้ว จบรอบ คำนวณผลระเบิด และไปหน้า Review
            setPlayers(currentPlayers => {
                const finalUpdated = [...currentPlayers];
                roundAnswers.forEach(ans => {
                    // เช็คว่าใครโดนระเบิดบ้าง
                    if (ans.bombTarget) {
                        const victimIdx = finalUpdated.findIndex(p => p.name === ans.bombTarget);
                        const victimAns = roundAnswers.find(a => a.playerIndex === victimIdx);
                        // ถ้าเหยื่อตอบผิดและไม่มีโล่ -> โดนระเบิด
                        if (victimAns && !victimAns.isCorrect && !victimAns.usedShield) {
                            finalUpdated[victimIdx].bombHits += 1; 
                        }
                    }
                });
                return finalUpdated;
            });
            setGameState('review');
        }
    };

    // ข้อมูลรายละเอียดไอเทมแต่ละชนิด
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
        // Container หลักของหน้า
        <div className="max-w-md mx-auto p-6 bg-slate-900 min-h-screen text-white font-bold relative overflow-hidden text-sm">
            {/* Feedback Popup (แจ้งเตือนลอย) */}
            {itemFeedback && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-bounce text-[10px] uppercase font-black">{itemFeedback}</div>}

            <h1 className="text-2xl font-black italic text-center mb-8 text-yellow-400 uppercase tracking-tighter">Harry's Roulette Quiz 🍭</h1>

            {/* --- SETUP PHASE: หน้าตั้งค่าก่อนเริ่มเกม --- */}
            {gameState === 'setup' && (
                <div className="space-y-6 animate-in fade-in font-black">
                    {/* ส่วนจัดการผู้เล่น */}
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

                    {/* ส่วนตั้งค่าเกม (จำนวนข้อ, หมวดหมู่) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-2xl border-2 border-slate-700 text-center font-black">
                            <label className="text-[9px] uppercase text-slate-400 block mb-2">จำนวนข้อ</label>
                            <div className="flex justify-around font-black">
                                {[5, 10, 20].map(n => <button key={n} onClick={() => setMaxQuestions(n)} className={`text-xs px-2 py-1 rounded transition-colors ${maxQuestions === n ? 'bg-yellow-400 text-slate-900' : 'text-slate-500 hover:text-white'}`}>{n}</button>)}
                            </div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-2xl border-2 border-slate-700 text-center">
                            <label className="text-[9px] uppercase text-slate-400 block mb-2 font-black">หมวดหมู่</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-transparent text-[10px] text-yellow-400 outline-none cursor-pointer font-black">
                                <option value="ความรู้รอบตัว">🌏 ความรู้รอบตัว</option>
                                {/* ... ตัวเลือกอื่นๆ ... */}
                                <option value="วิทยาศาสตร์น่ารู้">🧪 วิทยาศาสตร์</option>
                                <option value="ประวัติศาสตร์กวนๆ">📜 ประวัติศาสตร์</option>
                                <option value="บันเทิงและดารา">🎬 บันเทิง/ดารา</option>
                                <option value="ภูมิศาสตร์โลก">🗺️ ภูมิศาสตร์/สถานที่</option>
                                <option value="กีฬาและสถิติกีฬา">⚽ กีฬา/สถิติโลก</option>
                                <option value="เทคโนโลยีและนวัตกรรม">💻 เทคโนโลยี/AI</option>
                                <option value="อาหารและวัฒนธรรม">🍕 อาหาร/วัฒนธรรม</option>
                                <option value="สัตว์โลกน่ารัก">🦁 สัตว์/ธรรมชาติ</option>
                                <option value="แบรนด์ดังระดับโลก">🛍️ ธุรกิจ/แบรนด์ดัง</option>
                            </select>
                        </div>
                    </div>
                    {/* ปุ่มเริ่มเกม (Reset ค่าต่างๆ ก่อนเริ่ม) */}
                    <button onClick={async () => { setPlayers(players.map(p=>({...p, score:0, wrong:0, shieldSaves:0, bombHits:0}))); setPlayedQuestions([]); setCurrentQuestionIndex(0); await startNewRound(); }} disabled={loading} className="w-full py-5 bg-yellow-400 text-slate-900 rounded-[2rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">เริ่มสงครามลูกอม ✨</button>
                </div>
            )}

            {/* --- PLAYING PHASE: ระหว่างเล่น --- */}
            {gameState === 'playing' && quiz && (
                <div className="space-y-6 animate-in slide-in-from-right font-black">
                    {/* ✅ เงื่อนไข: ถ้าไม่ได้รอส่งเครื่อง (Handover) ให้แสดงหน้าจอเล่นปกติ */}
                    {!isWaitingHandover ? (
                        <>
                            {/* Header บอกข้อและคิวคนเล่น */}
                            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border-2 border-slate-700">
                                <div className="text-[10px] uppercase text-slate-400">ข้อ {currentQuestionIndex + 1}/{maxQuestions}</div>
                                <div className="text-yellow-400 uppercase italic text-sm tracking-tighter">คิว: {players[currentPlayerIndex].name}</div>
                            </div>

                            {/* กล่องคำถาม */}
                            <div className="p-8 bg-white text-slate-900 rounded-[2.5rem] shadow-2xl relative text-center">
                                {isShieldActive && <Shield className="absolute -top-3 -right-3 text-green-500 fill-green-500 drop-shadow-lg animate-pulse" size={40}/>}
                                {targetVictim && <Bomb className="absolute -top-3 -right-3 text-rose-500 animate-pulse drop-shadow-lg" size={40}/>}
                                <p className="text-lg font-black italic leading-tight uppercase">{quiz.question}</p>
                            </div>

                            {/* ตัวเลือกคำตอบ */}
                            <div className="space-y-3">
                                {quiz.options.map((opt, i) => (
                                    !hiddenOptions.includes(i) && ( // ถ้าโดนตัดช้อย จะไม่แสดง
                                        <button key={i} onClick={() => handleAnswer(i)}
                                            className={`w-full p-4 border-2 rounded-2xl text-xs text-left transition-all flex justify-between items-center
                                            ${lastChosenIndex === i ? 'bg-yellow-400 border-yellow-500 text-slate-900' : 'bg-slate-800 border-slate-700 hover:border-yellow-400'}
                                            ${showGoldenHint && i === quiz.answer_index ? 'bg-yellow-400/20 border-yellow-400 text-yellow-500' : ''}`}>
                                            <span>{opt}</span>
                                            {showGoldenHint && i === quiz.answer_index && <Sparkles size={16} className="text-yellow-600 animate-pulse"/>}
                                        </button>
                                    )
                                ))}
                            </div>

                            {/* Item Shelf: แสดงไอเทมของผู้เล่น */}
                            {players[currentPlayerIndex].items.length > 0 && !lastChosenIndex && (
                                <div className="bg-slate-800/80 p-5 rounded-[2rem] border border-white/10 shadow-inner">
                                    {/* Logic แสดงผลตอนกดใช้ไอเทมต่างๆ (ระเบิด, โล่, ฯลฯ) */}
                                    {selectedItem === 'bomb' && !targetVictim ? (
                                        <div className="text-center animate-in zoom-in">
                                            <p className="text-[11px] text-rose-400 uppercase mb-3 underline">เลือกเป้าหมายระเบิด!</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {players.filter((_, idx) => idx !== currentPlayerIndex).map((p, idx) => (
                                                    <button key={idx} onClick={() => { setTargetVictim(p.name); setItemFeedback(`💣 ล็อกเป้าหมายที่ ${p.name}!`); removeItem('bomb'); }}
                                                        className="bg-slate-700 p-2 rounded-xl text-[9px] hover:bg-rose-500 transition-colors uppercase">
                                                        {p.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={() => setSelectedItem(null)} className="mt-3 text-[8px] text-slate-500 uppercase">ยกเลิก</button>
                                        </div>
                                    ) : selectedItem ? (
                                        <div className="text-center space-y-3 animate-in fade-in duration-300">
                                            <p className="text-[11px] text-yellow-400 uppercase">{getItemInfo(selectedItem).title}</p>
                                            <p className="text-[9px] text-slate-300 italic">{getItemInfo(selectedItem).desc}</p>
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => setSelectedItem(null)} className="px-4 py-1.5 bg-slate-700 rounded-lg text-[9px] uppercase">ยกเลิก</button>
                                                <button onClick={() => {
                                                    // Logic การทำงานของไอเทมแต่ละชนิด
                                                    if(selectedItem === 'oracle') { 
                                                        let wrongIndices = [];
                                                        quiz.options.forEach((_, i) => { if (i !== quiz.answer_index) wrongIndices.push(i); });
                                                        setHiddenOptions(wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2));
                                                        setItemFeedback("🔵 ตัดช้อยผิดทิ้ง 2 ข้อ!");
                                                        removeItem('oracle'); 
                                                    }
                                                    if(selectedItem === 'golden') { setShowGoldenHint(true); setItemFeedback("✨ เห็นเฉลยแล้ว!"); removeItem('golden'); }
                                                    if(selectedItem === 'shield') { setIsShieldActive(true); setItemFeedback("🛡️ โล่ทำงาน!"); removeItem('shield'); }
                                                }} className="px-4 py-1.5 bg-yellow-400 text-slate-900 rounded-lg text-[9px] uppercase shadow-lg">ใช้ไอเทม ✨</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4 justify-center">
                                            {players[currentPlayerIndex].items.map((item, idx) => (
                                                <button key={idx} onClick={() => setSelectedItem(item)}
                                                    className={`p-4 rounded-full shadow-lg transition-all active:scale-75
                                                    ${item === 'shield' ? 'bg-green-500' : item === 'oracle' ? 'bg-blue-500' : item === 'bomb' ? 'bg-rose-500' : 'bg-yellow-400 text-slate-900'}`}>
                                                    {item === 'shield' ? <Shield size={22}/> : item === 'oracle' ? <Eye size={22}/> : item === 'bomb' ? <Bomb size={22}/> : <Sparkles size={22}/>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        /* ✅ หน้าจอส่งต่อเครื่อง (Handover Screen) */
                        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in zoom-in font-black text-center">
                            <div className="p-10 bg-slate-800 border-4 border-yellow-400 rounded-[3rem] shadow-2xl relative">
                                <Smartphone size={80} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                                <h3 className="text-2xl italic uppercase text-yellow-400 mb-2">ส่งเครื่องต่อ!</h3>
                                <p className="text-slate-400 text-xs uppercase tracking-widest">ตาต่อไปของ: <span className="text-white text-lg block mt-2">{players[currentPlayerIndex + 1]?.name || 'สรุปผล'}</span></p>
                            </div>
                            
                            <button onClick={nextPlayer} className="group flex items-center gap-4 px-10 py-6 bg-yellow-400 text-slate-900 rounded-full text-xl uppercase italic shadow-[0_0_30px_rgba(250,204,21,0.3)] active:scale-90 transition-all">
                                กดเพื่อไปต่อ <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </button>
                            <p className="text-[10px] text-slate-500 animate-pulse">เมื่อกี้ใครแอบดู ขอให้โดนระเบิด! 💣</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- REVIEW PHASE: เฉลยคำตอบหลังจบรอบ --- */}
            {gameState === 'review' && quiz && (
                <div className="space-y-5 animate-in zoom-in font-black">
                    <h2 className="text-xl font-black text-center text-yellow-400 italic uppercase underline decoration-rose-500">ผลตัดสินรอบนี้! 🍭</h2>
                    <div className="bg-white/10 border-2 border-yellow-400/50 p-5 rounded-[2.5rem] shadow-xl text-center">
                        <p className="text-xl text-green-400 font-black italic uppercase">เฉลย: "{quiz.options[quiz.answer_index]}"</p>
                        <p className="text-[10px] text-slate-300 italic mt-2">💡 {quiz.sweet_comment}</p>
                    </div>

                    <div className="bg-slate-800 rounded-[2rem] p-5 border-2 border-slate-700 shadow-inner">
                        <p className="text-[8px] text-slate-400 uppercase mb-3 text-center tracking-widest">ตารางสถิติปัจจุบัน</p>
                        {players.map((p, i) => {
                            const ans = roundAnswers.find(a => a.playerIndex === i);
                            const isVictim = roundAnswers.some(a => a.bombTarget === p.name);
                            const hitByBomb = isVictim && ans && !ans.isCorrect && !ans.usedShield;

                            return (
                                <div key={i} className={`flex justify-between items-center p-3 rounded-xl mb-2 border-2 ${ans?.isCorrect || ans?.usedShield ? 'bg-green-500/10 border-green-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex gap-2 items-center">
                                            <span className="text-sm uppercase">{p.name}</span>
                                            {ans?.usedShield && <span className="text-[7px] bg-green-600 px-1.5 py-0.5 rounded text-white">โล่ (รอด)</span>}
                                            {ans?.bombTarget && <span className="text-[7px] bg-rose-600 px-1.5 py-0.5 rounded text-white">บึ้ม {ans.bombTarget}!</span>}
                                        </div>
                                        <span className="text-[8px] text-slate-400 mt-1">ถูก {p.score} | ผิด {p.wrong} {p.bombHits > 0 ? `| 💣 -${p.bombHits}` : ''}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {ans?.isCorrect || ans?.usedShield ? <CheckCircle2 className="text-green-500" size={16}/> : <XCircle className="text-rose-500" size={16}/>}
                                        {hitByBomb && <span className="text-[7px] text-yellow-400">💥 โดน x2!</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* ปุ่มไปต่อ: ถ้ายังไม่ครบจำนวนข้อ ให้เริ่มรอบใหม่ ถ้าครบแล้วไป Endgame */}
                    <button onClick={async () => { if(currentQuestionIndex < maxQuestions - 1) { setCurrentQuestionIndex(prev => prev + 1); await startNewRound(); } else { setGameState('endgame'); } }}
                        className="w-full py-4 bg-yellow-400 text-slate-900 rounded-2xl font-black uppercase italic shadow-xl active:scale-95">ไปต่อ ↻</button>
                </div>
            )}

            {/* --- ENDGAME PHASE: จบเกม สรุปผล --- */}
            {gameState === 'endgame' && (
                <div className="space-y-6 text-center animate-in bounce-in font-black">
                    <h2 className="text-3xl font-black text-yellow-400 italic uppercase tracking-widest">ใครซวยที่สุด?</h2>
                    <div className="bg-slate-800 rounded-[2.5rem] p-6 border-2 border-slate-700 shadow-xl font-black">
                        {/* เรียงลำดับตามคะแนน */}
                        {players.sort((a,b) => a.score - b.score).map((p, i, sorted) => {
                            const isWorst = p.score === sorted[0].score; // คนที่คะแนนน้อยสุด
                            return (
                                <div key={i} className="py-4 border-b border-slate-700 last:border-0 px-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            {isWorst ? <Ghost className="text-rose-500" size={20}/> : <Trophy className="text-yellow-400" size={20}/>}
                                            <span className="uppercase text-sm">{isWorst ? '🤢 ผู้ดวงกุด' : '🏆 ผู้รอดชีวิต'} : {p.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">ครบ {maxQuestions} ข้อ</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/30 text-green-400 text-[10px]">ถูก {p.score}</div>
                                        <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/30 text-rose-400 text-[10px] text-left">ผิด {p.wrong}</div>
                                    </div>
                                    {(p.bombHits > 0 || p.shieldSaves > 0) && (
                                        <div className="mt-2 flex gap-2 justify-center">
                                            {p.bombHits > 0 && <span className="bg-rose-600/20 text-rose-500 px-2 py-0.5 rounded text-[8px]">💣 ระเบิดสะสม -{p.bombHits}</span>}
                                            {p.shieldSaves > 0 && <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-[8px]">🛡️ ป้องกันสำเร็จ {p.shieldSaves} ครั้ง</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* ปุ่มเริ่มใหม่ (Reload Page) */}
                    <button onClick={() => window.location.reload()} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-rose-500/20 active:scale-95">เริ่มวงใหม่ ↻</button>
                </div>
            )}
        </div>
    );
};

export default GangQuizPage;