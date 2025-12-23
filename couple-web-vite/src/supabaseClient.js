import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqmvmryebvmyariewpvr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbXZtcnllYnZteWFyaWV3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODIwOTcsImV4cCI6MjA4MTU1ODA5N30.xj8m6GZ6DrW5RCQM5fyCQekSbr2P46iBY1WuKQx9n-4';

// ✅ สร้าง Client โดยใช้ Library มาตรฐาน จะไม่มีปัญหา undefined หรือ loading นาน
export const supabase = createClient(supabaseUrl, supabaseAnonKey);