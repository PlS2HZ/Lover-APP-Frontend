import { createClient } from '@supabase/supabase-js'; // นำเข้าฟังก์ชัน createClient จาก Library ของ Supabase เพื่อใช้สร้างการเชื่อมต่อ

// กำหนด URL ของโปรเจกต์ Supabase (เป็น API Endpoint ที่ Frontend จะวิ่งไปหาฐานข้อมูล)
const supabaseUrl = 'https://xqmvmryebvmyariewpvr.supabase.co';

// กำหนด Anon Key (Public Key) สำหรับยืนยันตัวตนฝั่ง Client ว่ามาจากแอปเราจริง 
// (คีย์นี้ปลอดภัยที่จะอยู่บนฝั่ง Client เพราะสิทธิ์การเข้าถึงข้อมูลจะถูกคุมโดย RLS Policy ใน Database อีกที)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbXZtcnllYnZteWFyaWV3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODIwOTcsImV4cCI6MjA4MTU1ODA5N30.xj8m6GZ6DrW5RCQM5fyCQekSbr2P46iBY1WuKQx9n-4';

// ✅ สร้าง Client โดยใช้ Library มาตรฐาน จะไม่มีปัญหา undefined หรือ loading นาน
// สร้าง instance การเชื่อมต่อ (supabase) และ export ออกไปเพื่อให้ไฟล์อื่นๆ ในโปรเจกต์ import ไปใช้งานต่อได้ทันที
export const supabase = createClient(supabaseUrl, supabaseAnonKey);