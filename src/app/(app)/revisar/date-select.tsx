"use client";

import { useRouter } from "next/navigation";

export function DateSelect({ datas, atual }: { datas: string[]; atual: string }) {
  const router = useRouter();

  return (
    <select
      defaultValue={atual}
      onChange={(e) => router.push(`/revisar?data=${e.target.value}`)}
      className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
    >
      {datas.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}
