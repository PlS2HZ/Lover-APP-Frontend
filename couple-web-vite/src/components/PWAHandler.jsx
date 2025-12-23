import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, BellOff } from 'lucide-react';

const PWAHandler = () => {
    // ✅ สถานะการลงทะเบียนในฐานข้อมูล (ความจริงหลัก)
    const [isSubscribedInDB, setIsSubscribedInDB] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' : 'https://lover-backend.onrender.com';

    // ฟังก์ชันเช็คสถานะจาก DB
    const checkDBStatus = async () => {
        if (!userId) { setIsLoading(false); return; }
        try {
            const res = await axios.get(`${API_URL}/api/check-subscription?user_id=${userId}`);
            setIsSubscribedInDB(res.data.subscribed);
        } catch (err) {
            console.error("Check DB Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkDBStatus();
    }, [userId]);

    const handleSubscribe = async () => {
        try {
            // 1. ขอสิทธิ์จากเบราว์เซอร์ก่อน (ถ้ายังไม่ได้กดอนุญาตซ้ายบน)
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                const publicKey = "BOkbnuWUKrV8BKHA5UkNQAovhejO3ANCGjrY2M86OsYZ_WHRZSYUAaeKvh0g6qr1WjI5pZdZ1PwCelM6_ReNbF0";
                
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                });

                // 2. ส่งข้อมูลไปบันทึกใน DB
                await axios.post(`${API_URL}/api/save-subscription`, {
                    user_id: userId,
                    subscription: subscription
                });
                
                setIsSubscribedInDB(true);
                alert('เปิดการแจ้งเตือนสำเร็จ! ระบบจะแจ้งเตือนคุณเมื่อมีกิจกรรมใหม่ ❤️');
            } else {
                alert('คุณยังไม่ได้อนุญาตสิทธิ์การแจ้งเตือน โปรดกดอนุญาตที่รูปกุญแจซ้ายบนของเบราว์เซอร์ด้วยนะครับ');
            }
        } catch (err) { 
            console.error("Subscription Error:", err);
            alert('เกิดข้อผิดพลาดในการเปิดใช้งาน'); 
        }
    };

    const handleUnsubscribe = async () => {
        if (window.confirm("คุณต้องการปิดการแจ้งเตือนบนเครื่องนี้ใช่หรือไม่?")) {
            try {
                await axios.post(`${API_URL}/api/unsubscribe`, { user_id: userId });
                setIsSubscribedInDB(false);
                alert('ปิดการแจ้งเตือนเรียบร้อยแล้ว ✨');
            } catch (err) { 
                console.error("Unsubscribe Error:", err);
                alert('ปิดไม่สำเร็จ'); 
            }
        }
    };

    if (isLoading) return <div className="p-4 text-center animate-pulse text-slate-300">กำลังตรวจสอบสถานะ...</div>;

    return (
        <div className={`p-5 rounded-[2.5rem] border-2 transition-all ${isSubscribedInDB ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <p className="font-black text-slate-700 text-xs uppercase italic">การตั้งค่าแจ้งเตือน</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                        สถานะ: {isSubscribedInDB ? '● เปิดใช้งานแล้ว' : '○ ปิดอยู่'}
                    </p>
                </div>
                {isSubscribedInDB ? (
                    <button onClick={handleUnsubscribe} className="p-3 bg-white text-rose-500 rounded-2xl shadow-sm border border-rose-100 hover:bg-rose-50 transition-all active:scale-90">
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