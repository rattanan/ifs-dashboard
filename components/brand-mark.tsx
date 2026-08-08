import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20">
        <Image src="/assets/tpad-crest.png" alt="ตรากองบินตำรวจ" fill sizes="44px" className="object-cover" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight" aria-label="TPAD Aviation Intelligence & Command Center (AICC)">
          <span className="block whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.08em] text-sky-300">TPAD Aviation Intelligence</span>
          <span className="block whitespace-nowrap text-[11px] font-bold text-white">&amp; Command Center</span>
          <span className="block text-[10px] font-bold text-sky-200">(AICC)</span>
        </span>
      )}
    </div>
  );
}
