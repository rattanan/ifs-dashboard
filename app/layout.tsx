import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TPAD Aviation Intelligence & Command Center (AICC)",
    template: "%s | TPAD AICC",
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
