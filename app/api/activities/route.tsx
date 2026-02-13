import { openDb } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * ดึงรายการกิจกรรมล่าสุด 5 รายการ (GET)
 * เส้นทาง: /api/activities
 */
export async function GET() {
  try {
    const db = await openDb();
    
    // ดึงข้อมูลกิจกรรมล่าสุด เรียงตาม ID จากมากไปน้อย
    const data = await db.all('SELECT * FROM activities ORDER BY id DESC LIMIT 5');
    
    // ตรวจสอบข้อมูลใน Terminal ของ VS Code
    console.log("Fetched activities:", data);
    
    return NextResponse.json(data || []); 
  } catch (error: unknown) {
    // จัดการข้อผิดพลาดและส่งสถานะ 500
    console.error("GET Activities Error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}