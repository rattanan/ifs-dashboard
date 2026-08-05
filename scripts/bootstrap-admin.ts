import "dotenv/config";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { articleGroups, contents, users } from "../lib/db/schema";

const connectionUrl = process.env.DATABASE_URL;
if (!connectionUrl) throw new Error("DATABASE_URL is not configured");
const pool = mysql.createPool({ uri: connectionUrl, connectionLimit: 2, timezone: "+07:00" });
const db = drizzle(pool);

async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const displayName = process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME ?? "ผู้ดูแลระบบ TPAD";

  if (!username || !password || password.length < 12) {
    throw new Error(
      "Set BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD (at least 12 characters)",
    );
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  let adminId = existing[0]?.id;

  if (!adminId) {
    adminId = crypto.randomUUID();
    await db.insert(users).values({
      id: adminId,
      username,
      displayName,
      passwordHash: await hash(password, 12),
      role: "ADMIN",
      active: true,
    });
  }

  const groupId = crypto.randomUUID();
  await db
    .insert(articleGroups)
    .values({
      id: groupId,
      name: "ข่าวประชาสัมพันธ์",
      slug: "announcements",
      description: "ข่าวสารและประกาศสำหรับบุคลากรกองบินตำรวจ",
      sortOrder: 1,
    })
    .onDuplicateKeyUpdate({ set: { name: "ข่าวประชาสัมพันธ์" } });

  const groups = await db.select().from(articleGroups).where(eq(articleGroups.slug, "announcements"));
  const published = await db.select({ id: contents.id }).from(contents).limit(1);
  if (!published.length) {
    await db.insert(contents).values([
      {
        id: crypto.randomUUID(),
        groupId: groups[0]?.id ?? groupId,
        type: "NEWS",
        status: "PUBLISHED",
        title: "ยินดีต้อนรับสู่ TPAD Executive Dashboard",
        slug: "welcome-to-tpad-dashboard",
        summary: "ศูนย์รวมข้อมูล IFS ERP สำหรับติดตามภารกิจ งบประมาณ คลัง และการจัดซื้อ",
        bodyJson: {
          paragraphs: [
            "ระบบนี้รวบรวมข้อมูลสำคัญจาก IFS ERP เพื่อสนับสนุนการตัดสินใจของผู้บริหารกองบินตำรวจ",
            "เลือก Dashboard ที่ต้องการจากหน้าแรก หรือสอบถามข้อมูลผ่านผู้ช่วยอัจฉริยะด้านล่างขวา",
          ],
        },
        pinned: true,
        publishAt: new Date(),
        authorId: adminId,
      },
      {
        id: crypto.randomUUID(),
        groupId: groups[0]?.id ?? groupId,
        type: "ARTICLE",
        status: "PUBLISHED",
        title: "แนวทางการอ่านข้อมูลจาก Dashboard",
        slug: "dashboard-reading-guide",
        summary: "ทำความเข้าใจตัวกรอง สถานะข้อมูล และการเปิดดูรายละเอียดจากแต่ละ Card",
        bodyJson: {
          paragraphs: [
            "ข้อมูลบน Dashboard อ่านจาก Oracle IFS แบบ read-only และมีเวลาข้อมูลล่าสุดกำกับทุกครั้ง",
            "สามารถเลือก Site และช่วงเวลา จากนั้นกดที่ Card เพื่อดูรายละเอียดในรูปแบบตาราง",
          ],
        },
        pinned: false,
        publishAt: new Date(),
        authorId: adminId,
      },
    ]);
  }

  console.log(`Bootstrap complete for ${username}`);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await pool.end();
  process.exit(1);
});
