import { openDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// กำหนด Interface เพื่อความปลอดภัยของข้อมูล
interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
}

// 1. รับเข้า/จ่ายออกสินค้า และบันทึกกิจกรรม (PATCH)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { amount, type, price } = await req.json();
    const { id } = await params; // ต้อง await params สำหรับ Next.js 15+
    const db = await openDb();

    const product: Product | undefined = await db.get('SELECT name FROM products WHERE id = ?', [id]);
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    // อัปเดตสต็อก
    if (type === 'IN') {
      await db.run('UPDATE products SET stock = stock + ?, price = ? WHERE id = ?', [amount, price, id]);
    } else {
      await db.run('UPDATE products SET stock = stock - ?, price = ? WHERE id = ?', [amount, price, id]);
    }

    // บันทึกกิจกรรม (Action ชื่อตรงกับที่ใช้แยกสีในหน้า page.tsx)
    const actionLabel = type === 'IN' ? 'Stock In' : 'Stock Out';
    const detailMsg = `${type === 'IN' ? 'รับเข้า' : 'จ่ายออก'} ${product.name} จำนวน ${amount} ชิ้น`;
    
    await db.run(
      'INSERT INTO activities (action, details) VALUES (?, ?)',
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
    const db = await openDb();

    // ดึงชื่อสินค้ามาก่อนลบเพื่อใช้บันทึกกิจกรรม
    const product: Product | undefined = await db.get('SELECT name FROM products WHERE id = ?', [id]);
    
    await db.run('DELETE FROM products WHERE id = ?', [id]);

    // บันทึกกิจกรรมการลบ
    if (product) {
      await db.run('INSERT INTO activities (action, details) VALUES (?, ?)', 
        ['Delete Product', `ลบสินค้า: ${product.name}`]);
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: unknown) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: 'Delete Failed' }, { status: 500 });
  }
}