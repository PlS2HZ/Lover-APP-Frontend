import React, { useState, useEffect } from 'react'; // นำเข้า React Hooks: useState (เก็บค่า), useEffect (ทำงานเมื่อโหลดหน้า)
import axios from 'axios'; // นำเข้า axios สำหรับยิง API
import { Bell, BellOff } from 'lucide-react'; // นำเข้าไอคอนกระดิ่ง

const PWAHandler = () => {
    // State: เก็บสถานะว่าผู้ใช้นี้กดรับแจ้งเตือนใน Database แล้วหรือยัง (True = รับแล้ว)
    const [isSubscribedInDB, setIsSubscribedInDB] = useState(false);
    // State: สถานะ Loading ขณะเช็คข้อมูล (True = กำลังเช็ค)
    const [isLoading, setIsLoading] = useState(true);

    // ดึง user_id จาก LocalStorage
    const userId = localStorage.getItem('user_id');
    // กำหนด API URL ตาม Environment (Localhost หรือ Production)
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    // Public Key สำหรับ VAPID (ใช้ยืนยันตัวตนกับ Web Push Service) *ต้องตรงกับ Backend*
    const VAPID_PUBLIC_KEY = "BCvD9YU-2qHuXuolgoxZr7ggnLZEcSRZWgjVGQuWrkBIzEWuwwkoZLxBU_80d0JEusI8onyI76AJNAUX-EsFODk";

    // ฟังก์ชันเช็คสถานะการติดตามจาก Database
    const checkDBStatus = async () => {
        if (!userId) { setIsLoading(false); return; } // ถ้าไม่มี User ID ให้จบการทำงาน
        try {
            // ยิง API ไปเช็คว่า User คนนี้ Subscribe ไว้หรือยัง
            const res = await axios.get(`${API_URL}/api/check-subscription?user_id=${userId}`);
            setIsSubscribedInDB(res.data.subscribed); // อัปเดตสถานะลง State
        } catch (err) {
            console.error("Check DB Error:", err); // แสดง Error ถ้ามีปัญหา
        } finally {
            setIsLoading(false); // จบสถานะ Loading
        }
    };

    // Effect: ทำงานเมื่อ userId เปลี่ยน หรือโหลด Component ครั้งแรก เพื่อเช็คสถานะ
    useEffect(() => {
        checkDBStatus();
    }, [userId]);

   // src/components/PWAHandler.jsx (คอมเมนต์เดิมจากโค้ดนาย)

// ฟังก์ชันกดปุ่ม "เปิดแจ้งเตือน" (Subscribe)
const handleSubscribe = async () => {
    try {
        // 1. ขอสิทธิ์แจ้งเตือนจาก Browser (จะเด้ง Popup ถาม user)
        const permission = await Notification.requestPermission();
        
        // ถ้า User กดอนุญาต (granted)
        if (permission === 'granted') {
            // รอให้ Service Worker พร้อมทำงาน
            const registration = await navigator.serviceWorker.ready;
            
            // 🌟 แก้ไข: ใช้รหัส Public Key ที่ถูกต้อง (ต้องตรงกับ Backend)
            const VAPID_PUBLIC_KEY = "BCvD9YU-2qHuXuolgoxZr7ggnLZEcSRZWgjVGQuWrkBIzEWuwwkoZLxBU_80d0JEusI8onyI76AJNAUX-EsFODk";
            
            // สั่งให้ Browser สร้าง Push Subscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true, // ต้องแสดง Notification ให้เห็นเสมอ (กฏของ Browser)
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) // แปลง Key เป็น Format ที่ Browser เข้าใจ
            });

            // 🌟 แก้ไข: ส่งข้อมูล Subscription ไปเก็บที่ Backend (Database)
            // บังคับส่งเป็น JSON String เพื่อป้องกันปัญหา "" ใน Database
            await axios.post(`${API_URL}/api/save-subscription`, {
                user_id: userId,
                subscription: JSON.stringify(subscription)
            });
            
            setIsSubscribedInDB(true); // อัปเดตสถานะหน้าจอเป็น "เปิดแล้ว"
            alert('เปิดการแจ้งเตือนสำเร็จ! ❤️'); // แจ้งเตือนผู้ใช้
        } else {
            // ถ้า User ไม่อนุญาต
            alert('โปรดอนุญาตสิทธิ์การแจ้งเตือนที่รูปกุญแจซ้ายบนด้วยนะครับ');
        }
    } catch (err) { 
        console.error("Subscription Error:", err); // Log Error
        // ถ้าเกิด Error ตรงนี้ นายจะเห็นข้อความแจ้งเตือนที่หน้าจอโทรศัพท์เลย
        alert('เกิดข้อผิดพลาด: ' + err.message); 
    }
};

    // ฟังก์ชันกดปุ่ม "ปิดแจ้งเตือน" (Unsubscribe)
    const handleUnsubscribe = async () => {
        // ถามยืนยันก่อนปิด
        if (window.confirm("ต้องการปิดการแจ้งเตือนใช่หรือไม่?")) {
            try {
                // ยิง API ไปลบข้อมูล Subscription ออกจาก DB
                await axios.post(`${API_URL}/api/unsubscribe`, { user_id: userId });
                setIsSubscribedInDB(false); // อัปเดตสถานะหน้าจอเป็น "ปิดอยู่"
                alert('ปิดการแจ้งเตือนเรียบร้อย ✨');
            } catch (err) { 
                console.error("Unsubscribe Error:", err);
                alert('ปิดไม่สำเร็จ'); 
            }
        }
    };

    // แสดงข้อความ Loading ระหว่างเช็คสถานะ
    if (isLoading) return <div className="p-4 text-center text-slate-300">กำลังตรวจสอบ...</div>;

    return (
        // กล่อง UI หลัก: เปลี่ยนสีขอบและพื้นหลังตามสถานะ (เขียว=เปิด, ชมพู=ปิด)
        <div className={`p-5 rounded-[2.5rem] border-2 transition-all ${isSubscribedInDB ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <p className="font-black text-slate-700 text-xs uppercase italic">การตั้งค่าแจ้งเตือน</p>
                    {/* ข้อความบอกสถานะ */}
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                        สถานะ: {isSubscribedInDB ? '● เปิดใช้งานแล้ว' : '○ ปิดอยู่'}
                    </p>
                </div>
                {/* ปุ่มกด: ถ้าเปิดอยู่แสดงปุ่มปิด (BellOff), ถ้าปิดอยู่แสดงปุ่มเปิด (Text) */}
                {isSubscribedInDB ? (
                    <button onClick={handleUnsubscribe} className="p-3 bg-white text-rose-500 rounded-2xl shadow-sm border border-rose-100 active:scale-90">
                        <BellOff size={18} />
                    </button>
                ) : (
                    <button onClick={handleSubscribe} className="px-6 py-3 bg-rose-500 text-white text-[10px] font-black rounded-2xl shadow-md active:scale-95 uppercase">
                        เปิดแจ้งเตือน
                    </button>
                )}
            </div>
        </div>
    );
};

// ฟังก์ชัน Utility: แปลง Base64 String (VAPID Key) เป็น Uint8Array (Format ที่ Browser ต้องการ)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default PWAHandler;