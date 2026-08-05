import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TPAD Executive Dashboard",
    template: "%s | TPAD Dashboard",
  },
  description: "ระบบรายงานผู้บริหาร IFS ERP กองบินตำรวจ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full bg-slate-50 text-slate-950">{children}</body>
    </html>
  );
}
