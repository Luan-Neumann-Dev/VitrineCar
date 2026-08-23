"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Option } from "@/lib/filters";

/**
 * O Radix nao aceita item com value="" — usamos um sentinela interno para
 * representar a opcao "qualquer/todos" sem vazar isso para a URL.
 */
const ANY = "__any";

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || ANY}
      onValueChange={(next) => onChange(next === ANY ? "" : next)}
    >
      <SelectTrigger
        aria-label={label}
        className="h-[38px] w-full rounded-md text-[13.5px]"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value || ANY} value={option.value || ANY}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
