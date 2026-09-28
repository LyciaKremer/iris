"use client";

import { useRouter, usePathname } from "next/navigation";
import { formatarDataBR } from "@/lib/dates";

export function DateSelect({ datas, atual }: { datas: string[]; atual: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      defaultValue={atual}
      onChange={(e) => router.push(`${pathname}?data=${e.target.value}`)}
      className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
    >
      {datas.map((d) => (
        <option key={d} value={d}>
          {formatarDataBR(d)}
        </option>
      ))}
    </select>
  );
}
