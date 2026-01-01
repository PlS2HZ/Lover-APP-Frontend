/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // นำเข้า React Hooks พื้นฐาน
import { useNavigate } from 'react-router-dom'; // Hook สำหรับเปลี่ยนหน้า (Navigation)
import axios from 'axios'; // เครื่องมือยิง API
import { Star, Heart, Rocket, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'; // ไอคอนต่างๆ
import { motion, AnimatePresence } from 'framer-motion'; // Animation Library
import { useTheme } from '../ThemeConstants'; // Hook จัดการธีม (เปลี่ยนสี/ฤดูกาล)
import SeasonalOverlay from "../components/SeasonalOverlay"; // Component ซ้อนทับแสดงเอฟเฟกต์ตามฤดูกาล (เช่น หิมะตก)

// Component ย่อย: แสดงตัวเลขเวลานับถอยหลัง (เช่น 10 D, 5 H)
const CountdownUnit = ({ value, unit }) => (
  <div className="bg-white/80 py-1 rounded-lg border border-rose-50 text-center shadow-sm">
    <p className="text-[11px] font-black text-rose-500 leading-tight">{value}</p>
    <p className="text-[7px] font-bold text-slate-300 uppercase leading-none">{unit}</p>
  </div>
);

// Component ย่อย: แสดงรูปภาพที่ลอยอยู่รอบๆ (Fixed Photos)
const FixedPhoto = ({ src, rotate, isVisible }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0, x: 200, y: 200 }} // เริ่มต้น: จาง, เล็ก, และอยู่นอกจอ
    animate={isVisible ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: rotate } : {}} // แสดง: ชัด, ขนาดปกติ, กลับที่เดิม, หมุนตามค่า rotate
    whileHover={{ scale: 1.1, rotate: 0 }} // เอาเมาส์ชี้: ขยายและตั้งตรง
    className="w-20 h-20 md:w-32 md:h-32 bg-white p-1.5 shadow-xl rounded-lg border border-rose-100 cursor-pointer z-30"
  >
    <img src={src} className="w-full h-full object-cover rounded" alt="Memory" />
  </motion.div>
);

const HomePage = () => {
  const navigate = useNavigate(); // สร้างฟังก์ชัน navigate เพื่อใช้เปลี่ยนหน้า
  const { currentTheme } = useTheme(); // ดึงธีมปัจจุบันจาก Context
  
  // State: เก็บรายการเหตุการณ์ (Events) ทั้งหมด
  const [events, setEvents] = useState([]);
  // State: เก็บเวลาปัจจุบัน (Update ทุกวินาที)
  const [currentTime, setCurrentTime] = useState(new Date());
  // State: สถานะกำลังระเบิดรูป (Animation ตอนเปิดหน้าแรกสุด)
  const [isExploding, setIsExploding] = useState(false);
  // State: สถานะแสดงรูป Fixed Photos รอบๆ (แสดงหลังระเบิดเสร็จ)
  const [showFixedPhotos, setShowFixedPhotos] = useState(false);
  // State: เก็บ Index ของรูปใน Slideshow ที่กำลังแสดงอยู่
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  // State: ทิศทางการเลื่อนรูป (1 = ไปขวา, -1 = ไปซ้าย)
  const [direction, setDirection] = useState(0);

  // State: เก็บข้อมูลรูปภาพ Slideshow (URL PC/Mobile, Caption)
  const [photoData, setPhotoData] = useState([]);
  // State: เก็บ URL ของรูป Fixed Photos
  const [fixedPhotos, setFixedPhotos] = useState([]);
  // State: เก็บ URL ของรูปที่จะใช้ทำ Mosaic Effect (รูปแตกกระจาย)
  const [mosaicPhoto, setMosaicPhoto] = useState("");
  // State: สถานะ Loading ขณะดึงข้อมูล Config
  const [loading, setLoading] = useState(true);

  // เช็คว่าเป็นมือถือหรือไม่ (กว้าง < 768px)
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  // ดึง user_id จาก LocalStorage
  const userId = localStorage.getItem('user_id');
  
  // กำหนด API URL (ระบุตรงๆ ไม่ต้องเช็ค Localhost ก็ได้ตาม Comment ในโค้ดเดิม แต่ Code จริงมี Logic เช็คอยู่)
  const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' 
        : 'https://lover-app-jjoe.onrender.com'; 

  // ✅ ฟังก์ชันคำนวณเวลาถอยหลัง (รับวันเป้าหมาย และประเภทการวนซ้ำ Yearly/Monthly)
  const getDetailedCountdown = (eventDate, repeatType) => {
    const now = currentTime; 
    let target = new Date(eventDate);
    // ถ้าวนซ้ำรายปี: ตั้งปีเป็นปีปัจจุบัน ถ้าเลยวันไปแล้วให้บวกปีหน้า
    if (repeatType === 'yearly') {
        target.setFullYear(now.getFullYear());
        if (target < now) target.setFullYear(now.getFullYear() + 1);
    } 
    // ถ้าวนซ้ำรายเดือน: ตั้งเดือนเป็นเดือนปัจจุบัน ถ้าเลยวันไปแล้วให้บวกเดือนหน้า
    else if (repeatType === 'monthly') {
        target.setFullYear(now.getFullYear()); 
        target.setMonth(now.getMonth());
        if (target < now) target.setMonth(now.getMonth() + 1);
    }
    // คำนวณความต่างเวลา (ms)
    const diff = target - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    // แปลงเป็น วัน/ชั่วโมง/นาที/วินาที
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)), 
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60), 
        seconds: Math.floor((diff / 1000) % 60)
    };
  };

  // Effect: ดึงข้อมูล Config หน้า Home (Slideshow, Fixed Photos, Mosaic) จาก API
  useEffect(() => {
    const fetchHomeConfig = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/home-config/get`);
            res.data.forEach(item => {
                // แปลงข้อมูล JSON string กลับเป็น Object
                const parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                // แยกเก็บลง State ตามประเภท (config_type)
                if (item.config_type === 'slideshow') setPhotoData(parsedData);
                if (item.config_type === 'fixed') setFixedPhotos(parsedData);
                if (item.config_type === 'mosaic') {
                    // เลือกรูปตามอุปกรณ์ (Mobile/PC)
                    const selectedUrl = isMobileView ? (parsedData.mobile || parsedData.url) : (parsedData.pc || parsedData.url);
                    setMosaicPhoto(selectedUrl);
                }
            });
        } catch (err) { console.error("Load Home Config Failed", err); }
        finally { setLoading(false); } // จบการโหลด
    };
    fetchHomeConfig();
  }, [API_URL, isMobileView]);

  // Memo: คำนวณชิ้นส่วน Mosaic (ชิ้นเล็กๆ ของรูปที่จะระเบิด)
  // จะคำนวณใหม่เมื่อ isMobileView หรือ mosaicPhoto เปลี่ยน
  const mosaicPieces = useMemo(() => {
    if (!mosaicPhoto) return []; // ถ้าไม่มีรูปก็ไม่ต้องทำ
    const rows = isMobileView ? 8 : 10; // จำนวนแถว
    const cols = isMobileView ? 6 : 10; // จำนวนคอลัมน์
    const pieces = [];
    // วนลูปสร้างชิ้นส่วนแต่ละชิ้น
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const targetX = (c * (100 / cols)); // ตำแหน่งปลายทาง X (เป็น %)
        const targetY = (r * (100 / rows)); // ตำแหน่งปลายทาง Y (เป็น %)
        pieces.push({
          id: `piece-${r}-${c}`, targetX, targetY,
          width: `calc(${100 / cols}% + 0.2px)`, height: `calc(${100 / rows}% + 0.2px)`, // ขนาดชิ้นส่วน
          bgPosX: c === 0 ? 0 : (c * 100) / (cols - 1), bgPosY: r === 0 ? 0 : (r * 100) / (rows - 1), // ตำแหน่ง Background ของรูป
          midX: targetX + (Math.cos(r + c) * 30), midY: targetY + (Math.sin(r + c) * 30), // ตำแหน่งระหว่างทาง (เพื่อให้ดูระเบิดกระจาย)
          delay: (r * 0.04) + (c * 0.02), // Delay เพื่อให้ไล่ระดับการเคลื่อนที่
          bgSizeX: cols * 100, bgSizeY: rows * 100, // ขนาด Background รวม
          photo: mosaicPhoto 
        });
      }
    }
    return pieces;
  }, [isMobileView, mosaicPhoto]);

  // Effect: ตั้งเวลาอัปเดต currentTime ทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันเลื่อนรูปถัดไป
  const nextImage = () => {
    setDirection(1); // ทิศทางไปขวา
    setCurrentImgIndex((prev) => (prev + 1) % photoData.length); // วนกลับไป 0 เมื่อถึงท้ายสุด
  };

  // ฟังก์ชันเลื่อนรูปก่อนหน้า
  const prevImage = () => {
    setDirection(-1); // ทิศทางไปซ้าย
    setCurrentImgIndex((prev) => (prev - 1 + photoData.length) % photoData.length); // วนกลับไปท้ายสุดเมื่อถึง 0
  };

  // Effect: ตรวจสอบสถานะการระเบิดจาก LocalStorage (เพื่อให้ระเบิดแค่ครั้งเดียว หรือต่อเนื่องถ้ายังไม่จบ)
  useEffect(() => {
    const explosionStatus = localStorage.getItem('isExploded');
    const explosionTime = localStorage.getItem('explosionTimestamp');
    if (explosionStatus === 'true' && explosionTime) {
      const diff = Date.now() - parseInt(explosionTime);
      // ถ้าระเบิดไปไม่ถึง 5 วินาที ให้เล่นต่อให้จบ
      if (diff < 5000) {
        setIsExploding(true);
        setTimeout(() => {
          setIsExploding(false); setShowFixedPhotos(true);
          localStorage.removeItem('isExploded'); localStorage.removeItem('explosionTimestamp');
        }, 5000 - diff);
      } else {
        // ถ้าเกิน 5 วินาทีแล้ว ให้ข้ามไปแสดง Fixed Photos เลย
        setShowFixedPhotos(true);
        localStorage.removeItem('isExploded'); localStorage.removeItem('explosionTimestamp');
      }
    }
  }, []);

  // Effect: ดึงรายการเหตุการณ์ (Events) จาก API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/events?user_id=${userId}`);
        setEvents(res.data || []);
      } catch (err) { 
        console.error("Fetch Events Error:", err); 
      }
    };
    if (userId) fetchEvents();
  }, [userId, API_URL]);

  // ฟังก์ชันสั่งเริ่มระเบิด (เมื่อกดปุ่มลับ)
  const handleExplosion = () => {
    setIsExploding(true);
    localStorage.setItem('isExploded', 'true'); // บันทึกสถานะลง Storage
    localStorage.setItem('explosionTimestamp', Date.now().toString());
    // ตั้งเวลา 5 วินาทีให้หยุดระเบิดและแสดง Fixed Photos
    setTimeout(() => {
      setIsExploding(false); setShowFixedPhotos(true);
      localStorage.removeItem('isExploded'); localStorage.removeItem('explosionTimestamp');
    }, 5000); 
  };

  // แสดง Loading Screen
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-rose-50 text-rose-500 font-black italic uppercase animate-pulse">Loading Our Memories...</div>;

  return (
    // Wrapper หลัก: เปลี่ยนสีพื้นหลังตาม Theme (Day/Night)
    <div className={`min-h-screen ${currentTheme.id === 'night' ? 'bg-slate-900' : 'bg-rose-50'} p-4 md:p-8 relative overflow-hidden flex items-center justify-center transition-colors duration-1000`}>
      {/* Overlay แสดงเอฟเฟกต์ฤดูกาล (เช่น หิมะตก) */}
      <SeasonalOverlay themeId={currentTheme.id} />

      {/* Animation ส่วนระเบิดรูป Mosaic */}
      <AnimatePresence>
        {isExploding && (
          <div className="fixed inset-0 z-[9999] pointer-events-none">
            {mosaicPieces.map((p) => (
              <motion.div
                key={p.id} 
                initial={{ opacity: 1, scale: 0, left: "90%", top: "80%" }} // เริ่มต้นที่มุมขวาล่าง
                animate={{ 
                  opacity: [1, 1, 1, 0], scale: [0, 1, 1, 1, 0], // ขยายแล้วหดหายไป
                  left: ["90%", `${p.midX}%`, `${p.targetX}%`, `${p.targetX}%`, `${p.targetX}%`], // เคลื่อนที่ไปจุดเป้าหมาย
                  top: ["80%", `${p.midY}%`, `${p.targetY}%`, `${p.targetY}%`, `${p.targetY}%`],
                }}
                transition={{ duration: 5, ease: "circOut", times: [0, 0.1, 0.2, 0.9, 1], delay: p.delay }}
                style={{ 
                  width: p.width, height: p.height, position: 'absolute',
                  backgroundImage: `url("${p.photo}")`, 
                  backgroundSize: `${p.bgSizeX}% ${p.bgSizeY}%`, 
                  backgroundPosition: `${p.bgPosX}% ${p.bgPosY}%`, 
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Content หลัก */}
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-6 md:gap-12 items-center justify-center z-10">
        
        {/* รูป Fixed Photos ด้านซ้าย (แสดง 3 รูปแรก) */}
        <div className="flex lg:flex-col gap-4 lg:gap-6 lg:absolute left-4 xl:left-10 lg:top-1/4 z-20 justify-center">
            {showFixedPhotos && fixedPhotos.slice(0, 3).map((src, idx) => (
                <FixedPhoto key={idx} src={src} rotate={idx % 2 === 0 ? -12 : 8} isVisible={showFixedPhotos} />
            ))}
        </div>

        {/* ส่วนกลาง: Slideshow และปุ่มเมนู */}
        <div className="flex-1 w-full max-w-lg order-2 lg:order-1">
          <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl border border-rose-100 text-center relative overflow-hidden">
            <div className="text-4xl md:text-5xl mb-2 animate-bounce select-none">💖</div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-800 mb-6 uppercase tracking-tighter italic">Our Space</h1>
            
            {/* กรอบ Slideshow */}
            <div className="relative group mb-4 rounded-[2rem] overflow-hidden aspect-square md:aspect-video bg-slate-50 flex items-center justify-center border-4 border-rose-50 shadow-inner">
              <AnimatePresence mode='popLayout' custom={direction}>
                {photoData.length > 0 && (
                  <motion.img 
                    key={currentImgIndex}
                    custom={direction}
                    src={isMobileView ? photoData[currentImgIndex].mobile : photoData[currentImgIndex].pc}
                    // Animation Slide ซ้าย/ขวา ตาม Direction
                    initial={(d) => ({ opacity: 0, x: d > 0 ? 200 : -200 })} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={(d) => ({ opacity: 0, x: d > 0 ? -200 : 200 })}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    drag="x" dragConstraints={{ left: 0, right: 0 }} // รองรับการลากนิ้ว (Swipe)
                    onDragEnd={(e, { offset }) => {
                      if (offset.x > 50) prevImage();
                      else if (offset.x < -50) nextImage();
                    }}
                    className="absolute w-full h-full object-cover cursor-grab active:cursor-grabbing"
                  />
                )}
              </AnimatePresence>
              {/* ปุ่มลูกศรซ้ายขวา (ซ่อนไว้ แสดงเมื่อ Hover) */}
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/30 backdrop-blur-md p-2 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={24} /></button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/30 backdrop-blur-md p-2 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={24} /></button>
            </div>
            
            {/* Caption ของรูป */}
            <motion.p key={`caption-${currentImgIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-rose-400 font-bold text-sm md:text-base mb-6 italic">
              {photoData[currentImgIndex]?.caption}
            </motion.p>
            
            {/* ปุ่มเมนูหลัก (ขออนุญาต / ดูประวัติ) */}
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/create')} className="bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2 text-base md:text-lg">ขออนุญาต ✨ <Rocket size={20}/></button>
              <button onClick={() => navigate('/history')} className="bg-slate-50 text-slate-600 font-black py-4 rounded-2xl border-2 border-slate-100 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base">ดูประวัติคำขอ <ClipboardList size={20}/></button>
            </div>
          </div>
        </div>

        {/* ส่วนขวา: รายการสำคัญ (Special Events) */}
        <div className="w-full lg:w-72 xl:w-80 space-y-6 order-1 lg:order-2">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-2 border-rose-100 relative min-h-[260px] flex flex-col">
            {/* หัวข้อ "รายการสำคัญ" */}
            <h3 className="text-rose-500 font-black flex items-center gap-2 mb-4 text-base italic uppercase">
                <Star size={20} fill="currentColor" className="text-yellow-400"/> รายการสำคัญ
            </h3>
            
            {/* List รายการ (Scroll ได้) */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[300px]">
              {events.filter(ev => ev.category_type === 'special').length > 0 ? (
                // กรองเฉพาะหมวด 'special' มาแสดง พร้อมนับถอยหลัง
                events.filter(ev => ev.category_type === 'special').map((ev) => {
                  const timeLeft = getDetailedCountdown(ev.event_date, ev.repeat_type);
                  return (
                    <div key={ev.id} className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 group transition-all hover:bg-rose-100/30 shadow-sm">
                      <p className="text-[11px] font-black text-slate-700 truncate w-full mb-2 uppercase tracking-tight">{ev.title}</p>
                      {/* Component นับถอยหลัง (วัน ชม นาที วินาที) */}
                      <div className="grid grid-cols-4 gap-1">
                        <CountdownUnit value={timeLeft.days} unit="D" />
                        <CountdownUnit value={timeLeft.hours} unit="H" />
                        <CountdownUnit value={timeLeft.minutes} unit="M" />
                        <CountdownUnit value={timeLeft.seconds} unit="S" />
                      </div>
                    </div>
                  );
                })
              ) : (
                // แสดงถ้าไม่มีข้อมูล
                <div className="flex-1 flex items-center justify-center py-10 text-center opacity-30 italic text-[10px] font-bold text-slate-400">ไม่มีรายการสำคัญจดไว้เลย ❤️</div>
              )}
            </div>
            
            {/* ปุ่มลับสำหรับสั่งระเบิด (ซ่อนอยู่มุมขวาล่าง) */}
            {!isExploding && !showFixedPhotos && (
              <motion.div onClick={handleExplosion} whileHover={{ scale: 1.2, rotate: 10 }} className="absolute -bottom-3 -right-3 w-12 h-12 bg-rose-500 rounded-2xl cursor-pointer flex items-center justify-center shadow-2xl z-50 animate-pulse border-4 border-white">
                <div className="grid grid-cols-2 gap-1">{[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-white rounded-sm" />)}</div>
              </motion.div>
            )}
          </div>
          
          {/* รูป Fixed Photos ด้านขวา (แสดง 2 รูปท้าย) */}
          <div className="flex justify-center lg:justify-end gap-4 pt-2 px-2">
            {showFixedPhotos && fixedPhotos.slice(3, 5).map((src, idx) => (
                <FixedPhoto key={idx} src={src} rotate={idx === 0 ? 12 : -8} isVisible={showFixedPhotos} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;