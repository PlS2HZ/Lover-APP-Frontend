import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, BellOff } from 'lucide-react';

const PWAHandler = () => {
    const [isSubscribedInDB, setIsSubscribedInDB] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const userId = localStorage.getItem('user_id');
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:10000' : 'https://lover-app-jjoe.onrender.com';

    const VAPID_PUBLIC_KEY = "BCvD9YU-2qHuXuolgoxZr7ggnLZEcSRZWgjVGQuWrkBIzEWuwwkoZLxBU_80d0JEusI8onyI76AJNAUX-EsFODk";

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

   // src/components/PWAHandler.jsx

const handleSubscribe = async () => {
    try {
        // 1. ขอสิทธิ์แจ้งเตือน
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            
            // 🌟 แก้ไข: ใช้รหัส Public Key ที่ถูกต้อง (ต้องตรงกับ Backend)
            const VAPID_PUBLIC_KEY = "BCvD9YU-2qHuXuolgoxZr7ggnLZEcSRZWgjVGQuWrkBIzEWuwwkoZLxBU_80d0JEusI8onyI76AJNAUX-EsFODk";
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // 🌟 แก้ไข: บังคับส่งเป็น JSON String เพื่อป้องกันปัญหา "" ใน Database
            await axios.post(`${API_URL}/api/save-subscription`, {
                user_id: userId,
                subscription: JSON.stringify(subscription)
            });
            
            setIsSubscribedInDB(true);
            alert('เปิดการแจ้งเตือนสำเร็จ! ❤️');
        } else {
            alert('โปรดอนุญาตสิทธิ์การแจ้งเตือนที่รูปกุญแจซ้ายบนด้วยนะครับ');
        }
    } catch (err) { 
        console.error("Subscription Error:", err);
        // ถ้าเกิด Error ตรงนี้ นายจะเห็นข้อความแจ้งเตือนที่หน้าจอโทรศัพท์เลย
        alert('เกิดข้อผิดพลาด: ' + err.message); 
    }
};

    const handleUnsubscribe = async () => {
        if (window.confirm("ต้องการปิดการแจ้งเตือนใช่หรือไม่?")) {
            try {
                await axios.post(`${API_URL}/api/unsubscribe`, { user_id: userId });
                setIsSubscribedInDB(false);
                alert('ปิดการแจ้งเตือนเรียบร้อย ✨');
            } catch (err) { 
                console.error("Unsubscribe Error:", err);
                alert('ปิดไม่สำเร็จ'); 
            }
        }
    };

    if (isLoading) return <div className="p-4 text-center text-slate-300">กำลังตรวจสอบ...</div>;

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