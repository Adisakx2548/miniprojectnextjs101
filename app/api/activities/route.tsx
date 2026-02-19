import db from '@/lib/db'; // นำเข้า pool การเชื่อมต่อที่เราสร้างไว้ใน lib/db.ts
import { NextResponse } from 'next/server';

/**
 * ดึงรายการกิจกรรมล่าสุด 5 รายการ (GET)
 * เส้นทาง: /api/activities
 */
export async function GET() {
  try {
    // ใช้ db.query ของ Postgres แทน db.all ของ SQLite
    // เรียงลำดับจากไอดีล่าสุด (ล่าสุดมาอันแรก)
    const { rows } = await db.query('SELECT * FROM activities ORDER BY id DESC LIMIT 5');
    
    // ตรวจสอบข้อมูลใน Console
    console.log("Fetched activities from Cloud:", rows);
    
    // ส่งข้อมูลกลับเป็น JSON
    return NextResponse.json(rows || []); 
  } catch (error: unknown) {
    // จัดการข้อผิดพลาดและส่งสถานะ 500
    console.error("GET Activities Error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}