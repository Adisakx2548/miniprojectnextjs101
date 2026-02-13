import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

let dbInstance: Database | null = null;

export const openDb = async () => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: './inventory.db',
      driver: sqlite3.Database,
    });
    // ตั้งค่าเพื่อลดปัญหา Database Busy และรองรับภาษาไทยได้ดีขึ้น
    await dbInstance.exec('PRAGMA busy_timeout = 5000;');
    await dbInstance.exec('PRAGMA journal_mode = WAL;'); // ช่วยให้เขียนและอ่านข้อมูลพร้อมกันได้ลื่นขึ้น
  }
  return dbInstance;
};

// ฟังก์ชันสำหรับสร้างตาราง (ให้มั่นใจว่ารันครั้งแรกเสมอ)
export const initDb = async () => {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')) 
    );
  `);
};