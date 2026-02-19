import db from '@/lib/db'; // นำเข้า pool การเชื่อมต่อจาก lib/db.ts
import { NextResponse } from 'next/server';

// 1. รับเข้า/จ่ายออกสินค้า และบันทึกกิจกรรม (PATCH)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { amount, type, price } = await req.json();
    const { id } = await params; 

    // 1. ตรวจสอบว่ามีสินค้าไหม (ใน Postgres ข้อมูลจะอยู่ใน rows)
    const productCheck = await db.query('SELECT name FROM products WHERE id = $1', [id]);
    
    if (productCheck.rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    const productName = productCheck.rows[0].name;

    // 2. อัปเดตสต็อก (ใช้ $1, $2 ตามลำดับ)
    if (type === 'IN') {
      await db.query(
        'UPDATE products SET stock = stock + $1, price = $2 WHERE id = $3', 
        [amount, price, id]
      );
    } else {
      await db.query(
        'UPDATE products SET stock = stock - $1, price = $2 WHERE id = $3', 
        [amount, price, id]
      );
    }

    // 3. บันทึกกิจกรรม (Action ชื่อตรงกับที่ใช้แยกสีแดง/เขียวในหน้า Dashboard)
    const actionLabel = type === 'IN' ? 'Stock In' : 'Stock Out';
    const detailMsg = `${type === 'IN' ? 'รับเข้า' : 'จ่ายออก'} ${productName} จำนวน ${amount} ชิ้น`;
    
    await db.query(
      'INSERT INTO activities (action, details) VALUES ($1, $2)',
      [actionLabel, detailMsg]
    );

    return NextResponse.json({ message: 'Success' });
  } catch (error: unknown) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}

// 2. ลบสินค้า (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. ดึงชื่อสินค้ามาก่อนลบเพื่อใช้บันทึกกิจกรรม
    const productCheck = await db.query('SELECT name FROM products WHERE id = $1', [id]);
    
    // 2. ลบสินค้า
    await db.query('DELETE FROM products WHERE id = $1', [id]);

    // 3. บันทึกกิจกรรมการลบ
    if (productCheck.rows.length > 0) {
      const productName = productCheck.rows[0].name;
      await db.query(
        'INSERT INTO activities (action, details) VALUES ($1, $2)', 
        ['Delete Product', `ลบสินค้า: ${productName}`]
      );
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: unknown) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: 'Delete Failed' }, { status: 500 });
  }
}