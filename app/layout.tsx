import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
// นำเข้าฟังก์ชันสร้างตารางจาก lib/db
import { initDb } from "@/lib/db";

const kanit = Kanit({ 
  subsets: ["thai", "latin"], 
  weight: ["300", "400", "700"] 
});

export const metadata: Metadata = {
  title: "Cs Stock | ระบบจัดการสต็อก",
};

// สั่งให้ฐานข้อมูลสร้างตาราง products และ activities ทันทีที่ระบบเริ่มทำงาน
initDb().catch((err) => {
  console.error("Failed to initialize database:", err);
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={kanit.className}>
        {children}
      </body>
    </html>
  );
}