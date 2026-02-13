import { openDb } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 1. ดึงรายการสินค้าทั้งหมด (GET)
 * เส้นทาง: /api/products
 */
export async function GET() {
  try {
    const db = await openDb();
    // ดึงข้อมูลสินค้าเรียงตาม ID ใหม่ล่าสุด
    const products = await db.all('SELECT * FROM products ORDER BY id DESC');
    
    return NextResponse.json(products || []);
  } catch (error: unknown) {
    // จัดการ Error และพิมพ์ลง Terminal
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

/**
 * 2. เพิ่มสินค้าใหม่ พร้อมบันทึกกิจกรรม (POST)
 * เส้นทาง: /api/products
 */
export async function POST(req: Request) {
  try {
    const { name, stock, price } = await req.json();
    const db = await openDb();

    // เพิ่มสินค้าลงในตาราง products
    const result = await db.run(
      'INSERT INTO products (name, stock, price) VALUES (?, ?, ?)',
      [name, stock, price]
    );

    // บันทึกกิจกรรมการเพิ่มสินค้าลงในตาราง activities
    await db.run(
      'INSERT INTO activities (action, details) VALUES (?, ?)',
      [
        'Add Product', 
        `เพิ่มสินค้าใหม่: ${name} (สต็อก: ${stock}, ราคา: ฿${price})`
      ]
    );

    return NextResponse.json({ 
      id: result.lastID, 
      message: "เพิ่มสินค้าและบันทึกกิจกรรมสำเร็จ" 
    });
  } catch (error: unknown) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}