import db from '@/lib/db'; 
import { NextResponse } from 'next/server';

// --- 1. ฟังก์ชันอัปเดตสต็อก รับเข้า/จ่ายออก (PATCH) ---
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { amount, type, price } = await req.json();
    const { id } = await params; 

    const productCheck = await db.query('SELECT name FROM products WHERE id = $1', [id]);
    if (productCheck.rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    const productName = productCheck.rows[0].name;

    const operator = type === 'IN' ? '+' : '-';
    await db.query(
      `UPDATE products SET stock = stock ${operator} $1, price = $2 WHERE id = $3`, 
      [amount, price, id]
    );

    // บันทึกกิจกรรม 'Stock In' หรือ 'Stock Out' ให้กราฟแสดงสีได้ถูกต้อง
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

// --- 2. ฟังก์ชันแก้ไขข้อมูลสินค้า ชื่อ/สต็อก/ราคา (PUT) ---
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, stock, price } = await req.json();
    const { id } = await params; 

    const currentData = await db.query('SELECT name FROM products WHERE id = $1', [id]);
    if (currentData.rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    const oldName = currentData.rows[0].name;

    // อัปเดตข้อมูลทั้งหมด
    await db.query(
      'UPDATE products SET name = $1, stock = $2, price = $3 WHERE id = $4',
      [name, stock, price, id]
    );

    // บันทึกกิจกรรม 'Edit Name' หากมีการเปลี่ยนชื่อ
    if (oldName !== name) {
      await db.query(
        'INSERT INTO activities (action, details) VALUES ($1, $2)',
        ['Edit Name', `เปลี่ยนชื่อสินค้าจาก "${oldName}" เป็น "${name}"`]
      );
    }

    return NextResponse.json({ message: 'Updated successfully' });
  } catch (error: unknown) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}

// --- 3. ฟังก์ชันลบสินค้า (DELETE) ---
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productCheck = await db.query('SELECT name FROM products WHERE id = $1', [id]);
    if (productCheck.rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    const productName = productCheck.rows[0].name;

    await db.query('DELETE FROM products WHERE id = $1', [id]);

    // บันทึกกิจกรรม 'Delete Product'
    await db.query(
      'INSERT INTO activities (action, details) VALUES ($1, $2)', 
      ['Delete Product', `ลบสินค้า: ${productName}`]
    );

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: unknown) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: 'Delete Failed' }, { status: 500 });
  }
}