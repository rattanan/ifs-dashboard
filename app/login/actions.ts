"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { createSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };

  let user: typeof users.$inferSelect | undefined;
  try {
    const rows = await getDb()
      .select()
      .from(users)
      .where(eq(users.username, parsed.data.username))
      .limit(1);
    user = rows[0];
  } catch (error) {
    console.error(
      "Login database query failed",
      error instanceof Error ? error.message : error,
    );
    return { error: "ไม่สามารถเชื่อมต่อฐานข้อมูล MariaDB ได้ กรุณาตรวจสอบการเชื่อมต่อระบบ" };
  }

  if (!user || !user.active || !(await compare(parsed.data.password, user.passwordHash))) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  try {
    await getDb().update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await createSession(user.id);
    await writeAudit({ actorId: user.id, action: "LOGIN", entityType: "SESSION" });
  } catch (error) {
    console.error(
      "Login session setup failed",
      error instanceof Error ? error.message : error,
    );
    return { error: "ไม่สามารถสร้าง session ได้ กรุณาตรวจสอบฐานข้อมูล MariaDB" };
  }
  redirect("/");
}
