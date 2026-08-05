import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20">
        <Image src="/assets/tpad-crest.png" alt="ตรากองบินตำรวจ" fill sizes="44px" className="object-cover" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">Thai Police Aviation</span>
          <span className="block truncate text-base font-bold text-white">TPAD Executive</span>
        </span>
      )}
    </div>
  );
}
