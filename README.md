# TPAD IFS Executive Dashboard

ระบบ Demo รายงานผู้บริหารสำหรับกองบินตำรวจ (Thai Police Aviation Division) เชื่อมข้อมูล IFS ERP จาก Oracle แบบอ่านอย่างเดียว และใช้ MariaDB สำหรับบัญชีผู้ใช้ เนื้อหา session, chatbot และ audit log

## ฟังก์ชันหลัก

- Login ภายในองค์กร พร้อม Role `ADMIN` และ `READ_ONLY`
- Home, ข่าว/บทความ และ Dashboard Summary พร้อม Fleet Readiness และ 4 แผนก
- Dashboard แบบ responsive พร้อม ECharts, ตาราง, filter, cache, refresh และ drawer รายละเอียด
- Chatbot เลือกได้เฉพาะ fixed metric จาก query catalog และแสดง Card ต้นทาง
- Admin จัดการผู้ใช้ กลุ่มบทความ ข่าว/บทความ สถานะเผยแพร่และ password reset
- Oracle hard guard: static `SELECT`/`WITH`, bind variables, `SET TRANSACTION READ ONLY`, timeout, row limit และ `ROLLBACK`

## เริ่มใช้งาน

```bash
npm install
npm run db:migrate
npm run db:seed:fleet # optional Fleet Readiness fallback data
BOOTSTRAP_ADMIN_USERNAME=admin \
BOOTSTRAP_ADMIN_PASSWORD='change-this-password' \
npm run db:bootstrap
npm run dev
```

เปิด `http://localhost:3000` และกำหนดค่าตาม [.env.example](./.env.example)

## ตรวจสอบระบบ

```bash
npm run lint
npm test
npm run build
npm run oracle:smoke
```

`oracle:smoke` รันทุก query ภายใต้ transaction แบบ read-only และ rollback ทุกครั้ง ไม่สร้างหรือแก้ไขข้อมูล Oracle

## โครงสร้างสำคัญ

- `lib/dashboard/catalog.ts` — fixed Oracle query catalog และ mapping Card
- `lib/dashboard/oracle.ts` — Oracle Thin pool และ read-only transaction guard
- `lib/db/schema.ts` / `drizzle/` — MariaDB schema และ migration
- `app/(protected)/` — Home, Dashboard, content และ Admin
- `app/api/` — Dashboard, metric detail และ chatbot APIs
- `scripts/bootstrap-admin.ts` — สร้าง Initial Admin แบบ one-time
