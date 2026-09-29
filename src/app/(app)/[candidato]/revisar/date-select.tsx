"use client";

import { useRouter, usePathname } from "next/navigation";
import { formatarDataBR } from "@/lib/dates";
import { Select } from "@/components/ui/input";

export function DateSelect({ datas, atual }: { datas: string[]; atual: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select defaultValue={atual} onChange={(e) => router.push(`${pathname}?data=${e.target.value}`)} className="w-auto">
      {datas.map((d) => (
        <option key={d} value={d}>
          {formatarDataBR(d)}
        </option>
      ))}
    </Select>
  );
}
