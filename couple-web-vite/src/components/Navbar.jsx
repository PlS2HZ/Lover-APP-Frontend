import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Home, Calendar, Send, History, LogOut, 
  Heart, Gift, Image as ImageIcon, Menu, X, 
  User as UserIcon, Gamepad2, Sparkles, Dices // ✅ เพิ่ม Dices มาใช้เป็นไอคอน Gang Quiz
} from 'lucide-react';
import { useTheme } from '../ThemeConstants';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const userId = localStorage.getItem('user_id');
  const ALLOWED_IDS = ["d8eb372a-d196-44fc-a73b-1809f27e0a56", "f384c03a-55bb-4d5f-b3f5-4f2052a9d00e"];

  const [userData, setUserData] = useState({
    username: localStorage.getItem('username'),
    avatarUrl: localStorage.getItem('avatar_url')
  });

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`);
        if (Array.isArray(res.data)) {
          const me = res.data.find(u => u.id === userId);
          if (me) {
            setUserData({ username: me.username, avatarUrl: me.avatar_url });
            localStorage.setItem('username', me.username);
            localStorage.setItem('avatar_url', me.avatar_url);
          }
        }
      } catch (err) { console.error("Navbar Sync Error:", err); }
    };
    if (userId) syncProfile();
  }, [location, userId, API_URL]);

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่? ❤️")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  // ✅ เพิ่มเมนู Gang Quiz และ Memory Quiz
  const navItems = [
    { name: 'Mind Game', path: '/mind-game', icon: <Gamepad2 size={20} className="text-purple-500" /> },
    { name: 'Memory Quiz', path: '/memory-quiz', icon: <Sparkles size={20} className="text-pink-500" /> },
    { name: 'Gang Quiz', path: '/gang-quiz', icon: <Dices size={20} className="text-yellow-500" /> }, // 👈 ใหม่: แสดงให้ทุกคนเห็น
    { name: 'Mood', path: '/mood', icon: <Heart size={20} className="text-rose-500" /> },
    { name: 'Wishlist', path: '/wishlist', icon: <Gift size={20} className="text-amber-500" /> },
    { name: 'Moments', path: '/moments', icon: <ImageIcon size={20} className="text-sky-500" /> },
    { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
    { name: 'Request', path: '/create', icon: <Send size={20} /> },
    { name: 'History', path: '/history', icon: <History size={20} /> },
    { name: 'Profile', path: '/profile', icon: <UserIcon size={20} className="text-slate-500" /> },
  ];

  const themeColors = {
    home: 'border-rose-100 text-rose-600 bg-rose-50',
    newyear: 'border-yellow-200 text-yellow-600 bg-yellow-50',
  };

  const activeColor = themeColors[currentTheme.id] || themeColors.home;

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <>
      <nav className={`bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b ${activeColor.split(' ')[0]} px-4 py-2`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl shadow-md overflow-hidden group-hover:rotate-12 transition-transform border border-rose-50">
              <img src="/com2.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={`text-xl font-black italic tracking-tighter uppercase ${activeColor.split(' ')[1]}`}>
              LOVER
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/" className={`relative p-2 rounded-xl transition-all ${location.pathname === '/' ? activeColor : 'text-slate-300 hover:text-rose-400'}`}>
              <Home size={22} />
            </Link>

            {userData.username && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                  title="ออกจากระบบ"
                >
                  <LogOut size={20} />
                </button>

                <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="relative">
                        <img 
                            src={userData.avatarUrl && userData.avatarUrl !== 'null' ? userData.avatarUrl : `https://ui-avatars.com/api/?name=${userData.username}&background=random`} 
                            className="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover group-hover:border-rose-400 transition-all"
                            alt="Avatar"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                </Link>
                
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

        {isMenuOpen && (
          <div className="absolute top-full right-0 w-full sm:w-72 bg-white border-b sm:border-l border-rose-100 shadow-2xl animate-in slide-in-from-top sm:slide-in-from-right duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="p-3 flex flex-col gap-1">
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
              
              {navItems.map((item) => {
                // ✅ กรองเมนู Memory Quiz ให้เห็นเฉพาะนายและแฟน
                if (item.path === '/memory-quiz' && !ALLOWED_IDS.includes(userId)) {
                  return null;
                }

                return (
                  <Link 
                    key={item.name} 
                    to={item.path} 
                    onClick={() => setIsMenuOpen(false)}
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