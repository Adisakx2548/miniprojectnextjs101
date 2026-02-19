import db from '@/lib/db'; // นำเข้า pool การเชื่อมต่อจาก lib/db.ts
import { NextResponse } from 'next/server';

/**
 * 1. ดึงรายการสินค้าทั้งหมด (GET)
 * เส้นทาง: /api/products
 */
export async function GET() {
  try {
    // ใน Postgres ข้อมูลจะอยู่ใน rows
    const { rows } = await db.query('SELECT * FROM products ORDER BY id DESC');
    
    return NextResponse.json(rows || []);
  } catch (error: unknown) {
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

    // 1. เพิ่มสินค้าและดึง ID ที่เพิ่งสร้างออกมาด้วย RETURNING id
    const productResult = await db.query(
      'INSERT INTO products (name, stock, price) VALUES ($1, $2, $3) RETURNING id',
      [name, stock, price]
    );

    const newProductId = productResult.rows[0].id;

    // 2. บันทึกกิจกรรมการเพิ่มสินค้า (สะกดชื่อ Action ให้ตรงกับที่หน้าบ้านใช้กรองสี)
    await db.query(
      'INSERT INTO activities (action, details) VALUES ($1, $2)',
      [
        'Add Product', 
        `เพิ่มสินค้าใหม่: ${name} (สต็อก: ${stock}, ราคา: ฿${price})`
      ]
    );

    return NextResponse.json({ 
      id: newProductId, 
      message: "เพิ่มสินค้าและบันทึกกิจกรรมสำเร็จ" 
    });
  } catch (error: unknown) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}