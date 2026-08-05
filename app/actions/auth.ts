"use server";

import { redirect } from "next/navigation";
import { destroySession, getCurrentUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await writeAudit({ actorId: user.id, action: "LOGOUT", entityType: "SESSION" });
  }
  await destroySession();
  redirect("/login");
}
