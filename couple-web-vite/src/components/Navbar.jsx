import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks พื้นฐาน
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Hooks สำหรับจัดการ Routing (Link, Location, Navigation)
import axios from 'axios'; // เครื่องมือยิง API
import { 
  Home, Calendar, Send, History, LogOut, 
  Heart, Gift, Image as ImageIcon, Menu, X, 
  User as UserIcon, Gamepad2, Sparkles, Dices // ✅ นำเข้าไอคอนต่างๆ
} from 'lucide-react';
import { useTheme } from '../ThemeConstants'; // Hook จัดการธีม

const Navbar = () => {
  const location = useLocation(); // ดึง path ปัจจุบัน (เพื่อ highlight เมนู)
  const navigate = useNavigate(); // ฟังก์ชันเปลี่ยนหน้า
  const { currentTheme } = useTheme(); // ดึงธีมปัจจุบัน
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State เปิด/ปิด เมนู Mobile
  
  const userId = localStorage.getItem('user_id'); // ดึง user_id จาก LocalStorage
  // รายชื่อ ID ที่อนุญาตให้เห็นเมนูพิเศษบางอย่าง (Memory Quiz, Home Admin)
  const ALLOWED_IDS = ["d8eb372a-d196-44fc-a73b-1809f27e0a56", "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e"];

  // State เก็บข้อมูล User (ชื่อ, รูปโปรไฟล์) เพื่อแสดงบน Navbar
  const [userData, setUserData] = useState({
    username: localStorage.getItem('username'),
    avatarUrl: localStorage.getItem('avatar_url')
  });

  // กำหนด API URL ตาม Environment
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

  // Effect: ซิงค์ข้อมูลโปรไฟล์ล่าสุดจาก Server ทุกครั้งที่เปลี่ยนหน้าหรือโหลดใหม่
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`);
        if (Array.isArray(res.data)) {
          // หาข้อมูลของ User ปัจจุบัน
          const me = res.data.find(u => u.id === userId);
          if (me) {
            // อัปเดต State และ LocalStorage ให้ตรงกัน
            setUserData({ username: me.username, avatarUrl: me.avatar_url });
            localStorage.setItem('username', me.username);
            localStorage.setItem('avatar_url', me.avatar_url);
          }
        }
      } catch (err) { console.error("Navbar Sync Error:", err); }
    };
    if (userId) syncProfile(); // ทำงานเมื่อมี userId เท่านั้น
  }, [location, userId, API_URL]);

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่? ❤️")) {
      localStorage.clear(); // ล้างข้อมูลทั้งหมดในเครื่อง
      navigate("/login"); // กลับไปหน้า Login
    }
  };

  // ✅ กำหนดรายการเมนูทั้งหมด (เพิ่มสีสันให้ไอคอนและลบ Profile ออก)
  const navItems = [
    { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} className="text-blue-500" /> },
    { name: 'Request', path: '/create', icon: <Send size={20} className="text-emerald-500" /> },
    { name: 'History', path: '/history', icon: <History size={20} className="text-slate-500" /> },
    { name: 'Memory Lane', path: '/memory-lane', icon: <ImageIcon size={20} className="text-indigo-500" /> },
    { name: 'Mood&Moment', path: '/mood', icon: <Heart size={20} className="text-rose-500" /> },
    { name: 'Wishlist', path: '/wishlist', icon: <Gift size={20} className="text-amber-500" /> },
    { name: 'Mind Game', path: '/mind-game', icon: <Gamepad2 size={20} className="text-purple-500" /> },
    { name: 'Memory Quiz', path: '/memory-quiz', icon: <Sparkles size={20} className="text-pink-500" /> },
    { name: 'Gang Quiz', path: '/gang-quiz', icon: <Dices size={20} className="text-orange-500" /> },
  ];

  // กำหนดสีธีมของ Navbar (Home = ชมพู, New Year = เหลือง)
  const themeColors = {
    home: 'border-rose-100 text-rose-600 bg-rose-50',
    newyear: 'border-yellow-200 text-yellow-600 bg-yellow-50',
  };

  // เลือกสีตาม Theme ปัจจุบัน (Default = Home)
  const activeColor = themeColors[currentTheme.id] || themeColors.home;

  // ถ้าอยู่หน้า Login หรือ Register ไม่ต้องแสดง Navbar
  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <>
      {/* ส่วนแถบ Navbar หลัก (Sticky Top) */}
      <nav className={`bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b ${activeColor.split(' ')[0]} px-4 py-2`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Logo และชื่อแอป (ลิ้งค์กลับหน้าแรก) */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl shadow-md overflow-hidden group-hover:rotate-12 transition-transform border border-rose-50">
              <img src="/com2.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={`text-xl font-black italic tracking-tighter uppercase ${activeColor.split(' ')[1]}`}>
              LOVER
            </span>
          </Link>

          {/* ส่วนขวา: ปุ่ม Home และ เมนู User */}
          <div className="flex items-center gap-2">
            {/* ปุ่ม Home */}
            <Link to="/" className={`relative p-2 rounded-xl transition-all ${location.pathname === '/' ? activeColor : 'text-slate-300 hover:text-rose-400'}`}>
              <Home size={22} />
            </Link>

            {/* แสดงส่วน User Menu ถ้า Login แล้ว */}
            {userData.username && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
                {/* ปุ่ม Logout */}
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                  title="ออกจากระบบ"
                >
                  <LogOut size={20} />
                </button>

                {/* รูปโปรไฟล์ (คลิกไปหน้า Profile) */}
                <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="relative">
                        <img 
                            src={userData.avatarUrl && userData.avatarUrl !== 'null' ? userData.avatarUrl : `https://ui-avatars.com/api/?name=${userData.username}&background=random`} 
                            className="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover group-hover:border-rose-400 transition-all"
                            alt="Avatar"
                        />
                        {/* จุดเขียวบอกสถานะ Online */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                </Link>
                
                {/* ปุ่มเปิด/ปิด Menu Dropdown */}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className={`relative p-2 rounded-xl transition-all ${isMenuOpen ? 'bg-rose-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Menu (แสดงเมื่อ isMenuOpen = true) */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 w-full sm:w-72 bg-white border-b sm:border-l border-rose-100 shadow-2xl animate-in slide-in-from-top sm:slide-in-from-right duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="p-3 flex flex-col gap-1">
              {/* Header ของ Menu: แสดงข้อมูล User แบบย่อ */}
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-2 hover:bg-rose-50 transition-all border border-slate-100">
                  <img 
                      src={userData.avatarUrl && userData.avatarUrl !== 'null' ? userData.avatarUrl : `https://ui-avatars.com/api/?name=${userData.username}&background=random`} 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                      alt="Avatar"
                  />
                  <div>
                      <p className="text-xs font-black text-slate-700 uppercase italic leading-none">{userData.username}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">ดูโปรไฟล์ของคุณ</p>
                  </div>
              </Link>

              <div className="px-3 py-1.5 mb-1 border-b border-slate-50">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Menu Navigation</p>
              </div>
              
              {/* วนลูปแสดงรายการเมนู navItems */}
              {navItems.map((item) => {
                // ✅ กรองเมนู Memory Quiz ให้เห็นเฉพาะคนที่มี ID ใน ALLOWED_IDS
                if (item.path === '/memory-quiz' && !ALLOWED_IDS.includes(userId)) {
                  return null;
                }

                return (
                  <Link 
                    key={item.name} 
                    to={item.path} 
                    onClick={() => setIsMenuOpen(false)} // ปิดเมนูเมื่อกด
                    className={`relative flex items-center gap-3 p-3 rounded-2xl font-bold text-xs uppercase italic transition-all ${
                      location.pathname === item.path ? activeColor : 'text-slate-500 hover:bg-rose-50 hover:text-rose-500'
                    }`}
                  >
                    <span className="p-1.5 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                      {React.cloneElement(item.icon, { size: 18 })}
                    </span>
                    {item.name}
                  </Link>
                );
              })}

              {/* เมนูพิเศษ: ตั้งค่าหน้า Home (แสดงเฉพาะ Admin) */}
              {ALLOWED_IDS.includes(userId) && (
                <Link 
                  to="/homeadmin" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-2xl font-bold text-xs uppercase italic transition-all ${
                    location.pathname === '/homeadmin' ? activeColor : 'text-rose-600 bg-rose-50/50 hover:bg-rose-100'
                  }`}
                >
                  <span className="p-1.5 bg-white rounded-xl shadow-sm">
                    <Home size={18} className="text-rose-500" />
                  </span>
                  ⚙️ ตั้งค่าหน้า Home
                </Link>
              )}

              {/* ปุ่มออกจากระบบใน Dropdown */}
              <div className="mt-2 pt-2 border-t border-slate-50">
                <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-2xl font-bold text-xs uppercase italic text-rose-500 hover:bg-rose-50 transition-all">
                  <span className="p-1.5 bg-rose-100/50 rounded-xl"><LogOut size={18} /></span>
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;