import { createPool } from '@vercel/postgres';

// สร้างการเชื่อมต่อกับ Postgres บน Cloud แทน SQLite
const db = createPool();

export const initDb = async () => {
  try {
    // สร้างตารางด้วย SQL ของ Postgres (SERIAL แทน AUTOINCREMENT)
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        price DECIMAL(10,2) DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Cloud Database initialized successfully!");
  } catch (err) {
    console.error("Database Init Error:", err);
  }
};

export default db;