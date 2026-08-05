"use client";

import { useActionState } from "react";
import { LockKeyhole, LogIn, UserRound } from "lucide-react";
import { loginAction, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-semibold text-slate-700">ชื่อผู้ใช้</label>
        <div className="relative">
          <UserRound aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="username" name="username" autoComplete="username" className="pl-10" placeholder="กรอกชื่อผู้ใช้" required />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">รหัสผ่าน</label>
        <div className="relative">
          <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="password" name="password" type="password" autoComplete="current-password" className="pl-10" placeholder="กรอกรหัสผ่าน" required />
        </div>
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{state.error}</p>}
      <Button className="w-full" disabled={pending}>
        <LogIn aria-hidden="true" className="size-4" />
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>
      <p className="text-center text-xs leading-5 text-slate-400">ระบบสำหรับผู้ได้รับอนุญาตเท่านั้น · ข้อมูล IFS เป็นแบบอ่านอย่างเดียว</p>
    </form>
  );
}
