"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function EChart({ option, label, className }: { option: echarts.EChartsOption; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chart.setOption(option);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} role="img" aria-label={label} className={cn("h-52 min-w-0 w-full overflow-hidden", className)} />;
}
