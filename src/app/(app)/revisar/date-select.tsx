"use client";

import { useRouter } from "next/navigation";
import { formatarDataBR } from "@/lib/dates";

export function DateSelect({ datas, atual }: { datas: string[]; atual: string }) {
  const router = useRouter();

  return (
    <select
      defaultValue={atual}
      onChange={(e) => router.push(`/revisar?data=${e.target.value}`)}
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
